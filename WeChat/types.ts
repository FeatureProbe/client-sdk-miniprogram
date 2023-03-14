import { IHttpRequest } from "featureprobe-client-sdk-js";

export interface FPStorageProvider {
  /**
   * Save data to storage.
   * 
   *  @param key
   *   The key of the storage item.
   * 
   *  @param data
   *   The data of the storage item.
   */

  setItem: (key: string, data: any) => Promise<void>;

  /**
   * Get data from storage.
   * 
   *  @param key
   *   The key of the storage item.
   */
  getItem: (key: string) => Promise<any>;
}

export interface IPlatForm {
  /**
   * Local storage used in Wechat miniprogram
   * 
   */
  localStorage: FPStorageProvider;

  /**
   * Useragent of Wechat miniprogram
   * 
   */
  UA: string;

  /**
   * Http service used in Wechat miniprogram
   * 
   */
  httpRequest: IHttpRequest;

  /**
   * Socket.io client used in Wechat miniprogram
   * 
   */
  socket: any;
}
