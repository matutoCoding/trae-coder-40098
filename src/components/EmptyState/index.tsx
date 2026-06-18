import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface EmptyStateProps {
  text?: string;
  subText?: string;
  icon?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  text = '暂无数据',
  subText,
  icon = '📭'
}) => {
  return (
    <View className={styles.emptyState}>
      <View className={styles.iconWrap}>
        <Text>{icon}</Text>
      </View>
      <Text className={styles.text}>{text}</Text>
      {subText && <Text className={styles.subText}>{subText}</Text>}
    </View>
  );
};

export default EmptyState;
