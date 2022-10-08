export declare class FPUser {
    private key;
    private attrs;
    constructor();
    with(attrName: string, attrValue: string): FPUser;
    getKey(): string;
    getAttrs(): {
        [key: string]: string;
    };
    extendAttrs(attrs: {
        [key: string]: string;
    }): FPUser;
    get(attrName: string): string | undefined;
    stableRollout(key: string): FPUser;
}
