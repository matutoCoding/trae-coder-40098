import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store';
import styles from './index.module.scss';
import BatchCard from '@/components/BatchCard';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import classnames from 'classnames';
import { getBloodTypeColor } from '@/utils';
import type { BatchStatus, BloodType } from '@/types';

type StatusFilter = 'all' | BatchStatus;

const BatchPage: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState<BloodType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { bloodBatches, getExpiringBatches, getExpiredBatches } = useAppStore();

  const expiring = useMemo(() => getExpiringBatches(), [getExpiringBatches]);
  const expired = useMemo(() => getExpiredBatches(), [getExpiredBatches]);
  const normalCount = useMemo(
    () => bloodBatches.filter(b => b.status === 'normal').length,
    [bloodBatches]
  );
  const lockedCount = useMemo(
    () => bloodBatches.filter(b => b.status === 'locked' || b.remainingQuantity === 0).length,
    [bloodBatches]
  );

  const alertCount7 = useMemo(
    () => bloodBatches.filter(b => b.daysToExpiry <= 7 && b.daysToExpiry > 0 && b.remainingQuantity > 0).length,
    [bloodBatches]
  );
  const alertCount30 = useMemo(
    () => bloodBatches.filter(b => b.daysToExpiry > 7 && b.daysToExpiry <= 30 && b.remainingQuantity > 0).length,
    [bloodBatches]
  );
  const alertCountExpired = useMemo(
    () => bloodBatches.filter(b => b.status === 'expired' && b.remainingQuantity > 0).length,
    [bloodBatches]
  );

  const filteredBatches = useMemo(() => {
    let list = bloodBatches;
    if (typeFilter !== 'all') {
      list = list.filter(b => b.bloodType === typeFilter);
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'locked') {
        list = list.filter(b => b.status === 'locked' || b.remainingQuantity === 0);
      } else {
        list = list.filter(b => b.status === statusFilter);
      }
    }
    return list.sort((a, b) => a.daysToExpiry - b.daysToExpiry);
  }, [bloodBatches, typeFilter, statusFilter]);

  const statusFilters = [
    { key: 'all', label: '全部' },
    { key: 'normal', label: '正常' },
    { key: 'near_expiry', label: `临期(${expiring.length})` },
    { key: 'expired', label: `过期(${expired.length})` },
    { key: 'locked', label: `锁定(${lockedCount})` }
  ];

  const bloodTypes: { key: BloodType | 'all'; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'A', label: 'A' },
    { key: 'B', label: 'B' },
    { key: 'AB', label: 'AB' },
    { key: 'O', label: 'O' }
  ];

  const typeColors = bloodTypes.map(t => {
    if (t.key === 'all') return '#4E5969';
    return getBloodTypeColor(t.key as BloodType);
  });

  return (
    <View className={styles.batchPage}>
      <View className={styles.overviewRow}>
        <View className={classnames(styles.overviewItem, styles.normal)}>
          <Text className={styles.value}>{normalCount}</Text>
          <Text className={styles.label}>正常</Text>
        </View>
        <View className={classnames(styles.overviewItem, styles.warn)}>
          <Text className={styles.value}>{expiring.length}</Text>
          <Text className={styles.label}>临期</Text>
        </View>
        <View className={classnames(styles.overviewItem, styles.danger)}>
          <Text className={styles.value}>{expired.length}</Text>
          <Text className={styles.label}>过期</Text>
        </View>
        <View className={classnames(styles.overviewItem, styles.locked)}>
          <Text className={styles.value}>{lockedCount}</Text>
          <Text className={styles.label}>锁定</Text>
        </View>
      </View>

      <View
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24rpx 28rpx',
          background: 'linear-gradient(135deg, rgba(245, 63, 63, 0.08) 0%, rgba(255, 125, 0, 0.08) 100%)',
          borderRadius: '16rpx',
          border: '1rpx solid rgba(245, 63, 63, 0.2)',
          marginBottom: '24rpx',
          cursor: 'pointer'
        }}
        onClick={() => Taro.navigateTo({ url: '/pages/inventory-alert/index' })}
      >
        <View style={{ display: 'flex', alignItems: 'center', gap: '12rpx' }}>
          <Text style={{ fontSize: '32rpx' }}>🚨</Text>
          <Text style={{ fontSize: '28rpx', fontWeight: '600', color: '#1D2129' }}>库存预警中心</Text>
        </View>
        <View style={{ display: 'flex', alignItems: 'center', gap: '16rpx' }}>
          <Text style={{ fontSize: '24rpx', color: '#F53F3F', fontWeight: '500' }}>7天{alertCount7}</Text>
          <Text style={{ color: '#C9CDD4' }}>·</Text>
          <Text style={{ fontSize: '24rpx', color: '#FF7D00', fontWeight: '500' }}>30天{alertCount30}</Text>
          <Text style={{ color: '#C9CDD4' }}>·</Text>
          <Text style={{ fontSize: '24rpx', color: '#86909C', fontWeight: '500' }}>过期{alertCountExpired}</Text>
          <Text style={{ fontSize: '32rpx', color: '#86909C', marginLeft: '4rpx' }}>›</Text>
        </View>
      </View>

      <View className={styles.typeBar}>
        {bloodTypes.map((bt, idx) => (
          <View
            key={bt.key}
            className={classnames(styles.typeItem, typeFilter === bt.key && styles.active)}
            style={{
              color: typeFilter === bt.key ? '#fff' : typeColors[idx],
              background: typeFilter === bt.key
                ? `linear-gradient(135deg, ${typeColors[idx]} 0%, ${typeColors[idx]}dd 100%)`
                : undefined,
              border: typeFilter === bt.key ? 'none' : `2rpx solid ${typeColors[idx]}40`
            }}
            onClick={() => setTypeFilter(bt.key)}
          >
            <Text>{bt.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView scrollX className={styles.filterBar}>
        {statusFilters.map(f => (
          <View
            key={f.key}
            className={classnames(styles.filterItem, statusFilter === f.key && styles.active)}
            onClick={() => setStatusFilter(f.key as StatusFilter)}
          >
            <Text>{f.label}</Text>
          </View>
        ))}
      </ScrollView>

      <Button
        className={styles.actionBtn}
        onClick={() => Taro.navigateTo({ url: '/pages/batch-register/index' })}
      >
        ＋ 批次效期登记
      </Button>

      <SectionHeader
        title="批次列表"
        subTitle={`${filteredBatches.length}条`}
        showArrow={expiring.length > 0}
        actionText="出库管理"
        onActionClick={() => Taro.navigateTo({ url: '/pages/outbound/index' })}
      />

      <View>
        {filteredBatches.length > 0 ? (
          <View>
            {filteredBatches.map(batch => (
              <BatchCard
                key={batch.id}
                batch={batch}
                onClick={() => Taro.navigateTo({ url: `/pages/batch-detail/index?id=${batch.id}` })}
                showArrow
                showExhausted
              />
            ))}
          </View>
        ) : (
          <EmptyState text="暂无批次数据" icon="🩸" />
        )}
      </View>
    </View>
  );
};

export default BatchPage;
