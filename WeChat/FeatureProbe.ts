import { TinyEmitter } from "tiny-emitter";
import { Base64 } from "js-base64";
import wefetch from "wefetch";
import { FPUser } from "./FPUser";
import StorageProvider from "./localstorage";
import { FPDetail, IParams, FPConfig, FPStorageProvider } from "./types";

const PKG_VERSION = "SDK_VERSION";
const UA = "WECHAT_MINIPROGRAM/" + PKG_VERSION;
const KEY = "repository";

const STATUS = {
  PENDING: "pending",
  READY: "ready",
  ERROR: "error",
}

const EVENTS = {
  READY: "ready",
  ERROR: "error",
  UPDATE: "update",
  CACHE_READY: "cache_ready"
};

/**
 * You can obtainan a client of FeatureProbe, 
 * which provides access to all of the SDK's functionality.
 */
class FeatureProbe extends TinyEmitter {
  private togglesUrl: string ;
  private eventsUrl: string;
  private refreshInterval: number;
  private clientSdkKey: string;
  private user: FPUser;
  private toggles: { [key: string]: FPDetail } | undefined;
  private timer?: NodeJS.Timeout;
  private timeoutTimer?: NodeJS.Timeout;
  private readyPromise: null | Promise<void>;
  private status: string;
  private storage: FPStorageProvider;
  private timeoutInterval: number;

  constructor() {
    super();

    this.togglesUrl = "";
    this.eventsUrl = "";
    this.user = new FPUser();
    this.clientSdkKey = "";
    this.refreshInterval = 1000;
    this.timeoutInterval = 10000;
    this.toggles = undefined;
    this.status = STATUS.PENDING;
    this.storage = new StorageProvider();
    this.readyPromise = null;
  }

  /**
   * Initialize the FeatureProbe client.
   */
  public init({
    remoteUrl,
    togglesUrl,
    eventsUrl,
    clientSdkKey,
    user,
    refreshInterval = 1000,
    timeoutInterval = 10000,
  }: FPConfig) {
    if (!clientSdkKey) {
      throw new Error("clientSdkKey is required");
    }
    if (refreshInterval <= 0) {
      throw new Error("refreshInterval is invalid");
    }
    if (timeoutInterval <= 0) {
      throw new Error("timeoutInterval is invalid");
    }
    if (!remoteUrl && !togglesUrl && !eventsUrl) {
      throw new Error("remoteUrl is required");
    }
    if (!remoteUrl && !togglesUrl) {
      throw new Error("remoteUrl or togglesUrl is required");
    }
    if (!remoteUrl && !eventsUrl) {
      throw new Error("remoteUrl or eventsUrl is required");
    }

    this.togglesUrl = togglesUrl || (remoteUrl + "/api/client-sdk/toggles");
    this.eventsUrl = eventsUrl || (remoteUrl + "/api/events");
    this.user = user;
    this.clientSdkKey = clientSdkKey;
    this.refreshInterval = refreshInterval;
    this.timeoutInterval = timeoutInterval;
  }

  /**
   * Start the FeatureProbe client.
   */
  public async start() {
    this.timeoutTimer = setTimeout(() => {
      if (this.status === STATUS.PENDING) {
        this.errorInitialized();
      }
    }, this.timeoutInterval);

    try {
      // Emit `cache_ready` event if toggles exist in LocalStorage
      const toggles = await this.storage.getItem(KEY);
      if (toggles) {
        this.toggles = JSON.parse(toggles);
        this.emit(EVENTS.CACHE_READY);
      }

      await this.fetchToggles();
    } finally {
      this.timer = setInterval(() => this.fetchToggles(), this.refreshInterval);
    }
  }

  /**
   * Stop the FeatureProbe client, once the client has been stopped, 
   * SDK will no longer listen for toggle changes or send metrics to Server.
   */
  public stop() {
    clearInterval(this.timer);
    clearTimeout(this.timeoutTimer);
    this.timeoutTimer = undefined;
    this.timer = undefined;
  }

  /**
   * Returns a Promise which tracks the client's ready state.
   *
   * The Promise will be resolved if the client successfully get toggles from the server
   * or ejected if client error get toggles from the server until `timeoutInterval` countdown reaches.
   */
  public waitUntilReady(): Promise<void> {
    if (this.readyPromise) {
      return this.readyPromise;
    }

    if (this.status === STATUS.READY) {
      return Promise.resolve();
    }

    if (this.status === STATUS.ERROR) {
      return Promise.reject();
    }

    this.readyPromise = new Promise((resolve, reject) => {
      const onReadyCallback = () => {
        this.off(EVENTS.READY, onReadyCallback);
        resolve();
      };

      const onErrorCallback = () => {
        this.off(EVENTS.ERROR, onErrorCallback);
        reject();
      };

      this.on(EVENTS.READY, onReadyCallback);
      this.on(EVENTS.ERROR, onErrorCallback);
    });

    return this.readyPromise;
  }

  /**
   * Determines the return `boolean` value of a toggle for the current user.
   *
   *
   * @param key
   *   The unique key of the toggle.
   * @param defaultValue
   *   The default value of the toggle, to be used if the value is not available from FeatureProbe.
   */
  public boolValue(key: string, defaultValue: boolean): boolean {
    return this.toggleValue(key, defaultValue, "boolean");
  }

  /**
   * Determines the return `number` value of a toggle for the current user.
   *
   *
   * @param key
   *   The unique key of the toggle.
   * @param defaultValue
   *   The default value of the toggle, to be used if the value is not available from FeatureProbe.
   */
  public numberValue(key: string, defaultValue: number): number {
    return this.toggleValue(key, defaultValue, "number");
  }

  /**
   * Determines the return `string` value of a toggle for the current user.
   *
   *
   * @param key
   *   The unique key of the toggle.
   * @param defaultValue
   *   The default value of the toggle, to be used if the value is not available from FeatureProbe.
   */
  public stringValue(key: string, defaultValue: string): string {
    return this.toggleValue(key, defaultValue, "string");
  }

  /**
   * Determines the return `json` value of a toggle for the current user.
   *
   *
   * @param key
   *   The unique key of the toggle.
   * @param defaultValue
   *   The default value of the toggle, to be used if the value is not available from FeatureProbe.
   */
  public jsonValue(key: string, defaultValue: object): object {
    return this.toggleValue(key, defaultValue, "object");
  }

  /**
   * Determines the return `boolean` value of a toggle for the current user, along with information about how it was calculated.
   *
   *
   * @param key
   *   The unique key of the toggle.
   * @param defaultValue
   *   The default value of the toggle, to be used if the value is not available from FeatureProbe.
   */
  public boolDetail(key: string, defaultValue: boolean): FPDetail {
    return this.toggleDetail(key, defaultValue, "boolean");
  }

  /**
   * Determines the return `number` value of a toggle for the current user, along with information about how it was calculated.
   *
   *
   * @param key
   *   The unique key of the toggle.
   * @param defaultValue
   *   The default value of the toggle, to be used if the value is not available from FeatureProbe.
   */
  public numberDetail(key: string, defaultValue: number): FPDetail {
    return this.toggleDetail(key, defaultValue, "number");
  }

  /**
   * Determines the return `string` value of a toggle for the current user, along with information about how it was calculated.
   *
   *
   * @param key
   *   The unique key of the toggle.
   * @param defaultValue
   *   The default value of the toggle, to be used if the value is not available from FeatureProbe.
   */
  public stringDetail(key: string, defaultValue: string): FPDetail {
    return this.toggleDetail(key, defaultValue, "string");
  }

  /**
   * Determines the return `json` value of a toggle for the current user, along with information about how it was calculated.
   *
   *
   * @param key
   *   The unique key of the toggle.
   * @param defaultValue
   *   The default value of the toggle, to be used if the value is not available from FeatureProbe.
   */
  public jsonDetail(key: string, defaultValue: object): FPDetail {
    return this.toggleDetail(key, defaultValue, "object");
  }

  /**
   * Returns an object of all available toggles' details to the current user.
   */
  public allToggles(): { [key: string]: FPDetail } | undefined {
    return Object.assign({}, this.toggles);
  }

  /**
   * Returns the current user.
   *
   * This is the user that was most recently passed to [[identifyUser]], or, if [[identifyUser]] has never
   * been called, the initial user specified when the client was created.
   */
  public getUser(): FPUser {
    return this.user;
  }

  /**
   * Changing the current user to FeatureProbe.
   *
   * @param user
   *   A new FPUser instance.
   */
  public identifyUser(user: FPUser) {
    this.user = user;
  }

  /**
   * Logout the current user, change the current user to an anonymous user.
   */
  public logout() {
    const user = new FPUser();
    this.identifyUser(user);
  }

  static newForTest(toggles?: { [key: string]: any }): FeatureProbe {
    const fp = new FeatureProbe();
    fp.init({
      remoteUrl: "http://127.0.0.1:4000",
      clientSdkKey: "_",
      user: new FPUser(),
      timeoutInterval: 1000,
    });
    fp.toggles = toggles;
    fp.successInitialized();
    return fp;
  }

  private toggleValue(key: string, defaultValue: any, valueType: string): any {
    this.sendEvents(key);

    if (this.toggles == undefined) {
      return defaultValue;
    }

    const detail = this.toggles[key];
    if (detail === undefined) {
      return defaultValue;
    }

    const v = detail.value;
    if (typeof v == valueType) {
      return v;
    } else {
      return defaultValue;
    }
  }

  private toggleDetail(
    key: string,
    defaultValue: any,
    valueType: string
  ): FPDetail {
    this.sendEvents(key);

    if (this.toggles == undefined) {
      return {
        value: defaultValue,
        ruleIndex: null,
        variationIndex: null,
        version: 0,
        reason: "Not ready",
      };
    }

    const detail = this.toggles[key];
    if (detail === undefined) {
      return {
        value: defaultValue,
        ruleIndex: null,
        variationIndex: null,
        version: null,
        reason: "Toggle: [" + key + "] not found",
      };
    } else if (typeof detail.value === valueType) {
      return detail;
    } else {
      return {
        value: defaultValue,
        ruleIndex: null,
        variationIndex: null,
        version: null,
        reason: "Value type mismatch",
      };
    }
  }

  private async fetchToggles() {
    const userStr = JSON.stringify(this.user);
    const userParam = Base64.encode(userStr);
    const url = this.togglesUrl;

    return wefetch.get(url, {
      cache: "no-cache",
      header: {
        Authorization: this.clientSdkKey,
        "Content-Type": "application/json",
        UA: UA,
      },
      data: {
        user: userParam
      }
    })
    .then(response => {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response;
      } else {
        const error: Error = new Error(response.data.error);
        throw error;
      }
    })
    .then(response => {
      if (this.status !== STATUS.ERROR) {
        this.toggles = response.data;

        if (this.status === STATUS.PENDING) {
          this.successInitialized();
        } else if (this.status === STATUS.READY) {
          this.emit(EVENTS.UPDATE);
        }

        this.storage.setItem(KEY, JSON.stringify(response.data));
      }
    }).catch(e => {
      console.error("FeatureProbe MiniProgram SDK: Error getting toggles: ", e);
    });
  }

  private async sendEvents(key: string): Promise<void> {
    if (this.toggles && this.toggles[key]) {
      const timestamp = Date.now();
      const payload: IParams[] = [
        {
          access: {
            startTime: timestamp,
            endTime: timestamp,
            counters: {
              [key]: [
                {
                  count: 1,
                  value: this.toggles[key].value,
                  index: this.toggles[key].variationIndex,
                  version: this.toggles[key].version,
                },
              ],
            },
          },
        },
      ];

      await wefetch.post(this.eventsUrl, {
        cache: "no-cache",
        header: {
          Authorization: this.clientSdkKey,
          "Content-Type": "application/json",
          UA: UA,
        },
        data: JSON.stringify(payload),
      })
      .then(response => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          return response;
        } else {
          const error: Error = new Error(response.data.error);
          throw error;
        }
      })
      .catch(e => {
        console.error("FeatureProbe MiniProgram SDK: Error reporting events: ", e);
      });
    }
  }

  // Emit `ready` event if toggles are successfully returned from server
  private successInitialized() {
    this.status = STATUS.READY;
    setTimeout(() => {
      this.emit(EVENTS.READY);
    });
            
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = undefined;
    }
  }

  // Emit `error` event if toggles are not available and timeout has been reached
  private errorInitialized() {
    this.status = STATUS.ERROR;
    setTimeout(() => {
      this.emit(EVENTS.ERROR);
    });

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}

/**
 * The client of the FeatureProbe.
 */
const featureProbeClient = new FeatureProbe();

export { FeatureProbe, featureProbeClient };
