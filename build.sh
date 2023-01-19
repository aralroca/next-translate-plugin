#!/bin/bash

mkdir index
touch index/package.json

echo '{
  "name": "index",
  "private": true,
  "main": "../lib/cjs/index.js",
  "module": "../lib/esm/index.js",
  "types": "../index.d.ts"
}' > index/package.json

