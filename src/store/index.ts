import { create } from 'zustand';
import type {
  QuotaInfo,
  QuotaDistributionRecord,
  ConsumptionRecord,
  BloodBatch,
  OutboundRecord,
  SelfpayApply,
  DashboardStats
} from '@/types';

interface AppState {
  quotaList: QuotaInfo[];
  quotaDistributionRecords: QuotaDistributionRecord[];
  consumptionRecords: ConsumptionRecord[];
  bloodBatches: BloodBatch[];
  outboundRecords: OutboundRecord[];
  selfpayApplications: SelfpayApply[];
  currentOrgId: string;

  getDashboardStats: () => DashboardStats;
  getQuotaByOrgId: (orgId: string) => QuotaInfo | undefined;
  getConsumptionsByOrgId: (orgId: string) => ConsumptionRecord[];
  getBatchesByBloodType: (bloodType?: string) => BloodBatch[];
  getExpiringBatches: () => BloodBatch[];
  getExpiredBatches: () => BloodBatch[];
  getFifoRecommendedBatches: () => BloodBatch[];
  addConsumption: (record: ConsumptionRecord) => void;
  addBloodBatch: (batch: BloodBatch) => void;
  addOutbound: (record: OutboundRecord) => void;
  distributeQuota: (record: QuotaDistributionRecord) => void;
  resetCycleQuota: (orgId: string) => void;
  createSelfpayApply: (apply: SelfpayApply) => void;
  approveSelfpayApply: (applyId: string, approver: string) => void;
  setCurrentOrgId: (orgId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  quotaList: [],
  quotaDistributionRecords: [],
  consumptionRecords: [],
  bloodBatches: [],
  outboundRecords: [],
  selfpayApplications: [],
  currentOrgId: 'ORG001',

  getDashboardStats: () => {
    const state = get();
    const quota = state.getQuotaByOrgId(state.currentOrgId);
    const totalQuota = quota?.totalQuota ?? 0;
    const usedQuota = quota?.usedQuota ?? 0;
    const remainingQuota = quota?.remainingQuota ?? 0;
    const quotaUsageRate = totalQuota > 0 ? Math.round((usedQuota / totalQuota) * 100) : 0;
    const totalBatches = state.bloodBatches.length;
    const nearExpiryCount = state.bloodBatches.filter(b => b.status === 'near_expiry').length;
    const expiredCount = state.bloodBatches.filter(b => b.status === 'expired').length;
    const totalOutbound = state.outboundRecords.length;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyDonations = state.consumptionRecords.filter(r => {
      const d = new Date(r.donateDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
    const selfpayApplications = state.selfpayApplications.filter(a => a.status === 'pending').length;
    const pendingApprovals = state.outboundRecords.filter(o => o.status === 'pending').length;
    return {
      totalQuota, usedQuota, remainingQuota, quotaUsageRate,
      totalBatches, nearExpiryCount, expiredCount,
      totalOutbound, monthlyDonations, selfpayApplications, pendingApprovals
    };
  },

  getQuotaByOrgId: (orgId) => {
    return get().quotaList.find(q => q.orgId === orgId);
  },

  getConsumptionsByOrgId: (orgId) => {
    return get().consumptionRecords
      .filter(r => r.orgId === orgId)
      .sort((a, b) => new Date(b.donateDate).getTime() - new Date(a.donateDate).getTime());
  },

  getBatchesByBloodType: (bloodType) => {
    const list = get().bloodBatches;
    if (!bloodType) return list;
    return list.filter(b => b.bloodType === bloodType);
  },

  getExpiringBatches: () => {
    return get().bloodBatches.filter(b => b.status === 'near_expiry');
  },

  getExpiredBatches: () => {
    return get().bloodBatches.filter(b => b.status === 'expired');
  },

  getFifoRecommendedBatches: () => {
    return get().bloodBatches
      .filter(b => b.status !== 'expired' && b.status !== 'locked' && b.remainingQuantity > 0)
      .sort((a, b) => {
        const ea = new Date(a.expiryDate).getTime();
        const eb = new Date(b.expiryDate).getTime();
        if (ea !== eb) return ea - eb;
        return new Date(a.collectionDate).getTime() - new Date(b.collectionDate).getTime();
      });
  },

  addConsumption: (record) => {
    set((state) => {
      const quotaIndex = state.quotaList.findIndex(q => q.orgId === record.orgId);
      if (quotaIndex < 0) return { consumptionRecords: [record, ...state.consumptionRecords] };
      const quota = state.quotaList[quotaIndex];
      const newQuota = { ...quota };
      if (record.type === 'quota') {
        newQuota.usedQuota = quota.usedQuota + record.amount;
        newQuota.remainingQuota = Math.max(0, quota.remainingQuota - record.amount);
      } else {
        newQuota.selfpayCount = quota.selfpayCount + record.amount;
      }
      const newQuotaList = [...state.quotaList];
      newQuotaList[quotaIndex] = newQuota;
      return {
        consumptionRecords: [record, ...state.consumptionRecords],
        quotaList: newQuotaList
      };
    });
  },

  addBloodBatch: (batch) => {
    set((state) => ({
      bloodBatches: [batch, ...state.bloodBatches]
    }));
  },

  addOutbound: (record) => {
    set((state) => {
      const batchIndex = state.bloodBatches.findIndex(b => b.id === record.batchId);
      if (batchIndex < 0) return { outboundRecords: [record, ...state.outboundRecords] };
      const batch = state.bloodBatches[batchIndex];
      const newBatch = {
        ...batch,
        usedQuantity: batch.usedQuantity + record.quantity,
        remainingQuantity: Math.max(0, batch.remainingQuantity - record.quantity)
      };
      const newBatches = [...state.bloodBatches];
      newBatches[batchIndex] = newBatch;
      return {
        outboundRecords: [record, ...state.outboundRecords],
        bloodBatches: newBatches
      };
    });
  },

  distributeQuota: (record) => {
    set((state) => {
      const quotaIndex = state.quotaList.findIndex(q => q.orgId === record.orgId);
      if (quotaIndex < 0) {
        const newQuota: QuotaInfo = {
          id: `Q${Date.now()}`,
          orgId: record.orgId,
          orgName: record.orgName,
          totalQuota: record.quotaAmount,
          usedQuota: 0,
          remainingQuota: record.quotaAmount,
          cycleStart: new Date().toISOString().split('T')[0],
          cycleEnd: record.cycle === 'monthly'
            ? new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
            : record.cycle === 'quarterly'
            ? new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0]
            : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          cycle: record.cycle,
          selfpayCount: 0
        };
        return {
          quotaList: [newQuota, ...state.quotaList],
          quotaDistributionRecords: [record, ...state.quotaDistributionRecords]
        };
      }
      const quota = state.quotaList[quotaIndex];
      const newQuota = {
        ...quota,
        totalQuota: quota.totalQuota + record.quotaAmount,
        remainingQuota: quota.remainingQuota + record.quotaAmount
      };
      const newQuotaList = [...state.quotaList];
      newQuotaList[quotaIndex] = newQuota;
      return {
        quotaList: newQuotaList,
        quotaDistributionRecords: [record, ...state.quotaDistributionRecords]
      };
    });
  },

  resetCycleQuota: (orgId) => {
    set((state) => {
      const quotaIndex = state.quotaList.findIndex(q => q.orgId === orgId);
      if (quotaIndex < 0) return state;
      const quota = state.quotaList[quotaIndex];
      const now = new Date();
      const newCycleStart = now.toISOString().split('T')[0];
      let newCycleEnd: string;
      if (quota.cycle === 'monthly') {
        newCycleEnd = new Date(now.setMonth(now.getMonth() + 1)).toISOString().split('T')[0];
      } else if (quota.cycle === 'quarterly') {
        newCycleEnd = new Date(now.setMonth(now.getMonth() + 3)).toISOString().split('T')[0];
      } else {
        newCycleEnd = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString().split('T')[0];
      }
      const newQuota = {
        ...quota,
        usedQuota: 0,
        remainingQuota: quota.totalQuota,
        cycleStart: newCycleStart,
        cycleEnd: newCycleEnd,
        selfpayCount: 0
      };
      const newQuotaList = [...state.quotaList];
      newQuotaList[quotaIndex] = newQuota;
      return { quotaList: newQuotaList };
    });
  },

  createSelfpayApply: (apply) => {
    set((state) => ({
      selfpayApplications: [apply, ...state.selfpayApplications]
    }));
  },

  approveSelfpayApply: (applyId, approver) => {
    set((state) => {
      const idx = state.selfpayApplications.findIndex(a => a.id === applyId);
      if (idx < 0) return state;
      const apply = { ...state.selfpayApplications[idx] };
      apply.status = 'approved';
      apply.approver = approver;
      apply.approvalDate = new Date().toISOString().split('T')[0];
      const newList = [...state.selfpayApplications];
      newList[idx] = apply;
      return { selfpayApplications: newList };
    });
  },

  setCurrentOrgId: (orgId) => set({ currentOrgId: orgId })
}));
