#!/usr/bin/env bash
original_line_lib='const lib = require\("@aws-sdk\/lib-dynamodb"\)'
safe_line_lib="const lib = {}"
original_line_unmarshall_output='const util = require\("@aws-sdk\/util-dynamodb"\)'
safe_line_unmarshall_output="const util = {}"
filePath="./src/client.js"

replaceLine() {
  sed -i.bak "${1} s/.*/${2}/" $3
}

replaceSecondLine() {
  sed -i.bak "2 s/.*/$1/" $2
}

replaceLine "1" "$safe_line_lib" "$filePath"
replaceLine "2" "$safe_line_unmarshall_output" "$filePath"
npm run build:browser
replaceLine "1" "$original_line_lib" "$filePath"
replaceLine "2" "$original_line_unmarshall_output" "$filePath"
rm ./src/client.js.bak