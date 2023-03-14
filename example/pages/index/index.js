// index.js
import { getClient } from "featureprobe-client-sdk-miniprogram";
// import { getClient } from "../../dist/index";

Page({
  data: {},

  onLoad() {
    const _this = this;
    const client = getClient();

    client.on('ready', function () {
      const boolValue = client.boolValue("campaign_allow_list", false);
      const boolDetail = client.boolDetail("campaign_allow_list", false);
      
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
