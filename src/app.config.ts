export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/quota/index',
    'pages/consumption/index',
    'pages/batch/index',
    'pages/outbound/index',
    'pages/donate-register/index',
    'pages/batch-register/index',
    'pages/outbound-register/index',
    'pages/selfpay-apply/index',
    'pages/selfpay-detail/index',
    'pages/donor-detail/index',
    'pages/batch-detail/index',
    'pages/inventory-tracker/index',
    'pages/inventory-alert/index',
    'pages/donate-certificate/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#E53935',
    navigationBarTitleText: '无偿献血服务',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#E53935',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/quota/index',
        text: '指标额度'
      },
      {
        pagePath: 'pages/consumption/index',
        text: '消费明细'
      },
      {
        pagePath: 'pages/batch/index',
        text: '血液批次'
      },
      {
        pagePath: 'pages/outbound/index',
        text: '效期出库'
      }
    ]
  }
})
