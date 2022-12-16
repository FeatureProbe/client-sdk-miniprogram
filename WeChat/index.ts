declare global {
  let App: (config?: any) => any;
  let getApp: () => any;
}

import { FeatureProbe, FPUser, FPDetail, FPConfig, initializePlatform } from "featureprobe-client-sdk-js";
import { platform } from './platform';

let featureProbeClient: FeatureProbe | undefined;

const originalApp = App;

App = function(config: any = {}) {
  config.globalData = {
    ...config.globalData,
    toggles: featureProbeClient?.allToggles(),
  }
  return originalApp(config);
}

/**
 * Initialize SDK with required parameters
 * 
 *  @param options
 *   The required parameters used in SDK initialization
 */
export function initialize(options: FPConfig): FeatureProbe | undefined {
  if (featureProbeClient) {
    return featureProbeClient;
  }
  
  initializePlatform({ platform });

  featureProbeClient = new FeatureProbe(options);

  featureProbeClient.on("ready", function() {
    getApp().globalData.toggles = featureProbeClient?.allToggles();
  });

  featureProbeClient.on("update", function() {
    getApp().globalData.toggles = featureProbeClient?.allToggles();
  });

  return featureProbeClient;
}

/**
 * Get the SDK client
 * 
 */
export function getClient() {
  return featureProbeClient;
}

export { FPUser, FeatureProbe, FPDetail, FPConfig };
