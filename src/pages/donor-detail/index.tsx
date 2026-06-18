import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store';
import styles from './index.module.scss';
import { isDonateIntervalValid, getBloodTypeColor } from '@/utils';
import dayjs from 'dayjs';
import classnames from 'classnames';
import type { ApplyStatus, ConsumptionRecord, Donor, SelfpayApply } from '@/types';

type TimelineEventType = 'consumption' | 'selfpay';
type TimelineEventSubType =
  | 'quota'
  | 'selfpay-pending'
  | 'selfpay-approved'
  | 'selfpay-rejected'
  | 'pending'
  | 'approved'
  | 'rejected';

interface TimelineEvent {
  time: string;
  type: TimelineEventType;
  subType: TimelineEventSubType;
  id: string;
  payload: ConsumptionRecord | SelfpayApply;
}

interface EventConfig {
  icon: string;
  title: string;
  color: string;
}

const EVENT_CONFIG: Record<TimelineEventSubType, EventConfig> = {
  'quota': { icon: '🩸', title: '献血登记（指标额度）', color: '#2E7D32' },
  'selfpay-pending': { icon: '🕒', title: '自费献血（待审批）', color: '#F57C00' },
  'selfpay-approved': { icon: '✅', title: '自费献血（已通过）', color: '#1976D2' },
  'selfpay-rejected': { icon: '❌', title: '自费献血（已驳回）', color: '#C62828' },
  'pending': { icon: '📝', title: '自费申请提交（待审批）', color: '#F57C00' },
  'approved': { icon: '✅', title: '自费申请已通过', color: '#2E7D32' },
  'rejected': { icon: '❌', title: '自费申请已驳回', color: '#C62828' },
};

type TabType = 'all' | 'donation' | 'application';

const TAB_LIST: { key: TabType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'donation', label: '献血记录' },
  { key: 'application', label: '申请记录' },
];

const DonorDetailPage: React.FC = () => {
  const router = Taro.useRouter();
  const { id, idCard } = router.params;

  const { donors, consumptionRecords, selfpayApplications, getDonorByIdCard } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');

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

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    if (!donor) return [];

    const consumptionEvents: TimelineEvent[] = consumptionRecords
      .filter(r => r.donorId === donor.id || (donor.idCard && r.idCard === donor.idCard))
      .map(record => {
        let subType: TimelineEventSubType = 'quota';
        if (record.type === 'selfpay') {
          if (record.selfpayStatus === 'pending') subType = 'selfpay-pending';
          else if (record.selfpayStatus === 'approved') subType = 'selfpay-approved';
          else if (record.selfpayStatus === 'rejected') subType = 'selfpay-rejected';
        }
        return {
          time: record.donateDate,
          type: 'consumption',
          subType,
          id: record.id,
          payload: record
        };
      });

    const selfpayEvents: TimelineEvent[] = selfpayApplications
      .filter(apply =>
        (donor.idCard && apply.donorIdCard === donor.idCard) ||
        (donor.name && apply.donorName === donor.name)
      )
      .map(apply => ({
        time: apply.applyDate,
        type: 'selfpay',
        subType: apply.status as TimelineEventSubType,
        id: apply.id,
        payload: apply
      }));

    return [...consumptionEvents, ...selfpayEvents].sort(
      (a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf()
    );
  }, [donor, consumptionRecords, selfpayApplications]);

  const filteredEvents = useMemo<TimelineEvent[]>(() => {
    if (activeTab === 'all') return timelineEvents;
    if (activeTab === 'donation') return timelineEvents.filter(e => e.type === 'consumption');
    if (activeTab === 'application') return timelineEvents.filter(e => e.type === 'selfpay');
    return timelineEvents;
  }, [timelineEvents, activeTab]);

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

  const handleViewCertificate = (e: React.MouseEvent, record: ConsumptionRecord) => {
    e.stopPropagation();
    Taro.navigateTo({
      url: `/pages/donate-certificate/index?consumptionId=${record.id}`
    });
  };

  const handleViewDetail = (e: React.MouseEvent, event: TimelineEvent) => {
    e.stopPropagation();
    if (event.type === 'consumption') {
      const record = event.payload as ConsumptionRecord;
      Taro.navigateTo({
        url: `/pages/donate-certificate/index?consumptionId=${record.id}`
      });
    } else {
      const apply = event.payload as SelfpayApply;
      Taro.navigateTo({
        url: `/pages/selfpay-detail/index?id=${apply.id}`
      });
    }
  };

  const handleEventClick = (event: TimelineEvent) => {
    if (event.type === 'consumption') {
      const record = event.payload as ConsumptionRecord;
      Taro.navigateTo({
        url: `/pages/donate-certificate/index?consumptionId=${record.id}`
      });
    } else {
      const apply = event.payload as SelfpayApply;
      Taro.navigateTo({
        url: `/pages/selfpay-detail/index?id=${apply.id}`
      });
    }
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
          全链路追踪时间轴（{timelineEvents.length}条）
        </Text>

        <ScrollView scrollX className={styles.tabScrollView}>
          <View className={styles.tabContainer}>
            {TAB_LIST.map(tab => (
              <View
                key={tab.key}
                className={classnames(styles.tabItem, activeTab === tab.key && styles.tabActive)}
                onClick={() => setActiveTab(tab.key)}
              >
                <Text>{tab.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {filteredEvents.length === 0 ? (
          <View className={styles.emptyHistory}>
            <Text className={styles.emptyIcon}>📭</Text>
            <Text className={styles.emptyText}>暂无记录</Text>
          </View>
        ) : (
          <View className={styles.timelineList}>
            {filteredEvents.map((event, index) => {
              const config = EVENT_CONFIG[event.subType];
              const isLast = index === filteredEvents.length - 1;
              const isConsumption = event.type === 'consumption';
              const record = isConsumption ? (event.payload as ConsumptionRecord) : null;
              const apply = !isConsumption ? (event.payload as SelfpayApply) : null;

              const daysPassed = record?.daysSinceLastDonate ?? 0;
              const intervalOk = daysPassed === 0 || daysPassed >= 180;

              return (
                <View key={event.id} className={styles.timelineItem}>
                  <View className={styles.timelineLine}>
                    <View
                      className={styles.timelineDot}
                      style={{ backgroundColor: config.color, borderColor: config.color }}
                    />
                    {!isLast && <View className={styles.timelineConnector} />}
                  </View>

                  <View
                    className={styles.timelineCard}
                    style={{ borderLeftColor: config.color }}
                    onClick={() => handleEventClick(event)}
                  >
                    <View className={styles.timelineHeader}>
                      <View className={styles.timelineTitleRow}>
                        <Text className={styles.timelineIcon}>{config.icon}</Text>
                        <Text className={styles.timelineTitle} style={{ color: config.color }}>
                          {config.title}
                        </Text>
                      </View>
                      <Text className={styles.timelineTime}>
                        {dayjs(event.time).format('YYYY-MM-DD HH:mm')}
                      </Text>
                    </View>

                    <View className={styles.timelineMeta}>
                      <View className={styles.metaRow}>
                        <View className={styles.metaItem}>
                          <Text className={styles.mLabel}>所属单位：</Text>
                          <Text>{record?.orgName || apply?.orgName || '-'}</Text>
                        </View>
                        <View className={styles.metaItem}>
                          <Text className={styles.mLabel}>血型：</Text>
                          <Text>{record?.bloodType || apply?.donorBloodType || '-'}型</Text>
                        </View>
                        <View className={styles.metaItem}>
                          <Text className={styles.mLabel}>额度来源：</Text>
                          <Text>
                            {record ? (record.type === 'quota' ? '指标额度' : '自费') : '自费申请'}
                          </Text>
                        </View>
                      </View>

                      {record && record.daysSinceLastDonate !== undefined && record.daysSinceLastDonate > 0 && (
                        <View className={styles.metaRow}>
                          <View className={styles.metaItem}>
                            <Text className={styles.mLabel}>距上次献血：</Text>
                            <Text>{record.daysSinceLastDonate}天</Text>
                          </View>
                          <View className={classnames(styles.intervalBadge, intervalOk ? styles.passed : styles.failed)}>
                            {intervalOk ? '✅ 间隔合规' : `⚠️ 间隔${daysPassed}天未到180`}
                          </View>
                        </View>
                      )}

                      {apply && apply.exceedCount !== undefined && (
                        <View className={styles.metaRow}>
                          <View className={styles.metaItem}>
                            <Text className={styles.mLabel}>超额度数：</Text>
                            <Text>{apply.exceedCount}次</Text>
                          </View>
                        </View>
                      )}

                      {apply && apply.reason && (
                        <View className={styles.metaRow}>
                          <View className={styles.metaItem}>
                            <Text className={styles.mLabel}>申请原因：</Text>
                            <Text>{apply.reason}</Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {(record?.selfpayApplyNo || apply?.applyNo) && (
                      <View className={styles.applyRow}>
                        <Text className={styles.applyNo}>
                          {record ? '消费关联申请' : '申请单号'}：{record?.selfpayApplyNo || apply?.applyNo}
                        </Text>
                        <View
                          className={classnames(
                            styles.statusBadge,
                            record?.selfpayStatus || apply?.status
                          )}
                        >
                          {getStatusText(record?.selfpayStatus || apply?.status)}
                        </View>
                      </View>
                    )}

                    {apply?.rejectReason && (
                      <View className={styles.rejectRow}>
                        <Text className={styles.rejectLabel}>驳回原因：</Text>
                        <Text className={styles.rejectText}>{apply.rejectReason}</Text>
                      </View>
                    )}

                    <View className={styles.actionRow}>
                      {isConsumption && record && record.id && (
                        <View
                          className={styles.actionBtnSecondary}
                          onClick={(e) => handleViewCertificate(e, record)}
                        >
                          <Text>📄 凭证</Text>
                        </View>
                      )}
                      <View
                        className={styles.actionBtnPrimary}
                        onClick={(e) => handleViewDetail(e, event)}
                      >
                        <Text>👁 查看详情</Text>
                      </View>
                    </View>
                  </View>
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
