#!/usr/bin/env bash
pattern=$@
LOCAL_DYNAMO_ENDPOINT=http://localhost:8000 node ./test/init.js && LOCAL_DYNAMO_ENDPOINT=http://localhost:8000 npm run test-ts -- --grep "$pattern"