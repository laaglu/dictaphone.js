/**********************************************
 * Copyright (C) 2014 Lukas Laag
 * This file is part of dictaphone.js.
 * 
 * dictaphone.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * dictaphone.js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with dictaphone.js.  If not, see http://www.gnu.org/licenses/
 **********************************************/

'use strict';

/* global Backbone, window, navigator, chrome, XMLHttpRequest, location, document*/

var logger = require('Logger');

/*
 type: the install type (mozilla, chromeStore, ios)
 state : (string) current installation state (unsupported, uninstalled, installed)
 error: (string) error message
 app: the mozApp object
 manifestVersion: (string) version string (as obtained by the mozApps API)
 resourceVersion: (string) version string (as read from manifest.webapp file)
 */
var Installation = Backbone.Model.extend({
  defaults : {
    // Set creation date to now
    state : 'unsupported'
  },
  initialize: function() {
    var handleCacheEvent = function handleCacheEvent(e) {
      logger.log('handleCacheEvent', e);
    };

    var handleCacheError = function handleCacheError(e) {
      logger.log('handleCacheError', e);
    };
    // Log all cache events for debugging purposes
    if (window.applicationCache) {
      // Fired after the first cache of the manifest.
      window.applicationCache.addEventListener('cached', handleCacheEvent, false);

      // Checking for an update. Always the first event fired in the sequence.
      window.applicationCache.addEventListener('checking', handleCacheEvent, false);

      // An update was found. The browser is fetching resources.
      window.applicationCache.addEventListener('downloading', handleCacheEvent, false);

      // The manifest returns 404 or 410, the download failed,
      // or the manifest changed while the download was in progress.
      window.applicationCache.addEventListener('error', handleCacheError, false);

      // Fired after the first download of the manifest.
      window.applicationCache.addEventListener('noupdate', handleCacheEvent, false);

      // Fired if the manifest file returns a 404 or 410.
      // This results in the application cache being deleted.
      window.applicationCache.addEventListener('obsolete', handleCacheEvent, false);

      // Fired for each resource listed in the manifest as it is being fetched.
      window.applicationCache.addEventListener('progress', handleCacheEvent, false);

      // Fired when the manifest resources have been newly redownloaded.
      window.applicationCache.addEventListener('updateready', handleCacheEvent, false);
    }
  },
  checkInstall: function(options) {
    logger.log('Installation.checkInstall');
    var installation = this;
    if (navigator.mozApps) {
      //Mozilla web apps
      this.set('type','mozilla');

      // TRY1: get our application management object using getSelf()
      // this works correctly when running into the webapp runtime container
      var try1 = function try1() {
        var req1 = navigator.mozApps.getSelf();
        req1.onsuccess = function () {
          if (req1.result === null) {
            try2();
          } else {
            installation.set('state', 'installed');
            installation.set('app', req1.result);
            if (req1.result.manifest && req1.result.manifest.version) {
              this.set('manifestVersion', req1.result.manifest.version);
            }
          }
        };
        req1.onerror = function() {
          if (options && options.error && (typeof options.error === 'function')) {
            options.error(/*err*/);
          }
          try2();
        };
      };

      // TRY2: get our application management object using getInstalled()
      // this works correctly when running as "self service installer"
      // in a Firefox browser tab
      var try2 = function try2() {
        var req2 = navigator.mozApps.getInstalled();
        req2.onsuccess = function () {
          var result = null;
          var myorigin = window.location.protocol + "//" + window.location.host;
          if (req2.result !== null) {
            req2.result.forEach(function (app) {
              if (app.origin === myorigin) {
                result = app;
              }
            });
          }
          if (result) {
            installation.set('state', 'installed');
            installation.set('app', result);
            if (result.manifest && result.manifest.version) {
              installation.set('manifestVersion', result.manifest.version);
            }
          } else {
            installation.set('state', 'uninstalled');
          }
        };
        req2.onerror = function (err) {
          if (options && options.error && (typeof options.error === 'function')) {
            options.error(err);
          }
        };
      };

      // ---> Actual code starts here<---
      try1();

    } else if (typeof chrome !== 'undefined' &&
      chrome.webstore &&
      chrome.app) {
      //Chrome web apps
      this.set('type','chromeStore');
      this.set('state', chrome.app.isInstalled ? 'installed' : 'uninstalled');

    } else if (typeof window.navigator.standalone !== 'undefined') {
      this.set('type','ios');
      this.set('state', window.navigator.standalone ? 'installed' : 'uninstalled');

    } else {
      this.set('type','unsupported');
      this.set('state', 'unsupported');
    }
  },

  checkVersion: function(options) {
    logger.log('Installation.checkVersion');
    var installation = this;
    var req = new XMLHttpRequest();
    req.open("GET", "manifest.webapp", true);
    req.onload = function() {
      var manifest = JSON.parse(req.responseText);
      if (manifest && manifest.version) {
        installation.set('resourceVersion', manifest.version);
      }
    };
    if (options && options.error && (typeof options.error === 'function')) {
      req.onerror = options.error;
    }
    req.send();
  },

  check: function(options) {
    this.checkInstall(options);
    this.checkVersion(options);
  },

  install: function() {
    logger.log('Installation.install');
    var type = this.get('type');
    if (type) {
      this[type + 'Install']();
    }
  },

  mozillaInstall: function () {
    var base = location.href.split("#")[0]; // WORKAROUND: remove hash from url
    base = base.replace("index.html", ""); // WORKAROUND: remove index.html
    var mozillaInstallUrl = base + '/manifest.webapp';
    var installRequest = navigator.mozApps.install(mozillaInstallUrl);

    var installation = this;
    this.set('error', null);
    installRequest.onsuccess = function (/*data*/) {
      installation.set('state', 'installed');
    };

    installRequest.onerror = function (err) {
      if (err.name) {
        installation.set('error', err.name);
      } else {
        installation.set('error', document.webL10n.get('installError'));
      }
    };
  },

  chromeStoreInstall: function () {
    var installation = this;
    chrome.webstore.install(null,
      function () {
        installation.set('state', 'installed');
      },
      function () {
        installation.set('error', document.webL10n.get('installError'));
      });
  },

  iosInstall: function () {
    // do nothing. As the action only involves displaying a popup to the
    // end-user, it will be handled by the view.
  }
});
module.exports = new Installation();
