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
mv ../dictaphone.js.optimized/index.html.opt ../dictaphone.js.optimized/index.html
rm -rf ../dictaphone.js.zip
DATE=`date`
VERSION=`grep version manifest.webapp | sed -e 's/[^0-9.]*//g'`
EXPR="s/#.*/#v${VERSION} ${DATE}/g"
sed -e "${EXPR}" index.appcache > ../dictaphone.js.optimized/index.appcache
( cd ../dictaphone.js.optimized ; zip -9 -v -r ../dictaphone.js.zip .)
