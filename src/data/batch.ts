import type { BloodBatch } from '@/types';
import dayjs from 'dayjs';
import { getDaysToExpiry, getBatchStatus } from '@/utils';

const today = dayjs();

const rawBatches = [
  {
    id: 'B001',
    batchNo: 'BT20250610A001',
    bloodType: 'A' as const,
    collectionDate: today.subtract(1, 'day').format('YYYY-MM-DD'),
    expiryDate: today.add(34, 'day').format('YYYY-MM-DD'),
    quantity: 50,
    usedQuantity: 28,
    remainingQuantity: 22,
    collectionSite: '中心采血点1',
    donorCount: 50
  },
  {
    id: 'B002',
    batchNo: 'BT20250609O002',
    bloodType: 'O' as const,
    collectionDate: today.subtract(2, 'day').format('YYYY-MM-DD'),
    expiryDate: today.add(33, 'day').format('YYYY-MM-DD'),
    quantity: 45,
    usedQuantity: 30,
    remainingQuantity: 15,
    collectionSite: '中心采血点1',
    donorCount: 45
  },
  {
    id: 'B003',
    batchNo: 'BT20250608B003',
    bloodType: 'B' as const,
    collectionDate: today.subtract(3, 'day').format('YYYY-MM-DD'),
    expiryDate: today.add(25, 'day').format('YYYY-MM-DD'),
    quantity: 35,
    usedQuantity: 12,
    remainingQuantity: 23,
    collectionSite: '移动采血车A',
    donorCount: 35
  },
  {
    id: 'B004',
    batchNo: 'BT20250606AB004',
    bloodType: 'AB' as const,
    collectionDate: today.subtract(5, 'day').format('YYYY-MM-DD'),
    expiryDate: today.add(15, 'day').format('YYYY-MM-DD'),
    quantity: 20,
    usedQuantity: 5,
    remainingQuantity: 15,
    collectionSite: '中心采血点2',
    donorCount: 20
  },
  {
    id: 'B005',
    batchNo: 'BT20250604A005',
    bloodType: 'A' as const,
    collectionDate: today.subtract(7, 'day').format('YYYY-MM-DD'),
    expiryDate: today.add(28, 'day').format('YYYY-MM-DD'),
    quantity: 60,
    usedQuantity: 0,
    remainingQuantity: 60,
    collectionSite: '中心采血点1',
    donorCount: 60
  },
  {
    id: 'B006',
    batchNo: 'BT20250525B006',
    bloodType: 'B' as const,
    collectionDate: today.subtract(17, 'day').format('YYYY-MM-DD'),
    expiryDate: today.add(5, 'day').format('YYYY-MM-DD'),
    quantity: 30,
    usedQuantity: 20,
    remainingQuantity: 10,
    collectionSite: '移动采血车B',
    donorCount: 30
  },
  {
    id: 'B007',
    batchNo: 'BT20250520O007',
    bloodType: 'O' as const,
    collectionDate: today.subtract(22, 'day').format('YYYY-MM-DD'),
    expiryDate: today.add(0, 'day').format('YYYY-MM-DD'),
    quantity: 25,
    usedQuantity: 25,
    remainingQuantity: 0,
    collectionSite: '中心采血点2',
    donorCount: 25
  },
  {
    id: 'B008',
    batchNo: 'BT20250510A008',
    bloodType: 'A' as const,
    collectionDate: today.subtract(32, 'day').format('YYYY-MM-DD'),
    expiryDate: today.subtract(8, 'day').format('YYYY-MM-DD'),
    quantity: 40,
    usedQuantity: 15,
    remainingQuantity: 25,
    collectionSite: '中心采血点1',
    donorCount: 40
  },
  {
    id: 'B009',
    batchNo: 'BT20250508AB009',
    bloodType: 'AB' as const,
    collectionDate: today.subtract(34, 'day').format('YYYY-MM-DD'),
    expiryDate: today.subtract(5, 'day').format('YYYY-MM-DD'),
    quantity: 15,
    usedQuantity: 8,
    remainingQuantity: 7,
    collectionSite: '移动采血车A',
    donorCount: 15
  },
  {
    id: 'B010',
    batchNo: 'BT20250601O010',
    bloodType: 'O' as const,
    collectionDate: today.subtract(10, 'day').format('YYYY-MM-DD'),
    expiryDate: today.add(25, 'day').format('YYYY-MM-DD'),
    quantity: 55,
    usedQuantity: 18,
    remainingQuantity: 37,
    collectionSite: '中心采血点1',
    donorCount: 55
  }
];

export const mockBloodBatches: BloodBatch[] = rawBatches.map(b => {
  const days = getDaysToExpiry(b.expiryDate);
  const { status, daysToExpiry } = getBatchStatus({ ...b, daysToExpiry: days });
  return {
    ...b,
    status,
    daysToExpiry
  };
});
