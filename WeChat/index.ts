
import { FeatureProbe, FPUser, FPDetail, FPConfig, initializePlatform } from "featureprobe-client-sdk-js";
import platform from "./platform";

initializePlatform({
  platform: platform
});

export { FPUser, FeatureProbe, FPDetail, FPConfig };

let featureProbeClient: FeatureProbe | undefined;

export function initialize(options: FPConfig): FeatureProbe {
  if (featureProbeClient) {
    return featureProbeClient;
  }
  featureProbeClient = new FeatureProbe(options);
  return featureProbeClient;
}

declare global {
  let App: (config?: any) => any;
  let getApp: () => any;
}

featureProbeClient?.on("update", function() {
  getApp().globalData.toggles = featureProbeClient?.allToggles();
});

const originalApp = App;

App = function(config: any = {}) {
  config.globalData = {
    ...config.globalData,
    toggles: featureProbeClient?.allToggles(),
  }
  return originalApp(config);
}
