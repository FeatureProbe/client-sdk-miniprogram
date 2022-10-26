import { TinyEmitter } from "tiny-emitter";
import { Base64 } from "js-base64";
import wefetch from "wefetch";
import { FPUser } from "./FPUser";
import StorageProvider from "./localstorage";
import { FPToggleDetail, IParams, IOption, IStorageProvider } from "./types";

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

class FeatureProbe extends TinyEmitter {
  private togglesUrl: string ;
  private eventsUrl: string;
  private refreshInterval: number;
  private clientSdkKey: string;
  private user: FPUser;
  private toggles: { [key: string]: FPToggleDetail } | undefined;
  private timer?: NodeJS.Timeout;
  private timeoutTimer?: NodeJS.Timeout;
  private readyPromise: null | Promise<void>;
  private status: string;
  private storage: IStorageProvider;
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

  public init({
    remoteUrl,
    togglesUrl,
    eventsUrl,
    clientSdkKey,
    user,
    refreshInterval = 1000,
    timeoutInterval = 10000,
  }: IOption) {
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

  public stop() {
    clearInterval(this.timer);
    clearTimeout(this.timeoutTimer);
    this.timeoutTimer = undefined;
    this.timer = undefined;
  }

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

  public boolValue(key: string, defaultValue: boolean): boolean {
    return this.toggleValue(key, defaultValue, "boolean");
  }

  public numberValue(key: string, defaultValue: number): number {
    return this.toggleValue(key, defaultValue, "number");
  }

  public stringValue(key: string, defaultValue: string): string {
    return this.toggleValue(key, defaultValue, "string");
  }

  public jsonValue(key: string, defaultValue: object): object {
    return this.toggleValue(key, defaultValue, "object");
  }

  public boolDetail(key: string, defaultValue: boolean): FPToggleDetail {
    return this.toggleDetail(key, defaultValue, "boolean");
  }

  public numberDetail(key: string, defaultValue: number): FPToggleDetail {
    return this.toggleDetail(key, defaultValue, "number");
  }

  public stringDetail(key: string, defaultValue: string): FPToggleDetail {
    return this.toggleDetail(key, defaultValue, "string");
  }

  public jsonDetail(key: string, defaultValue: object): FPToggleDetail {
    return this.toggleDetail(key, defaultValue, "object");
  }

  public allToggles(): { [key: string]: FPToggleDetail } | undefined {
    return Object.assign({}, this.toggles);
  }

  public getUser(): FPUser {
    return this.user;
  }

  public identifyUser(user: FPUser) {
    this.user = user;
  }

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
  ): FPToggleDetail {
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

const featureProbeClient = new FeatureProbe();

export { FeatureProbe, featureProbeClient };
