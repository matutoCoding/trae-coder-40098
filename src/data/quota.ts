import type { QuotaInfo, QuotaDistributionRecord } from '@/types';
import dayjs from 'dayjs';

const today = dayjs();

export const mockQuotaList: QuotaInfo[] = [
  {
    id: 'Q001',
    orgId: 'ORG001',
    orgName: '市第一人民医院',
    totalQuota: 200,
    usedQuota: 143,
    remainingQuota: 57,
    cycleStart: today.subtract(15, 'day').format('YYYY-MM-DD'),
    cycleEnd: today.add(15, 'day').format('YYYY-MM-DD'),
    cycle: 'monthly',
    selfpayCount: 12
  },
  {
    id: 'Q002',
    orgId: 'ORG002',
    orgName: '市中心血站',
    totalQuota: 500,
    usedQuota: 328,
    remainingQuota: 172,
    cycleStart: today.subtract(20, 'day').format('YYYY-MM-DD'),
    cycleEnd: today.add(40, 'day').format('YYYY-MM-DD'),
    cycle: 'quarterly',
    selfpayCount: 25
  },
  {
    id: 'Q003',
    orgId: 'ORG003',
    orgName: '市第二人民医院',
    totalQuota: 150,
    usedQuota: 150,
    remainingQuota: 0,
    cycleStart: today.subtract(10, 'day').format('YYYY-MM-DD'),
    cycleEnd: today.add(20, 'day').format('YYYY-MM-DD'),
    cycle: 'monthly',
    selfpayCount: 34
  },
  {
    id: 'Q004',
    orgId: 'ORG004',
    orgName: '妇幼保健院',
    totalQuota: 100,
    usedQuota: 45,
    remainingQuota: 55,
    cycleStart: today.subtract(30, 'day').format('YYYY-MM-DD'),
    cycleEnd: today.subtract(1, 'day').format('YYYY-MM-DD'),
    cycle: 'monthly',
    selfpayCount: 5
  }
];

export const mockQuotaDistributionRecords: QuotaDistributionRecord[] = [
  {
    id: 'QD001',
    orgId: 'ORG001',
    orgName: '市第一人民医院',
    quotaAmount: 200,
    cycle: 'monthly',
    distributeDate: today.subtract(15, 'day').format('YYYY-MM-DD'),
    operator: '管理员',
    remark: '月度常规发放'
  },
  {
    id: 'QD002',
    orgId: 'ORG002',
    orgName: '市中心血站',
    quotaAmount: 500,
    cycle: 'quarterly',
    distributeDate: today.subtract(20, 'day').format('YYYY-MM-DD'),
    operator: '管理员',
    remark: '季度发放'
  },
  {
    id: 'QD003',
    orgId: 'ORG003',
    orgName: '市第二人民医院',
    quotaAmount: 150,
    cycle: 'monthly',
    distributeDate: today.subtract(10, 'day').format('YYYY-MM-DD'),
    operator: '管理员',
    remark: '月度发放'
  }
];
