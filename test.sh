#!/bin/bash
pattern=$@

function finish {
  docker compose down
}

docker compose up -d
docker compose exec electro npm run test:run;
if [ $? -eq 0 ]; then
  finish
else
  finish
  exit 1
fi


