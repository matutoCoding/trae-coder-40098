import { create } from 'zustand';
import type {
  QuotaInfo,
  QuotaDistributionRecord,
  ConsumptionRecord,
  BloodBatch,
  OutboundRecord,
  SelfpayApply,
  DashboardStats,
  Donor,
  InventoryLog,
  InventoryLogType,
  BloodType
} from '@/types';
import dayjs from 'dayjs';

interface AppState {
  quotaList: QuotaInfo[];
  quotaDistributionRecords: QuotaDistributionRecord[];
  consumptionRecords: ConsumptionRecord[];
  bloodBatches: BloodBatch[];
  outboundRecords: OutboundRecord[];
  selfpayApplications: SelfpayApply[];
  donors: Donor[];
  inventoryLogs: InventoryLog[];
  currentOrgId: string;

  getDashboardStats: () => DashboardStats;
  getQuotaByOrgId: (orgId: string) => QuotaInfo | undefined;
  getConsumptionsByOrgId: (orgId: string) => ConsumptionRecord[];
  getBatchesByBloodType: (bloodType?: string) => BloodBatch[];
  getExpiringBatches: () => BloodBatch[];
  getExpiredBatches: () => BloodBatch[];
  getFifoRecommendedBatches: () => BloodBatch[];
  isBatchUsable: (batch: BloodBatch) => boolean;
  getNearExpiryBatches: (days: number) => BloodBatch[];
  getExpiredWithStockBatches: () => BloodBatch[];
  getExhaustedBatches: () => BloodBatch[];
  addConsumption: (record: ConsumptionRecord) => void;
  addBloodBatch: (batch: BloodBatch) => void;
  addOutbound: (record: OutboundRecord) => void;
  distributeQuota: (record: QuotaDistributionRecord) => void;
  resetCycleQuota: (orgId: string) => void;
  createSelfpayApply: (apply: SelfpayApply) => void;
  approveSelfpayApply: (applyId: string, approver: string) => void;
  setCurrentOrgId: (orgId: string) => void;
  getDonorByIdCard: (idCard: string) => Donor | undefined;
  upsertDonor: (donor: Partial<Donor> & { idCard: string; name: string; bloodType: BloodType; phone: string }) => Donor;
  updateDonorAfterDonate: (idCard: string, donateDate: string) => void;
  getInventoryLogsByBatchId: (batchId: string) => InventoryLog[];
  addInventoryLog: (log: Omit<InventoryLog, 'id' | 'logTime'>) => void;
  rejectSelfpayApply: (applyId: string, approver: string, rejectReason: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  quotaList: [],
  quotaDistributionRecords: [],
  consumptionRecords: [],
  bloodBatches: [],
  outboundRecords: [],
  selfpayApplications: [],
  donors: [],
  inventoryLogs: [],
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
    const exhaustedCount = state.bloodBatches.filter(b => b.remainingQuantity === 0).length;
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
      totalBatches, nearExpiryCount, expiredCount, exhaustedCount,
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

  isBatchUsable: (batch) => {
    return batch.status !== 'expired' && batch.status !== 'locked' && batch.remainingQuantity > 0;
  },

  getNearExpiryBatches: (days) => {
    return get().bloodBatches
      .filter(b => b.daysToExpiry > 0 && b.daysToExpiry <= days && b.remainingQuantity > 0);
  },

  getExpiredWithStockBatches: () => {
    return get().bloodBatches
      .filter(b => b.status === 'expired' && b.remainingQuantity > 0);
  },

  getExhaustedBatches: () => {
    return get().bloodBatches
      .filter(b => b.remainingQuantity === 0);
  },

  addConsumption: (record) => {
    set((state) => {
      const quotaIndex = state.quotaList.findIndex(q => q.orgId === record.orgId);
      let newQuotaList = state.quotaList;
      if (quotaIndex >= 0) {
        const quota = state.quotaList[quotaIndex];
        const newQuota = { ...quota };
        if (record.type === 'quota') {
          newQuota.usedQuota = quota.usedQuota + record.amount;
          newQuota.remainingQuota = Math.max(0, quota.remainingQuota - record.amount);
        } else {
          newQuota.selfpayCount = quota.selfpayCount + record.amount;
        }
        newQuotaList = [...state.quotaList];
        newQuotaList[quotaIndex] = newQuota;
      }

      let newDonors = state.donors;
      if (record.idCard) {
        const donorIndex = state.donors.findIndex(d => d.idCard === record.idCard);
        if (donorIndex >= 0) {
          const donor = { ...state.donors[donorIndex] };
          donor.lastDonateDate = record.donateDate;
          donor.donateCount = donor.donateCount + 1;
          newDonors = [...state.donors];
          newDonors[donorIndex] = donor;
        }
      }

      return {
        consumptionRecords: [record, ...state.consumptionRecords],
        quotaList: newQuotaList,
        donors: newDonors
      };
    });
  },

  addBloodBatch: (batch) => {
    set((state) => {
      const inboundLog: InventoryLog = {
        id: `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        batchId: batch.id,
        batchNo: batch.batchNo,
        bloodType: batch.bloodType,
        logType: 'inbound' as InventoryLogType,
        changeQty: batch.quantity,
        balanceQty: batch.quantity,
        logTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        operator: '采血登记员',
        relatedNo: `IN${dayjs(batch.collectionDate).format('YYYYMMDD')}${batch.id}`,
        remark: '采血入库'
      };
      return {
        bloodBatches: [batch, ...state.bloodBatches],
        inventoryLogs: [inboundLog, ...state.inventoryLogs]
      };
    });
  },

  addOutbound: (record) => {
    set((state) => {
      const batchIndex = state.bloodBatches.findIndex(b => b.id === record.batchId);
      if (batchIndex < 0) {
        return { outboundRecords: [record, ...state.outboundRecords] };
      }
      const batch = state.bloodBatches[batchIndex];
      const newBatch = {
        ...batch,
        usedQuantity: batch.usedQuantity + record.quantity,
        remainingQuantity: Math.max(0, batch.remainingQuantity - record.quantity)
      };
      const newBatches = [...state.bloodBatches];
      newBatches[batchIndex] = newBatch;

      const outboundLog: InventoryLog = {
        id: `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        batchId: record.batchId,
        batchNo: record.batchNo,
        bloodType: record.bloodType,
        logType: 'outbound' as InventoryLogType,
        changeQty: record.quantity,
        balanceQty: newBatch.remainingQuantity,
        logTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        operator: record.operator,
        relatedNo: record.outboundNo,
        receiver: record.receiver,
        receiverDept: record.receiverDept,
        receiverPhone: record.receiverPhone,
        purpose: record.purpose
      };

      let newLogs = [outboundLog, ...state.inventoryLogs];

      if (newBatch.remainingQuantity === 0) {
        const exhaustedLog: InventoryLog = {
          id: `LOG_${Date.now() + 1}_${Math.random().toString(36).substring(2, 6)}`,
          batchId: record.batchId,
          batchNo: record.batchNo,
          bloodType: record.bloodType,
          logType: 'exhausted' as InventoryLogType,
          changeQty: 0,
          balanceQty: 0,
          logTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          operator: '系统自动',
          remark: '该批次已全部出库完毕'
        };
        newLogs = [exhaustedLog, ...newLogs];
      }

      return {
        outboundRecords: [record, ...state.outboundRecords],
        bloodBatches: newBatches,
        inventoryLogs: newLogs
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
      const newConsumptionRecords = state.consumptionRecords.map(r => {
        if (r.selfpayApplyNo === apply.applyNo) {
          return { ...r, selfpayStatus: 'approved' as const };
        }
        return r;
      });
      return { selfpayApplications: newList, consumptionRecords: newConsumptionRecords };
    });
  },

  setCurrentOrgId: (orgId) => set({ currentOrgId: orgId }),

  getDonorByIdCard: (idCard) => {
    return get().donors.find(d => d.idCard === idCard);
  },

  upsertDonor: (donor) => {
    const state = get();
    const existingIndex = state.donors.findIndex(d => d.idCard === donor.idCard);
    if (existingIndex >= 0) {
      const existing = state.donors[existingIndex];
      const updated: Donor = {
        ...existing,
        name: donor.name,
        bloodType: donor.bloodType,
        phone: donor.phone,
        ...(donor.lastDonateDate !== undefined ? { lastDonateDate: donor.lastDonateDate } : {}),
        ...(donor.donateCount !== undefined ? { donateCount: donor.donateCount } : {})
      };
      const newDonors = [...state.donors];
      newDonors[existingIndex] = updated;
      set({ donors: newDonors });
      return updated;
    } else {
      const newDonor: Donor = {
        id: `D${Date.now()}`,
        idCard: donor.idCard,
        name: donor.name,
        bloodType: donor.bloodType,
        phone: donor.phone,
        donateCount: 0,
        lastDonateDate: undefined
      };
      set({ donors: [newDonor, ...state.donors] });
      return newDonor;
    }
  },

  updateDonorAfterDonate: (idCard, donateDate) => {
    set((state) => {
      const donorIndex = state.donors.findIndex(d => d.idCard === idCard);
      if (donorIndex < 0) return state;
      const donor = { ...state.donors[donorIndex] };
      donor.lastDonateDate = donateDate;
      donor.donateCount = donor.donateCount + 1;
      const newDonors = [...state.donors];
      newDonors[donorIndex] = donor;
      return { donors: newDonors };
    });
  },

  getInventoryLogsByBatchId: (batchId) => {
    return get().inventoryLogs
      .filter(l => l.batchId === batchId)
      .sort((a, b) => dayjs(b.logTime).valueOf() - dayjs(a.logTime).valueOf());
  },

  addInventoryLog: (log) => {
    set((state) => {
      const newLog: InventoryLog = {
        ...log,
        id: `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        logTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
      };
      return {
        inventoryLogs: [newLog, ...state.inventoryLogs]
      };
    });
  },

  rejectSelfpayApply: (applyId, approver, rejectReason) => {
    set((state) => {
      const idx = state.selfpayApplications.findIndex(a => a.id === applyId);
      if (idx < 0) return state;
      const apply = { ...state.selfpayApplications[idx] };
      apply.status = 'rejected';
      apply.approver = approver;
      apply.approvalDate = new Date().toISOString().split('T')[0];
      apply.rejectReason = rejectReason;
      const newList = [...state.selfpayApplications];
      newList[idx] = apply;
      const newConsumptionRecords = state.consumptionRecords.map(r => {
        if (r.selfpayApplyNo === apply.applyNo) {
          return { ...r, selfpayStatus: 'rejected' as const };
        }
        return r;
      });
      return { selfpayApplications: newList, consumptionRecords: newConsumptionRecords };
    });
  }
}));
