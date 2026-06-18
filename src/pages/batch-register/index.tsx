import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

const BatchRegisterPage: React.FC = () => {
  return (
    <View className={styles.placeholderPage}>
      <View className={styles.iconBox}>
        <Text>📦</Text>
      </View>
      <Text className={styles.title}>批次效期登记功能</Text>
      <Text className={styles.desc}>批次登记功能开发中，支持录入血液批号、血型、采集日期、有效期，系统自动计算效期天数并标记状态，支持按批次入库管理。</Text>

      <View className={styles.featureList}>
        <Text className={styles.listTitle}>功能预览</Text>
        <View className={styles.featureItem}>
          <View className={styles.dot} />
          <Text className={styles.text}>批号自动生成 / 手工录入（批次号唯一性校验）</Text>
        </View>
        <View className={styles.featureItem}>
          <View className={styles.dot} />
          <Text className={styles.text}>血型选择（A/B/AB/O）、采集数量、采集地点、献血人数</Text>
        </View>
        <View className={styles.featureItem}>
          <View className={styles.dot} />
          <Text className={styles.text}><Text className={styles.strong}>效期自动管理：</Text>计算距离过期天数，≤30天标为临期，过期自动锁定</Text>
        </View>
        <View className={styles.featureItem}>
          <View className={styles.dot} />
          <Text className={styles.text}>关联献血登记：同一批次支持多人献血信息关联</Text>
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

export default BatchRegisterPage;
