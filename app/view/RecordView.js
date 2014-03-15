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

/* global document, $, requestAnimationFrame, location*/

var ViewBase = require('./ViewBase');
var clipModels = require('model/ClipModels');
var RecordTemplate = require('./template/RecordTemplate');
var Recorder = require('Recorder');
var env = require('AudioEnv');
var logger = require('Logger');

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
    data.clip = this.model.toJSON();
    data.recording = this.model.isRecording();
    data.duration = this.model.getDuration();

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
    this.model.set('name', this.name.val());
  },
  toggleRecord : function toggleRecord(/*e*/) {
    if (this.model.isRecording()) {
      this.recordButton.addClass('icon-record');
      this.recordButton.removeClass('icon-stop');
      var terminate = function terminate() {
        // Display the clip list view
        location.hash = '#/list';
      }.bind(this);
      this.model.recorder.stop({ success: terminate, error:logger.error });
    } else {
      var ready = function ready(localMediaStream) {
        this.recordButton.addClass('icon-stop');
        this.recordButton.removeClass('icon-record');
        clipModels.nextId();
        clipModels.add(this.model);
        this.model.recorder = new Recorder({model: this.model});
        this.model.recorder.start(localMediaStream);
        this.update(this.model);
      }.bind(this);
      env.getMediaSource({success: ready });
    }
  },
  update: function update(model) {
    // If the model has changed, do not update the UI
    if (this.model === model) {
      this.duration.val(this.model.getDuration());
      if (model.isRecording()) {
        requestAnimationFrame(update.bind(this, model));
      }
    }
  }
});

