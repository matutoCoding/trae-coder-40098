import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store';
import styles from './index.module.scss';
import StatusTag from '@/components/StatusTag';
import classnames from 'classnames';
import { formatDate } from '@/utils';
import type { BloodBatch } from '@/types';

interface GroupConfig {
  key: string;
  color: 'red' | 'orange' | 'gray';
  icon: string;
  title: string;
  statusBadge: React.ReactNode;
}

const InventoryAlertPage: React.FC = () => {
  const { bloodBatches } = useAppStore();

  const nearExpiry7 = useMemo(
    () =>
      bloodBatches.filter(
        b => b.daysToExpiry <= 7 && b.daysToExpiry > 0 && b.remainingQuantity > 0
      ).sort((a, b) => a.daysToExpiry - b.daysToExpiry),
    [bloodBatches]
  );

  const nearExpiry30 = useMemo(
    () =>
      bloodBatches.filter(
        b => b.daysToExpiry > 7 && b.daysToExpiry <= 30 && b.remainingQuantity > 0
      ).sort((a, b) => a.daysToExpiry - b.daysToExpiry),
    [bloodBatches]
  );

  const expiredWithStock = useMemo(
    () =>
      bloodBatches
        .filter(b => b.status === 'expired' && b.remainingQuantity > 0)
        .sort((a, b) => a.daysToExpiry - b.daysToExpiry),
    [bloodBatches]
  );

  const totalAlertCount = nearExpiry7.length + nearExpiry30.length + expiredWithStock.length;

  const groups: Array<{
    config: GroupConfig;
    list: BloodBatch[];
  }> = [
    {
      config: {
        key: '7days',
        color: 'red',
        icon: '🚨',
        title: '7天内到期',
        statusBadge: (
          <View
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2rpx 12rpx',
              borderRadius: '8rpx',
              background: 'rgba(245, 63, 63, 0.12)',
              color: '#F53F3F',
              fontSize: '22rpx',
              fontWeight: '600',
              gap: '4rpx'
            }}
          >
            🚨 7天内到期
          </View>
        )
      },
      list: nearExpiry7
    },
    {
      config: {
        key: '30days',
        color: 'orange',
        icon: '⚠️',
        title: '30天内到期',
        statusBadge: (
          <View
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2rpx 12rpx',
              borderRadius: '8rpx',
              background: 'rgba(255, 125, 0, 0.12)',
              color: '#FF7D00',
              fontSize: '22rpx',
              fontWeight: '600',
              gap: '4rpx'
            }}
          >
            ⚠️ 临期30天
          </View>
        )
      },
      list: nearExpiry30
    },
    {
      config: {
        key: 'expired',
        color: 'gray',
        icon: '💀',
        title: '已过期但仍有库存',
        statusBadge: (
          <View
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2rpx 12rpx',
              borderRadius: '8rpx',
              background: 'rgba(78, 89, 105, 0.12)',
              color: '#4E5969',
              fontSize: '22rpx',
              fontWeight: '600',
              gap: '4rpx'
            }}
          >
            💀 已过期
          </View>
        )
      },
      list: expiredWithStock
    }
  ];

  const renderDaysText = (batch: BloodBatch, color: 'red' | 'orange' | 'gray') => {
    if (batch.status === 'expired') {
      return (
        <Text className={classnames(styles.daysText, styles[color])}>
          已过期{Math.abs(batch.daysToExpiry)}天
        </Text>
      );
    }
    if (batch.daysToExpiry === 0) {
      return <Text className={classnames(styles.daysText, styles[color])}>今日到期</Text>;
    }
    return (
      <Text className={classnames(styles.daysText, styles[color])}>
        剩余{batch.daysToExpiry}天
      </Text>
    );
  };

  const renderBatchCard = (batch: BloodBatch, config: GroupConfig) => (
    <View
      key={batch.id}
      className={classnames(styles.batchCard, styles[config.color])}
      onClick={() => Taro.navigateTo({ url: `/pages/batch-detail/index?id=${batch.id}` })}
    >
      <View className={styles.cardLeft}>
        <Text className={styles.batchNo}>{batch.batchNo}</Text>
        <View className={styles.tagsRow}>
          <StatusTag type={batch.bloodType} />
          {config.statusBadge}
        </View>
        {config.color === 'gray' && (
          <View className={styles.expiredWarn}>⚠️ 已过期切勿出库，请及时处理</View>
        )}
      </View>

      <View className={styles.cardCenter}>
        <Text className={styles.expiryDate}>效期 {formatDate(batch.expiryDate)}</Text>
        {renderDaysText(batch, config.color)}
        <Text className={styles.remaining}>
          剩余
          {config.color === 'gray' ? (
            <Text className={styles.remainingHighlight}>{batch.remainingQuantity}</Text>
          ) : (
            batch.remainingQuantity
          )}
          份
        </Text>
      </View>

      <View className={styles.cardRight}>
        <Text className={styles.detailBtn}>查看详情</Text>
        <Text className={styles.arrow}>›</Text>
      </View>
    </View>
  );

  const renderGroup = (group: { config: GroupConfig; list: BloodBatch[] }) => (
    <View key={group.config.key} className={styles.alertGroup}>
      <View className={classnames(styles.groupHeader, styles[group.config.color])}>
        <View className={styles.groupTitle}>
          <Text className={styles.groupIcon}>{group.config.icon}</Text>
          <Text>{group.config.title}</Text>
        </View>
        <View className={classnames(styles.countBadge, styles[group.config.color])}>
          {group.list.length}批次
        </View>
      </View>

      {group.list.length > 0 ? (
        <View className={styles.batchCardList}>
          {group.list.map(batch => renderBatchCard(batch, group.config))}
        </View>
      ) : (
        <View className={styles.emptyGroup}>
          <Text className={styles.emptyIcon}>✅</Text>
          <Text className={styles.emptyText}>无符合条件的批次</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView scrollY className={styles.alertPage}>
      <View className={styles.header}>
        <View className={styles.headerTop}>
          <Text className={styles.headerIcon}>🚨</Text>
          <Text className={styles.headerTitle}>库存预警中心</Text>
        </View>
        <Text className={styles.headerSub}>
          实时监控血液效期，提前预警，避免血液浪费。请优先处理临期批次，已过期血液禁止出库。
        </Text>
        <View className={styles.headerStats}>
          <View className={styles.headerStat}>
            <Text className={styles.statValue}>{nearExpiry7.length}</Text>
            <Text className={styles.statLabel}>7天内到期</Text>
          </View>
          <View className={styles.headerStat}>
            <Text className={styles.statValue}>{nearExpiry30.length}</Text>
            <Text className={styles.statLabel}>30天内到期</Text>
          </View>
          <View className={styles.headerStat}>
            <Text className={styles.statValue}>{expiredWithStock.length}</Text>
            <Text className={styles.statLabel}>过期有库存</Text>
          </View>
        </View>
      </View>

      {groups.map(renderGroup)}
    </ScrollView>
  );
};

export default InventoryAlertPage;
