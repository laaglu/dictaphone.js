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
requirejs.config({
  paths: {
    jquery: 'vendor/jquery-1.10.2.min',
    underscore: 'vendor/underscore',
    backbone: 'vendor/backbone',
    moment: 'vendor/moment-langs-2.2.1.min',
    handlebars: 'vendor/handlebars',
    modernizr : 'modernizr.custom.24918'
  },
  shim: {
    'jquery': {
      exports: '$'
    },
    'handlebars': {
      exports: 'Handlebars'
    }
  }
});
require(['backbone', 'DictaphoneRouter', 'modernizr', 'view/PrereqView', 'moment'],
  function (backbone, DictaphoneRouter, Modernizr, PrereqView, moment) {

    var started = false,

      startApp = function startApp() {
        var i, feature, features = ['indexeddb', 'csstransitions', 'localstorage', 'applicationcache', 'svg', 'webaudio'], prereqView;

        if (!started) {
          started = true;
          console.log('The app has started');

          // Check requirements with Modernizr
          for (i = features.length - 1; i >= 0; i--) {
            feature = features[i];
            if (Modernizr[feature]) {
              features.splice(i, 1);
            }
          }
          if (!features.length) {
            // The requirements are complete
            navigator.getMedia = ( navigator.getUserMedia ||
              navigator.webkitGetUserMedia ||
              navigator.mozGetUserMedia ||
              navigator.msGetUserMedia);

            // The app starts here
            moment.lang(navigator.language || navigator.userLanguage);
            new DictaphoneRouter();
            Backbone.history.start();
          } else {
            console.log('PrereqView', PrereqView);
            prereqView = new PrereqView({ model : { features : features }}).render();
            prereqView.$el.removeClass('hidden');
          }
        }
      },
      count = 0,
      intervalId = setInterval(function checkWebL10nReady() {
        if (document.webL10n.getReadyState() === 'complete') {
          console.log('webl10n delayed initialization');
          startApp();
          clearInterval(intervalId);
        } else {
          count++;
          if (count > 20) {
            alert('webl10n initialization error');
            clearInterval(intervalId);
          }
        }
      }, 500);

    document.webL10n.ready(function() {
      console.log('webl10n regular initialization');
      startApp();
    });
  }
);
