import type { OutboundRecord, SelfpayApply } from '@/types';
import dayjs from 'dayjs';

const today = dayjs();

export const mockOutboundRecords: OutboundRecord[] = [
  {
    id: 'OB001',
    outboundNo: 'OUT202506150001',
    batchId: 'B001',
    batchNo: 'BT20250610A001',
    bloodType: 'A',
    quantity: 10,
    outboundDate: today.subtract(1, 'day').format('YYYY-MM-DD'),
    receiver: '市第一人民医院',
    receiverDept: '输血科',
    purpose: '常规手术用血',
    status: 'completed',
    isFifoRecommended: true,
    operator: '王主任'
  },
  {
    id: 'OB002',
    outboundNo: 'OUT202506140002',
    batchId: 'B002',
    batchNo: 'BT20250609O002',
    bloodType: 'O',
    quantity: 15,
    outboundDate: today.subtract(2, 'day').format('YYYY-MM-DD'),
    receiver: '市中心医院',
    receiverDept: '急诊科',
    purpose: '急救用血',
    status: 'completed',
    isFifoRecommended: true,
    operator: '王主任'
  },
  {
    id: 'OB003',
    outboundNo: 'OUT202506130003',
    batchId: 'B006',
    batchNo: 'BT20250525B006',
    bloodType: 'B',
    quantity: 5,
    outboundDate: today.subtract(3, 'day').format('YYYY-MM-DD'),
    receiver: '市第二人民医院',
    receiverDept: '外科',
    purpose: '临期优先出库',
    status: 'completed',
    isFifoRecommended: true,
    operator: '李主管'
  },
  {
    id: 'OB004',
    outboundNo: 'OUT202506180004',
    batchId: 'B004',
    batchNo: 'BT20250606AB004',
    bloodType: 'AB',
    quantity: 3,
    outboundDate: today.format('YYYY-MM-DD'),
    receiver: '妇幼保健院',
    receiverDept: '产科',
    purpose: '待产备血',
    status: 'pending',
    isFifoRecommended: true,
    operator: '王主任',
    approvalRemark: '待审批'
  },
  {
    id: 'OB005',
    outboundNo: 'OUT202506100005',
    batchId: 'B005',
    batchNo: 'BT20250604A005',
    bloodType: 'A',
    quantity: 8,
    outboundDate: today.subtract(5, 'day').format('YYYY-MM-DD'),
    receiver: '市第一人民医院',
    receiverDept: '心内科',
    purpose: '手术用血',
    status: 'completed',
    isFifoRecommended: false,
    operator: '王主任'
  },
  {
    id: 'OB006',
    outboundNo: 'OUT202506180006',
    batchId: 'B010',
    batchNo: 'BT20250601O010',
    bloodType: 'O',
    quantity: 12,
    outboundDate: today.format('YYYY-MM-DD'),
    receiver: '市第一人民医院',
    receiverDept: 'ICU',
    purpose: '重症患者用血',
    status: 'approved',
    isFifoRecommended: true,
    operator: '李主管'
  }
];

export const mockSelfpayApplications: SelfpayApply[] = [
  {
    id: 'SP001',
    applyNo: 'SP202506150001',
    orgId: 'ORG003',
    orgName: '市第二人民医院',
    applicant: '张主任',
    applyDate: today.subtract(2, 'day').format('YYYY-MM-DD'),
    exceedCount: 20,
    reason: '本月献血指标已用完，仍有30名员工自愿献血，申请自费指标20人份',
    status: 'pending'
  },
  {
    id: 'SP002',
    applyNo: 'SP202506120002',
    orgId: 'ORG001',
    orgName: '市第一人民医院',
    applicant: '李主任',
    applyDate: today.subtract(8, 'day').format('YYYY-MM-DD'),
    exceedCount: 12,
    reason: '突发手术用血需求，急需额外献血指标',
    status: 'approved',
    approver: '王局长',
    approvalDate: today.subtract(7, 'day').format('YYYY-MM-DD'),
    approvalRemark: '情况紧急，同意追加'
  }
];
