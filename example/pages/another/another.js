// another.js

const app = getApp();

Page({
  data: {
    boolValue: '',
    boolDetail: ''
  },

  onLoad() {
    console.log(app.globalData);
    this.setData({
      boolValue: JSON.stringify(app.globalData.toggles['campaign_allow_list'].value),
      boolDetail: JSON.stringify(app.globalData.toggles['campaign_allow_list'])
    })
  }
})
