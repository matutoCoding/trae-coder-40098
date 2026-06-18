import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store';
import styles from './index.module.scss';
import StatusTag from '@/components/StatusTag';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import classnames from 'classnames';
import { formatDate } from '@/utils';
import type { ConsumptionType, BloodType } from '@/types';

type FilterType = 'all' | 'quota' | 'selfpay' | BloodType;

const ConsumptionPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');

  const { currentOrgId, getConsumptionsByOrgId, getQuotaByOrgId } = useAppStore();

  const records = useMemo(
    () => getConsumptionsByOrgId(currentOrgId),
    [getConsumptionsByOrgId, currentOrgId]
  );

  const quota = useMemo(
    () => getQuotaByOrgId(currentOrgId),
    [getQuotaByOrgId, currentOrgId]
  );

  const filteredRecords = useMemo(() => {
    let list = records;
    if (filter === 'quota' || filter === 'selfpay') {
      list = list.filter(r => r.type === filter);
    } else if (filter === 'A' || filter === 'B' || filter === 'AB' || filter === 'O') {
      list = list.filter(r => r.bloodType === filter);
    }
    return list;
  }, [records, filter]);

  const stats = useMemo(() => {
    const total = records.length;
    const quotaCount = records.filter(r => r.type === 'quota').length;
    const selfpayCount = records.filter(r => r.type === 'selfpay').length;
    const intervalFail = records.filter(r => !r.intervalCheckPassed).length;
    return { total, quotaCount, selfpayCount, intervalFail };
  }, [records]);

  const filters = [
    { key: 'all', label: '全部' },
    { key: 'quota', label: '额度内' },
    { key: 'selfpay', label: '自费' },
    { key: 'A', label: 'A型' },
    { key: 'B', label: 'B型' },
    { key: 'AB', label: 'AB型' },
    { key: 'O', label: 'O型' }
  ];

  return (
    <View className={styles.consumptionPage}>
      <View className={styles.summaryCard}>
        <Text className={styles.summaryTitle}>
          {quota?.orgName || '市第一人民医院'} · 周期累计
        </Text>
        <View>
          <Text className={styles.summaryValue}>{stats.total}</Text>
          <Text className={styles.summaryUnit}>人次</Text>
        </View>
        <View className={styles.summaryGrid}>
          <View className={styles.gridItem}>
            <Text className={styles.value}>{stats.quotaCount}</Text>
            <Text className={styles.label}>额度内</Text>
          </View>
          <View className={styles.gridItem}>
            <Text className={styles.value}>{stats.selfpayCount}</Text>
            <Text className={styles.label}>自费</Text>
          </View>
          <View className={styles.gridItem}>
            <Text className={styles.value}>{stats.intervalFail}</Text>
            <Text className={styles.label}>间隔异常</Text>
          </View>
        </View>
      </View>

      <Button
        className={styles.actionBtn}
        onClick={() => Taro.navigateTo({ url: '/pages/donate-register/index' })}
      >
        ＋ 献血登记（含间隔校验）
      </Button>

      <ScrollView scrollX className={styles.filterBar}>
        {filters.map(f => (
          <View
            key={f.key}
            className={classnames(styles.filterItem, filter === f.key && styles.active)}
            onClick={() => setFilter(f.key as FilterType)}
          >
            <Text>{f.label}</Text>
          </View>
        ))}
      </ScrollView>

      <SectionHeader
        title="献血记录"
        subTitle={`${filteredRecords.length}/${records.length}条`}
      />

      <View className={styles.recordList}>
        {filteredRecords.length > 0 ? (
          <View>
            {filteredRecords.map(record => (
              <View key={record.id} className={styles.recordCard}>
                <View className={styles.cardHeader}>
                  <View className={styles.left}>
                    <View className={styles.donorInfo}>
                      <Text className={styles.donorName}>{record.donorName}</Text>
                      <StatusTag type={record.bloodType} />
                      <StatusTag type={record.type as ConsumptionType} />
                      {!record.intervalCheckPassed && (
                        <View style={{
                          padding: '4rpx 12rpx',
                          borderRadius: '8rpx',
                          fontSize: '22rpx',
                          fontWeight: '500',
                          background: 'rgba(245, 63, 63, 0.12)',
                          color: '#F53F3F'
                        }}>间隔不足</View>
                      )}
                    </View>
                    <View style={{ fontSize: '22rpx', color: '#86909C' }}>
                      ID: {record.donorId}
                    </View>
                  </View>
                  <Text style={{ fontSize: '24rpx', color: '#86909C' }}>{formatDate(record.donateDate)}</Text>
                </View>

                <View className={styles.cardBody}>
                  <View className={styles.col}>
                    <Text>所属单位：<Text style={{ color: '#1D2129', fontWeight: '500' }}>{record.orgName}</Text></Text>
                    <Text>操作人：{record.operator}</Text>
                    {record.batchNo && <Text>关联批次：{record.batchNo}</Text>}
                  </View>
                  <View className={classnames(styles.col, styles.right)}>
                    {record.daysSinceLastDonate !== undefined && (
                      <Text className={record.daysSinceLastDonate < 180 ? styles.danger : ''}>
                        距上次{record.daysSinceLastDonate}天
                      </Text>
                    )}
                    <Text className={styles.highlight}>献血 {record.amount} 份</Text>
                  </View>
                </View>

                {record.selfpayApplyNo && (
                  <View className={styles.selfpayInfo}>
                    <Text className={styles.applyNoText}>申请单号：{record.selfpayApplyNo}</Text>
                    {record.selfpayStatus && (
                      <View
                        className={classnames(
                          styles.selfpayBadge,
                          record.selfpayStatus === 'pending' && styles.badgePending,
                          record.selfpayStatus === 'approved' && styles.badgeApproved,
                          record.selfpayStatus === 'rejected' && styles.badgeRejected
                        )}
                      >
                        {record.selfpayStatus === 'pending' ? '待审批' : record.selfpayStatus === 'approved' ? '已通过' : '已驳回'}
                      </View>
                    )}
                  </View>
                )}

                {record.remark && (
                  <View className={styles.remark}>备注：{record.remark}</View>
                )}

                <View className={styles.cardFooter}>
                  <View
                    className={styles.certBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      Taro.navigateTo({ url: `/pages/donate-certificate/index?consumptionId=${record.id}` });
                    }}
                  >
                    📄 献血凭证
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState text="暂无献血记录" icon="📋" />
        )}
      </View>
    </View>
  );
};

export default ConsumptionPage;
