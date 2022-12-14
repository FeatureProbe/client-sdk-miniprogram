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
  _fetch: any;
  localStorage: FPStorageProvider;
  UA: string;
}
