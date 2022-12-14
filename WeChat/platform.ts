import wefetch from "wefetch";
import { IPlatForm } from "./types";
import StorageProvider from "./localstorage";
import pkg from '../package.json';

const PKG_VERSION = pkg.version;
const UA = "MINIPROGRAM/" + PKG_VERSION;

const platform: IPlatForm = {
  _fetch: wefetch,
  localStorage: new StorageProvider(),
  UA: UA,
};

export default platform;