import React, { useState, useMemo } from 'react';
import { View, Text, Input, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store';
import styles from './index.module.scss';
import {
  generateOrderNo,
  getBloodTypeColor,
  validatePhone,
  getFifoSortedBatches,
  EXHAUSTED_BADGE_TEXT,
  isBatchExhausted
} from '@/utils';
import classnames from 'classnames';
import type { BloodBatch, BloodType, OutboundRecord } from '@/types';
import dayjs from 'dayjs';

const BLOOD_FILTER: { key: BloodType | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'A', label: 'A' },
  { key: 'B', label: 'B' },
  { key: 'AB', label: 'AB' },
  { key: 'O', label: 'O' }
];

const OutboundRegisterPage: React.FC = () => {
  const { bloodBatches, addOutbound, getFifoRecommendedBatches } = useAppStore();

  const [typeFilter, setTypeFilter] = useState<BloodType | 'all'>('all');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedBatches, setSelectedBatches] = useState<Set<string>>(new Set());
  const [receiver, setReceiver] = useState('');
  const [receiverDept, setReceiverDept] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [purpose, setPurpose] = useState('');

  const fifoList = useMemo(() => {
    const sorted = getFifoSortedBatches(
      typeFilter === 'all' ? bloodBatches : bloodBatches.filter(b => b.bloodType === typeFilter),
      typeFilter === 'all' ? undefined : typeFilter
    );
    return sorted;
  }, [bloodBatches, typeFilter, getFifoSortedBatches]);

  const firstBatchId = fifoList[0]?.id || '';

  const { isBatchUsable } = useAppStore();

  const toggleBatch = (b: BloodBatch) => {
    if (!isBatchUsable(b)) {
      let toastMsg = '该批次不可出库';
      if (isBatchExhausted(b)) {
        toastMsg = '该批次已清空，无库存可出库';
      } else if (b.status === 'expired') {
        toastMsg = '批次已过期，不可出库';
      } else if (b.status === 'locked') {
        toastMsg = '批次已锁定，不可出库';
      }
      Taro.showToast({
        title: toastMsg,
        icon: 'none'
      });
      return;
    }
    const next = new Set(selectedBatches);
    if (next.has(b.id)) {
      next.delete(b.id);
      const q = { ...quantities };
      delete q[b.id];
      setQuantities(q);
    } else {
      next.add(b.id);
      const q = { ...quantities };
      q[b.id] = q[b.id] || 1;
      setQuantities(q);
    }
    setSelectedBatches(next);
  };

  const changeQty = (id: string, max: number, delta: number) => {
    const cur = quantities[id] || 1;
    const next = Math.max(1, Math.min(max, cur + delta));
    setQuantities({ ...quantities, [id]: next });
  };

  const totalQty = useMemo(
    () => Array.from(selectedBatches).reduce((s, id) => s + (quantities[id] || 0), 0),
    [selectedBatches, quantities]
  );
  const totalStock = useMemo(
    () => fifoList.reduce((s, b) => s + b.remainingQuantity, 0),
    [fifoList]
  );
  const fifoCompliant = useMemo(() => {
    if (selectedBatches.size === 0) return true;
    const selectedSorted = Array.from(selectedBatches)
      .map(id => fifoList.findIndex(b => b.id === id))
      .filter(i => i >= 0)
      .sort((a, b) => a - b);
    if (selectedSorted[0] !== 0 && !selectedSorted.includes(0) && firstBatchId) {
      return false;
    }
    for (let i = 1; i < selectedSorted.length; i++) {
      if (selectedSorted[i] - selectedSorted[i - 1] > 1) return false;
    }
    return true;
  }, [selectedBatches, fifoList, firstBatchId]);

  const nearCount = useMemo(() => Array.from(selectedBatches)
    .filter(id => {
      const b = fifoList.find(x => x.id === id);
      return b && b.status === 'near_expiry';
    }).length, [selectedBatches, fifoList]);

  const statusToBadgeCss = (s: string) =>
    s === 'normal' ? 'normal' : s === 'near_expiry' ? 'near' : s === 'expired' ? 'expired' : 'locked';
  const statusText = (s: string) => ({ normal: '正常', near_expiry: '临期', expired: '已过期', locked: '锁定' }[s] || s);

  const checkRequired = (): { ok: boolean; msg?: string } => {
    if (selectedBatches.size === 0) return { ok: false, msg: '请至少选择一个出库批次' };
    for (const id of Array.from(selectedBatches)) {
      const b = fifoList.find(x => x.id === id);
      if (!b) continue;
      const q = quantities[id] || 0;
      if (q <= 0) return { ok: false, msg: `批次 ${b.batchNo} 数量必须≥1` };
      if (q > b.remainingQuantity) {
        return { ok: false, msg: `批次 ${b.batchNo} 数量超过库存（剩余${b.remainingQuantity}份）` };
      }
      if (!isBatchUsable(b)) {
        if (isBatchExhausted(b)) {
          return { ok: false, msg: `批次 ${b.batchNo} 已清空，无库存可出库` };
        } else if (b.status === 'expired') {
          return { ok: false, msg: `批次 ${b.batchNo} 已过期，不可出库` };
        } else if (b.status === 'locked') {
          return { ok: false, msg: `批次 ${b.batchNo} 已锁定，不可出库` };
        }
      }
    }
    if (!receiver.trim()) return { ok: false, msg: '请输入领用人姓名' };
    if (!receiverDept.trim()) return { ok: false, msg: '请输入领用科室' };
    if (!receiverPhone.trim()) return { ok: false, msg: '请输入联系电话' };
    if (!validatePhone(receiverPhone)) return { ok: false, msg: '联系电话格式不正确' };
    if (!purpose.trim()) return { ok: false, msg: '请填写出库用途' };
    return { ok: true };
  };

  const submit = async () => {
    const req = checkRequired();
    if (!req.ok) {
      Taro.showToast({ title: req.msg!, icon: 'none' });
      return;
    }
    const doSubmit = !fifoCompliant
      ? await new Promise<boolean>((resolve) => {
          Taro.showModal({
            title: '偏离FIFO原则',
            content: '您选择的出库顺序未严格遵循FIFO先进先出原则（临期/效期近的批次未被优先出库），可能造成血液过期浪费。确认要继续提交吗？',
            confirmText: '继续提交',
            cancelText: '重新选择',
            confirmColor: '#FF7D00',
            success: (res) => resolve(!!res.confirm)
          });
        })
      : true;
    if (!doSubmit) return;

    const today = dayjs().format('YYYY-MM-DD');
    const records: OutboundRecord[] = [];
    for (const id of Array.from(selectedBatches)) {
      const b = fifoList.find(x => x.id === id);
      if (!b) continue;
      const q = quantities[id] || 0;
      const isFifo = fifoCompliant && (
        fifoList.findIndex(x => x.id === id) < Math.max(3, fifoList.findIndex(x => x.id === id) + 1)
      );
      records.push({
        id: `OBD${Date.now()}_${id}`,
        outboundNo: generateOrderNo('OB'),
        batchId: b.id,
        batchNo: b.batchNo,
        bloodType: b.bloodType,
        quantity: q,
        outboundDate: today,
        receiver: receiver.trim(),
        receiverDept: receiverDept.trim(),
        receiverPhone: receiverPhone.trim(),
        purpose: purpose.trim(),
        status: 'completed',
        isFifoRecommended: isFifo,
        operator: '系统管理员',
        approvalRemark: fifoCompliant ? 'FIFO合规，自动通过' : '人工确认偏离FIFO提交'
      });
    }
    records.sort((a, b) => {
      const ba = bloodBatches.find(x => x.id === a.batchId);
      const bb = bloodBatches.find(x => x.id === b.batchId);
      if (!ba || !bb) return 0;
      return dayjs(ba.expiryDate).valueOf() - dayjs(bb.expiryDate).valueOf();
    });
    records.forEach(r => addOutbound(r));

    Taro.showToast({
      title: `已出库 ${records.length} 批 ${totalQty} 份`,
      icon: 'success'
    });
    setTimeout(() => Taro.navigateBack(), 900);
  };

  return (
    <View className={styles.outboundRegister}>
      <View className={styles.formCard}>
        <View className={styles.formTitle}>
          <View className={styles.left}>
            <Text className={styles.icon}>🚚</Text>
            FIFO出库批次选择
          </View>
          <Text className={styles.hint}>
            {typeFilter === 'all' ? '全部血型' : `${typeFilter}型`} · 共{fifoList.length}批/{totalStock}份
          </Text>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.label}>按血型过滤 <Text className={styles.tip}>（仅显示未过期、未锁定、有库存的批次）</Text></Text>
          <View className={styles.bloodTypeBar}>
            {BLOOD_FILTER.map(f => (
              <View
                key={f.key}
                className={classnames(
                  styles.typeItem,
                  f.key === 'all' && styles.all,
                  typeFilter === f.key && styles.active
                )}
                style={typeFilter === f.key && f.key !== 'all' ? {
                  background: `linear-gradient(135deg, ${getBloodTypeColor(f.key as BloodType)} 0%, ${getBloodTypeColor(f.key as BloodType)}dd 100%)`,
                  boxShadow: `0 4rpx 12rpx ${getBloodTypeColor(f.key as BloodType)}40`
                } : undefined}
                onClick={() => setTypeFilter(f.key)}
              >
                {f.key === 'all' ? f.label : `${f.label}型`}
              </View>
            ))}
          </View>
        </View>

        {fifoList.length === 0 ? (
          <View className={styles.emptyBatches}>
            <Text className={styles.emoji}>📦</Text>
            暂无可出库的{typeFilter === 'all' ? '' : `${typeFilter}型`}批次
          </View>
        ) : (
          <View className={styles.batchList}>
            {fifoList.map((b, idx) => {
              const isExhausted = isBatchExhausted(b);
              const disabled = !isBatchUsable(b);
              const selected = selectedBatches.has(b.id);
              const q = quantities[b.id] || 1;
              return (
                <View
                  key={b.id}
                  className={classnames(
                    styles.batchItem,
                    selected && styles.selected,
                    idx === 0 && styles.fifoFirst,
                    disabled && styles.disabled
                  )}
                  onClick={() => toggleBatch(b)}
                >
                  {idx === 0 && !disabled && <View className={styles.badgeFifo}>⭐ FIFO最优先</View>}
                  <View className={styles.batchRow}>
                    <Text className={styles.no}>{b.batchNo}</Text>
                    <View
                      className={classnames(styles.badge, isExhausted ? styles.exhausted : statusToBadgeCss(b.status) as any)}
                    >
                      {isExhausted ? '📦 无库存' : statusText(b.status)}
                    </View>
                  </View>
                  <View className={styles.batchMeta}>
                    <View className={styles.metaItem}>
                      <Text style={{
                        padding: '2rpx 10rpx',
                        borderRadius: '6rpx',
                        background: `${getBloodTypeColor(b.bloodType)}18`,
                        color: getBloodTypeColor(b.bloodType),
                        fontWeight: '600',
                        fontSize: '22rpx'
                      }}>{b.bloodType}型</Text>
                    </View>
                    <View className={styles.metaItem}>📅 效期：{b.expiryDate}</View>
                    <View className={styles.metaItem}>⏱ 剩 {b.daysToExpiry} 天</View>
                    <View className={styles.metaItem}>📍 {b.collectionSite}</View>
                  </View>
                  <View className={styles.batchFooter}>
                    <View className={styles.stock}>
                      库存
                      <Text className={styles.num}>{b.remainingQuantity}</Text>
                      / {b.quantity}份
                    </View>
                    {selected && !disabled && (
                      <View
                        className={styles.qtyControl}
                        onClick={(e) => { e.stopPropagation && e.stopPropagation(); }}
                      >
                        <View
                          className={classnames(styles.qtyBtn, styles.minus)}
                          onClick={(e) => { e.stopPropagation && e.stopPropagation(); changeQty(b.id, b.remainingQuantity, -1); }}
                        >−</View>
                        <View className={styles.qtyNum}>{q}</View>
                        <View
                          className={classnames(styles.qtyBtn, styles.plus)}
                          onClick={(e) => { e.stopPropagation && e.stopPropagation(); changeQty(b.id, b.remainingQuantity, 1); }}
                        >+</View>
                      </View>
                    )}
                    {disabled && (
                      <Text style={{ fontSize: '22rpx', color: '#86909C' }}>
                        {isExhausted ? '📦 无库存' : b.status === 'expired' ? '已过期' : '已锁定'}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {!fifoCompliant && selectedBatches.size > 0 && (
          <View className={classnames(styles.alertBox, styles.danger)}>
            <Text className={styles.title}>⚠️ 偏离FIFO出库原则</Text>
            <Text className={styles.text}>
              您跳过了排在前面的临期/优先批次，这可能会导致未优先出库的血液过期浪费。
              建议优先选择带有"⭐ FIFO最优先"标记的批次。
            </Text>
          </View>
        )}
      </View>

      <View className={styles.summaryPanel}>
        <View className={styles.title}>📊 本次出库汇总</View>
        <View className={styles.grid}>
          <View className={styles.stat}>
            <Text className={styles.lbl}>选择批次</Text>
            <Text className={classnames(styles.val, styles.accent)}>{selectedBatches.size} 批</Text>
          </View>
          <View className={styles.stat}>
            <Text className={styles.lbl}>出库总量</Text>
            <Text className={classnames(styles.val, styles.accent)}>{totalQty} 份</Text>
          </View>
          <View className={styles.stat}>
            <Text className={styles.lbl}>含临期批次</Text>
            <Text className={classnames(styles.val, styles.warn)}>{nearCount} 批</Text>
          </View>
          <View className={styles.stat}>
            <Text className={styles.lbl}>FIFO合规</Text>
            <Text className={classnames(styles.val, fifoCompliant ? styles.green : styles.warn)}>
              {fifoCompliant ? '✓ 合规' : '✗ 偏离'}
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.formCard}>
        <View className={styles.formTitle}>
          <View className={styles.left}>
            <Text className={styles.icon}>🧾</Text>
            领用信息
          </View>
        </View>
        <View className={styles.formItem}>
          <Text className={styles.label}><Text className={styles.required}>*</Text>领用人</Text>
          <View className={styles.input}>
            <Input
              placeholder="请输入领用人姓名"
              value={receiver}
              onInput={(e) => setReceiver(e.detail.value)}
            />
          </View>
        </View>
        <View className={styles.formItem}>
          <Text className={styles.label}><Text className={styles.required}>*</Text>领用科室</Text>
          <View className={styles.input}>
            <Input
              placeholder="如：手术室、重症监护室、内科等"
              value={receiverDept}
              onInput={(e) => setReceiverDept(e.detail.value)}
            />
          </View>
        </View>
        <View className={styles.formItem}>
          <Text className={styles.label}><Text className={styles.required}>*</Text>联系电话</Text>
          <View className={styles.input}>
            <Input
              type="number"
              placeholder="11位手机号"
              value={receiverPhone}
              maxLength={11}
              onInput={(e) => setReceiverPhone(e.detail.value.replace(/[^\d]/g, ''))}
            />
          </View>
        </View>
        <View className={styles.formItem}>
          <Text className={styles.label}><Text className={styles.required}>*</Text>出库用途</Text>
          <Textarea
            className={styles.textAreaField}
            placeholder="请填写本次血液出库用途，如：手术备血、急救输血、患者治疗用血等..."
            maxlength={300}
            value={purpose}
            onInput={(e) => setPurpose(e.detail.value)}
          />
        </View>
      </View>

      <View style={{ height: 160 }} />

      <View className={styles.submitBar}>
        <View className={styles.cancelBtn} onClick={() => Taro.navigateBack()}>取消</View>
        <View
          className={classnames(styles.submitBtn, !checkRequired().ok && styles.disabled)}
          onClick={submit}
        >
          ✓ 确认出库 {selectedBatches.size > 0 && `(${selectedBatches.size}批/${totalQty}份)`}
        </View>
      </View>
    </View>
  );
};

export default OutboundRegisterPage;
