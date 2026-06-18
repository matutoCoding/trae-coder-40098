import dayjs from 'dayjs';
import Taro from '@tarojs/taro';
import type { BloodBatch, BatchStatus, BloodType } from '@/types';

export const formatDate = (date: string | Date, format = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date, format = 'YYYY-MM-DD HH:mm'): string => {
  return dayjs(date).format(format);
};

export const calculateDaysBetween = (start: string | Date, end: string | Date): number => {
  return dayjs(end).diff(dayjs(start), 'day');
};

export const isDonateIntervalValid = (lastDonateDate?: string): { valid: boolean; days: number } => {
  if (!lastDonateDate) {
    return { valid: true, days: -1 };
  }
  const DAYS = 180;
  const today = dayjs();
  const last = dayjs(lastDonateDate);
  const daysSince = today.diff(last, 'day');
  return {
    valid: daysSince >= DAYS,
    days: daysSince
  };
};

export const getDaysToExpiry = (expiryDate: string): number => {
  const today = dayjs();
  const expiry = dayjs(expiryDate);
  return expiry.diff(today, 'day');
};

export const getBatchStatus = (batch: Omit<BloodBatch, 'status' | 'daysToExpiry'> & { daysToExpiry?: number }): { status: BatchStatus; daysToExpiry: number } => {
  const days = batch.daysToExpiry ?? getDaysToExpiry(batch.expiryDate);
  if (batch.remainingQuantity <= 0) {
    return { status: 'locked', daysToExpiry: days };
  }
  if (days < 0) {
    return { status: 'expired', daysToExpiry: days };
  }
  if (days <= 30) {
    return { status: 'near_expiry', daysToExpiry: days };
  }
  return { status: 'normal', daysToExpiry: days };
};

export const EXHAUSTED_BADGE_TEXT = '📦 已清空（无库存锁定）';

export const isBatchExhausted = (batch: { remainingQuantity: number }): boolean => {
  return batch.remainingQuantity === 0;
};

export const getStatusText = (status: BatchStatus): string => {
  const map: Record<BatchStatus, string> = {
    normal: '正常',
    near_expiry: '临期',
    expired: '已过期',
    locked: '已锁定'
  };
  return map[status];
};

export const getBloodTypeText = (type: BloodType): string => {
  return `${type}型`;
};

export const getBloodTypeColor = (type: BloodType): string => {
  const map: Record<BloodType, string> = {
    A: '#EF5350',
    B: '#42A5F5',
    AB: '#AB47BC',
    O: '#66BB6A'
  };
  return map[type];
};

export const getUsageRate = (used: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((used / total) * 100);
};

export const generateBatchNo = (): string => {
  const now = dayjs();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BT${now.format('YYYYMMDD')}${rand}`;
};

export const generateOrderNo = (prefix: string): string => {
  const now = dayjs();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${now.format('YYYYMMDDHHmmss')}${rand}`;
};

export const validateIdCard = (idCard: string): boolean => {
  const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
  return reg.test(idCard);
};

export const validatePhone = (phone: string): boolean => {
  const reg = /^1[3-9]\d{9}$/;
  return reg.test(phone);
};

export const getFifoSortedBatches = (batches: BloodBatch[], bloodType?: BloodType): BloodBatch[] => {
  let filtered = batches.filter(b => b.status !== 'expired' && b.status !== 'locked' && b.remainingQuantity > 0);
  if (bloodType) {
    filtered = filtered.filter(b => b.bloodType === bloodType);
  }
  return filtered.sort((a, b) => {
    const expiryCompare = dayjs(a.expiryDate).valueOf() - dayjs(b.expiryDate).valueOf();
    if (expiryCompare !== 0) return expiryCompare;
    return dayjs(a.collectionDate).valueOf() - dayjs(b.collectionDate).valueOf();
  });
};

export const formatNumber = (num: number, decimals = 0): string => {
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const chooseDate = async (initialDate?: string): Promise<string | null> => {
  try {
    const res = await (Taro as any).chooseDate({
      begin: '1900-01-01',
      end: dayjs().add(100, 'day').format('YYYY-MM-DD'),
      current: initialDate || dayjs().format('YYYY-MM-DD')
    });
    if (res && (res as any).date) return (res as any).date;
    if (res && typeof res === 'string') return res;
  } catch (e) {
  }
  try {
    if (typeof window !== 'undefined' && (window as any).prompt) {
      const val = (window as any).prompt(
        '请选择/输入日期（格式：YYYY-MM-DD）',
        initialDate || dayjs().format('YYYY-MM-DD')
      );
      if (val && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    }
  } catch (e) {
  }
  return null;
};
