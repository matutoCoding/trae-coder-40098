import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store';
import styles from './index.module.scss';
import StatCard from '@/components/StatCard';
import SectionHeader from '@/components/SectionHeader';
import BatchCard from '@/components/BatchCard';
import { formatDate } from '@/utils';
import StatusTag from '@/components/StatusTag';

const HomePage: React.FC = () => {
  const {
    currentOrgId,
    getDashboardStats,
    getQuotaByOrgId,
    getExpiringBatches,
    getFifoRecommendedBatches,
    selfpayApplications
  } = useAppStore();

  const stats = useMemo(() => getDashboardStats(), [getDashboardStats]);
  const currentQuota = useMemo(() => getQuotaByOrgId(currentOrgId), [getQuotaByOrgId, currentOrgId]);
  const expiringBatches = useMemo(() => getExpiringBatches(), [getExpiringBatches]);
  const fifoRecommend = useMemo(() => getFifoRecommendedBatches().slice(0, 2), [getFifoRecommendedBatches]);
  const pendingSelfpay = useMemo(
    () => selfpayApplications.filter(a => a.status === 'pending'),
    [selfpayApplications]
  );

  const quickActions = [
    { icon: '🩸', label: '献血登记', iconClass: styles.icon1, path: '/pages/donate-register/index' },
    { icon: '📦', label: '批次登记', iconClass: styles.icon2, path: '/pages/batch-register/index' },
    { icon: '🚚', label: '出库登记', iconClass: styles.icon3, path: '/pages/outbound-register/index' },
    { icon: '📋', label: '自费申请', iconClass: styles.icon4, path: '/pages/selfpay-apply/index' }
  ];

  const handleQuickAction = (path: string) => {
    console.log('[Home] 点击快捷入口:', path);
    Taro.navigateTo({ url: path }).catch(err => {
      console.error('[Home] 跳转失败:', err);
      Taro.showToast({ title: '功能开发中', icon: 'none' });
    });
  };

  const handleRefresh = () => {
    console.log('[Home] 下拉刷新');
    setTimeout(() => {
      Taro.stopPullDownRefresh();
      Taro.showToast({ title: '刷新成功', icon: 'success' });
    }, 800);
  };

  Taro.usePullDownRefresh(handleRefresh);

  return (
    <ScrollView scrollY className={styles.homePage}>
      <View className={styles.heroSection}>
        <Text className={styles.greeting}>
          欢迎来到<Text className={styles.highlight}>无偿献血</Text>
        </Text>
        <Text className={styles.subGreeting}>
          {currentQuota?.orgName || '市第一人民医院'} · {formatDate(new Date(), 'YYYY年MM月DD日')}
        </Text>
      </View>

      <View className={styles.statsGrid}>
        <StatCard
          label="剩余额度"
          value={stats.remainingQuota}
          unit="份"
          color="#E53935"
          trend={`${stats.quotaUsageRate}%使用率`}
        />
        <StatCard
          label="本月献血"
          value={stats.monthlyDonations}
          unit="人次"
          color="#1976D2"
          trend="+8 较上月"
        />
        <StatCard
          label="血液批次"
          value={stats.totalBatches}
          unit="批"
          color="#00B42A"
        />
        <StatCard
          label="出库次数"
          value={stats.totalOutbound}
          unit="次"
          color="#FF7D00"
        />
      </View>

      {(expiringBatches.length > 0 || pendingSelfpay.length > 0) && (
        <View className={styles.alertBanner}>
          <Text className={styles.alertIcon}>⚠️</Text>
          <View className={styles.alertContent}>
            <Text className={styles.alertTitle}>重要提醒</Text>
            <Text className={styles.alertText}>
              {expiringBatches.length > 0 && `有${expiringBatches.length}批血液即将过期，请优先出库。`}
              {expiringBatches.length > 0 && pendingSelfpay.length > 0 && ' '}
              {pendingSelfpay.length > 0 && `${pendingSelfpay.length}份自费申请待审批。`}
            </Text>
          </View>
          <Text className={styles.alertBage}>
            {expiringBatches.length + pendingSelfpay.length}
          </Text>
        </View>
      )}

      <View className={styles.quickActions}>
        <View className={styles.grid}>
          {quickActions.map((item, idx) => (
            <View
              key={idx}
              className={styles.actionItem}
              onClick={() => handleQuickAction(item.path)}
            >
              <View className={`${styles.icon} ${item.iconClass}`}>
                <Text>{item.icon}</Text>
              </View>
              <Text className={styles.actionLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <SectionHeader
        title="临期预警"
        subTitle={`${expiringBatches.length}批`}
        showArrow={expiringBatches.length > 0}
        onActionClick={() => Taro.switchTab({ url: '/pages/batch/index' })}
      />

      {expiringBatches.length > 0 ? (
        <View>
          {expiringBatches.slice(0, 2).map(batch => (
            <BatchCard key={batch.id} batch={batch} />
          ))}
        </View>
      ) : (
        <View style={{
          padding: '48rpx 32rpx',
          textAlign: 'center',
          background: '#fff',
          borderRadius: '16rpx',
          boxShadow: '0 2rpx 12rpx rgba(0,0,0,0.06)'
        }}>
          <Text style={{ fontSize: '48rpx' }}>✅</Text>
          <Text style={{ display: 'block', marginTop: '16rpx', color: '#4E5969', fontSize: '28rpx' }}>暂无临期批次</Text>
        </View>
      )}

      <SectionHeader
        title="FIFO优先出库"
        subTitle="先进先出推荐"
        showArrow={fifoRecommend.length > 0}
        onActionClick={() => Taro.navigateTo({ url: '/pages/outbound/index' })}
      />

      {fifoRecommend.length > 0 ? (
        <View>
          {fifoRecommend.map(batch => (
            <BatchCard key={batch.id} batch={batch} showFifoBadge />
          ))}
        </View>
      ) : null}

      <SectionHeader
        title="额度概览"
        showArrow
        onActionClick={() => Taro.switchTab({ url: '/pages/quota/index' })}
      />

      <View className={styles.sectionList}>
        {currentQuota && (
          <View
            className={styles.listItem}
            onClick={() => Taro.switchTab({ url: '/pages/quota/index' })}
          >
            <View className={styles.itemIcon} style={{ background: 'rgba(229, 57, 53, 0.1)' }}>
              <Text>📊</Text>
            </View>
            <View className={styles.itemBody}>
              <Text className={styles.itemTitle}>{currentQuota.orgName}</Text>
              <Text className={styles.itemSub}>
                周期 {formatDate(currentQuota.cycleStart)} ~ {formatDate(currentQuota.cycleEnd)}
              </Text>
            </View>
            <View className={styles.itemExtra}>
              <Text className={styles.itemValue}>{currentQuota.remainingQuota}</Text>
              <Text className={styles.itemLabel}>剩余额度</Text>
            </View>
            <Text className={styles.arrow}>›</Text>
          </View>
        )}

        {pendingSelfpay.length > 0 && (
          <View
            className={styles.listItem}
            onClick={() => Taro.navigateTo({ url: '/pages/selfpay-apply/index' })}
          >
            <View className={styles.itemIcon} style={{ background: 'rgba(255, 125, 0, 0.1)' }}>
              <Text>📝</Text>
            </View>
            <View className={styles.itemBody}>
              <Text className={styles.itemTitle}>待审批申请</Text>
              <Text className={styles.itemSub}>自费额度申请</Text>
            </View>
            <View className={styles.itemExtra}>
              <Text className={styles.itemValue} style={{ color: '#FF7D00' }}>
                {pendingSelfpay.length}
              </Text>
              <Text className={styles.itemLabel}>条待审</Text>
            </View>
            <Text className={styles.arrow}>›</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default HomePage;
