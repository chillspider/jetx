#!/bin/sh
export $(grep -v '^#' .buildenv | xargs)

export NODE_PORT="${NODE_PORT:-'3000'}"
export NODE_ENV="${NODE_ENV:-'development'}"
envsubst <.env.example >.env

node dist/src/main.js
