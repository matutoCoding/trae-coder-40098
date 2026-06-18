import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';
import type { QuotaInfo } from '@/types';
import { getUsageRate, formatDate } from '@/utils';

interface QuotaCardProps {
  quota: QuotaInfo;
  onClick?: () => void;
}

const getCycleText = (cycle: string): string => {
  const map: Record<string, string> = {
    monthly: '月度周期',
    quarterly: '季度周期',
    yearly: '年度周期'
  };
  return map[cycle] || cycle;
};

const QuotaCard: React.FC<QuotaCardProps> = ({ quota, onClick }) => {
  const rate = getUsageRate(quota.usedQuota, quota.totalQuota);
  const progressClass = rate >= 90 ? styles.danger : rate >= 70 ? styles.warning : '';

  return (
    <View className={styles.quotaCard} onClick={onClick}>
      <View className={styles.header}>
        <Text className={styles.orgName}>{quota.orgName}</Text>
        <Text className={styles.cycleTag}>{getCycleText(quota.cycle)}</Text>
      </View>

      <View className={styles.progressSection}>
        <View className={styles.progressInfo}>
          <Text className={styles.used}>
            已使用 {quota.usedQuota} / {quota.totalQuota}
          </Text>
          <Text className={styles.rate}>{rate}%</Text>
        </View>
        <View className={styles.progressBar}>
          <View
            className={classnames(styles.progressFill, progressClass)}
            style={{ width: `${Math.min(rate, 100)}%` }}
          />
        </View>
      </View>

      <View className={styles.statsRow}>
        <View className={classnames(styles.statItem, styles.primary)}>
          <Text className={styles.value}>{quota.remainingQuota}</Text>
          <Text className={styles.label}>剩余额度</Text>
        </View>
        <View className={classnames(styles.statItem, styles.success)}>
          <Text className={styles.value}>{quota.totalQuota}</Text>
          <Text className={styles.label}>总额度</Text>
        </View>
        <View className={classnames(styles.statItem, styles.warning)}>
          <Text className={styles.value}>{quota.selfpayCount}</Text>
          <Text className={styles.label}>自费次数</Text>
        </View>
      </View>

      <View className={styles.cycleInfo}>
        <Text>周期开始：{formatDate(quota.cycleStart)}</Text>
        <Text>周期结束：{formatDate(quota.cycleEnd)}</Text>
      </View>
    </View>
  );
};

export default QuotaCard;
