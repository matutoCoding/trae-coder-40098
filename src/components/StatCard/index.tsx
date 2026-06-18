import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';
import type { StatCardItem } from '@/types';

interface StatCardProps extends StatCardItem {
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, unit, trend, color = '#E53935', bgColor, onClick }) => {
  const trendClass = trend?.startsWith('+')
    ? styles.trendUp
    : trend?.startsWith('-')
    ? styles.trendDown
    : '';

  return (
    <View className={styles.statCard} onClick={onClick}>
      <View className={styles.bgDecor} style={{ background: bgColor || color }} />
      <Text className={styles.label}>{label}</Text>
      <View className={styles.valueRow}>
        <Text className={styles.value} style={{ color }}>{value}</Text>
        {unit && <Text className={styles.unit}>{unit}</Text>}
      </View>
      {trend && (
        <Text className={classnames(styles.trend, trendClass)}>{trend}</Text>
      )}
    </View>
  );
};

export default StatCard;
