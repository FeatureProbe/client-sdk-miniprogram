import { FPUser } from './FPUser';
import { FPToggleDetail, featureProbeClient } from './FeatureProbe';
export { FPUser, FPToggleDetail, featureProbeClient };
declare global {
    let App: (config?: any) => any;
    let getApp: () => any;
}
