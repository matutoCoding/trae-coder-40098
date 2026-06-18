import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

const SelfpayApplyPage: React.FC = () => {
  return (
    <View className={styles.placeholderPage}>
      <View className={styles.iconBox}>
        <Text>📋</Text>
      </View>
      <Text className={styles.title}>超额自费申请功能</Text>
      <Text className={styles.desc}>自费申请功能开发中，当单位周期献血额度用完时，可发起自费献血申请，由管理员审批通过后即可继续登记献血，费用由个人或单位承担。</Text>

      <View className={styles.featureList}>
        <Text className={styles.listTitle}>功能预览</Text>
        <View className={styles.featureItem}>
          <View className={styles.dot} />
          <Text className={styles.text}>单位选择、申请人数、超额数量、申请原因录入</Text>
        </View>
        <View className={styles.featureItem}>
          <View className={styles.dot} />
          <Text className={styles.text}><Text className={styles.strong}>超额拦截：</Text>献血时若额度用完，自动跳转自费申请</Text>
        </View>
        <View className={styles.featureItem}>
          <View className={styles.dot} />
          <Text className={styles.text}>审批流程：待审批→已通过/已拒绝，审批人意见留痕</Text>
        </View>
        <View className={styles.featureItem}>
          <View className={styles.dot} />
          <Text className={styles.text}>审批通过后自动增加自费献血额度</Text>
        </View>
      </View>

      <Button
        className={styles.actionBtn}
        onClick={() => {
          Taro.showToast({ title: '功能开发中', icon: 'none' });
        }}
      >
        功能开发中，敬请期待
      </Button>
    </View>
  );
};

export default SelfpayApplyPage;
