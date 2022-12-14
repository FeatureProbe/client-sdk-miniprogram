// import { FeatureProbe } from "../WeChat/FeatureProbe";
// import { FPUser } from "../WeChat/index";
// import * as data from "./fixtures/toggles.json";

// test("FeatureProbe instance", () => {
//   expect(new FeatureProbe()).not.toBeNull();
// });

// test("FeatureProbe init with invalid url", () => {
//   const fp = new FeatureProbe();
//   expect(() => {
//     fp.init({
//       clientSdkKey: "client-sdk-key1",
//       user: new FPUser(),
//     })
//   }).toThrow(Error);

//   expect(() => {
//     fp.init({
//       remoteUrl: "invalid url",
//       clientSdkKey: "",
//       user: new FPUser(),
//     });
//   }).toThrow();

//   expect(() => {
//     fp.init({
//       remoteUrl: "http://127.0.0.1:4007",
//       clientSdkKey: "client-sdk-key1",
//       user: new FPUser(),
//       refreshInterval: -1,
//     });
//   }).toThrow();

//   expect(() => {
//     fp.init({
//       remoteUrl: "http://127.0.0.1:4007",
//       clientSdkKey: "client-sdk-key1",
//       user: new FPUser(),
//       timeoutInterval: -1,
//     });
//   }).toThrow();

//   expect(() => {
//     fp.init({
//       clientSdkKey: "client-sdk-key1",
//       user: new FPUser(),
//     });
//   }).toThrow();

//   expect(() => {
//     fp.init({
//       togglesUrl: "http://127.0.0.1:4007",
//       clientSdkKey: "client-sdk-key1",
//       user: new FPUser(),
//     });
//   }).toThrow();

//   expect(() => {
//     fp.init({
//       eventsUrl: "http://127.0.0.1:4007",
//       clientSdkKey: "client-sdk-key1",
//       user: new FPUser(),
//     });
//   }).toThrow();
// });

// test("FeatureProbe boolean toggle", (done) => {
//   const fpClient = FeatureProbe.newForTest(data);
//   expect(fpClient.boolValue("bool_toggle", false)).toBe(true);
//   expect(fpClient.boolValue("string_toggle", false)).toBe(false);
//   expect(fpClient.boolValue("__not_exist_toggle", false)).toBe(false);

//   let detail = fpClient.boolDetail("bool_toggle", false);
//   expect(detail.value).toBe(true);
//   expect(detail.ruleIndex).toBe(0);

//   detail = fpClient.boolDetail("string_toggle", false);
//   expect(detail.value).toBe(false);
//   expect(detail.reason).toBe("Value type mismatch");
//   done();
// });

// test("FeatureProbe no toggles", (done) => {
//   const fpClient = FeatureProbe.newForTest();
  
//   fpClient.on("ready", function() {
//     expect(fpClient.boolValue("bool_toggle", false)).toBe(false);

//     const detail = fpClient.boolDetail("bool_toggle", false);
//     expect(detail.value).toBe(false);
//     expect(detail.reason).toBe('Not ready');

//     done();
//   });
  
//   fpClient.start();
// });

// test("FeatureProbe number toggle", (done) => {
//   const fpClient = FeatureProbe.newForTest(data);
//   expect(fpClient.numberValue("number_toggle", 0)).toBe(1);
//   expect(fpClient.numberValue("string_toggle", 0)).toBe(0);
//   expect(fpClient.numberValue("__not_exist_toggle", 1)).toBe(1);

//   let detail = fpClient.numberDetail("number_toggle", 0);
//   expect(detail.value).toBe(1);
//   expect(detail.ruleIndex).toBe(0);

//   detail = fpClient.numberDetail("string_toggle", 404);
//   expect(detail.value).toBe(404);
//   expect(detail.reason).toBe("Value type mismatch");
//   done();
// });

// test("FeatureProbe string toggle", (done) => {
//   const fpClient = FeatureProbe.newForTest(data);
//   expect(fpClient.stringValue("string_toggle", "ok")).toBe("1");
//   expect(fpClient.stringValue("bool_toggle", "not_match")).toBe("not_match");
//   expect(fpClient.stringValue("__not_exist_toggle", "not_exist")).toBe("not_exist");

//   let detail = fpClient.stringDetail("bool_toggle", "not match");
//   expect(detail.value).toBe("not match");
//   expect(detail.reason).toBe("Value type mismatch");

//   detail = fpClient.stringDetail("string_toggle", "defaultValue");
//   expect(detail.value).toBe("1");
//   expect(detail.ruleIndex).toBe(0);

//   done();
// });

// test("FeatureProbe json toggle", (done) => {
//   const fpClient = FeatureProbe.newForTest(data);
//   expect(fpClient.jsonValue("json_toggle", {})).toMatchObject({
//     v: "v1",
//     variation_0: "c2",
//   });
//   expect(fpClient.jsonValue("bool_toggle", {})).toMatchObject({});
//   expect(fpClient.jsonValue("__not_exist_toggle", {})).toMatchObject({});

//   let detail = fpClient.jsonDetail("bool_toggle", {});
//   expect(detail.value).toMatchObject({});
//   expect(detail.reason).toBe("Value type mismatch");

//   detail = fpClient.jsonDetail("json_toggle", {});
//   expect(detail.value).toMatchObject({});
//   expect(detail.ruleIndex).toBe(0);
//   done();
// });

// test("FeatureProbe logout", (done) => {
//   const user = new FPUser().with("city", "2");
//   expect(user.get('city')).toBe('2');

//   const fp = new FeatureProbe();
//   fp.init({
//     remoteUrl: "http://127.0.0.1:4007",
//     clientSdkKey: "client-sdk-key1",
//     user: user,
//   });

//   fp.logout();
//   expect(fp.getUser().get('city')).toBe(undefined);
//   done();
// });

// test("FeatureProbe start error", (done) => {
//   const user = new FPUser().with("city", "2");
//   expect(user.get('city')).toBe('2');

//   const fp = new FeatureProbe();
//   fp.init({
//     remoteUrl: "http://127.0.0.1:4007",
//     clientSdkKey: "client-sdk-key1",
//     user: user,
//     timeoutInterval: 1000
//   });

//   fp.on("error", function() {
//     done();
//   })
  
//   fp.start();
// });

// test("FeatureProbe start ready", (done) => {
//   const fpClient = FeatureProbe.newForTest(data);

//   fpClient.on("ready", function() {
//     done();
//   });
  
//   fpClient.start();
// });

// test("FeatureProbe stop", (done) => {
//   const fpClient = FeatureProbe.newForTest(data);
  
//   fpClient.start();
//   fpClient.stop();

//   done();
// });

// test("FeatureProbe waitUntilReady", (done) => {
//   const fpClient = FeatureProbe.newForTest(data);
//   fpClient.start();

//   fpClient.waitUntilReady().then(() => {
//     done();
//   }).catch(() => {
//     done();
//   })
// });

// test("FeatureProbe allToggles", (done) => {
//   const fpClient = FeatureProbe.newForTest(data);
//   fpClient.start();

//   fpClient.waitUntilReady().then(() => {
//     expect(fpClient.allToggles()).toMatchObject(data);
//     done();
//   });
// });
