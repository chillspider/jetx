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
    yarn build:ios:dev

    # appcenter distribute release \
    #     --mandatory \
    #     --app Wash24hOrg/JetX-IOS-Dev \
    #     --file $ROOT/ios/build/jetx-dev.ipa \
    #     --group "Testers,Collaborators"

    firebase appdistribution:distribute $ROOT/ios/build/jetx-dev.ipa \
        --app 1:150072397142:ios:432a14d44e91c3f190daf7 \
        --release-notes "New app release" \
        --groups "testers"

else
    yarn build:ios

    # appcenter distribute release \
    #     --mandatory \
    #     --app Wash24hOrg/JetX-IOS \
    #     --file $ROOT/ios/build/jetx.ipa \
    #     --group "Testers,Collaborators"
    firebase appdistribution:distribute $ROOT/ios/build/jetx.ipa \
        --app 1:671821638452:ios:3fd28c8ca35b7ba6245361 \
        --release-notes "New app release" \
        --groups "testers"

fi
