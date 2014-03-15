#!/bin/bash
# Build script for dictaphone.js
r.js -o app.build.js
rm -f ../dictaphone.js.optimized/app.build.js 
rm -f ../dictaphone.js.optimized/build.txt
rm -f ../dictaphone.js.optimized/build.sh
rm -rf ../dictaphone.js.optimized/js/view
rm -rf ../dictaphone.js.optimized/js/vendor/require-2.1.6.js
rm -rf ../dictaphone.js.optimized/.idea
rm -rf ../dictaphone.js.optimized/.git
rm -rf ../dictaphone.js.optimized/img/embedded
rm -rf ../dictaphone.js.optimized/locales/*/manifest.properties
rm -rf ../dictaphone.js.optimized/.tx
sed -e "s@<html class='no-js'>@<html manifest='index.appcache' class='no-js'>@g" index.html | sed -e "s@<script data-main='js/main' src='js/vendor/require-2.1.6.js'></script>@<script type='text/javascript' src='js/main.js'></script>@g" > ../dictaphone.js.optimized/index.html
rm -rf ../dictaphone.js.zip
DATE=`date`
VERSION=`grep version manifest.webapp | sed -e 's/[^0-9.]*//g'`
EXPR="s/#.*/#v${VERSION} ${DATE}/g"
sed -e "${EXPR}" index.appcache > ../dictaphone.js.optimized/index.appcache
( cd ../dictaphone.js.optimized ; zip -9 -v -r ../dictaphone.js.zip .)
