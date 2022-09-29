import { FPUser } from './FPUser';
import { FPToggleDetail, featureProbeClient } from './FeatureProbe';

export { FPUser, FPToggleDetail, featureProbeClient };

declare global {
  let App: (config?: any) => any;
  let getApp: () => any;
}

featureProbeClient.on('toggles', function() {
  getApp().globalData.toggles = featureProbeClient.allToggles();
})

const originalApp = App;

App = function(config: any = {}) {
  config.globalData = {
    ...config.globalData,
    toggles: featureProbeClient.allToggles(),
  }
  return originalApp(config);
}

