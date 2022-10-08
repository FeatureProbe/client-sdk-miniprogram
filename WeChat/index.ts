import { FPUser } from './FPUser';
import { featureProbeClient } from './FeatureProbe';

export { FPUser, featureProbeClient };

declare global {
  let App: (config?: any) => any;
  let getApp: () => any;
}

featureProbeClient.on('update', function() {
  getApp().globalData.toggles = featureProbeClient.allToggles();
});

const originalApp = App;

App = function(config: any = {}) {
  config.globalData = {
    ...config.globalData,
    toggles: featureProbeClient.allToggles(),
  }
  return originalApp(config);
}
