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

/* global document, $, requestAnimationFrame, window */

var ViewBase = require('./ViewBase');
var RecordTemplate = require('./template/RecordTemplate');
var env = require('AudioEnv');
var logger = require('Logger');
var commands = require('cmd/Commands');

module.exports = ViewBase.extend({
  el: '#recordView',
  template: RecordTemplate,
  recordButton: null,
  events: {
    'click a[data-type="tapedeck"]': 'toggleRecord',
    'change input[data-l10n-id="name"]' : 'updateName'
  },
  render : function render() {
    var data = {};
    data.clip = this.model.clip.toJSON();
    data.recording = this.model.running;
    data.duration = this.model.clip.getDuration();

    var tpl = $(this.template(data));
    document.webL10n.translate(tpl[0]);
    this.replaceContent(tpl);

    // Keep references to mutable DOM elements
    this.recordButton = this.$('a[data-type="tapedeck"] span');
    this.duration = this.$('input[data-l10n-id="duration"]');
    this.name = this.$('input[data-l10n-id="name"]');

    this.update(this.model);
    return this;
  },
  updateName : function updateName(/*e*/) {
    this.model.clip.set('name', this.name.val());
  },
  toggleRecord : function toggleRecord(/*e*/) {
    var self = this;
    if (self.model.running) {
      self.recordButton.addClass('icon-record');
      self.recordButton.removeClass('icon-stop');
      self.model.stop()
        .then(function() {
          commands.remove(self.model);
          // Display the clip list view
          window.router.navigate('list', {trigger: true, replace: true});
        })
        .then(null, logger.error);
    } else {
      env.getMediaSource()
        .then(function ready(localMediaStream) {
          self.recordButton.addClass('icon-stop');
          self.recordButton.removeClass('icon-record');
          self.model.start(localMediaStream);
          self.update(self.model);
        })
        .then(null, logger.error);
    }
  },
  update: function update(model) {
    var self = this;
    // If the model has changed, do not update the UI
    if (self.model === model) {
      self.duration.val(model.clip.getDuration());
      if (model.running) {
        requestAnimationFrame(update.bind(self, model));
      }
    }
  }
});

