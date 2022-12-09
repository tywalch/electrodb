#!/usr/bin/env bash
original_line="const lib = require\('@aws-sdk\/lib-dynamodb'\)"
safe_line="const lib = {};"
filePath="./src/client.js"

replaceLine() {
  sed -i.bak "1 s/.*/$1/" $2
}

replaceLine "$safe_line" "$filePath"
npm run build:browser
replaceLine "$original_line" "$filePath"
rm ./src/client.js.bak