#!/usr/bin/env bash

GREEN=$'\e[0;32m'
RED=$'\e[0;31m'

set -e
ROOT=$(pwd)

ENV_ARG=${1:-prod}

echo "${GREEN}"
echo ======================================================
echo ==========READY TO BUILD FOR ENV: $ENV_ARG============
echo ======================================================

bash scripts/prepare-env.sh "$ENV_ARG"

yarn

if [[ $ENV_ARG == *"dev"* ]]; then
    yarn build:android:dev

    # appcenter distribute release \
    #     --mandatory \
    #     --app Wash24hOrg/JetX-Android-Dev \
    #     --file $ROOT/android/app/build/outputs/apk/release/app-release.apk \
    #     --group "Testers,Collaborators"

    firebase appdistribution:distribute $ROOT/android/app/build/outputs/apk/release/app-release.apk \
        --app 1:150072397142:android:abb5fa5b01c0600290daf7 \
        --release-notes "New app release" \
        --groups "testers"

else
    yarn build:androidApk

    # appcenter distribute release \
    #     --mandatory \
    #     --app Wash24hOrg/JetX-Android \
    #     --file $ROOT/android/app/build/outputs/apk/release/app-release.apk \
    #     --group "Testers,Collaborators"

    firebase appdistribution:distribute $ROOT/android/app/build/outputs/apk/release/app-release.apk \
        --app 1:671821638452:android:2df4c65b32a29efe245361 \
        --release-notes "New app release" \
        --groups "testers"

fi
