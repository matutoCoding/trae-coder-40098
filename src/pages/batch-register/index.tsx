import React, { useState, useMemo } from 'react';
import { View, Text, Input, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store';
import styles from './index.module.scss';
import {
  generateBatchNo,
  getBatchStatus,
  getDaysToExpiry,
  getBloodTypeColor,
  validatePhone
} from '@/utils';
import classnames from 'classnames';
import type { BloodBatch, BloodType, BatchStatus } from '@/types';
import dayjs from 'dayjs';

const BLOOD_TYPES: BloodType[] = ['A', 'B', 'AB', 'O'];
const DEFAULT_SITES = [
  '北京市红十字血液中心',
  '海淀区流动献血车',
  '朝阳区中心血库',
  '西单爱心献血屋',
  '王府井献血站'
];

const BatchRegisterPage: React.FC = () => {
  const [batchNo, setBatchNo] = useState(generateBatchNo());
  const [bloodType, setBloodType] = useState<BloodType | ''>('');
  const [collectionDate, setCollectionDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [expiryDate, setExpiryDate] = useState(dayjs().add(35, 'day').format('YYYY-MM-DD'));
  const [quantity, setQuantity] = useState('');
  const [donorCount, setDonorCount] = useState('');
  const [collectionSite, setCollectionSite] = useState('');
  const [customSite, setCustomSite] = useState('');
  const [remark, setRemark] = useState('');
  const [colOpen, setColOpen] = useState(false);
  const [expOpen, setExpOpen] = useState(false);

  const { addBloodBatch, bloodBatches } = useAppStore();

  const computedStatus = useMemo<{ status: BatchStatus; daysToExpiry: number; daysValid: boolean }>(() => {
    if (!expiryDate || !collectionDate) {
      return { status: 'normal' as BatchStatus, daysToExpiry: 0, daysValid: false };
    }
    const daysToExpiry = getDaysToExpiry(expiryDate);
    const daysFromCol = dayjs(expiryDate).diff(dayjs(collectionDate), 'day');
    const valid = daysFromCol > 0 && dayjs(collectionDate).isBefore(dayjs(expiryDate));
    const s = getBatchStatus({
      id: '',
      batchNo: '',
      bloodType: (bloodType || 'A') as BloodType,
      collectionDate,
      expiryDate,
      quantity: Number(quantity) || 0,
      usedQuantity: 0,
      remainingQuantity: Number(quantity) || 1,
      collectionSite: '',
      donorCount: 0,
      daysToExpiry
    });
    return { status: s.status, daysToExpiry, daysValid: valid };
  }, [expiryDate, collectionDate, quantity, bloodType]);

  const checkRequired = (): { ok: boolean; msg?: string } => {
    if (!batchNo.trim()) return { ok: false, msg: '请输入批次号' };
    if (bloodBatches.some(b => b.batchNo === batchNo.trim())) {
      return { ok: false, msg: '该批次号已存在，请换一个' };
    }
    if (!bloodType) return { ok: false, msg: '请选择血型' };
    if (!collectionDate) return { ok: false, msg: '请选择采集日期' };
    if (!expiryDate) return { ok: false, msg: '请选择有效期' };
    if (!computedStatus.daysValid) {
      return { ok: false, msg: '有效期必须晚于采集日期' };
    }
    const q = parseInt(quantity, 10);
    if (!quantity || isNaN(q) || q <= 0) return { ok: false, msg: '请输入有效的采集数量' };
    if (q > 999) return { ok: false, msg: '单批次数量不可超过999' };
    const dc = parseInt(donorCount, 10);
    if (!donorCount || isNaN(dc) || dc <= 0) return { ok: false, msg: '请输入献血人数' };
    if (dc > q) return { ok: false, msg: '献血人数不可超过采集份数' };
    const finalSite = customSite.trim() || collectionSite;
    if (!finalSite.trim()) return { ok: false, msg: '请选择或输入采集点' };
    if (computedStatus.status === 'expired') {
      return { ok: false, msg: '有效期已过期，请重新设置' };
    }
    return { ok: true };
  };

  const pickDate = async (kind: 'col' | 'exp') => {
    try {
      const res = await (Taro as any).chooseDate({});
      if (res) {
        if (kind === 'col') {
          setCollectionDate(res);
          if (!expiryDate || dayjs(expiryDate).isBefore(dayjs(res))) {
            setExpiryDate(dayjs(res).add(35, 'day').format('YYYY-MM-DD'));
          }
          setColOpen(false);
        } else {
          setExpiryDate(res);
          setExpOpen(false);
        }
      }
    } catch (e) {
      const def = kind === 'col' ? collectionDate : expiryDate;
      const y = prompt(`请输入${kind === 'col' ? '采集' : '有效'}日期 (YYYY-MM-DD)`, def);
      if (y && dayjs(y).isValid()) {
        if (kind === 'col') {
          setCollectionDate(y);
          if (!expiryDate || dayjs(expiryDate).isBefore(dayjs(y))) {
            setExpiryDate(dayjs(y).add(35, 'day').format('YYYY-MM-DD'));
          }
        } else {
          setExpiryDate(y);
        }
      }
    }
  };

  const submit = () => {
    const req = checkRequired();
    if (!req.ok) {
      Taro.showToast({ title: req.msg!, icon: 'none' });
      return;
    }
    const q = parseInt(quantity, 10);
    const dc = parseInt(donorCount, 10);
    const finalSite = customSite.trim() || collectionSite;
    const { status, daysToExpiry } = computedStatus;
    const finalStatus: BatchStatus = q > 0 ? status : 'locked';

    const batch: BloodBatch = {
      id: `B${Date.now()}`,
      batchNo: batchNo.trim(),
      bloodType: bloodType as BloodType,
      collectionDate,
      expiryDate,
      quantity: q,
      usedQuantity: 0,
      remainingQuantity: q,
      status: finalStatus,
      daysToExpiry,
      collectionSite: finalSite,
      donorCount: dc
    };
    addBloodBatch(batch);
    const statusText = { normal: '正常', near_expiry: '临期', expired: '已过期', locked: '已锁定' }[finalStatus];
    Taro.showToast({ title: `批次创建成功（${statusText}）`, icon: 'success' });
    setTimeout(() => Taro.navigateBack(), 900);
  };

  const statusCss = { normal: 'normal', near_expiry: 'near', expired: 'expired', locked: 'normal' }[computedStatus.status];
  const statusIconMap: Record<string, string> = { normal: '✅', near_expiry: '⚠️', expired: '❌', locked: '🔒' };
  const statusLabelMap: Record<string, string> = { normal: '效期正常', near_expiry: '临期预警', expired: '已过期', locked: '已锁定' };
  const statusDescMap: Record<string, string> = {
    normal: `距到期还有 ${computedStatus.daysToExpiry} 天，状态良好可正常入库`,
    near_expiry: `仅剩 ${computedStatus.daysToExpiry} 天到期（≤30天），标记为临期批次，优先安排出库`,
    expired: `已过期 ${Math.abs(computedStatus.daysToExpiry)} 天，系统将自动锁定不可出库`,
    locked: `库存为0，已自动锁定`
  };

  return (
    <View className={styles.batchRegister}>
      <View className={styles.formCard}>
        <Text className={styles.formTitle}>
          <Text className={styles.icon}>📦</Text>
          批号信息
        </Text>
        <View className={styles.formItem}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>批次号
          </Text>
          <View className={styles.batchNoRow}>
            <View className={classnames(styles.input, styles.noInput)}>
              <Input
                type="text"
                placeholder="系统已自动生成，可手动修改"
                value={batchNo}
                maxlength={20}
                onInput={(e) => setBatchNo(e.detail.value.toUpperCase())}
              />
            </View>
            <View className={styles.regenBtn} onClick={() => setBatchNo(generateBatchNo())}>
              ⟳ 换一个
            </View>
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>血型
          </Text>
          <View className={styles.bloodTypeGroup}>
            {BLOOD_TYPES.map(t => (
              <View
                key={t}
                className={classnames(styles.bloodTypeItem, bloodType === t && styles.active)}
                style={{
                  background: bloodType === t
                    ? `linear-gradient(135deg, ${getBloodTypeColor(t)} 0%, ${getBloodTypeColor(t)}dd 100%)`
                    : undefined,
                  borderColor: bloodType === t ? 'transparent' : `${getBloodTypeColor(t)}40`,
                  color: bloodType === t ? '#fff' : getBloodTypeColor(t)
                }}
                onClick={() => setBloodType(t)}
              >
                {t}型
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.formCard}>
        <Text className={styles.formTitle}>
          <Text className={styles.icon}>📅</Text>
          效期与数量
        </Text>
        <View className={styles.formItem}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>采集日期
          </Text>
          <View
            className={classnames(styles.selectField, !!collectionDate && styles.active)}
            onClick={() => pickDate('col')}
          >
            <Text className={!collectionDate ? styles.placeholder : ''}>
              {collectionDate || '点击选择采集日期'}
            </Text>
            <Text className={styles.arrow}>📅</Text>
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>有效期至
          </Text>
          <View
            className={classnames(styles.selectField, !!expiryDate && styles.active)}
            onClick={() => pickDate('exp')}
          >
            <Text className={!expiryDate ? styles.placeholder : ''}>
              {expiryDate || '点击选择有效期'}
            </Text>
            <Text className={styles.arrow}>📅</Text>
          </View>
          {(expiryDate || collectionDate) && (
            <View className={classnames(styles.statusPreview, statusCss as any)}>
              <Text className={styles.statusIcon}>{statusIconMap[computedStatus.status] || '✅'}</Text>
              <View className={styles.statusText}>
                <Text className={styles.statusLbl}>{statusLabelMap[computedStatus.status] || '正常'}</Text>
                <Text className={styles.statusDesc}>
                  {!computedStatus.daysValid ? '⚠️ 有效期必须晚于采集日期' : statusDescMap[computedStatus.status] || ''}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View className={styles.formItem}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>采集份数
          </Text>
          <View className={styles.input}>
            <Input
              type="number"
              placeholder="请输入本批次采集份数（全血份数/单位）"
              value={quantity}
              maxlength={4}
              onInput={(e) => setQuantity(e.detail.value.replace(/[^\d]/g, ''))}
            />
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>献血人数
          </Text>
          <View className={styles.input}>
            <Input
              type="number"
              placeholder="请输入参与献血人数"
              value={donorCount}
              maxlength={4}
              onInput={(e) => setDonorCount(e.detail.value.replace(/[^\d]/g, ''))}
            />
          </View>
        </View>
      </View>

      <View className={styles.formCard}>
        <Text className={styles.formTitle}>
          <Text className={styles.icon}>📍</Text>
          采集信息
        </Text>
        <View className={styles.formItem}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>采集点
          </Text>
          <View className={styles.sitesBar}>
            {DEFAULT_SITES.map(site => (
              <View
                key={site}
                className={classnames(styles.siteTag, collectionSite === site && !customSite && styles.active)}
                onClick={() => { setCollectionSite(site); setCustomSite(''); }}
              >
                {site}
              </View>
            ))}
          </View>
          <View style={{ height: 20 }} />
          <View className={styles.input}>
            <Input
              type="text"
              placeholder="或手动输入其他采集点..."
              value={customSite}
              maxlength={50}
              onInput={(e) => { setCustomSite(e.detail.value); if (e.detail.value) setCollectionSite(''); }}
            />
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.label}>备注</Text>
          <Textarea
            className={styles.textAreaField}
            placeholder="批次相关备注信息，如特殊检验、特殊用途等..."
            maxlength={300}
            value={remark}
            onInput={(e) => setRemark(e.detail.value)}
          />
        </View>
      </View>

      <View style={{ height: 140 }} />

      <View className={styles.submitBar}>
        <View
          className={styles.cancelBtn}
          onClick={() => Taro.navigateBack()}
        >
          取消
        </View>
        <View
          className={classnames(styles.submitBtn, !checkRequired().ok && styles.disabled)}
          onClick={submit}
        >
          ✓ 确认入库
        </View>
      </View>
    </View>
  );
};

export default BatchRegisterPage;
