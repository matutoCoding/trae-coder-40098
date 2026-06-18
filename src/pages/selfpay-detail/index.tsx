import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useAppStore } from '@/store';
import styles from './index.module.scss';
import classnames from 'classnames';
import dayjs from 'dayjs';
import type { ApplyStatus } from '@/types';

const statusConfig: Record<ApplyStatus, { label: string; icon: string }> = {
  pending: { label: '待审批', icon: '⏳' },
  approved: { label: '已通过', icon: '✅' },
  rejected: { label: '已驳回', icon: '❌' }
};

const SelfpayDetailPage: React.FC = () => {
  const router = useRouter();
  const applyId = router.params.id as string;

  const { selfpayApplications, approveSelfpayApply, rejectSelfpayApply, consumptionRecords } = useAppStore();

  const apply = useMemo(() => {
    return selfpayApplications.find(a => a.id === applyId);
  }, [selfpayApplications, applyId]);

  const linkedRecords = useMemo(() => {
    if (!apply) return [];
    return consumptionRecords.filter(r => r.selfpayApplyNo === apply.applyNo);
  }, [apply, consumptionRecords]);

  const handleReject = () => {
    Taro.showModal({
      title: '驳回申请',
      editable: true,
      placeholderText: '请输入驳回理由',
      success: (res) => {
        if (res.confirm) {
          const rejectReason = res.content?.trim() || '未填写驳回理由';
          rejectSelfpayApply(applyId, '审批管理员', rejectReason);
          Taro.showToast({ title: '已驳回', icon: 'success' });
          setTimeout(() => {
            Taro.navigateBack();
          }, 800);
        }
      }
    });
  };

  const handleApprove = () => {
    Taro.showModal({
      title: '确认通过',
      content: '确认通过该自费申请吗？通过后申请人可继续完成献血登记',
      confirmText: '确认通过',
      confirmColor: '#E53935',
      success: (res) => {
        if (res.confirm) {
          approveSelfpayApply(applyId, '审批管理员');
          Taro.showToast({ title: '已通过', icon: 'success' });
          setTimeout(() => {
            Taro.redirectTo({
              url: '/pages/donate-register/index?selfpayApplyId=' + applyId
            });
          }, 800);
        }
      }
    });
  };

  if (!apply) {
    return (
      <View className={styles.emptyWrap}>
        <Text className={styles.emptyIcon}>📋</Text>
        <Text className={styles.emptyText}>申请不存在</Text>
      </View>
    );
  }

  const status = apply.status as ApplyStatus;

  return (
    <View className={styles.detailPage}>
      <View className={styles.statusCard}>
        <View className={classnames(styles.statusBadge, styles[status])}>
          <Text className={styles.statusIcon}>{statusConfig[status].icon}</Text>
          <Text className={styles.statusLabel}>{statusConfig[status].label}</Text>
        </View>
        <View className={styles.applyInfoRow}>
          <View className={styles.applyInfoItem}>
            <Text className={styles.applyInfoLabel}>审批号</Text>
            <Text className={styles.applyInfoValue}>{apply.applyNo}</Text>
          </View>
          <View className={styles.applyInfoItem}>
            <Text className={styles.applyInfoLabel}>申请日期</Text>
            <Text className={styles.applyInfoValue}>{dayjs(apply.applyDate).format('YYYY-MM-DD')}</Text>
          </View>
        </View>
      </View>

      <View className={styles.formCard}>
        <Text className={styles.formTitle}>
          <Text className={styles.icon}>👤</Text>
          申请人信息
        </Text>
        <View className={styles.infoGrid}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>申请人</Text>
            <Text className={styles.infoValue}>{apply.applicant}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>联系电话</Text>
            <Text className={styles.infoValue}>{apply.applicantPhone || '-'}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>所属单位</Text>
            <Text className={styles.infoValue}>{apply.orgName}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>超指标数</Text>
            <Text className={classnames(styles.infoValue, styles.highlightValue)}>{apply.exceedCount} 人</Text>
          </View>
        </View>
      </View>

      <View className={styles.formCard}>
        <Text className={styles.formTitle}>
          <Text className={styles.icon}>🩸</Text>
          献血人信息
        </Text>
        <View className={styles.infoGrid}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>姓名</Text>
            <Text className={styles.infoValue}>{apply.donorName || '-'}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>血型</Text>
            <Text className={styles.infoValue}>{apply.donorBloodType ? `${apply.donorBloodType}型` : '-'}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>身份证号</Text>
            <Text className={styles.infoValue}>{apply.donorIdCard || '-'}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>手机号</Text>
            <Text className={styles.infoValue}>{apply.donorPhone || '-'}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>上次献血日期</Text>
            <Text className={styles.infoValue}>
              {apply.lastDonateDate ? dayjs(apply.lastDonateDate).format('YYYY-MM-DD') : '首次献血'}
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.formCard}>
        <Text className={styles.formTitle}>
          <Text className={styles.icon}>📝</Text>
          申请说明
        </Text>
        <View className={styles.textBlock}>
          <Text className={styles.blockLabel}>申请理由</Text>
          <Text className={styles.blockContent}>{apply.reason}</Text>
        </View>
        {apply.remark && (
          <View className={styles.textBlock}>
            <Text className={styles.blockLabel}>备注</Text>
            <Text className={styles.blockContent}>{apply.remark}</Text>
          </View>
        )}
      </View>

      {(apply.approver || apply.approvalDate) && (
        <View className={styles.formCard}>
          <Text className={styles.formTitle}>
            <Text className={styles.icon}>📋</Text>
            审批历史
          </Text>
          <View className={styles.approvalBlock}>
            <View className={styles.approvalRow}>
              <View className={styles.approvalDot} />
              <View className={styles.approvalContent}>
                <View className={styles.approvalHeader}>
                  <Text className={styles.approver}>{apply.approver || '审批管理员'}</Text>
                  {apply.approvalDate && (
                    <Text className={styles.approvalDate}>
                      {dayjs(apply.approvalDate).format('YYYY-MM-DD')}
                    </Text>
                  )}
                </View>
                {status === 'rejected' && apply.rejectReason && (
                  <View className={styles.approvalRemark}>
                    <Text className={styles.remarkLabel}>驳回理由：</Text>
                    <Text className={styles.remarkText}>{apply.rejectReason}</Text>
                  </View>
                )}
                {status === 'approved' && apply.approvalRemark && (
                  <View className={styles.approvalRemark}>
                    <Text className={styles.remarkLabel}>审批意见：</Text>
                    <Text className={styles.remarkText}>{apply.approvalRemark}</Text>
                  </View>
                )}
                {status === 'approved' && !apply.approvalRemark && (
                  <View className={styles.approvalRemark}>
                    <Text className={styles.remarkLabel}>审批意见：</Text>
                    <Text className={styles.remarkText}>审批通过，同意自费献血申请</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          {linkedRecords.length > 0 && (
            <View
              style={{
                marginTop: '24rpx',
                padding: '16rpx 20rpx',
                background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
                borderRadius: '12rpx',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
              onClick={() => {
                if (apply.donorIdCard) {
                  Taro.navigateTo({ url: `/pages/donor-detail/index?idCard=${apply.donorIdCard}` });
                }
              }}
            >
              <Text style={{ color: '#1565C0', fontWeight: '600', fontSize: '26rpx' }}>
                🩸 已关联献血记录：{linkedRecords.length}条
              </Text>
              <Text style={{ color: '#1565C0', fontSize: '28rpx', fontWeight: '600' }}>›</Text>
            </View>
          )}
        </View>
      )}

      {status === 'pending' && <View style={{ height: 180 }} />}

      {status === 'pending' && (
        <View className={styles.actionBar}>
          <View className={styles.rejectBtn} onClick={handleReject}>
            驳回
          </View>
          <View className={styles.approveBtn} onClick={handleApprove}>
            通过申请
          </View>
        </View>
      )}
    </View>
  );
};

export default SelfpayDetailPage;
