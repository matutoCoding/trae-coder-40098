import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

interface SectionHeaderProps {
  title: string;
  subTitle?: string;
  showArrow?: boolean;
  onActionClick?: () => void;
  actionText?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subTitle,
  showArrow = false,
  onActionClick,
  actionText = '查看更多'
}) => {
  const handleAction = () => {
    if (onActionClick) {
      onActionClick();
    }
  };

  return (
    <View className={styles.sectionHeader}>
      <View className={styles.titleRow}>
        <View className={styles.indicator} />
        <Text className={styles.title}>{title}</Text>
        {subTitle && <Text className={styles.subTitle}>{subTitle}</Text>}
      </View>
      {showArrow && (
        <View className={styles.action} onClick={handleAction}>
          <Text>{actionText}</Text>
          <Text className={styles.arrow}>›</Text>
        </View>
      )}
    </View>
  );
};

export default SectionHeader;
