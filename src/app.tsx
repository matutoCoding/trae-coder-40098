import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { useAppStore } from '@/store';
import { mockQuotaList, mockQuotaDistributionRecords } from '@/data/quota';
import { mockConsumptionRecords } from '@/data/consumption';
import { mockBloodBatches } from '@/data/batch';
import { mockOutboundRecords, mockSelfpayApplications } from '@/data/outbound';
import './app.scss';

function App(props) {
  const initMockData = useAppStore((state) => {
    return {
      setQuotaList: state.quotaList.length === 0 ? (list: typeof mockQuotaList) => {
        useAppStore.setState({ quotaList: list });
      } : null,
      setDistributionRecords: state.quotaDistributionRecords.length === 0 ? (list: typeof mockQuotaDistributionRecords) => {
        useAppStore.setState({ quotaDistributionRecords: list });
      } : null,
      setConsumptionRecords: state.consumptionRecords.length === 0 ? (list: typeof mockConsumptionRecords) => {
        useAppStore.setState({ consumptionRecords: list });
      } : null,
      setBloodBatches: state.bloodBatches.length === 0 ? (list: typeof mockBloodBatches) => {
        useAppStore.setState({ bloodBatches: list });
      } : null,
      setOutboundRecords: state.outboundRecords.length === 0 ? (list: typeof mockOutboundRecords) => {
        useAppStore.setState({ outboundRecords: list });
      } : null,
      setSelfpayApplications: state.selfpayApplications.length === 0 ? (list: typeof mockSelfpayApplications) => {
        useAppStore.setState({ selfpayApplications: list });
      } : null
    };
  });

  useEffect(() => {
    console.log('[App] 初始化 Mock 数据');
    try {
      if (initMockData.setQuotaList) initMockData.setQuotaList(mockQuotaList);
      if (initMockData.setDistributionRecords) initMockData.setDistributionRecords(mockQuotaDistributionRecords);
      if (initMockData.setConsumptionRecords) initMockData.setConsumptionRecords(mockConsumptionRecords);
      if (initMockData.setBloodBatches) initMockData.setBloodBatches(mockBloodBatches);
      if (initMockData.setOutboundRecords) initMockData.setOutboundRecords(mockOutboundRecords);
      if (initMockData.setSelfpayApplications) initMockData.setSelfpayApplications(mockSelfpayApplications);
      console.log('[App] Mock 数据初始化成功');
    } catch (error) {
      console.error('[App] Mock 数据初始化失败:', error);
    }
  }, [initMockData]);

  useDidShow(() => {
    console.log('[App] 小程序显示');
  });

  useDidHide(() => {
    console.log('[App] 小程序隐藏');
  });

  return props.children;
}

export default App;
