import wefetch from "wefetch";
import { IHttpRequest } from "featureprobe-client-sdk-js";
import { IPlatForm } from "./types";
import StorageProvider from "./localstorage";
import pkg from '../package.json';

const PKG_VERSION = pkg.version;
const UA = "MINIPROGRAM/" + PKG_VERSION;

const httpRequest: IHttpRequest = {
  get: function(url, headers, data, successCb, errorCb) {
    wefetch.get(url.toString(), {
      cache: "no-cache",
      header: headers,
      data,
    })
    .then((response: { statusCode: number; data: { error: string | undefined; }; }) => {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response;
      } else {
        const error: Error = new Error(response.data.error);
        throw error;
      }
    })
    .then(json => {
      successCb(json.data);
    })
    .catch(e => {
      errorCb(e);
    });
  },
  post: function(url, headers, data, successCb, errorCb) {
    wefetch.post(url.toString(), {
      cache: "no-cache",
      header: headers,
      data,
    })
    .then((response: { status: number; statusText: string | undefined; }) => {
      if (response.status >= 200 && response.status < 300) {
        return response;
      } else {
        const error: Error = new Error(response.statusText);
        throw error;
      }
    })
    .then(() => {
      successCb();
    })
    .catch(e => {
      errorCb(e);
    });
  }
};

export const platform: IPlatForm = {
  localStorage: new StorageProvider(),
  UA: UA,
  httpRequest: httpRequest,
};
