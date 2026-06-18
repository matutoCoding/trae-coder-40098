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
  generateOrderNo,
  chooseDate
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
  const [donorId, setDonorId] = useState<string>('');
  const [mode, setMode] = useState<SubmitMode>('quota');
  const [selfpayApplyNo, setSelfpayApplyNo] = useState<string>('');
  const [selfpayStatus, setSelfpayStatus] = useState<'' | 'pending' | 'approved'>('');
  const [submitDisabled, setSubmitDisabled] = useState(true);

  const router = Taro.useRouter();
  const { selfpayApplyId, prefillIdCard, prefillName } = router.params;

  const {
    quotaList,
    getQuotaByOrgId,
    addConsumption,
    createSelfpayApply,
    consumptionRecords,
    getDonorByIdCard,
    upsertDonor,
    selfpayApplications,
    donors
  } = useAppStore();

  useEffect(() => {
    ORG_OPTIONS.forEach(opt => {
      if (!getQuotaByOrgId(opt.id)) return;
    });
    if (prefillIdCard) setIdCard(prefillIdCard);
    if (prefillName) setName(prefillName);
    if (selfpayApplyId) {
      const apply = selfpayApplications.find(a => a.id === selfpayApplyId);
      if (apply && apply.status === 'approved') {
        Taro.showToast({ title: '自费申请已通过，可继续完成献血登记', icon: 'success' });

        const nameVal = apply.donorName || apply.applicant || '';
        const phoneVal = apply.donorPhone || apply.applicantPhone || '';
        const idCardVal = apply.donorIdCard || '';
        const bloodTypeVal = apply.donorBloodType || '';
        const lastDonateDateVal = apply.lastDonateDate || '';

        setName(nameVal);
        setPhone(phoneVal);
        setIdCard(idCardVal);
        setBloodType(bloodTypeVal as BloodType | '');
        setLastDonateDate(lastDonateDateVal);
        if (apply.orgId) setOrgId(apply.orgId);

        const donorFromStore = donors.find(d =>
          (apply.donorIdCard && d.idCard === apply.donorIdCard) ||
          (nameVal && d.name === nameVal) ||
          (phoneVal && d.phone === phoneVal)
        );
        if (donorFromStore) {
          setDonorId(donorFromStore.id);
          if (!nameVal && donorFromStore.name) setName(donorFromStore.name);
          if (!phoneVal && donorFromStore.phone) setPhone(donorFromStore.phone);
          if (!idCardVal && donorFromStore.idCard) setIdCard(donorFromStore.idCard);
          if (!bloodTypeVal && donorFromStore.bloodType) setBloodType(donorFromStore.bloodType);
          if (!lastDonateDateVal && donorFromStore.lastDonateDate) setLastDonateDate(donorFromStore.lastDonateDate);
        }

        setMode('selfpayApply');
        setSelfpayApplyNo(apply.applyNo);
        setSelfpayStatus('approved');

        if (nameVal && apply.orgId) {
          setSubmitDisabled(false);
        }
      }
    }
  }, []);

  const currentQuota = useMemo(() => getQuotaByOrgId(orgId) || quotaList[0], [getQuotaByOrgId, orgId, quotaList]);
  const orgName = useMemo(() => ORG_OPTIONS.find(o => o.id === orgId)?.name || '', [orgId]);

  const donateCount = useMemo(() => {
    if (!idCard) return 0;
    const donor = donors.find(d => d.idCard === idCard);
    return donor?.donateCount || 0;
  }, [donors, idCard]);

  const hasDonorProfile = useMemo(() => !!donorId || donateCount > 0, [donorId, donateCount]);

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
    if (!lastDonateDate) return { ok: false, msg: '请选择上次献血日期' };
    if (!orgId) return { ok: false, msg: '请选择所属单位' };
    return { ok: true };
  };

  const handleIdCardBlur = () => {
    if (idCard.length >= 15) {
      const donor = getDonorByIdCard(idCard);
      if (donor) {
        Taro.showToast({ title: '已匹配献血者档案，自动回填信息', icon: 'success' });
        setName(donor.name);
        setPhone(donor.phone);
        setBloodType(donor.bloodType);
        if (donor.lastDonateDate) setLastDonateDate(donor.lastDonateDate);
        setDonorId(donor.id);
      }
    }
  };

  const doSubmit = (submitMode: SubmitMode) => {
    setForceShowIntervalError(true);

    const isSelfpayApprovedBackflow = mode === 'selfpayApply' && selfpayStatus === 'approved';

    if (!name.trim()) {
      Taro.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    if (!orgId) {
      Taro.showToast({ title: '请选择所属单位', icon: 'none' });
      return;
    }

    if (isSelfpayApprovedBackflow) {
      let donorFromStore = donors.find(d => d.name === name.trim());
      if (donorFromStore) {
        if (!idCard.trim() && donorFromStore.idCard) setIdCard(donorFromStore.idCard);
        if (!bloodType && donorFromStore.bloodType) setBloodType(donorFromStore.bloodType);
        if (!phone.trim() && donorFromStore.phone) setPhone(donorFromStore.phone);
        if (!lastDonateDate && donorFromStore.lastDonateDate) setLastDonateDate(donorFromStore.lastDonateDate);
        if (!donorId) setDonorId(donorFromStore.id);
      }

      if (!idCard.trim()) {
        Taro.showToast({ title: '请补全身份证号信息', icon: 'none' });
        return;
      }
      if (!validateIdCard(idCard)) {
        Taro.showToast({ title: '证件号格式不正确', icon: 'none' });
        return;
      }
      if (!bloodType) {
        Taro.showToast({ title: '请补全血型信息', icon: 'none' });
        return;
      }
      if (!phone.trim()) {
        Taro.showToast({ title: '请补全手机号信息', icon: 'none' });
        return;
      }
      if (!validatePhone(phone)) {
        Taro.showToast({ title: '手机号格式不正确', icon: 'none' });
        return;
      }
      if (!lastDonateDate) {
        Taro.showToast({ title: '请补全上次献血日期', icon: 'none' });
        return;
      }
    } else {
      const req = checkRequired();
      if (!req.ok) {
        Taro.showToast({ title: req.msg!, icon: 'none' });
        return;
      }
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

    if (submitMode === 'quota' && !hasQuota && mode !== 'selfpayApply') {
      Taro.showToast({ title: '额度已用完，请选择自费申请', icon: 'none' });
      return;
    }

    if (submitMode === 'selfpayApply' && hasQuota && mode !== 'selfpayApply') {
      Taro.showToast({ title: '仍有额度，不可申请自费', icon: 'none' });
      return;
    }

    const donor = upsertDonor({
      idCard: idCard.trim(),
      name: name.trim(),
      bloodType: bloodType as BloodType,
      phone: phone.trim(),
      lastDonateDate: lastDonateDate || undefined
    });
    setDonorId(donor.id);

    const today = dayjs().format('YYYY-MM-DD');
    const recordId = `CR${Date.now()}`;

    const isSelfpayApprovedFlow = mode === 'selfpayApply' && submitMode === 'selfpayApply';

    if (submitMode === 'quota') {
      const record: ConsumptionRecord = {
        id: recordId,
        donorId: donor.id,
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
      const newRecord = addConsumption(record);
      if (newRecord) {
        Taro.showModal({
          title: '✓ 献血登记成功！',
          content: `献血凭证号：${newRecord.donationNo}`,
          confirmText: '去查看献血凭证',
          cancelText: '好的',
          confirmColor: '#E53935',
          success: (res) => {
            if (res.confirm) {
              Taro.navigateTo({
                url: `/pages/donate-certificate/index?donationNo=${encodeURIComponent(newRecord.donationNo)}`
              });
            } else {
              Taro.navigateBack();
            }
          }
        });
      } else {
        Taro.showToast({ title: '登记成功，已扣减额度', icon: 'success' });
        setTimeout(() => Taro.navigateBack(), 800);
      }
    } else {
      if (isSelfpayApprovedFlow) {
        const approvedRecord: ConsumptionRecord = {
          id: recordId,
          donorId: donor.id,
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
          operator: '系统管理员',
          phone: phone.trim(),
          lastDonateDate: lastDonateDate || undefined,
          remark: `自费申请编号：${selfpayApplyNo}，审批通过已登记`,
          selfpayApplyNo: selfpayApplyNo,
          selfpayStatus: 'approved'
        };
        const newRecord = addConsumption(approvedRecord);
        if (newRecord) {
          Taro.showModal({
            title: '✓ 献血登记成功！',
            content: `献血凭证号：${newRecord.donationNo}`,
            confirmText: '去查看献血凭证',
            cancelText: '好的',
            confirmColor: '#E53935',
            success: (res) => {
              if (res.confirm) {
                Taro.navigateTo({
                  url: `/pages/donate-certificate/index?donationNo=${encodeURIComponent(newRecord.donationNo)}`
                });
              } else {
                Taro.switchTab({ url: '/pages/quota/index' });
              }
            }
          });
        } else {
          Taro.showToast({ title: '登记成功，自费申请已生效', icon: 'success' });
          setTimeout(() => Taro.switchTab({ url: '/pages/quota/index' }), 1000);
        }
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
          donorId: donor.id,
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
        const newRecord = addConsumption(pendingRecord);
        if (newRecord) {
          Taro.showModal({
            title: '✓ 自费申请已提交！',
            content: `献血凭证号：${newRecord.donationNo}\n\n申请已提交，等待审批通过后生效。`,
            confirmText: '去查看献血凭证',
            cancelText: '好的',
            confirmColor: '#E53935',
            success: (res) => {
              if (res.confirm) {
                Taro.navigateTo({
                  url: `/pages/donate-certificate/index?donationNo=${encodeURIComponent(newRecord.donationNo)}`
                });
              } else {
                Taro.switchTab({ url: '/pages/quota/index' });
              }
            }
          });
        } else {
          Taro.showToast({ title: '自费申请已提交', icon: 'success' });
          setTimeout(() => Taro.switchTab({ url: '/pages/quota/index' }), 1000);
        }
      }
    }
  };

  const pickDate = async () => {
    const res = await chooseDate(lastDonateDate || dayjs().subtract(90, 'day').format('YYYY-MM-DD'));
    if (res) setLastDonateDate(res);
  };

  const orgSelectedName = ORG_OPTIONS.find(o => o.id === orgId)?.name || '请选择所属单位';

  return (
    <View className={styles.donateRegister}>
      <View className={styles.formCard}>
        <Text className={styles.formTitle}>
          <Text className={styles.icon}>🩸</Text>
          献血人基本信息
        </Text>

        {hasDonorProfile ? (
          <View
            style={{
              padding: '12rpx 20rpx',
              marginTop: '8rpx',
              marginBottom: '16rpx',
              background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
              borderRadius: '12rpx',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: (donorId || idCard) ? 'pointer' : 'default'
            }}
            onClick={() => {
              if (donorId) {
                Taro.navigateTo({ url: `/pages/donor-detail/index?id=${encodeURIComponent(donorId)}` });
              } else if (idCard) {
                Taro.navigateTo({ url: `/pages/donor-detail/index?idCard=${encodeURIComponent(idCard)}` });
              }
            }}
          >
            <Text style={{ color: '#2E7D32', fontWeight: '600', fontSize: '26rpx' }}>
              📋 已登记档案 · 累计献血{donateCount}次
            </Text>
            {(donorId || idCard) && (
              <Text style={{ color: '#2E7D32', fontSize: '28rpx', fontWeight: '600' }}>›</Text>
            )}
          </View>
        ) : (
          <View
            style={{
              padding: '12rpx 20rpx',
              marginTop: '8rpx',
              marginBottom: '16rpx',
              background: 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)',
              borderRadius: '12rpx',
              display: 'flex',
              alignItems: 'center'
            }}
            onClick={() => {
              Taro.showToast({ title: '提交首次献血后可查看档案', icon: 'none' });
            }}
          >
            <Text style={{ color: '#F57C00', fontWeight: '600', fontSize: '26rpx' }}>
              ✨ 新建档案 · 首次献血
            </Text>
          </View>
        )}

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
              onBlur={handleIdCardBlur}
            />
          </View>
          {donorId && (
            <View style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '8rpx',
              padding: '8rpx 16rpx',
              background: '#E8F5E9',
              borderRadius: '8rpx',
              alignSelf: 'flex-start'
            }}>
              <Text style={{ color: '#2E7D32', fontSize: '24rpx', fontWeight: '500' }}>
                📋 已匹配档案
              </Text>
            </View>
          )}
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

        {mode === 'selfpayApply' && (
          <View className={classnames(styles.alertBox, styles.success)} style={{ marginBottom: '24rpx' }}>
            <Text className={styles.alertTitle}>✅ 自费申请已审批通过</Text>
            <Text className={styles.alertText}>
              自费申请编号：{selfpayApplyNo}，本次献血按自费登记，无需扣减额度。
            </Text>
          </View>
        )}

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

      {!hasQuota && currentQuota && mode !== 'selfpayApply' && (
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
        {mode === 'selfpayApply' ? (
          <View
            className={classnames(styles.submitBtn, styles.warning, (!intervalCheck.valid || submitDisabled) && styles.disabled)}
            onClick={() => doSubmit('selfpayApply')}
          >
            {!intervalCheck.valid
              ? `间隔还差${180 - intervalCheck.days}天`
              : '✓ 确认登记（自费申请已通过）'}
          </View>
        ) : hasQuota ? (
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
