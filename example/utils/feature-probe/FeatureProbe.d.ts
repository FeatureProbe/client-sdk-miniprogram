import { TinyEmitter } from "tiny-emitter";
import { FPUser } from "./FPUser";
import { FPToggleDetail, IOption } from "./types";
declare class FeatureProbe extends TinyEmitter {
    private togglesUrl;
    private eventsUrl;
    private refreshInterval;
    private clientSdkKey;
    private user;
    private toggles;
    private timer?;
    constructor();
    init({ remoteUrl, togglesUrl, eventsUrl, clientSdkKey, user, refreshInterval, }: IOption): void;
    start(): Promise<void>;
    stop(): void;
    boolValue(key: string, defaultValue: boolean): boolean;
    numberValue(key: string, defaultValue: number): number;
    stringValue(key: string, defaultValue: string): string;
    jsonValue(key: string, defaultValue: object): object;
    boolDetail(key: string, defaultValue: boolean): FPToggleDetail;
    numberDetail(key: string, defaultValue: number): FPToggleDetail;
    stringDetail(key: string, defaultValue: string): FPToggleDetail;
    jsonDetail(key: string, defaultValue: object): FPToggleDetail;
    allToggles(): {
        [key: string]: FPToggleDetail;
    } | undefined;
    getUser(): FPUser;
    static newForTest(toggles: {
        [key: string]: any;
    }): FeatureProbe;
    private toggleValue;
    private toggleDetail;
    private fetchToggles;
    private sendEvents;
}
declare const featureProbeClient: FeatureProbe;
export { FeatureProbe, FPToggleDetail, featureProbeClient };
