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

/* global $, document*/

var ViewBase = require('./ViewBase');
var AboutTemplate = require('./template/AboutTemplate');
var install = require('model/Installation');
var env = require('AudioEnv');
var logger = require('Logger');

module.exports = ViewBase.extend({
  el: '#aboutView',
  template: AboutTemplate,
  model: install,
  events: {
    'click a[data-l10n-id="installBtn"]' : 'showNotification',
    'change #debugLogs' : 'toggleDebug',
    'change #releaseMic' : 'toggleReleaseMic'
  },

  initialize: function () {
    this.listenTo(this.model, 'change', this.render);
    this.render();
  },

  render : function() {
    logger.log('AboutView.render()');
    var resourceVersion = this.model.get('resourceVersion');
    var manifestVersion = this.model.get('manifestVersion');
    var install = this.model.get('state') === 'uninstalled';
    var update = this.model.get('state') === 'installed' &&
     manifestVersion !== null &&
     manifestVersion !== resourceVersion;
    var tpl = $(this.template({
      version: manifestVersion ?  manifestVersion : resourceVersion,
      updateVersion: resourceVersion,
      install: install,
      update: update,
      error: this.model.get('error'),
      debugLogs: logger.getShowLogs(),
      releaseMic: env.getReleaseMic()
    }));
    document.webL10n.translate(tpl[0]);
    this.replaceContent(tpl);
    this.delegateEvents();
    return this;
  },

  showNotification: function() {
    logger.log('AboutView.showNotification()');
    if (this.model.get('type') === 'ios') {
      var msg = this.$('#arrow_box');
      msg.show();

      setTimeout(function() {
        msg.hide();
      }, 8000);
    }
  },

  toggleDebug : function() {
    logger.log('toggleDebug()');
    logger.setShowLogs('' + (!logger.getShowLogs()));
  },

  toggleReleaseMic : function() {
    logger.log('toggleReleaseMic()');
    env.setReleaseMic('' + (!env.getReleaseMic()));
  }
});

