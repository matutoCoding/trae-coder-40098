import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

const OutboundRegisterPage: React.FC = () => {
  return (
    <View className={styles.placeholderPage}>
      <View className={styles.iconBox}>
        <Text>🚚</Text>
      </View>
      <Text className={styles.title}>效期出库登记功能</Text>
      <Text className={styles.desc}>出库登记功能开发中，系统根据FIFO先进先出原则自动推荐出库批次，优先效期近的血液，标记临期批次为优先出库，减少过期浪费。</Text>

      <View className={styles.featureList}>
        <Text className={styles.listTitle}>功能预览</Text>
        <View className={styles.featureItem}>
          <View className={styles.dot} />
          <Text className={styles.text}><Text className={styles.strong}>FIFO推荐：</Text>按效期自动排序推荐出库批次，临期优先</Text>
        </View>
        <View className={styles.featureItem}>
          <View className={styles.dot} />
          <Text className={styles.text}>手动选择批次（需提示是否偏离FIFO原则）</Text>
        </View>
        <View className={styles.featureItem}>
          <View className={styles.dot} />
          <Text className={styles.text}>出库数量、领用单位/科室、用途说明录入</Text>
        </View>
        <View className={styles.featureItem}>
          <View className={styles.dot} />
          <Text className={styles.text}>过期/锁定批次禁止出库，出库需审批流程</Text>
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

export default OutboundRegisterPage;
