import { featureProbeClient } from "../../utils/feature-probe/index";
// index.js

Page({
  data: {
    
  },

  onLoad() {
    const _this = this;
    featureProbeClient.on('ready', function () {
      const boolValue = featureProbeClient.boolValue("campaign_allow_list", false);
      const boolDetail = featureProbeClient.boolDetail("campaign_allow_list", false);
      
      _this.setData({
        boolValue: JSON.stringify(boolValue),
        boolDetail: JSON.stringify(boolDetail),
      });
    })
  },

  onreplace() {
    wx.navigateTo({
      url: '/pages/another/another',
    });
  }
})
