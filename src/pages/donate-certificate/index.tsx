import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store';
import styles from './index.module.scss';
import classnames from 'classnames';
import dayjs from 'dayjs';
import type { ConsumptionRecord, ApplyStatus } from '@/types';

const DonateCertificatePage: React.FC = () => {
  const router = Taro.useRouter();
  const { consumptionId, donationNo } = router.params;

  const {
    consumptionRecords,
    donors,
    getConsumptionByDonationNo,
    quotaList,
    selfpayApplications
  } = useAppStore();

  const record = useMemo<ConsumptionRecord | undefined>(() => {
    if (consumptionId) {
      return consumptionRecords.find(r => r.id === consumptionId);
    }
    if (donationNo) {
      return getConsumptionByDonationNo(decodeURIComponent(donationNo));
    }
    return undefined;
  }, [consumptionId, donationNo, consumptionRecords, getConsumptionByDonationNo]);

  const selfpayApply = useMemo(() => {
    if (!record?.selfpayApplyNo) return undefined;
    return selfpayApplications.find(a => a.applyNo === record.selfpayApplyNo);
  }, [record, selfpayApplications]);

  const maskIdCard = (id: string) => {
    if (!id || id.length < 8) return id || '-';
    return id.substring(0, 6) + '********' + id.substring(id.length - 4);
  };

  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 11) return phone || '-';
    return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
  };

  const getStatusText = (status?: ApplyStatus) => {
    const map: Record<ApplyStatus, string> = {
      approved: '已通过',
      pending: '审批中',
      rejected: '已拒绝'
    };
    return status ? map[status] : '';
  };

  if (!record) {
    return (
      <View className={styles.certPage}>
        <View className={styles.certCard}>
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📄</Text>
            <Text className={styles.emptyTitle}>凭证不存在</Text>
            <Text className={styles.emptyDesc}>
              该献血凭证可能已失效或不存在，{'\n'}请检查参数后重试。
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const daysSince = record.daysSinceLastDonate ?? 0;
  const intervalValid = daysSince === 0 || daysSince >= 180;
  const daysDiff = 180 - daysSince;
  const registerTime = dayjs(record.donateDate).format('YYYY-MM-DD HH:mm');
  const generateDate = dayjs().format('YYYY年MM月DD日');

  return (
    <View className={styles.certPage}>
      <View className={styles.certCard}>
        <View className={styles.certHeader}>
          <Text className={styles.bloodDrop}>🩸</Text>
          <Text className={styles.title}>无偿献血凭证</Text>
        </View>

        <View className={styles.certNo}>
          <Text className={styles.no}>{record.donationNo}</Text>
          <Text className={styles.label}>献血凭证唯一编号</Text>
        </View>

        <View className={styles.divider} />

        <View className={styles.infoSection}>
          <Text className={styles.sectionTitle}>📋 献血人信息</Text>
        </View>
        <View className={styles.infoGrid}>
          <View className={styles.infoItem}>
            <Text className={styles.label}>姓名</Text>
            <Text className={styles.value}>{record.donorName}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.label}>血型</Text>
            <View className={classnames(styles.bloodTypeBadge, styles[`type${record.bloodType}`])}>
              {record.bloodType}型
            </View>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.label}>身份证号</Text>
            <Text className={styles.value}>{maskIdCard(record.idCard || '')}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.label}>手机号</Text>
            <Text className={styles.value}>{maskPhone(record.phone || '')}</Text>
          </View>
        </View>

        <View className={styles.divider} />

        <View className={styles.infoSection}>
          <Text className={styles.sectionTitle}>🏢 单位信息</Text>
        </View>
        <View className={styles.infoGrid}>
          <View className={styles.infoItem}>
            <Text className={styles.label}>所属单位</Text>
            <Text className={styles.value}>{record.orgName}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.label}>额度来源</Text>
            <View className={classnames(styles.quotaBadge, record.type)}>
              {record.type === 'quota' ? '指标额度' : '自费申请'}
            </View>
          </View>
          {record.selfpayApplyNo && (
            <>
              <View className={styles.infoItem}>
                <Text className={styles.label}>申请单号</Text>
                <Text className={styles.value}>{record.selfpayApplyNo}</Text>
              </View>
              <View className={styles.infoItem}>
                <Text className={styles.label}>审批状态</Text>
                {record.selfpayStatus && (
                  <View className={classnames(styles.statusBadge, record.selfpayStatus)}>
                    {getStatusText(record.selfpayStatus)}
                  </View>
                )}
              </View>
            </>
          )}
        </View>

        <View className={styles.divider} />

        <View className={styles.infoSection}>
          <Text className={styles.sectionTitle}>🩸 献血信息</Text>
        </View>
        <View className={styles.infoGrid}>
          <View className={styles.infoItem}>
            <Text className={styles.label}>献血日期</Text>
            <Text className={styles.value}>{record.donateDate}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.label}>登记时间</Text>
            <Text className={styles.value}>{registerTime}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.label}>献血数量</Text>
            <Text className={styles.value}>{record.amount} 份</Text>
          </View>
          {record.daysSinceLastDonate !== undefined && record.daysSinceLastDonate > 0 && (
            <View className={styles.infoItem}>
              <Text className={styles.label}>距上次献血</Text>
              <Text className={styles.value}>{record.daysSinceLastDonate} 天</Text>
            </View>
          )}
          {record.batchNo && (
            <View className={styles.infoItem}>
              <Text className={styles.label}>关联批次</Text>
              <Text className={styles.value}>{record.batchNo}</Text>
            </View>
          )}
          <View className={styles.infoItem}>
            <Text className={styles.label}>操作人</Text>
            <Text className={styles.value}>{record.operator}</Text>
          </View>
        </View>

        <View className={styles.divider} />

        <View className={styles.infoSection}>
          <Text className={styles.sectionTitle}>✅ 合规校验</Text>
        </View>
        <View style={{ padding: '0 32rpx 32rpx' }}>
          <View className={classnames(styles.intervalBadge, intervalValid ? styles.valid : styles.invalid)}>
            {intervalValid ? '✅ 满足180天间隔' : `❌ 未满180天（差${daysDiff}天）`}
          </View>
          <Text className={styles.complianceText}>
            献血时间隔{intervalValid ? '≥180天' : `差${daysDiff}天`}，{intervalValid ? '符合' : '不符合'}《献血法》规定。
          </Text>
        </View>

        <View className={styles.divider} />

        <View className={styles.qrPlaceholder}>
          <Text className={styles.qrIcon}>📱</Text>
          <Text className={styles.qrText}>扫码验证</Text>
        </View>
        <Text className={styles.qrTip}>📱 扫码可验证真伪</Text>

        <View className={styles.footerText}>
          本凭证由无偿献血管理系统自动生成 · {generateDate}
        </View>
      </View>
    </View>
  );
};

export default DonateCertificatePage;
