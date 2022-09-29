import { FeatureProbe } from "../WeChat/FeatureProbe";
import { FPUser } from "../WeChat/index";
import * as data from "./fixtures/toggles.json";

const fpClient = FeatureProbe.newForTest(data);

test("FeatureProbe instance", () => {
  expect(new FeatureProbe()).not.toBeNull();
});

test("feature probe init with invalid url", () => {
  const fp = new FeatureProbe();
  expect(() => {
    fp.init({
      clientSdkKey: "client-sdk-key1",
      user: new FPUser(),
    })
  }).toThrow(Error);
});

test("FeatureProbe boolean toggle", (done) => {
  expect(fpClient.boolValue("bool_toggle", false)).toBe(true);
  expect(fpClient.boolValue("string_toggle", false)).toBe(false);
  expect(fpClient.boolValue("__not_exist_toggle", false)).toBe(false);

  let detail = fpClient.boolDetail("bool_toggle", false);
  expect(detail.value).toBe(true);
  expect(detail.ruleIndex).toBe(0);

  detail = fpClient.boolDetail("string_toggle", false);
  expect(detail.value).toBe(false);
  expect(detail.reason).toBe("Value type mismatch");
  done();
});

test("FeatureProbe number toggle", (done) => {
  const fpClient = FeatureProbe.newForTest(data);
  expect(fpClient.numberValue("number_toggle", 0)).toBe(1);
  expect(fpClient.numberValue("string_toggle", 0)).toBe(0);
  expect(fpClient.numberValue("__not_exist_toggle", 1)).toBe(1);

  let detail = fpClient.numberDetail("number_toggle", 0);
  expect(detail.value).toBe(1);
  expect(detail.ruleIndex).toBe(0);

  detail = fpClient.numberDetail("string_toggle", 404);
  expect(detail.value).toBe(404);
  expect(detail.reason).toBe("Value type mismatch");
  done();
});

test("FeatureProbe string toggle", (done) => {
  const fpClient = FeatureProbe.newForTest(data);
  expect(fpClient.stringValue("string_toggle", "ok")).toBe("1");
  expect(fpClient.stringValue("bool_toggle", "not_match")).toBe("not_match");
  expect(fpClient.stringValue("__not_exist_toggle", "not_exist")).toBe("not_exist");

  let detail = fpClient.stringDetail("bool_toggle", "not match");
  expect(detail.value).toBe("not match");
  expect(detail.reason).toBe("Value type mismatch");

  detail = fpClient.stringDetail("string_toggle", "defaultValue");
  expect(detail.value).toBe("1");
  expect(detail.ruleIndex).toBe(0);

  done();
});

test("FeatureProbe json toggle", (done) => {
  expect(fpClient.jsonValue("json_toggle", {})).toMatchObject({
    v: "v1",
    variation_0: "c2",
  });
  expect(fpClient.jsonValue("bool_toggle", {})).toMatchObject({});
  expect(fpClient.jsonValue("__not_exist_toggle", {})).toMatchObject({});

  let detail = fpClient.jsonDetail("bool_toggle", {});
  expect(detail.value).toMatchObject({});
  expect(detail.reason).toBe("Value type mismatch");

  detail = fpClient.jsonDetail("json_toggle", {});
  expect(detail.value).toMatchObject({});
  expect(detail.ruleIndex).toBe(0);
  done();
});
