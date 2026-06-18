import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store';
import styles from './index.module.scss';
import BatchCard from '@/components/BatchCard';
import StatusTag from '@/components/StatusTag';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import classnames from 'classnames';
import type { OutboundStatus } from '@/types';

type TabType = 'fifo' | 'records';

const OutboundPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('fifo');
  const [statusFilter, setStatusFilter] = useState<OutboundStatus | 'all'>('all');

  const { getFifoRecommendedBatches, outboundRecords, bloodBatches } = useAppStore();

  const fifoBatches = useMemo(() => getFifoRecommendedBatches(), [getFifoRecommendedBatches]);
  const fifoTotalQty = useMemo(
    () => fifoBatches.reduce((sum, b) => sum + b.remainingQuantity, 0),
    [fifoBatches]
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

  const hasAlert = alertCount7 + alertCount30 + alertCountExpired > 0;

  const filteredRecords = useMemo(() => {
    let list = outboundRecords;
    if (statusFilter !== 'all') {
      list = list.filter(r => r.status === statusFilter);
    }
    return list.sort((a, b) => new Date(b.outboundDate).getTime() - new Date(a.outboundDate).getTime());
  }, [outboundRecords, statusFilter]);

  const tabs = [
    { key: 'fifo', label: 'FIFO出库推荐' },
    { key: 'records', label: '出库记录' }
  ];

  const statusFilters = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待审批' },
    { key: 'approved', label: '已通过' },
    { key: 'completed', label: '已完成' },
    { key: 'rejected', label: '已拒绝' }
  ];

  return (
    <View className={styles.outboundPage}>
      <View className={styles.tipBanner}>
        <Text className={styles.tipIcon}>ℹ️</Text>
        <View className={styles.tipContent}>
          <Text className={styles.tipTitle}>先进先出（FIFO）原则</Text>
          <Text className={styles.tipText}>
            系统自动按效期优先排序推荐出库批次，有效期近的批次优先出库，有效减少血液过期浪费。临期批次（≤30天）会高亮提醒。
          </Text>
        </View>
        <View
          className={styles.trackerEntry}
          onClick={() => Taro.navigateTo({ url: '/pages/inventory-tracker/index' })}
        >
          🔍 批次追踪
        </View>
      </View>

      {hasAlert && (
        <View
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16rpx 24rpx',
            background: 'rgba(255, 125, 0, 0.06)',
            borderRadius: '12rpx',
            border: '1rpx solid rgba(255, 125, 0, 0.18)',
            marginBottom: '20rpx',
            cursor: 'pointer'
          }}
          onClick={() => Taro.navigateTo({ url: '/pages/inventory-alert/index' })}
        >
          <View style={{ display: 'flex', alignItems: 'center', gap: '10rpx', flex: 1, flexWrap: 'wrap' }}>
            <Text style={{ fontSize: '26rpx' }}>⚠️</Text>
            <Text style={{ fontSize: '24rpx', color: '#4E5969', fontWeight: '500' }}>预警：</Text>
            {alertCount7 > 0 && (
              <Text style={{ fontSize: '24rpx', color: '#F53F3F', fontWeight: '500' }}>
                {alertCount7}批7天内到期
              </Text>
            )}
            {alertCount7 > 0 && (alertCount30 > 0 || alertCountExpired > 0) && (
              <Text style={{ color: '#C9CDD4', margin: '0 6rpx' }}>·</Text>
            )}
            {alertCount30 > 0 && (
              <Text style={{ fontSize: '24rpx', color: '#FF7D00', fontWeight: '500' }}>
                {alertCount30}批30天内
              </Text>
            )}
            {alertCount30 > 0 && alertCountExpired > 0 && (
              <Text style={{ color: '#C9CDD4', margin: '0 6rpx' }}>·</Text>
            )}
            {alertCountExpired > 0 && (
              <Text style={{ fontSize: '24rpx', color: '#86909C', fontWeight: '500' }}>
                {alertCountExpired}批过期有库存
              </Text>
            )}
          </View>
          <Text style={{ fontSize: '28rpx', color: '#86909C', flexShrink: 0, marginLeft: '8rpx' }}>›</Text>
        </View>
      )}

      <View className={styles.tabBar}>
        {tabs.map(tab => (
          <View
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
            onClick={() => setActiveTab(tab.key as TabType)}
          >
            <Text>{tab.label}</Text>
          </View>
        ))}
      </View>

      <Button
        className={styles.actionBtn}
        onClick={() => Taro.navigateTo({ url: '/pages/outbound-register/index' })}
      >
        ＋ 效期出库登记
      </Button>

      {activeTab === 'fifo' && (
        <View>
          <View className={styles.fifoHeader}>
            <Text className={styles.title}>
              📦 按效期优先排序
              <Text className={styles.badge}>共{fifoBatches.length}批/{fifoTotalQty}份</Text>
            </Text>
          </View>

          {fifoBatches.length > 0 ? (
            <View>
              {fifoBatches.map((batch, idx) => (
                <View key={batch.id}>
                  {idx === 0 && (
                    <View style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8rpx',
                      padding: '8rpx 20rpx',
                      borderRadius: '32rpx',
                      background: 'linear-gradient(135deg, #FF7D00 0%, #F53F3F 100%)',
                      color: '#fff',
                      fontSize: '24rpx',
                      fontWeight: '600',
                      marginBottom: '16rpx'
                    }}>
                      ⭐ 最优先出库
                    </View>
                  )}
                  <BatchCard batch={batch} showFifoBadge />
                </View>
              ))}
            </View>
          ) : (
            <EmptyState text="暂无可出库批次" subText="所有批次已出库或锁定" icon="🚚" />
          )}
        </View>
      )}

      {activeTab === 'records' && (
        <View>
          <ScrollView scrollX style={{
            display: 'flex',
            gap: '16rpx',
            marginBottom: '24rpx',
            paddingBottom: '8rpx'
          }}>
            {statusFilters.map(f => (
              <View
                key={f.key}
                onClick={() => setStatusFilter(f.key as any)}
                style={{
                  flexShrink: 0,
                  padding: '12rpx 28rpx',
                  borderRadius: '48rpx',
                  background: statusFilter === f.key ? '#1976D2' : '#fff',
                  color: statusFilter === f.key ? '#fff' : '#4E5969',
                  fontSize: '28rpx',
                  fontWeight: statusFilter === f.key ? '600' : '500',
                  boxShadow: '0 2rpx 12rpx rgba(0,0,0,0.06)',
                  transition: 'all 0.25s'
                }}
              >
                <Text>{f.label}</Text>
              </View>
            ))}
          </ScrollView>

          <SectionHeader title="出库记录" subTitle={`${filteredRecords.length}条`} />

          {filteredRecords.length > 0 ? (
            <View>
              {filteredRecords.map(record => (
                <View key={record.id} className={styles.outboundCard}>
                  <View className={styles.header}>
                    <View style={{ display: 'flex', alignItems: 'center', gap: '12rpx' }}>
                      <Text className={styles.outboundNo}>{record.outboundNo}</Text>
                      <StatusTag type={record.status} />
                    </View>
                    <Text className={styles.date}>{record.outboundDate}</Text>
                  </View>

                  <View className={styles.infoGrid}>
                    <View className={styles.infoItem}>
                      <Text className={styles.label}>关联批次</Text>
                      <Text className={styles.value}>{record.batchNo}</Text>
                    </View>
                    <View className={styles.infoItem}>
                      <Text className={styles.label}>血型</Text>
                      <View><StatusTag type={record.bloodType} /></View>
                    </View>
                    <View className={classnames(styles.infoItem, styles.highlight)}>
                      <Text className={styles.label}>出库数量</Text>
                      <Text className={styles.value}>{record.quantity}份</Text>
                    </View>
                    <View className={styles.infoItem}>
                      <Text className={styles.label}>领用科室</Text>
                      <Text className={styles.value}>{record.receiverDept}</Text>
                    </View>
                  </View>

                  <Text className={styles.purpose}>{record.purpose}</Text>

                  <View className={styles.operator}>
                    <Text>领用单位：{record.receiver}</Text>
                    <View style={{ display: 'flex', alignItems: 'center', gap: '8rpx' }}>
                      {record.isFifoRecommended && (
                        <Text style={{
                          fontSize: '22rpx',
                          padding: '2rpx 10rpx',
                          borderRadius: '6rpx',
                          background: 'rgba(0, 180, 42, 0.12)',
                          color: '#00B42A'
                        }}>FIFO合规</Text>
                      )}
                      <Text>操作：{record.operator}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState text="暂无出库记录" icon="📦" />
          )}
        </View>
      )}
    </View>
  );
};

export default OutboundPage;
