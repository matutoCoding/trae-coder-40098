import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store';
import styles from './index.module.scss';
import { isDonateIntervalValid, getBloodTypeColor } from '@/utils';
import dayjs from 'dayjs';
import classnames from 'classnames';
import type { ApplyStatus, ConsumptionRecord, Donor } from '@/types';

const DonorDetailPage: React.FC = () => {
  const router = Taro.useRouter();
  const { id, idCard } = router.params;

  const { donors, consumptionRecords, getDonorByIdCard } = useAppStore();

  const donor = useMemo<Donor | undefined>(() => {
    if (id) {
      const foundById = donors.find(d => d.id === id);
      if (foundById) return foundById;
    }
    if (idCard) {
      return getDonorByIdCard(idCard);
    }
    return undefined;
  }, [id, idCard, donors, getDonorByIdCard]);

  const donorHistory = useMemo<ConsumptionRecord[]>(() => {
    if (!donor) return [];
    const list = consumptionRecords.filter(
      r => r.donorId === donor.id || (donor.idCard && r.idCard === donor.idCard)
    );
    return list.sort(
      (a, b) => dayjs(b.donateDate).valueOf() - dayjs(a.donateDate).valueOf()
    );
  }, [donor, consumptionRecords]);

  const firstDonateDate = useMemo(() => {
    if (donorHistory.length === 0) return '-';
    return donorHistory[donorHistory.length - 1].donateDate;
  }, [donorHistory]);

  const intervalCheck = useMemo(() => {
    if (!donor?.lastDonateDate) return { valid: true, days: -1 };
    return isDonateIntervalValid(donor.lastDonateDate);
  }, [donor]);

  const renderDaysBadge = () => {
    const { valid, days } = intervalCheck;
    if (days < 0) {
      return (
        <View className={classnames(styles.daysBadge, styles.valid)}>
          ✅ 首次献血，无间隔要求
        </View>
      );
    }
    if (valid) {
      return (
        <View className={classnames(styles.daysBadge, styles.valid)}>
          ✅ 满足献血间隔（已{days}天）
        </View>
      );
    }
    const remain = 180 - days;
    if (remain <= 30) {
      return (
        <View className={classnames(styles.daysBadge, styles.danger)}>
          🚫 未满180天（差{remain}天）
        </View>
      );
    }
    return (
      <View className={classnames(styles.daysBadge, styles.warn)}>
        ⏳ 还差{remain}天
      </View>
    );
  };

  const getStatusText = (status?: ApplyStatus) => {
    const map: Record<ApplyStatus, string> = {
      approved: '已通过',
      pending: '审批中',
      rejected: '已拒绝'
    };
    return status ? map[status] : '';
  };

  const handleGoConsumption = (recordId: string) => {
    Taro.switchTab({ url: '/pages/consumption/index' });
  };

  const handleGoBack = () => {
    if (donor?.idCard) {
      Taro.redirectTo({
        url: '/pages/donate-register/index?prefillIdCard=' + encodeURIComponent(donor.idCard) + '&prefillName=' + encodeURIComponent(donor.name)
      });
    } else {
      Taro.navigateBack({ delta: 1 }).catch(() => {
        Taro.redirectTo({ url: '/pages/donate-register/index' });
      });
    }
  };

  const maskIdCard = (id: string) => {
    if (!id || id.length < 8) return id || '-';
    return id.substring(0, 6) + '********' + id.substring(id.length - 4);
  };

  if (!donor) {
    return (
      <View className={styles.donorDetail}>
        <View className={styles.emptyProfile}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyTitle}>未找到献血人档案</Text>
          <Text className={styles.emptyDesc}>
            可能是档案编号或身份证号有误，{'\n'}请返回登记页重新查询。
          </Text>
          <View className={styles.bottomBar} style={{ position: 'relative', padding: 0, boxShadow: 'none', background: 'transparent' }}>
            <View className={styles.actionBtn} onClick={handleGoBack}>
              ✎ 返回登记页继续献血
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.donorDetail}>
      <View className={styles.headerCard}>
        <View className={styles.avatarRow}>
          <View className={styles.avatar}>
            {donor.name ? donor.name.charAt(0) : '👤'}
          </View>
          <View className={styles.infoColumn}>
            <View className={styles.nameRow}>
              <Text className={styles.name}>{donor.name}</Text>
              <View
                className={classnames(styles.infoTag, styles.bloodType)}
                style={{
                  background: `linear-gradient(135deg, ${getBloodTypeColor(donor.bloodType)} 0%, ${getBloodTypeColor(donor.bloodType)}dd 100%)`
                }}
              >
                {donor.bloodType}型
              </View>
              <View className={classnames(styles.infoTag, styles.profileId)}>
                档案 {donor.id}
              </View>
            </View>
          </View>
        </View>

        <View className={styles.countRow}>
          <View className={styles.countItem}>
            <View className={styles.left}>
              <Text>🩸</Text>
              <Text>累计献血</Text>
            </View>
            <Text className={styles.num}>{donor.donateCount} 次</Text>
          </View>
          <View className={styles.countItem}>
            <View className={styles.left}>
              <Text>📅</Text>
              <Text>距离下次可献血</Text>
            </View>
            {renderDaysBadge()}
          </View>
        </View>
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.icon}>📋</Text>
          基本信息
        </Text>
        <View className={styles.infoGrid}>
          <View className={styles.infoItem}>
            <Text className={styles.label}>姓名</Text>
            <Text className={styles.value}>{donor.name}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.label}>身份证号</Text>
            <Text className={styles.value}>{maskIdCard(donor.idCard)}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.label}>手机号</Text>
            <Text className={styles.value}>{donor.phone}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.label}>血型</Text>
            <Text className={classnames(styles.value, styles.highlight)} style={{ color: getBloodTypeColor(donor.bloodType) }}>
              {donor.bloodType}型
            </Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.label}>首次献血</Text>
            <Text className={styles.value}>{firstDonateDate}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.label}>最近一次献血</Text>
            <Text className={classnames(styles.value, donor.lastDonateDate && styles.highlight)}>
              {donor.lastDonateDate || '-'}
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.icon}>📜</Text>
          献血历史记录（{donorHistory.length}条）
        </Text>

        {donorHistory.length === 0 ? (
          <View className={styles.emptyHistory}>
            <Text className={styles.emptyIcon}>📭</Text>
            <Text className={styles.emptyText}>暂无献血记录，快去完成第一次献血吧！</Text>
          </View>
        ) : (
          <View className={styles.historyList}>
            {donorHistory.map(record => {
              const daysPassed = record.daysSinceLastDonate ?? 0;
              const intervalOk = daysPassed === 0 || daysPassed >= 180;

              return (
                <View
                  key={record.id}
                  className={styles.historyItem}
                  onClick={() => handleGoConsumption(record.id)}
                >
                  <View className={styles.itemHeader}>
                    <Text className={styles.donateDate}>{record.donateDate}</Text>
                    <View className={classnames(styles.intervalBadge, intervalOk ? styles.passed : styles.failed)}>
                      {intervalOk ? '✅ 间隔合规' : `⚠️ 间隔${daysPassed}天未到180`}
                    </View>
                  </View>
                  <View className={styles.itemMeta}>
                    <View className={styles.metaRow}>
                      <View className={styles.metaItem}>
                        <Text className={styles.mLabel}>所属单位：</Text>
                        <Text>{record.orgName}</Text>
                      </View>
                      <View className={styles.metaItem}>
                        <Text className={styles.mLabel}>血型：</Text>
                        <Text>{record.bloodType}型</Text>
                      </View>
                      <View className={styles.metaItem}>
                        <Text className={styles.mLabel}>消费类型：</Text>
                        <Text>{record.type === 'quota' ? '指标额度' : '自费'}</Text>
                      </View>
                    </View>
                    {record.daysSinceLastDonate !== undefined && record.daysSinceLastDonate > 0 && (
                      <View className={styles.metaRow}>
                        <View className={styles.metaItem}>
                          <Text className={styles.mLabel}>距上次献血：</Text>
                          <Text>{record.daysSinceLastDonate}天</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {record.selfpayApplyNo && (
                    <View className={styles.applyRow}>
                      <Text className={styles.applyNo}>
                        申请单号：{record.selfpayApplyNo}
                      </Text>
                      {record.selfpayStatus && (
                        <View className={classnames(styles.statusBadge, record.selfpayStatus)}>
                          {getStatusText(record.selfpayStatus)}
                        </View>
                      )}
                    </View>
                  )}

                  <Text className={styles.viewDetail}>
                    查看消费明细 →
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />

      <View className={styles.bottomBar}>
        <View className={styles.actionBtn} onClick={handleGoBack}>
          ✎ 返回登记页继续献血
        </View>
      </View>
    </View>
  );
};

export default DonorDetailPage;
