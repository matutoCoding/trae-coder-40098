import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

const DonateRegisterPage: React.FC = () => {
  return (
    <View className={styles.placeholderPage}>
      <View className={styles.iconBox}>
        <Text>🩸</Text>
      </View>
      <Text className={styles.title}>献血登记功能</Text>
      <Text className={styles.desc}>献血登记功能开发中，支持录入献血人信息，自动校验献血间隔（≥6个月），并根据单位剩余额度自动选择额度扣减或走自费流程。</Text>

      <View className={styles.featureList}>
        <Text className={styles.listTitle}>功能预览</Text>
        <View className={styles.featureItem}>
          <View className={styles.dot} />
          <Text className={styles.text}>献血人信息录入（姓名、身份证、血型、联系方式）</Text>
        </View>
        <View className={styles.featureItem}>
          <View className={styles.dot} />
          <Text className={styles.text}><Text className={styles.strong}>献血间隔校验：</Text>自动比对上次献血日期，未满180天拦截</Text>
        </View>
        <View className={styles.featureItem}>
          <View className={styles.dot} />
          <Text className={styles.text}>额度扣减：优先扣减单位额度，余额不足自动提示自费转换</Text>
        </View>
        <View className={styles.featureItem}>
          <View className={styles.dot} />
          <Text className={styles.text}>超额自费申请：额度用完后自动发起自费审批流程</Text>
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

export default DonateRegisterPage;
