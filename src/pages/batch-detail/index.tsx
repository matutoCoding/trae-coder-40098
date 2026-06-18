import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store';
import styles from './index.module.scss';
import EmptyState from '@/components/EmptyState';
import classnames from 'classnames';
import {
  getBloodTypeColor,
  getBloodTypeText,
  getStatusText,
  formatDate,
  formatDateTime,
  EXHAUSTED_BADGE_TEXT,
  isBatchExhausted
} from '@/utils';
import dayjs from 'dayjs';
import type { InventoryLog, InventoryLogType } from '@/types';

const logTypeConfig: Record<InventoryLogType, { icon: string; label: string }> = {
  inbound: { icon: '📥', label: '入库' },
  outbound: { icon: '📤', label: '出库' },
  exhausted: { icon: '🗑️', label: '清零' },
  expired_lock: { icon: '🔒', label: '过期锁定' },
  manual_lock: { icon: '🔒', label: '锁定' },
  manual_unlock: { icon: '🔓', label: '解锁' },
  adjust: { icon: '⚠️', label: '库存调整' }
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

const BatchDetailPage: React.FC = () => {
  const router = Taro.useRouter();
  const batchId = router.params.id || router.params.batchId || '';

  const { bloodBatches, getInventoryLogsByBatchId } = useAppStore();

  const batch = useMemo(
    () => bloodBatches.find(b => b.id === batchId),
    [bloodBatches, batchId]
  );

  const logs = useMemo(
    () => getInventoryLogsByBatchId(batchId),
    [getInventoryLogsByBatchId, batchId]
  );

  const inboundTime = useMemo(() => {
    const inboundLogs = logs.filter(l => l.logType === 'inbound');
    if (inboundLogs.length === 0) return '';
    const sorted = [...inboundLogs].sort((a, b) => dayjs(a.logTime).valueOf() - dayjs(b.logTime).valueOf());
    return sorted[0].logTime;
  }, [logs]);

  const lastOperateTime = useMemo(() => {
    if (logs.length === 0) return '';
    const sorted = [...logs].sort((a, b) => dayjs(b.logTime).valueOf() - dayjs(a.logTime).valueOf());
    return sorted[0].logTime;
  }, [logs]);

  const latestAdjustLog = useMemo(() => {
    const adjustLogs = logs.filter(l => l.logType === 'adjust');
    if (adjustLogs.length === 0) return null;
    const sorted = [...adjustLogs].sort((a, b) => dayjs(b.logTime).valueOf() - dayjs(a.logTime).valueOf());
    return sorted[0];
  }, [logs]);

  const renderLogExtra = (log: InventoryLog) => {
    if (log.logType === 'outbound') {
      const items: React.ReactNode[] = [];
      if (log.receiver) {
        items.push(
          <View key="receiver" className={styles.extraItem}>
            <Text className={styles.label}>领用人：</Text>
            <Text>{log.receiver}</Text>
          </View>
        );
      }
      if (log.receiverDept) {
        items.push(
          <View key="dept" className={styles.extraItem}>
            <Text className={styles.label}>科室：</Text>
            <Text>{log.receiverDept}</Text>
          </View>
        );
      }
      if (log.purpose) {
        items.push(
          <View key="purpose" className={styles.extraItem}>
            <Text className={styles.label}>用途：</Text>
            <Text>{log.purpose}</Text>
          </View>
        );
      }
      return items.length > 0 ? <View className={styles.logExtra}>{items}</View> : null;
    }

    if (log.logType === 'inbound' && log.remark) {
      return (
        <View className={styles.logExtra}>
          <View className={styles.extraItem}>
            <Text className={styles.label}>备注：</Text>
            <Text>{log.remark}</Text>
          </View>
        </View>
      );
    }

    if (log.logType === 'exhausted') {
      return (
        <View className={styles.logExtra}>
          <View className={styles.extraItem}>
            <Text className={styles.label}>备注：</Text>
            <Text>该批次已全部出库完毕</Text>
          </View>
        </View>
      );
    }

    if (log.logType === 'adjust') {
      return (
        <View className={styles.logExtra}>
          <View className={styles.extraItem}>
            <Text className={styles.label}>处理人：</Text>
            <Text>{log.operator}</Text>
          </View>
          {log.remark && (
            <View className={styles.extraItem}>
              <Text className={styles.label}>处理说明：</Text>
              <Text>{log.remark}</Text>
            </View>
          )}
        </View>
      );
    }

    return null;
  };

  if (!batch) {
    return (
      <View className={styles.batchDetailPage}>
        <EmptyState text="未找到该批次信息" icon="❌" />
      </View>
    );
  }

  const bloodTypeColor = getBloodTypeColor(batch.bloodType);
  const isExhausted = isBatchExhausted(batch);
  const statusBadgeClass = classnames(styles.statusBadge, isExhausted ? styles.exhausted : styles[batch.status]);

  const daysText = (() => {
    if (isExhausted) return '';
    if (batch.status === 'expired') return `已过期${Math.abs(batch.daysToExpiry)}天`;
    if (batch.status === 'locked') return '';
    if (batch.daysToExpiry === 0) return '今日到期';
    return `剩余${batch.daysToExpiry}天`;
  })();

  return (
    <View className={styles.batchDetailPage}>
      <View className={styles.overviewCard}>
        <Text className={styles.batchNo}>{batch.batchNo}</Text>
        <View className={styles.tagsRow}>
          <View
            className={styles.bloodTypeBadge}
            style={{
              background: `linear-gradient(135deg, ${bloodTypeColor} 0%, ${bloodTypeColor}dd 100%)`
            }}
          >
            {getBloodTypeText(batch.bloodType)}
          </View>
          <View className={statusBadgeClass}>
            {isExhausted ? EXHAUSTED_BADGE_TEXT : getStatusText(batch.status)}
            {daysText && (
              <Text className={styles.daysLabel}>{daysText}</Text>
            )}
          </View>
        </View>
        {(batch.status === 'locked' || isExhausted) && latestAdjustLog && (
          <View className={styles.processInfo}>
            <Text className={styles.processTitle}>🔒 已处理</Text>
            <View className={styles.processRow}>
              <Text className={styles.processLabel}>处理时间：</Text>
              <Text className={styles.processValue}>{formatDateTime(latestAdjustLog.logTime)}</Text>
            </View>
            <View className={styles.processRow}>
              <Text className={styles.processLabel}>处理人：</Text>
              <Text className={styles.processValue}>{latestAdjustLog.operator}</Text>
            </View>
            {latestAdjustLog.remark && (
              <View className={styles.processRow}>
                <Text className={styles.processLabel}>处理说明：</Text>
                <Text className={styles.processValue}>{latestAdjustLog.remark}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View className={styles.statsGrid}>
        <View className={styles.statItem}>
          <Text className={classnames(styles.value, styles.primary)}>
            {batch.quantity}
            <Text className={styles.unit}>份</Text>
          </Text>
          <Text className={styles.label}>采集总份数</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={classnames(styles.value, styles.warning)}>
            {batch.usedQuantity}
            <Text className={styles.unit}>份</Text>
          </Text>
          <Text className={styles.label}>已出库份数</Text>
        </View>
        <View className={styles.statItem}>
          <Text
            className={classnames(
              styles.value,
              isExhausted ? styles.exhausted : styles.success
            )}
          >
            {isExhausted ? (
              '已清空'
            ) : (
              <>
                {batch.remainingQuantity}
                <Text className={styles.unit}>份</Text>
              </>
            )}
          </Text>
          <Text className={styles.label}>
            剩余份数
            {isExhausted && <Text className={styles.exhaustedHint}>（已锁定，不可出库）</Text>}
          </Text>
        </View>
        <View className={styles.statItem}>
          <Text className={classnames(styles.value, styles.primary)}>
            {batch.donorCount}
            <Text className={styles.unit}>人</Text>
          </Text>
          <Text className={styles.label}>采集人数</Text>
        </View>
      </View>

      <View className={styles.infoCard}>
        <Text className={styles.cardTitle}>批次详情</Text>
        <View className={styles.infoList}>
          <View className={styles.infoRow}>
            <Text className={styles.label}>采集日期</Text>
            <Text className={styles.value}>{formatDate(batch.collectionDate)}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.label}>有效期至</Text>
            <Text className={styles.value}>{formatDate(batch.expiryDate)}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.label}>采集点</Text>
            <Text className={styles.value}>{batch.collectionSite}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.label}>入库时间</Text>
            <Text className={styles.value}>{inboundTime ? formatDateTime(inboundTime) : '—'}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.label}>最后操作时间</Text>
            <Text className={styles.value}>{lastOperateTime ? formatDateTime(lastOperateTime) : '—'}</Text>
          </View>
        </View>
      </View>

      <View className={styles.timelineSection}>
        <Text className={styles.cardTitle}>库存流水</Text>
        {logs.length > 0 ? (
          <View className={styles.timeline}>
            <View className={styles.timelineLine} />
            {logs.map(log => (
              <View key={log.id} className={styles.timelineItem}>
                <View className={classnames(styles.timelineDot, styles[log.logType])} />
                <View className={styles.logCard}>
                  <View className={styles.logHeader}>
                    <View className={classnames(styles.logTypeTag, styles[log.logType])}>
                      <Text>{logTypeConfig[log.logType].icon}</Text>
                      <Text>{logTypeConfig[log.logType].label}</Text>
                    </View>
                    <View className={classnames(styles.logQty, styles[log.logType])}>
                      <Text>{getChangeQtyText(log)}</Text>
                    </View>
                  </View>
                  <View className={styles.logBalance}>结存 {log.balanceQty} 份</View>
                  <View className={styles.logTime}>{formatDateTime(log.logTime)}</View>
                  {renderLogExtra(log)}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState text="暂无库存流水记录" icon="📋" />
        )}
      </View>
    </View>
  );
};

export default BatchDetailPage;
