export type BloodType = 'A' | 'B' | 'AB' | 'O';

export type QuotaCycle = 'monthly' | 'quarterly' | 'yearly';

export type BatchStatus = 'normal' | 'near_expiry' | 'expired' | 'locked';

export type ConsumptionType = 'quota' | 'selfpay';

export type OutboundStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export type ApplyStatus = 'pending' | 'approved' | 'rejected';

export type InventoryLogType = 'inbound' | 'outbound' | 'exhausted' | 'expired_lock' | 'manual_lock' | 'manual_unlock' | 'adjust';

export interface Organization {
  id: string;
  name: string;
  quotaCycle: QuotaCycle;
}

export interface QuotaInfo {
  id: string;
  orgId: string;
  orgName: string;
  totalQuota: number;
  usedQuota: number;
  remainingQuota: number;
  cycleStart: string;
  cycleEnd: string;
  cycle: QuotaCycle;
  selfpayCount: number;
}

export interface QuotaDistributionRecord {
  id: string;
  orgId: string;
  orgName: string;
  quotaAmount: number;
  cycle: QuotaCycle;
  distributeDate: string;
  operator: string;
  remark?: string;
}

export interface Donor {
  id: string;
  name: string;
  idCard: string;
  bloodType: BloodType;
  phone: string;
  lastDonateDate?: string;
  donateCount: number;
}

export interface ConsumptionRecord {
  id: string;
  donorId: string;
  donorName: string;
  idCard?: string;
  phone?: string;
  lastDonateDate?: string;
  bloodType: BloodType;
  orgId: string;
  orgName: string;
  type: ConsumptionType;
  amount: number;
  donateDate: string;
  batchNo?: string;
  intervalCheckPassed: boolean;
  daysSinceLastDonate?: number;
  operator: string;
  remark?: string;
  selfpayApplyNo?: string;
  selfpayStatus?: ApplyStatus;
}

export interface BloodBatch {
  id: string;
  batchNo: string;
  bloodType: BloodType;
  collectionDate: string;
  expiryDate: string;
  quantity: number;
  usedQuantity: number;
  remainingQuantity: number;
  status: BatchStatus;
  daysToExpiry: number;
  collectionSite: string;
  donorCount: number;
}

export interface OutboundRecord {
  id: string;
  outboundNo: string;
  batchId: string;
  batchNo: string;
  bloodType: BloodType;
  quantity: number;
  outboundDate: string;
  receiver: string;
  receiverDept: string;
  receiverPhone?: string;
  purpose: string;
  status: OutboundStatus;
  isFifoRecommended: boolean;
  operator: string;
  approvalRemark?: string;
}

export interface SelfpayApply {
  id: string;
  applyNo: string;
  orgId: string;
  orgName: string;
  applicant: string;
  applicantPhone?: string;
  donorName?: string;
  donorPhone?: string;
  donorBloodType?: BloodType;
  donorIdCard?: string;
  lastDonateDate?: string;
  applyDate: string;
  exceedCount: number;
  reason: string;
  status: ApplyStatus;
  approver?: string;
  approvalDate?: string;
  approvalRemark?: string;
  remark?: string;
  rejectReason?: string;
}

export interface DashboardStats {
  totalQuota: number;
  usedQuota: number;
  remainingQuota: number;
  quotaUsageRate: number;
  totalBatches: number;
  nearExpiryCount: number;
  expiredCount: number;
  exhaustedCount?: number;
  totalOutbound: number;
  monthlyDonations: number;
  selfpayApplications: number;
  pendingApprovals: number;
}

export interface StatCardItem {
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
  color?: string;
  bgColor?: string;
}

export interface InventoryLog {
  id: string;
  batchId: string;
  batchNo: string;
  bloodType: BloodType;
  logType: InventoryLogType;
  changeQty: number;
  balanceQty: number;
  logTime: string;
  operator: string;
  relatedNo?: string;
  remark?: string;
  receiver?: string;
  receiverDept?: string;
  receiverPhone?: string;
  purpose?: string;
}
