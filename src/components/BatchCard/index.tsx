import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';
import type { BloodBatch } from '@/types';
import { formatDate, getUsageRate } from '@/utils';
import StatusTag from '@/components/StatusTag';

interface BatchCardProps {
  batch: BloodBatch;
  onClick?: () => void;
  showFifoBadge?: boolean;
  showArrow?: boolean;
  showExhausted?: boolean;
}

const BatchCard: React.FC<BatchCardProps> = ({ batch, onClick, showFifoBadge = false, showArrow = false, showExhausted = false }) => {
  const rate = getUsageRate(batch.usedQuantity, batch.quantity);
  const isExhausted = batch.remainingQuantity === 0;

  const getExpiryBadge = () => {
    if (batch.status === 'expired') {
      return <View className={classnames(styles.expiryWarn, styles.danger)}>已过期</View>;
    }
    if (batch.status === 'near_expiry') {
      const dayText = batch.daysToExpiry === 0 ? '今日到期' : `${batch.daysToExpiry}天后过期`;
      return <View className={classnames(styles.expiryWarn, styles.warn)}>{dayText}</View>;
    }
    return null;
  };

  return (
    <View
      className={classnames(
        styles.batchCard,
        batch.status === 'expired' && styles.expiredCard,
        batch.status === 'near_expiry' && styles.nearExpiryCard
      )}
      onClick={onClick}
    >
      {getExpiryBadge()}

      <View className={styles.header}>
        <View className={styles.left}>
          <Text className={styles.batchNo}>{batch.batchNo}</Text>
          <View className={styles.tagsRow}>
            <StatusTag type={batch.bloodType} />
            {showExhausted && isExhausted && (
              <View className={classnames(styles.exhaustedBadge)}>📦 已清空</View>
            )}
            <StatusTag type={batch.status} />
            {showFifoBadge && batch.status !== 'expired' && batch.status !== 'locked' && !isExhausted && (
              <View style={{
                fontSize: '22rpx',
                padding: '4rpx 12rpx',
                borderRadius: '8rpx',
                background: 'rgba(25, 118, 210, 0.12)',
                color: '#1976D2',
                fontWeight: '500'
              }}>FIFO推荐</View>
            )}
          </View>
        </View>
        {showArrow && (
          <Text className={styles.arrowIcon}>›</Text>
        )}
      </View>

      <View className={styles.progressRow}>
        <View className={styles.progressInfo}>
          <Text>库存使用率</Text>
          <Text className={styles.remain}>剩余 {batch.remainingQuantity} 份</Text>
        </View>
        <View className={styles.bar}>
          <View className={styles.fill} style={{ width: `${rate}%` }} />
        </View>
      </View>

      <View className={styles.statsGrid}>
        <View className={classnames(styles.stat, styles.primary)}>
          <Text className={styles.value}>{batch.quantity}</Text>
          <Text className={styles.label}>总采集</Text>
        </View>
        <View className={classnames(styles.stat, styles.success)}>
          <Text className={styles.value}>{batch.donorCount}</Text>
          <Text className={styles.label}>献血人数</Text>
        </View>
        <View className={classnames(styles.stat, styles.warning)}>
          <Text className={styles.value}>{batch.usedQuantity}</Text>
          <Text className={styles.label}>已出库</Text>
        </View>
      </View>

      <View className={styles.infoRow}>
        <Text className={styles.site}>📍 {batch.collectionSite}</Text>
        <Text>有效期至 {formatDate(batch.expiryDate)}</Text>
      </View>
    </View>
  );
};

export default BatchCard;
