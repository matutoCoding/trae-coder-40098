import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store';
import styles from './index.module.scss';
import EmptyState from '@/components/EmptyState';
import classnames from 'classnames';
import {
  getBloodTypeColor,
  getBloodTypeText,
  getStatusText,
  formatDateTime
} from '@/utils';
import dayjs from 'dayjs';
import type { BloodType, InventoryLog, InventoryLogType, BloodBatch } from '@/types';

type TypeFilter = 'all' | BloodType;
type StatusFilter = 'all' | 'near' | 'exhausted' | 'expired';

const logTypeConfig: Record<InventoryLogType, { icon: string; label: string }> = {
  inbound: { icon: '📥', label: '入库' },
  outbound: { icon: '📤', label: '出库' },
  exhausted: { icon: '🗑️', label: '清零' },
  expired_lock: { icon: '🔒', label: '过期锁定' },
  manual_lock: { icon: '🔒', label: '手动锁定' },
  manual_unlock: { icon: '🔓', label: '解锁' },
  adjust: { icon: '⚙️', label: '调整' }
};

const getChangeQtyText = (log: InventoryLog): string => {
  switch (log.logType) {
    case 'inbound':
      return `+${log.changeQty}`;
    case 'outbound':
      return `−${log.changeQty}`;
    case 'adjust':
      return log.changeQty >= 0 ? `+${log.changeQty}` : `−${Math.abs(log.changeQty)}`;
    case 'exhausted':
    case 'expired_lock':
    case 'manual_lock':
    case 'manual_unlock':
      return '—';
    default:
      return String(log.changeQty);
  }
};

const BLOOD_TYPE_OPTIONS: Array<{ key: TypeFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'A', label: 'A型' },
  { key: 'B', label: 'B型' },
  { key: 'AB', label: 'AB型' },
  { key: 'O', label: 'O型' }
];

const STATUS_OPTIONS: Array<{ key: StatusFilter; label: string; activeClass: string }> = [
  { key: 'all', label: '全部', activeClass: 'activeAll' },
  { key: 'near', label: '临期预警', activeClass: 'activeNear' },
  { key: 'exhausted', label: '已清空', activeClass: 'activeExhausted' },
  { key: 'expired', label: '已过期', activeClass: 'activeExpired' }
];

const InventoryTrackerPage: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { inventoryLogs, bloodBatches } = useAppStore();

  const { filteredBatchIds, total, nearCount, exhaustedCount, expiredCount } = useMemo(() => {
    let batches = [...bloodBatches];

    if (typeFilter !== 'all') {
      batches = batches.filter(b => b.bloodType === typeFilter);
    }

    let filteredBatches: BloodBatch[];
    switch (statusFilter) {
      case 'near':
        filteredBatches = batches.filter(b => b.daysToExpiry > 0 && b.daysToExpiry <= 30 && b.remainingQuantity > 0);
        break;
      case 'exhausted':
        filteredBatches = batches.filter(b => b.remainingQuantity === 0);
        break;
      case 'expired':
        filteredBatches = batches.filter(b => b.status === 'expired');
        break;
      default:
        filteredBatches = batches;
    }

    const allNear = bloodBatches.filter(b => b.daysToExpiry > 0 && b.daysToExpiry <= 30 && b.remainingQuantity > 0).length;
    const allExhausted = bloodBatches.filter(b => b.remainingQuantity === 0).length;
    const allExpired = bloodBatches.filter(b => b.status === 'expired').length;

    return {
      filteredBatchIds: new Set(filteredBatches.map(b => b.id)),
      total: filteredBatches.length,
      nearCount: allNear,
      exhaustedCount: allExhausted,
      expiredCount: allExpired
    };
  }, [bloodBatches, typeFilter, statusFilter]);

  const filteredLogs = useMemo(() => {
    return inventoryLogs
      .filter(log => filteredBatchIds.has(log.batchId))
      .sort((a, b) => dayjs(b.logTime).valueOf() - dayjs(a.logTime).valueOf());
  }, [inventoryLogs, filteredBatchIds]);

  const batchMap = useMemo(() => {
    const map = new Map<string, BloodBatch>();
    bloodBatches.forEach(b => map.set(b.id, b));
    return map;
  }, [bloodBatches]);

  const handleGoToBatchDetail = (batchId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    Taro.navigateTo({ url: `/pages/batch-detail/index?id=${batchId}` });
  };

  const handleRelatedNoClick = (relatedNo: string, e: React.MouseEvent) => {
    e.stopPropagation();
    Taro.showToast({ title: `单号：${relatedNo}`, icon: 'none' });
  };

  const renderLogMeta = (log: InventoryLog) => {
    if (log.logType === 'outbound') {
      const items: React.ReactNode[] = [];
      if (log.receiver) {
        items.push(
          <View key="receiver" className={styles.metaItem}>
            <Text className={styles.label}>领用人：</Text>
            <Text>{log.receiver}</Text>
          </View>
        );
      }
      if (log.receiverDept) {
        items.push(
          <View key="dept" className={styles.metaItem}>
            <Text className={styles.label}>科室：</Text>
            <Text>{log.receiverDept}</Text>
          </View>
        );
      }
      if (log.purpose) {
        items.push(
          <View key="purpose" className={styles.metaItem}>
            <Text className={styles.label}>用途：</Text>
            <Text>{log.purpose}</Text>
          </View>
        );
      }
      if (items.length === 0) return null;
      return (
        <View className={styles.logMeta}>
          <View className={styles.metaRow}>{items}</View>
        </View>
      );
    }

    if (log.logType === 'inbound' && log.remark) {
      return (
        <View className={styles.logMeta}>
          <View className={styles.metaRow}>
            <View className={styles.metaItem}>
              <Text className={styles.label}>备注：</Text>
              <Text>{log.remark}</Text>
            </View>
          </View>
        </View>
      );
    }

    if (log.logType === 'exhausted') {
      return (
        <View className={styles.logMeta}>
          <View className={styles.metaRow}>
            <View className={styles.metaItem}>
              <Text className={styles.label}>系统提示：</Text>
              <Text>该批次已全部出库完毕</Text>
            </View>
          </View>
        </View>
      );
    }

    if (log.logType === 'expired_lock') {
      return (
        <View className={styles.logMeta}>
          <View className={styles.metaRow}>
            <View className={styles.metaItem}>
              <Text className={styles.label}>系统提示：</Text>
              <Text>过期已锁定，不可出库</Text>
            </View>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <View className={styles.trackerPage}>
      <View className={styles.topBar}>
        <ScrollView scrollX className={styles.filterGroup}>
          {BLOOD_TYPE_OPTIONS.map(opt => {
            const isActive = typeFilter === opt.key;
            const color = opt.key === 'all' ? '#1976D2' : getBloodTypeColor(opt.key as BloodType);
            return (
              <View
                key={opt.key}
                className={classnames(styles.filterItem, isActive && styles.active)}
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`
                    : undefined,
                  borderColor: isActive ? 'transparent' : `${color}40`,
                  color: isActive ? '#fff' : color
                }}
                onClick={() => setTypeFilter(opt.key)}
              >
                {opt.label}
              </View>
            );
          })}
        </ScrollView>

        <ScrollView scrollX className={styles.statusTabs}>
          {STATUS_OPTIONS.map(opt => {
            const isActive = statusFilter === opt.key;
            return (
              <View
                key={opt.key}
                className={classnames(styles.tabItem, isActive && styles[opt.activeClass])}
                onClick={() => setStatusFilter(opt.key)}
              >
                {opt.label}
              </View>
            );
          })}
        </ScrollView>
      </View>

      <View className={styles.summaryRow}>
        <View className={styles.summaryItem}>
          <Text className={classnames(styles.value, styles.total)}>{total}</Text>
          <Text className={styles.label}>总批次数</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={classnames(styles.value, styles.near)}>{nearCount}</Text>
          <Text className={styles.label}>临期</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={classnames(styles.value, styles.exhausted)}>{exhaustedCount}</Text>
          <Text className={styles.label}>清空</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={classnames(styles.value, styles.expired)}>{expiredCount}</Text>
          <Text className={styles.label}>过期</Text>
        </View>
      </View>

      {filteredLogs.length > 0 ? (
        <View className={styles.inventoryList}>
          {filteredLogs.map(log => {
            const batch = batchMap.get(log.batchId);
            const bloodColor = getBloodTypeColor(log.bloodType);
            return (
              <View
                key={log.id}
                className={styles.logItem}
                onClick={() => handleGoToBatchDetail(log.batchId)}
              >
                <View className={classnames(styles.dotIcon, styles[log.logType])} />

                {batch && (
                  <View
                    className={styles.batchTag}
                    onClick={(e) => handleGoToBatchDetail(log.batchId, e)}
                  >
                    <Text className={styles.batchNoTag}>{log.batchNo}</Text>
                    <View
                      className={styles.bloodBadge}
                      style={{
                        background: `linear-gradient(135deg, ${bloodColor} 0%, ${bloodColor}dd 100%)`
                      }}
                    >
                      {getBloodTypeText(log.bloodType)}
                    </View>
                    <View className={classnames(styles.statusBadge, styles[batch.status])}>
                      {getStatusText(batch.status)}
                    </View>
                  </View>
                )}

                <View className={styles.logHeader}>
                  <View className={classnames(styles.logTypeBadge, styles[log.logType])}>
                    <Text>{logTypeConfig[log.logType].icon}</Text>
                    <Text>{logTypeConfig[log.logType].label}</Text>
                  </View>
                  <Text className={styles.logTime}>{formatDateTime(log.logTime)}</Text>
                </View>

                <View className={styles.logDetail}>
                  <Text className={classnames(styles.changeQty, styles[log.logType])}>
                    {getChangeQtyText(log)}
                  </Text>
                  <Text className={styles.balanceQty}>结存 {log.balanceQty} 份</Text>
                  {log.relatedNo && (
                    <Text
                      className={styles.relatedNo}
                      onClick={(e) => handleRelatedNoClick(log.relatedNo!, e)}
                    >
                      {log.relatedNo}
                    </Text>
                  )}
                </View>

                {renderLogMeta(log)}
              </View>
            );
          })}
        </View>
      ) : (
        <View className={styles.emptyState}>
          <EmptyState text="暂无库存流水记录" subText="请调整筛选条件或先进行出入库操作" icon="📋" />
        </View>
      )}
    </View>
  );
};

export default InventoryTrackerPage;
