import React from 'react';
import { Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';
import type { BatchStatus, ConsumptionType, OutboundStatus, ApplyStatus, BloodType } from '@/types';
import { getStatusText, getBloodTypeText } from '@/utils';

type TagType = BatchStatus | ConsumptionType | OutboundStatus | ApplyStatus | BloodType | 'quota' | 'selfpay';

interface StatusTagProps {
  type: TagType;
  text?: string;
}

const getClassName = (type: TagType): string => {
  const map: Record<string, string> = {
    normal: styles.normal,
    near_expiry: styles.nearExpiry,
    expired: styles.expired,
    locked: styles.locked,
    quota: styles.quota,
    selfpay: styles.selfpay,
    pending: styles.pending,
    approved: styles.approved,
    rejected: styles.rejected,
    completed: styles.completed,
    A: styles.bloodA,
    B: styles.bloodB,
    AB: styles.bloodAB,
    O: styles.bloodO
  };
  return map[type] || styles.normal;
};

const getDisplayText = (type: TagType, customText?: string): string => {
  if (customText) return customText;
  if (type === 'quota') return '额度内';
  if (type === 'selfpay') return '自费';
  if (type === 'A' || type === 'B' || type === 'AB' || type === 'O') return getBloodTypeText(type);
  if (type === 'normal' || type === 'near_expiry' || type === 'expired' || type === 'locked') {
    return getStatusText(type as BatchStatus);
  }
  if (type === 'pending') return '待审批';
  if (type === 'approved') return '已通过';
  if (type === 'rejected') return '已拒绝';
  if (type === 'completed') return '已完成';
  return String(type);
};

const StatusTag: React.FC<StatusTagProps> = ({ type, text }) => {
  return (
    <Text className={classnames(styles.statusTag, getClassName(type))}>
      {getDisplayText(type, text)}
    </Text>
  );
};

export default StatusTag;
