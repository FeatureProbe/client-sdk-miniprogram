import typescript from "rollup-plugin-typescript2";
import minify from "rollup-plugin-babel-minify";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import nodePolyfills from "rollup-plugin-node-polyfills";
import json from "@rollup/plugin-json";
import replace from 'rollup-plugin-replace';
import pkg from './package.json';

export default {
  input: "./WeChat/index.ts",
  output: {
    file: "./dist/index.js",
    format: 'esm',
  },
  plugins: [
    resolve({
      browser: true,
    }),
    commonjs({
      include: "node_modules/**",
    }),
    typescript({ tsconfigOverride: { compilerOptions: { module: "ES2015" } } }),
    minify({ comments: false }),
    json(),
    replace({
      SDK_VERSION: pkg.version
    }),
    nodePolyfills(),
  ]
};
