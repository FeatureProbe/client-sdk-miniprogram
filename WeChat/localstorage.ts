declare class wx {
  static getStorageSync(key: string): any;
  static setStorageSync(key: string, data: any): void;
  static removeStorageSync(key: string): void;
}

export default {
  getItem(key: string): string {
    try {
      return wx.getStorageSync(key);
    } catch (e) {
      console.log(e);
      return '';
    }
  },
  setItem(key: string, data: string) {
    try {
      wx.setStorageSync(key, data);
    } catch (e) {
      console.log(e);
    }
  },
  removeItem(key: string) {
    try {
      wx.removeStorageSync(key);
    } catch (e) {
      console.log(e);
    }
  }
}