#!/bin/bash

function finish {
  docker compose down
}

trap finish EXIT

docker compose up -d
docker compose exec electro npm run test:run