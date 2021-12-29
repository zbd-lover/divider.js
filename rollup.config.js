// import babel from 'rollup-plugin-babel';
import { babel } from '@rollup/plugin-babel';

export default {
  "input": "./src/index.js",
  "output": [
    {
      "file": "./es/divider.js",
      "format": "esm"
    },
    {
      "file": "./dist/divider.js",
      "format": "umd",
      "name": "divider",
    },
    {
      "file": "./example/divider.js",
      "format": "iife",
      "name": "divider"
    },
    {
      "file": "./lib/divider.js",
      "format": "cjs",
      "name": "divider"
    }
  ],
  'plugins': [
    babel({ babelHelpers: 'bundled' }),
  ]
}