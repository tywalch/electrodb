#!/usr/bin/env bash
pattern=$@
LOCAL_DYNAMO_ENDPOINT=http://localhost:8000 npm run test:unit -- --grep "$pattern"