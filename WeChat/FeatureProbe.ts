import { TinyEmitter } from "tiny-emitter";
import { Base64 } from "js-base64";
import wefetch from "wefetch";
import { FPUser } from "./FPUser";
import { FPToggleDetail, IParams, IOption  } from "./types";

const PKG_VERSION = 'SDK_VERSION';
const UA = "WECHAT_MINIPROGRAM/" + PKG_VERSION;

const EVENTS = {
  READY: "ready",
  ERROR: "error",
  UPDATE: "update",
};

class FeatureProbe extends TinyEmitter {
  private togglesUrl: string ;
  private eventsUrl: string;
  private refreshInterval: number;
  private clientSdkKey: string;
  private user: FPUser;
  private toggles: { [key: string]: FPToggleDetail } | null;
  private timer?: NodeJS.Timeout;
  private readyPromise: Promise<void>


  constructor() {
    super();

    this.togglesUrl = '';
    this.eventsUrl = '';
    this.user = new FPUser();
    this.clientSdkKey = '';
    this.refreshInterval = 0;
    this.toggles = {};
    this.readyPromise = new Promise((resolve) => {
      const onReadyCallback = () => {
        this.off(EVENTS.READY, onReadyCallback)
        resolve();
      }
      this.on(EVENTS.READY, onReadyCallback);
    });
  }

  public init({
    remoteUrl,
    togglesUrl,
    eventsUrl,
    clientSdkKey,
    user,
    refreshInterval = 1000,
  }: IOption) {
    if (!clientSdkKey) {
      throw new Error("clientSdkKey is required");
    }

    if (refreshInterval <= 0) {
      throw new Error("refreshInterval is invalid");
    }

    if (!remoteUrl && !togglesUrl) {
      throw new Error("remoteUrl or togglesUrl is required");
    }

    if (!remoteUrl && !eventsUrl) {
      throw new Error("remoteUrl or eventsUrl is required");
    }

    if (!remoteUrl && !togglesUrl && !eventsUrl) {
      throw new Error("remoteUrl is required");
    }

    this.togglesUrl = togglesUrl || (remoteUrl + "/api/client-sdk/toggles");
    this.eventsUrl = eventsUrl || (remoteUrl + "/api/events");
    this.user = user;
    this.clientSdkKey = clientSdkKey;
    this.refreshInterval = refreshInterval;
  }

  public async start() {
    const interval = this.refreshInterval;
    await this.fetchToggles();
    this.emit(EVENTS.READY);
    this.timer = setInterval(() => this.fetchToggles(), interval);
  }

  public stop() {
    clearInterval(this.timer);
  }

  public waitUntilReady(): Promise<void> {
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
    return Object.assign({}, this.user);
  }

  public identifyUser(user: FPUser) {
    this.user = Object.assign({}, user);
  }

  public logout() {
    const user = new FPUser();
    this.identifyUser(user);
  }

  static newForTest(toggles: { [key: string]: any }): FeatureProbe {
    const fp = new FeatureProbe();
    fp.init({
      remoteUrl: "http://127.0.0.1:4000",
      clientSdkKey: "_",
      user: new FPUser(),
    });
    fp.toggles = toggles;
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

    await wefetch.get(url, {
      cache: "no-cache",
      header: {
        Authorization: this.clientSdkKey,
        "Content-Type": "application/json",
        UA: UA,
      },
      data: {
        user: userParam
      }
    }).then((response: any) => {
      this.toggles = response.data;
      this.emit(EVENTS.UPDATE);
    }).catch((e: any) => {
      this.emit(EVENTS.ERROR, e);
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
      }).catch(() => {
        // TODO:
      });
    }
  }
}

const featureProbeClient = new FeatureProbe();


export { FeatureProbe, featureProbeClient };
