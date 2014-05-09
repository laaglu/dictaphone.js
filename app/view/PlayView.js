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

/* global document, $, requestAnimationFrame*/

var ViewBase = require('./ViewBase');
var PlayTemplate = require('./template/PlayTemplate');
var utils = require('seekbars');
var logger = require('Logger');

module.exports = ViewBase.extend({
  el: '#playView',
  template: PlayTemplate,
  playButton: null,
  events: {
    'click #tapedeck2a': 'togglePlay',
    'click #tapedeck2b' : 'toggleLoop',
    'change input[data-l10n-id="name"]' : 'updateName',
    'change #volumeSlider' : 'volumeChange',
    'mousedown #positionSlider' : 'positionDown',
    'mouseup #positionSlider' : 'positionUp',
    'touchstart #positionSlider' : 'positionDown',
    'touchend #positionSlider' : 'positionUp'
  },
  render : function render() {
    var data = {};
    data.clip = this.model.toJSON();
    data.playing = this.model.isPlaying();
    data.duration = this.model.getDuration();
    data.position = this.model.player.clipTime;
    data.volume = this.model.player.getVolume();
    data.loop = this.model.player.loop;

    var tpl = $(this.template(data));
    document.webL10n.translate(tpl[0]);
    this.replaceContent(tpl);

    return this;
  },
  lazyRender: function lazyRender() {
    // Keep references to mutable DOM elements
    this.playButton = this.$('#tapedeck2a span');
    this.loopButton = this.$('#tapedeck2b');
    utils.seekbars.init();
    this.volumeSlider = utils.seekbars.bind(document.getElementById('volumeSlider'));
    this.positionSlider = utils.seekbars.bind(document.getElementById('positionSlider'));
    this.name = this.$('input[data-l10n-id="name"]');

    this.update(this.model);
    this.volumeChange();
  },
  updateName : function updateName(/*e*/) {
    this.model.set('name', this.name.val());
    this.model.save({});
  },
  volumeChange : function volumeChange(/*e*/) {
    if (this.volumeSlider) {
      logger.log('volumeChange', this.volumeSlider.getValue());
      this.model.player.setVolume(this.volumeSlider.getValue());
    }
  },
  positionDown : function positionDown(/*e*/) {
    logger.log('positionDown', this.positionSlider.getValue());
    if (this.model.isPlaying()) {
      this.togglePlay(null);
      this.suspended = true;
    }
  },
  positionUp : function positionUp(/*e*/) {
    logger.log('positionUp', this.positionSlider.getValue());
    if (this.suspended) {
      this.togglePlay(null);
      this.suspended = false;
    }
  },
  togglePlay : function togglePlay(/*e*/) {
    logger.log('togglePlay', this.positionSlider.getValue());
    if (this.model.isPlaying()) {
      this.model.player.stop();
    } else {
      this.model.player.start(this.positionSlider.getValue());
    }
    this.update(this.model);
  },
  toggleLoop : function toggleLoop(/*e*/) {
    var loop;
    logger.log('toggleLoop');
    loop = this.model.player.loop;
    this.model.player.loop = !loop;
    this.loopButton.attr('pressed', !loop);
  },
  update: function update(model) {
    // If the model has changed, do not update the UI
    if (this.model === model) {
      this.positionSlider.setValue(model.player.clipTime);
      if (model.isPlaying()) {
        this.playButton.addClass('icon-pause');
        this.playButton.removeClass('icon-play');
        requestAnimationFrame(update.bind(this, model));
      } else {
        this.playButton.addClass('icon-play');
        this.playButton.removeClass('icon-pause');
      }
    }
  }
});
