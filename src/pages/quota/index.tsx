import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store';
import styles from './index.module.scss';
import QuotaCard from '@/components/QuotaCard';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import classnames from 'classnames';
import type { QuotaCycle } from '@/types';
import { generateOrderNo, formatDate } from '@/utils';

type TabType = 'quota' | 'distribute' | 'selfpay';
type FilterType = 'all' | 'normal' | 'warning' | 'exhausted';

const QuotaPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('quota');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'distribute' | 'reset'>('distribute');
  const [formData, setFormData] = useState({
    orgId: 'ORG001',
    orgName: '市第一人民医院',
    amount: 50,
    cycle: 'monthly' as QuotaCycle,
    remark: ''
  });

  const {
    quotaList,
    quotaDistributionRecords,
    selfpayApplications,
    distributeQuota,
    resetCycleQuota,
    currentOrgId,
    setCurrentOrgId
  } = useAppStore();

  const filteredQuota = useMemo(() => {
    let list = quotaList;
    if (filter === 'warning') {
      list = list.filter(q => q.remainingQuota > 0 && (q.usedQuota / q.totalQuota) >= 0.7);
    } else if (filter === 'exhausted') {
      list = list.filter(q => q.remainingQuota === 0);
    } else if (filter === 'normal') {
      list = list.filter(q => (q.usedQuota / q.totalQuota) < 0.7);
    }
    return list;
  }, [quotaList, filter]);

  const orgOptions = useMemo(() => {
    return quotaList.map(q => ({ id: q.orgId, name: q.orgName }));
  }, [quotaList]);

  const handleDistribute = () => {
    console.log('[Quota] 发放额度:', formData);
    if (formData.amount <= 0) {
      Taro.showToast({ title: '请输入有效额度', icon: 'none' });
      return;
    }
    distributeQuota({
      id: generateOrderNo('QD'),
      orgId: formData.orgId,
      orgName: formData.orgName,
      quotaAmount: formData.amount,
      cycle: formData.cycle,
      distributeDate: formatDate(new Date()),
      operator: '管理员',
      remark: formData.remark || '系统发放'
    });
    Taro.showToast({ title: '发放成功', icon: 'success' });
    setShowModal(false);
  };

  const handleReset = (orgId: string, orgName: string) => {
    console.log('[Quota] 重置周期额度:', orgId);
    Taro.showModal({
      title: '确认重置',
      content: `确定重置「${orgName}」的周期额度吗？重置后已用额度清零，剩余额度恢复为总额度，不累加历史额度。`,
      confirmColor: '#E53935',
      success: (res) => {
        if (res.confirm) {
          resetCycleQuota(orgId);
          Taro.showToast({ title: '重置成功', icon: 'success' });
        }
      }
    });
  };

  const openDistributeModal = () => {
    setModalType('distribute');
    setShowModal(true);
  };

  const handleQuotaClick = (orgId: string) => {
    setCurrentOrgId(orgId);
  };

  const handleSelfpayClick = (applyId: string, status: string) => {
    if (status === 'pending') {
      Taro.showActionSheet({
        itemList: ['通过申请', '拒绝申请', '查看详情'],
        success: (res) => {
          if (res.tapIndex === 0) {
            useAppStore.getState().approveSelfpayApply(applyId, '管理员');
            Taro.showToast({ title: '已通过', icon: 'success' });
          } else if (res.tapIndex === 1) {
            Taro.showToast({ title: '已拒绝', icon: 'none' });
          }
        }
      });
    }
  };

  const tabs = [
    { key: 'quota', label: '额度管理' },
    { key: 'distribute', label: '发放记录' },
    { key: 'selfpay', label: '自费申请' }
  ];

  const filters = [
    { key: 'all', label: '全部' },
    { key: 'normal', label: '正常' },
    { key: 'warning', label: '预警(≥70%)' },
    { key: 'exhausted', label: '已用完' }
  ];

  return (
    <View className={styles.quotaPage}>
      <View className={styles.tabBar}>
        {tabs.map(tab => (
          <View
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
            onClick={() => setActiveTab(tab.key as TabType)}
          >
            <Text>{tab.label}</Text>
          </View>
        ))}
      </View>

      {activeTab === 'quota' && (
        <View>
          <View className={styles.filterRow}>
            {filters.map(f => (
              <View
                key={f.key}
                className={classnames(styles.filterItem, filter === f.key && styles.active)}
                onClick={() => setFilter(f.key as FilterType)}
              >
                <Text>{f.label}</Text>
              </View>
            ))}
          </View>

          <View className={styles.actionBar}>
            <Button className={classnames(styles.btn, styles.primary)} onClick={openDistributeModal}>
              ＋ 额度发放
            </Button>
            <Button
              className={classnames(styles.btn, styles.secondary)}
              onClick={() => Taro.navigateTo({ url: '/pages/selfpay-apply/index' })}
            >
              自费申请
            </Button>
          </View>

          <ScrollView scrollY>
            {filteredQuota.length > 0 ? (
              <View>
                {filteredQuota.map(quota => (
                  <View key={quota.id} onClick={() => handleQuotaClick(quota.orgId)}>
                    <QuotaCard quota={quota} />
                    <View style={{
                      display: 'flex',
                      gap: '16rpx',
                      marginTop: '-16rpx',
                      marginBottom: '24rpx',
                      padding: '0 16rpx'
                    }}>
                      <Button
                        style={{
                          flex: 1,
                          height: '64rpx',
                          fontSize: '24rpx',
                          background: 'rgba(25, 118, 210, 0.1)',
                          color: '#1976D2',
                          borderRadius: '32rpx',
                          fontWeight: '500',
                          lineHeight: '60rpx'
                        }}
                        onClick={(e) => { e.stopPropagation(); handleReset(quota.orgId, quota.orgName); }}
                      >
                        🔄 周期重置
                      </Button>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState text="暂无额度数据" subText="点击上方按钮发放额度" icon="📊" />
            )}
          </ScrollView>
        </View>
      )}

      {activeTab === 'distribute' && (
        <ScrollView scrollY>
          <SectionHeader title="发放记录" subTitle={`${quotaDistributionRecords.length}条`} />
          <View className={styles.distributionList}>
            {quotaDistributionRecords.length > 0 ? (
              quotaDistributionRecords.map(record => (
                <View key={record.id} className={styles.distCard}>
                  <View className={styles.distHeader}>
                    <Text className={styles.amount}>＋{record.quotaAmount} 份</Text>
                    <Text className={styles.date}>{record.distributeDate}</Text>
                  </View>
                  <View className={styles.distBody}>
                    <Text className={styles.org}>{record.orgName}</Text>
                    <Text style={{
                      fontSize: '24rpx',
                      padding: '4rpx 12rpx',
                      borderRadius: '8rpx',
                      background: 'rgba(229, 57, 53, 0.1)',
                      color: '#E53935',
                      fontWeight: '500'
                    }}>
                      {record.cycle === 'monthly' ? '月度' : record.cycle === 'quarterly' ? '季度' : '年度'}
                    </Text>
                  </View>
                  <View style={{
                    marginTop: '12rpx',
                    fontSize: '22rpx',
                    color: '#86909C',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <Text>发放人：{record.operator}</Text>
                    {record.remark && <Text>备注：{record.remark}</Text>}
                  </View>
                </View>
              ))
            ) : (
              <EmptyState text="暂无发放记录" />
            )}
          </View>
        </ScrollView>
      )}

      {activeTab === 'selfpay' && (
        <ScrollView scrollY>
          <SectionHeader
            title="自费申请列表"
            subTitle={`${selfpayApplications.length}条`}
            showArrow
            actionText="发起申请"
            onActionClick={() => Taro.navigateTo({ url: '/pages/selfpay-apply/index' })}
          />
          <View>
            {selfpayApplications.length > 0 ? (
              selfpayApplications.map(apply => (
                <View
                  key={apply.id}
                  style={{
                    background: '#fff',
                    borderRadius: '16rpx',
                    padding: '32rpx',
                    marginBottom: '16rpx',
                    boxShadow: '0 2rpx 12rpx rgba(0,0,0,0.06)'
                  }}
                  onClick={() => handleSelfpayClick(apply.id, apply.status)}
                >
                  <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16rpx' }}>
                    <Text style={{ fontSize: '28rpx', fontWeight: '600' }}>{apply.applyNo}</Text>
                    <View style={{
                      padding: '4rpx 16rpx',
                      borderRadius: '8rpx',
                      fontSize: '22rpx',
                      fontWeight: '500',
                      background: apply.status === 'pending'
                        ? 'rgba(25, 118, 210, 0.12)'
                        : apply.status === 'approved'
                        ? 'rgba(0, 180, 42, 0.12)'
                        : 'rgba(245, 63, 63, 0.12)',
                      color: apply.status === 'pending'
                        ? '#1976D2'
                        : apply.status === 'approved'
                        ? '#00B42A'
                        : '#F53F3F'
                    }}>
                      {apply.status === 'pending' ? '待审批' : apply.status === 'approved' ? '已通过' : '已拒绝'}
                    </View>
                  </View>
                  <View style={{ fontSize: '26rpx', color: '#4E5969', marginBottom: '8rpx' }}>
                    <Text>{apply.orgName}</Text>
                    <Text style={{ marginLeft: '16rpx' }}>申请人：{apply.applicant}</Text>
                  </View>
                  <View style={{ fontSize: '26rpx', color: '#4E5969', marginBottom: '8rpx' }}>
                    <Text>超额数量：<Text style={{ color: '#E53935', fontWeight: '600' }}>{apply.exceedCount}份</Text></Text>
                    <Text style={{ marginLeft: '16rpx', color: '#86909C' }}>{apply.applyDate}</Text>
                  </View>
                  <View style={{ fontSize: '24rpx', color: '#86909C', lineHeight: 1.5 }}>
                    申请原因：{apply.reason}
                  </View>
                  {apply.approver && (
                    <View style={{
                      marginTop: '16rpx',
                      paddingTop: '16rpx',
                      borderTop: '1rpx solid #F2F3F5',
                      fontSize: '22rpx',
                      color: '#86909C'
                    }}>
                      <Text>审批人：{apply.approver}</Text>
                      <Text style={{ marginLeft: '16rpx' }}>{apply.approvalDate}</Text>
                      {apply.approvalRemark && <Text style={{ display: 'block', marginTop: '4rpx' }}>审批意见：{apply.approvalRemark}</Text>}
                    </View>
                  )}
                </View>
              ))
            ) : (
              <EmptyState text="暂无自费申请" />
            )}
          </View>
        </ScrollView>
      )}

      {showModal && (
        <View className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <View className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <Text className={styles.modalTitle}>额度发放</Text>

            <View className={styles.formItem}>
              <Text className={styles.label}>选择单位</Text>
              <View className={styles.pickerRow}>
                {orgOptions.map(opt => (
                  <View
                    key={opt.id}
                    className={classnames(styles.pickerItem, formData.orgId === opt.id && styles.active)}
                    onClick={() => setFormData({ ...formData, orgId: opt.id, orgName: opt.name })}
                  >
                    <Text>{opt.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.label}>发放额度（份）</Text>
              <View className={styles.input}>
                <Text>{formData.amount}</Text>
                <View style={{ marginLeft: 'auto', display: 'flex', gap: '16rpx' }}>
                  <View
                    style={{
                      width: '56rpx', height: '56rpx',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '50%',
                      background: formData.amount > 0 ? 'rgba(229, 57, 53, 0.1)' : '#F2F3F5',
                      color: formData.amount > 0 ? '#E53935' : '#86909C',
                      fontSize: '32rpx', fontWeight: '600'
                    }}
                    onClick={() => setFormData({ ...formData, amount: Math.max(0, formData.amount - 10) })}
                  >-</View>
                  <View
                    style={{
                      width: '56rpx', height: '56rpx',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '50%',
                      background: 'rgba(229, 57, 53, 0.1)',
                      color: '#E53935',
                      fontSize: '32rpx', fontWeight: '600'
                    }}
                    onClick={() => setFormData({ ...formData, amount: formData.amount + 10 })}
                  >+</View>
                </View>
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.label}>周期类型</Text>
              <View className={styles.pickerRow}>
                {([
                  { key: 'monthly', label: '月度' },
                  { key: 'quarterly', label: '季度' },
                  { key: 'yearly', label: '年度' }
                ] as { key: QuotaCycle; label: string }[]).map(opt => (
                  <View
                    key={opt.key}
                    className={classnames(styles.pickerItem, formData.cycle === opt.key && styles.active)}
                    onClick={() => setFormData({ ...formData, cycle: opt.key })}
                  >
                    <Text>{opt.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.modalActions}>
              <Button className={classnames(styles.btn, styles.cancel)} onClick={() => setShowModal(false)}>取消</Button>
              <Button className={classnames(styles.btn, styles.confirm)} onClick={handleDistribute}>确认发放</Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default QuotaPage;
