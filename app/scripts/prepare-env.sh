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

ENV_FILE=".env"
$(test $ENV_ARG == 'prod') && ENV_FILE=".env.prod"
$(test $ENV_ARG == 'dev') && ENV_FILE=".env.dev"

echo "${GREEN}"
echo project $PROJ_ARG -src $SRC -env $ENV_FILE

export $(cat ${ENV_FILE} | xargs)

sed -e "s/PRODUCT_BUNDLE_IDENTIFIER\ =\ com.*;/PRODUCT_BUNDLE_IDENTIFIER\ =\ $APP_ID;/" ios/mobile.xcodeproj/project.pbxproj >tmp.pbxproj
sed -e "s/DEVELOPMENT_TEAM\ =\ .*;/DEVELOPMENT_TEAM\ =\ $DEVELOPMENT_TEAM;/" tmp.pbxproj >project.pbxproj
mv project.pbxproj ios/mobile.xcodeproj
rm *.pbxproj

if [[ $ENV_ARG == *"dev"* ]]; then
    rm android/app/google-services.json
    cp scripts/google-services-dev.json android/app/google-services.json

    rm ios/GoogleService-Info.plist
    cp scripts/GoogleService-Info-dev.plist ios/GoogleService-Info.plist

else
    rm android/app/google-services.json
    cp scripts/google-services-prod.json android/app/google-services.json

    rm ios/GoogleService-Info.plist
    cp scripts/GoogleService-Info-prod.plist ios/GoogleService-Info.plist
fi
