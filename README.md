# Overview
Dictaphone.js is a digital dictaphone application for the web in general and FirefoxOS in particular. It is based on the WebAudio and IndexedDB APIs. 

This github repository contains the full code of the application. You can use also the repository to view/file bug reports and feature requests

Users can download the app and read the user guide at: [fos-apps.org](http://www.fos-apps.org/)
They may also want to run the app directly from the [Firefox Marketplace](https://marketplace.firefox.com/app/dictaphone/)

# Build
To build the dictaphone webapp, all you need is a recent [node.js](http://nodejs.org/) installation. The app build relies entirely on [brunch](http://brunch.io/) and [bower](http://bower.io/).

Then run the following commands:
```
  sudo npm install -g bower
  git clone https://github.com/laaglu/dictaphone.js.git
  cd dictaphone.js
  npm install
  npm start
```
