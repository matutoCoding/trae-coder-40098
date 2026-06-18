import type { Donor } from '@/types';
import dayjs from 'dayjs';

const today = dayjs();

export const mockDonors: Donor[] = [
  {
    id: 'D001',
    name: '张伟',
    idCard: '110101199001011234',
    bloodType: 'A',
    phone: '13800138001',
    lastDonateDate: today.subtract(195, 'day').format('YYYY-MM-DD'),
    donateCount: 3
  },
  {
    id: 'D002',
    name: '王芳',
    idCard: '310101199203152345',
    bloodType: 'O',
    phone: '13800138002',
    lastDonateDate: today.subtract(210, 'day').format('YYYY-MM-DD'),
    donateCount: 4
  },
  {
    id: 'D003',
    name: '刘强',
    idCard: '440101198805203456',
    bloodType: 'B',
    phone: '13800138003',
    lastDonateDate: today.subtract(250, 'day').format('YYYY-MM-DD'),
    donateCount: 2
  },
  {
    id: 'D004',
    name: '陈静',
    idCard: '510101199508084567',
    bloodType: 'AB',
    phone: '13800138004',
    lastDonateDate: today.subtract(300, 'day').format('YYYY-MM-DD'),
    donateCount: 5
  },
  {
    id: 'D005',
    name: '李明',
    idCard: '320101199312125678',
    bloodType: 'A',
    phone: '13800138005',
    lastDonateDate: today.subtract(200, 'day').format('YYYY-MM-DD'),
    donateCount: 3
  },
  {
    id: 'D006',
    name: '赵琳',
    idCard: '330101199406066789',
    bloodType: 'O',
    phone: '13800138006',
    lastDonateDate: today.subtract(185, 'day').format('YYYY-MM-DD'),
    donateCount: 2
  },
  {
    id: 'D007',
    name: '孙磊',
    idCard: '370101199109097890',
    bloodType: 'B',
    phone: '13800138007',
    lastDonateDate: today.subtract(90, 'day').format('YYYY-MM-DD'),
    donateCount: 4
  },
  {
    id: 'D008',
    name: '周雯',
    idCard: '420101199604048901',
    bloodType: 'AB',
    phone: '13800138008',
    lastDonateDate: today.subtract(270, 'day').format('YYYY-MM-DD'),
    donateCount: 5
  }
];
