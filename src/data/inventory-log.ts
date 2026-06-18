import type { InventoryLog } from '@/types';
import dayjs from 'dayjs';
import { mockBloodBatches } from './batch';
import { mockOutboundRecords } from './outbound';

const today = dayjs();

const logs: InventoryLog[] = [];

mockBloodBatches.forEach((batch) => {
  const collectionDay = dayjs(batch.collectionDate);

  logs.push({
    id: `LOG_${batch.id}_IN`,
    batchId: batch.id,
    batchNo: batch.batchNo,
    bloodType: batch.bloodType,
    logType: 'inbound',
    changeQty: batch.quantity,
    balanceQty: batch.quantity,
    logTime: collectionDay.format('YYYY-MM-DD HH:mm:ss'),
    operator: '采血登记员',
    relatedNo: `IN${collectionDay.format('YYYYMMDD')}${batch.id}`,
    remark: '采血入库'
  });

  switch (batch.id) {
    case 'B001': {
      const ob1 = mockOutboundRecords.find(o => o.id === 'OB001');
      if (ob1) {
        logs.push({
          id: `LOG_${batch.id}_OUT1`,
          batchId: batch.id,
          batchNo: batch.batchNo,
          bloodType: batch.bloodType,
          logType: 'outbound',
          changeQty: ob1.quantity,
          balanceQty: batch.quantity - ob1.quantity,
          logTime: dayjs(ob1.outboundDate).format('YYYY-MM-DD HH:mm:ss'),
          operator: ob1.operator,
          relatedNo: ob1.outboundNo,
          receiver: ob1.receiver,
          receiverDept: ob1.receiverDept,
          receiverPhone: ob1.receiverPhone,
          purpose: ob1.purpose
        });
      }
      logs.push({
        id: `LOG_${batch.id}_OUT2`,
        batchId: batch.id,
        batchNo: batch.batchNo,
        bloodType: batch.bloodType,
        logType: 'outbound',
        changeQty: 18,
        balanceQty: 22,
        logTime: today.subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
        operator: '王主任',
        relatedNo: 'OUT202506120007',
        receiver: '市第一人民医院',
        receiverDept: '血液科',
        purpose: '临床用血'
      });
      break;
    }
    case 'B002': {
      const ob2 = mockOutboundRecords.find(o => o.id === 'OB002');
      if (ob2) {
        logs.push({
          id: `LOG_${batch.id}_OUT1`,
          batchId: batch.id,
          batchNo: batch.batchNo,
          bloodType: batch.bloodType,
          logType: 'outbound',
          changeQty: ob2.quantity,
          balanceQty: batch.quantity - ob2.quantity,
          logTime: dayjs(ob2.outboundDate).format('YYYY-MM-DD HH:mm:ss'),
          operator: ob2.operator,
          relatedNo: ob2.outboundNo,
          receiver: ob2.receiver,
          receiverDept: ob2.receiverDept,
          receiverPhone: ob2.receiverPhone,
          purpose: ob2.purpose
        });
      }
      logs.push({
        id: `LOG_${batch.id}_OUT2`,
        batchId: batch.id,
        batchNo: batch.batchNo,
        bloodType: batch.bloodType,
        logType: 'outbound',
        changeQty: 15,
        balanceQty: 15,
        logTime: today.subtract(4, 'day').format('YYYY-MM-DD HH:mm:ss'),
        operator: '李主管',
        relatedNo: 'OUT202506110008',
        receiver: '市中医院',
        receiverDept: '外科',
        purpose: '手术备血'
      });
      break;
    }
    case 'B003': {
      logs.push({
        id: `LOG_${batch.id}_OUT1`,
        batchId: batch.id,
        batchNo: batch.batchNo,
        bloodType: batch.bloodType,
        logType: 'outbound',
        changeQty: 12,
        balanceQty: 23,
        logTime: today.subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'),
        operator: '王主任',
        relatedNo: 'OUT202506100009',
        receiver: '市第二人民医院',
        receiverDept: '内科',
        purpose: '常规用血'
      });
      break;
    }
    case 'B004': {
      const ob4 = mockOutboundRecords.find(o => o.id === 'OB004');
      if (ob4) {
        logs.push({
          id: `LOG_${batch.id}_OUT1`,
          batchId: batch.id,
          batchNo: batch.batchNo,
          bloodType: batch.bloodType,
          logType: 'outbound',
          changeQty: ob4.quantity,
          balanceQty: batch.quantity - ob4.quantity,
          logTime: dayjs(ob4.outboundDate).format('YYYY-MM-DD HH:mm:ss'),
          operator: ob4.operator,
          relatedNo: ob4.outboundNo,
          receiver: ob4.receiver,
          receiverDept: ob4.receiverDept,
          receiverPhone: ob4.receiverPhone,
          purpose: ob4.purpose
        });
      }
      logs.push({
        id: `LOG_${batch.id}_OUT2`,
        batchId: batch.id,
        batchNo: batch.batchNo,
        bloodType: batch.bloodType,
        logType: 'outbound',
        changeQty: 2,
        balanceQty: 15,
        logTime: today.subtract(6, 'day').format('YYYY-MM-DD HH:mm:ss'),
        operator: '李主管',
        relatedNo: 'OUT202506090010',
        receiver: '市第一人民医院',
        receiverDept: '输血科',
        purpose: '稀有血型调配'
      });
      break;
    }
    case 'B006': {
      const ob3 = mockOutboundRecords.find(o => o.id === 'OB003');
      if (ob3) {
        logs.push({
          id: `LOG_${batch.id}_OUT1`,
          batchId: batch.id,
          batchNo: batch.batchNo,
          bloodType: batch.bloodType,
          logType: 'outbound',
          changeQty: ob3.quantity,
          balanceQty: batch.quantity - ob3.quantity,
          logTime: dayjs(ob3.outboundDate).format('YYYY-MM-DD HH:mm:ss'),
          operator: ob3.operator,
          relatedNo: ob3.outboundNo,
          receiver: ob3.receiver,
          receiverDept: ob3.receiverDept,
          receiverPhone: ob3.receiverPhone,
          purpose: ob3.purpose
        });
      }
      logs.push({
        id: `LOG_${batch.id}_OUT2`,
        batchId: batch.id,
        batchNo: batch.batchNo,
        bloodType: batch.bloodType,
        logType: 'outbound',
        changeQty: 15,
        balanceQty: 10,
        logTime: today.subtract(7, 'day').format('YYYY-MM-DD HH:mm:ss'),
        operator: '王主任',
        relatedNo: 'OUT202506080011',
        receiver: '市中心血站',
        receiverDept: '调配科',
        purpose: '临期紧急调配'
      });
      break;
    }
    case 'B010': {
      const ob6 = mockOutboundRecords.find(o => o.id === 'OB006');
      if (ob6) {
        logs.push({
          id: `LOG_${batch.id}_OUT1`,
          batchId: batch.id,
          batchNo: batch.batchNo,
          bloodType: batch.bloodType,
          logType: 'outbound',
          changeQty: ob6.quantity,
          balanceQty: batch.quantity - ob6.quantity,
          logTime: dayjs(ob6.outboundDate).format('YYYY-MM-DD HH:mm:ss'),
          operator: ob6.operator,
          relatedNo: ob6.outboundNo,
          receiver: ob6.receiver,
          receiverDept: ob6.receiverDept,
          receiverPhone: ob6.receiverPhone,
          purpose: ob6.purpose
        });
      }
      logs.push({
        id: `LOG_${batch.id}_OUT2`,
        batchId: batch.id,
        batchNo: batch.batchNo,
        bloodType: batch.bloodType,
        logType: 'outbound',
        changeQty: 6,
        balanceQty: 37,
        logTime: today.subtract(8, 'day').format('YYYY-MM-DD HH:mm:ss'),
        operator: '李主管',
        relatedNo: 'OUT202506070012',
        receiver: '市第一人民医院',
        receiverDept: '急诊科',
        purpose: '急诊用血'
      });
      break;
    }
    case 'B007': {
      logs.push({
        id: `LOG_${batch.id}_OUT1`,
        batchId: batch.id,
        batchNo: batch.batchNo,
        bloodType: batch.bloodType,
        logType: 'outbound',
        changeQty: 25,
        balanceQty: 0,
        logTime: today.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
        operator: '王主任',
        relatedNo: 'OUT202506170013',
        receiver: '市第一人民医院',
        receiverDept: '输血科',
        purpose: '到期前全部出库'
      });
      logs.push({
        id: `LOG_${batch.id}_EXH`,
        batchId: batch.id,
        batchNo: batch.batchNo,
        bloodType: batch.bloodType,
        logType: 'exhausted',
        changeQty: 0,
        balanceQty: 0,
        logTime: today.subtract(1, 'day').add(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        operator: '系统自动',
        remark: '该批次已全部出库完毕'
      });
      break;
    }
    case 'B008': {
      logs.push({
        id: `LOG_${batch.id}_OUT1`,
        batchId: batch.id,
        batchNo: batch.batchNo,
        bloodType: batch.bloodType,
        logType: 'outbound',
        changeQty: 15,
        balanceQty: 25,
        logTime: dayjs(batch.expiryDate).subtract(10, 'day').format('YYYY-MM-DD HH:mm:ss'),
        operator: '李主管',
        relatedNo: 'OUT202506010014',
        receiver: '市第一人民医院',
        receiverDept: '输血科',
        purpose: '过期前出库'
      });
      logs.push({
        id: `LOG_${batch.id}_EXP`,
        batchId: batch.id,
        batchNo: batch.batchNo,
        bloodType: batch.bloodType,
        logType: 'expired_lock',
        changeQty: 0,
        balanceQty: 25,
        logTime: dayjs(batch.expiryDate).add(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        operator: '系统自动',
        remark: '该批次已过期，自动锁定'
      });
      break;
    }
    case 'B009': {
      logs.push({
        id: `LOG_${batch.id}_OUT1`,
        batchId: batch.id,
        batchNo: batch.batchNo,
        bloodType: batch.bloodType,
        logType: 'outbound',
        changeQty: 8,
        balanceQty: 7,
        logTime: dayjs(batch.expiryDate).subtract(7, 'day').format('YYYY-MM-DD HH:mm:ss'),
        operator: '王主任',
        relatedNo: 'OUT202506030015',
        receiver: '妇幼保健院',
        receiverDept: '输血科',
        purpose: '稀有血型使用'
      });
      logs.push({
        id: `LOG_${batch.id}_EXP`,
        batchId: batch.id,
        batchNo: batch.batchNo,
        bloodType: batch.bloodType,
        logType: 'expired_lock',
        changeQty: 0,
        balanceQty: 7,
        logTime: dayjs(batch.expiryDate).add(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        operator: '系统自动',
        remark: '该批次已过期，自动锁定'
      });
      break;
    }
    case 'B005':
    default:
      break;
  }
});

export const mockInventoryLogs: InventoryLog[] = logs;
