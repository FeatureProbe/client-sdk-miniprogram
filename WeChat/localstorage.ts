declare class wx {
  static getStorageSync(key: string): any;
  static setStorageSync(key: string, data: any): void;
}

export default class StorageProvider {
  public async getItem(key: string) {
    try {
      return wx.getStorageSync(key);
    } catch (e) {
      console.log(e);
      return "";
    }
  }

  public async setItem(key: string, data: string) {
    try {
      wx.setStorageSync(key, data);
    } catch (e) {
      console.log(e);
    }
  }
}