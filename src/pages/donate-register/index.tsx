import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Input, Textarea } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useAppStore } from '@/store';
import styles from './index.module.scss';
import {
  isDonateIntervalValid,
  validateIdCard,
  validatePhone,
  getBloodTypeColor,
  generateOrderNo
} from '@/utils';
import classnames from 'classnames';
import type { BloodType, ConsumptionRecord, SelfpayApply } from '@/types';
import dayjs from 'dayjs';

const BLOOD_TYPES: BloodType[] = ['A', 'B', 'AB', 'O'];
const ORG_OPTIONS = [
  { id: 'ORG001', name: '北京市第一人民医院' },
  { id: 'ORG002', name: '北京市红十字血液中心' },
  { id: 'ORG003', name: '海淀区中心血站' },
  { id: 'ORG004', name: '朝阳区爱心献血办公室' }
];

type SubmitMode = 'quota' | 'selfpayApply';

const DonateRegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [idCard, setIdCard] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodType, setBloodType] = useState<BloodType | ''>('');
  const [lastDonateDate, setLastDonateDate] = useState('');
  const [orgId, setOrgId] = useState('ORG001');
  const [orgOpen, setOrgOpen] = useState(false);
  const [selfpayReason, setSelfpayReason] = useState('');
  const [forceShowIntervalError, setForceShowIntervalError] = useState(false);

  const { quotaList, getQuotaByOrgId, addConsumption, createSelfpayApply, consumptionRecords } = useAppStore();

  useEffect(() => {
    ORG_OPTIONS.forEach(opt => {
      if (!getQuotaByOrgId(opt.id)) return;
    });
  }, []);

  const currentQuota = useMemo(() => getQuotaByOrgId(orgId) || quotaList[0], [getQuotaByOrgId, orgId, quotaList]);
  const orgName = useMemo(() => ORG_OPTIONS.find(o => o.id === orgId)?.name || '', [orgId]);

  const intervalCheck = useMemo(() => {
    if (forceShowIntervalError || (name && idCard)) {
      if (lastDonateDate) {
        return isDonateIntervalValid(lastDonateDate);
      }
      const matched = consumptionRecords.find(r => r.idCard === idCard || r.donorName === name);
      if (matched) {
        return isDonateIntervalValid(matched.donateDate);
      }
    }
    return { valid: true, days: -1 };
  }, [name, idCard, lastDonateDate, consumptionRecords, forceShowIntervalError]);

  const hasQuota = useMemo(() => !!currentQuota && currentQuota.remainingQuota > 0, [currentQuota]);
  const quotaColorClass = useMemo(() => {
    if (!currentQuota) return '';
    const rate = currentQuota.totalQuota > 0 ? currentQuota.remainingQuota / currentQuota.totalQuota : 0;
    if (rate === 0) return 'danger';
    if (rate <= 0.2) return 'warn';
    return '';
  }, [currentQuota]);

  const checkRequired = (): { ok: boolean; msg?: string } => {
    if (!name.trim()) return { ok: false, msg: '请输入姓名' };
    if (!idCard.trim()) return { ok: false, msg: '请输入证件号' };
    if (!validateIdCard(idCard)) return { ok: false, msg: '证件号格式不正确' };
    if (!bloodType) return { ok: false, msg: '请选择血型' };
    if (!phone.trim()) return { ok: false, msg: '请输入手机号' };
    if (!validatePhone(phone)) return { ok: false, msg: '手机号格式不正确' };
    if (!orgId) return { ok: false, msg: '请选择所属单位' };
    return { ok: true };
  };

  const doSubmit = (mode: SubmitMode) => {
    setForceShowIntervalError(true);
    const req = checkRequired();
    if (!req.ok) {
      Taro.showToast({ title: req.msg!, icon: 'none' });
      return;
    }
    if (!intervalCheck.valid) {
      const need = 180 - intervalCheck.days;
      Taro.showModal({
        title: '献血间隔不足',
        content: `距离上次献血仅${intervalCheck.days}天，未满180天最低要求，还差${need}天。按《献血法》规定暂不可献血，请${need}天后再来。`,
        showCancel: false,
        confirmColor: '#E53935'
      });
      return;
    }

    if (mode === 'quota' && !hasQuota) {
      Taro.showToast({ title: '额度已用完，请选择自费申请', icon: 'none' });
      return;
    }

    if (mode === 'selfpayApply' && hasQuota) {
      Taro.showToast({ title: '仍有额度，不可申请自费', icon: 'none' });
      return;
    }

    const today = dayjs().format('YYYY-MM-DD');
    const recordId = `CR${Date.now()}`;

    if (mode === 'quota') {
      const record: ConsumptionRecord = {
        id: recordId,
        donorId: `DR${Date.now()}`,
        donorName: name.trim(),
        idCard: idCard.trim(),
        bloodType: bloodType as BloodType,
        orgId,
        orgName,
        type: 'quota',
        amount: 1,
        donateDate: today,
        intervalCheckPassed: true,
        daysSinceLastDonate: intervalCheck.days > 0 ? intervalCheck.days : undefined,
        operator: '系统管理员',
        phone: phone.trim(),
        lastDonateDate: lastDonateDate || undefined,
        remark: ''
      };
      addConsumption(record);
      Taro.showToast({ title: '登记成功，已扣减额度', icon: 'success' });
      setTimeout(() => Taro.navigateBack(), 800);
    } else {
      if (!selfpayReason.trim()) {
        Taro.showToast({ title: '请填写自费申请原因', icon: 'none' });
        return;
      }
      const apply: SelfpayApply = {
        id: `SA${Date.now()}`,
        applyNo: generateOrderNo('SP'),
        orgId,
        orgName,
        applicant: name.trim(),
        applyDate: today,
        exceedCount: 1,
        reason: selfpayReason.trim(),
        status: 'pending',
        donorPhone: phone.trim(),
        donorBloodType: bloodType as BloodType,
        donorIdCard: idCard.trim(),
        lastDonateDate: lastDonateDate || undefined,
        remark: '献血登记流程自动发起'
      };
      createSelfpayApply(apply);
      const pendingRecord: ConsumptionRecord = {
        id: recordId,
        donorId: `DR${Date.now()}`,
        donorName: name.trim(),
        idCard: idCard.trim(),
        bloodType: bloodType as BloodType,
        orgId,
        orgName,
        type: 'selfpay',
        amount: 1,
        donateDate: today,
        intervalCheckPassed: true,
        daysSinceLastDonate: intervalCheck.days > 0 ? intervalCheck.days : undefined,
        operator: '待审批',
        phone: phone.trim(),
        lastDonateDate: lastDonateDate || undefined,
        remark: `自费申请编号：${apply.applyNo}，等待审批`,
        selfpayApplyNo: apply.applyNo,
        selfpayStatus: 'pending'
      };
      addConsumption(pendingRecord);
      Taro.showToast({ title: '自费申请已提交', icon: 'success' });
      setTimeout(() => Taro.switchTab({ url: '/pages/quota/index' }), 1000);
    }
  };

  const pickDate = async () => {
    try {
      const res = await Taro.chooseDate({});
      if (res) setLastDonateDate(res);
    } catch (e) {
      const y = prompt('请输入上次献血日期 (格式：YYYY-MM-DD)', lastDonateDate || dayjs().subtract(90, 'day').format('YYYY-MM-DD'));
      if (y) setLastDonateDate(y);
    }
  };

  const orgSelectedName = ORG_OPTIONS.find(o => o.id === orgId)?.name || '请选择所属单位';

  return (
    <View className={styles.donateRegister}>
      <View className={styles.formCard}>
        <Text className={styles.formTitle}>
          <Text className={styles.icon}>🩸</Text>
          献血人基本信息
        </Text>

        <View className={styles.formItem}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>姓名
          </Text>
          <View className={styles.input}>
            <Input
              type="text"
              placeholder="请输入献血人真实姓名"
              value={name}
              onInput={(e) => setName(e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>身份证号
          </Text>
          <View className={styles.input}>
            <Input
              type="idcard"
              placeholder="18位身份证号，含校验"
              value={idCard}
              maxLength={18}
              onInput={(e) => setIdCard(e.detail.value.toUpperCase())}
            />
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

        <View className={styles.formItem}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>手机号
          </Text>
          <View className={styles.input}>
            <Input
              type="number"
              placeholder="11位联系电话"
              value={phone}
              maxLength={11}
              onInput={(e) => setPhone(e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.label}>上次献血日期（可选）</Text>
          <View
            className={classnames(styles.selectField, !!lastDonateDate && styles.active)}
            onClick={pickDate}
          >
            <Text className={lastDonateDate ? '' : styles.placeholder}>
              {lastDonateDate || '点击选择日期，用于180天间隔校验'}
            </Text>
            <Text className={styles.arrow}>▼</Text>
          </View>
          {!intervalCheck.valid && (intervalCheck.days >= 0) && (forceShowIntervalError || lastDonateDate) && (
            <View className={classnames(styles.alertBox, styles.danger)}>
              <Text className={styles.alertTitle}>⛔ 献血间隔不足</Text>
              <Text className={styles.alertText}>
                距离上次仅 {intervalCheck.days} 天，还差 <Text style={{ fontWeight: '700' }}>{180 - intervalCheck.days}</Text> 天才满180天。
                按《献血法》规定本次不可献血，请于 {dayjs(lastDonateDate).add(180, 'day').format('YYYY年MM月DD日')} 后再来。
              </Text>
            </View>
          )}
          {intervalCheck.valid && intervalCheck.days >= 0 && lastDonateDate && (
            <View className={classnames(styles.alertBox, styles.success)}>
              <Text className={styles.alertTitle}>✅ 间隔校验通过</Text>
              <Text className={styles.alertText}>
                距上次献血已 {intervalCheck.days} 天，符合 ≥180 天要求，可以登记。
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.formCard}>
        <Text className={styles.formTitle}>
          <Text className={styles.icon}>🏢</Text>
          所属单位与额度信息
        </Text>

        <View className={styles.formItem}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>所属单位
          </Text>
          <View
            className={classnames(styles.selectField, orgOpen && styles.open)}
            onClick={() => setOrgOpen(!orgOpen)}
          >
            <Text className={!orgId ? styles.placeholder : ''}>{orgSelectedName}</Text>
            <Text className={styles.arrow}>▼</Text>
          </View>
          {orgOpen && (
            <View className={styles.selectOptions}>
              {ORG_OPTIONS.map(opt => (
                <View
                  key={opt.id}
                  className={classnames(styles.optionItem, orgId === opt.id && styles.selected)}
                  onClick={() => { setOrgId(opt.id); setOrgOpen(false); }}
                >
                  {opt.name}
                </View>
              ))}
            </View>
          )}
        </View>

        {currentQuota && (
          <View className={styles.quotaInfo}>
            <View className={styles.infoItem}>
              <Text className={classnames(styles.num, quotaColorClass)}>{currentQuota.totalQuota}</Text>
              <Text className={styles.lbl}>本周期总额</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.num}>{currentQuota.usedQuota}</Text>
              <Text className={styles.lbl}>已使用</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={classnames(styles.num, quotaColorClass)}>{currentQuota.remainingQuota}</Text>
              <Text className={styles.lbl}>可用剩余</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.num}>{currentQuota.selfpayCount}</Text>
              <Text className={styles.lbl}>自费数</Text>
            </View>
          </View>
        )}
      </View>

      {!hasQuota && currentQuota && (
        <View className={styles.formCard}>
          <Text className={styles.formTitle}>
            <Text className={styles.icon}>📋</Text>
            额度不足：自费申请
          </Text>
          <View className={classnames(styles.alertBox, styles.warning)} style={{ marginBottom: '24rpx' }}>
            <Text className={styles.alertTitle}>⚠️ 额度已用完</Text>
            <Text className={styles.alertText}>
              当前单位（{currentQuota.orgName}）本周期 {currentQuota.cycleStart} ~ {currentQuota.cycleEnd}
              献血额度已全部用完。如仍需献血请填写下方说明，系统将自动发起自费申请，审批通过后方可登记。
            </Text>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>
              <Text className={styles.required}>*</Text>自费申请原因
            </Text>
            <Textarea
              className={styles.selfpayReasonInput}
              placeholder="请详细说明本次需自费献血的原因（如：应急手术用血、家属互助等）..."
              maxlength={200}
              value={selfpayReason}
              onInput={(e) => setSelfpayReason(e.detail.value)}
            />
          </View>
        </View>
      )}

      <View style={{ height: 140 }} />

      <View className={styles.submitBar}>
        {hasQuota ? (
          <View
            className={classnames(styles.submitBtn, !intervalCheck.valid && styles.disabled)}
            onClick={() => doSubmit('quota')}
          >
            {!intervalCheck.valid
              ? `间隔还差${180 - intervalCheck.days}天`
              : '✓ 确认登记（扣减额度）'}
          </View>
        ) : (
          <View
            className={classnames(styles.submitBtn, styles.warning, (!intervalCheck.valid || !selfpayReason.trim()) && styles.disabled)}
            onClick={() => doSubmit('selfpayApply')}
          >
            {!intervalCheck.valid
              ? `间隔还差${180 - intervalCheck.days}天`
              : '📋 提交自费申请（待审批）'}
          </View>
        )}
      </View>
    </View>
  );
};

export default DonateRegisterPage;
