import { babel } from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';

export default [
  {
    "input": "./src/index.js",
    "output": {
      "file": "./lib/divider.js",
      "format": "cjs",
    },
    "plugins": [
      babel({
        babelHelpers: 'bundled',
      }),
    ],
  },
  {
    "input": "./src/index.js",
    "output": {
      "file": "./es/divider.js",
      "format": "esm",
    },
    "plugins": [
      babel({
        babelHelpers: 'bundled',
      }),
    ],
  },
  {
    "input": "./src/index.js",
    "output": {
      "file": "./dist/divider.js",
      "format": "umd",
      "name": "divider"
    },
    "plugins": [
      babel({
        babelHelpers: 'bundled',
      }),
    ],
  },
  {
    "input": "./src/index.js",
    "output": {
      "file": "./example/divider.js",
      "format": "iife",
      "name": "divider"
    },
    "plugins": [
      babel({
        babelHelpers: 'bundled',
      }),
    ],
  },
  {
    "input": "./src/index.js",
    "output": {
      "file": "./lib/divider.min.js",
      "format": "cjs",
    },
    "plugins": [
      babel({
        babelHelpers: 'bundled',
      }),
      terser()
    ],
  },
  {
    "input": "./src/index.js",
    "output": {
      "file": "./es/divider.min.js",
      "format": "esm",
    },
    "plugins": [
      babel({
        babelHelpers: 'bundled',
      }),
      terser(),
    ],
  },
  {
    "input": "./src/index.js",
    "output": {
      "file": "./dist/divider.min.js",
      "format": "umd",
      "name": "divider"
    },
    "plugins": [
      babel({
        babelHelpers: 'bundled',
      }),
      terser()
    ],
  },
]