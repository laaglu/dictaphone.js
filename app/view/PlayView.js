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
var EditView = require('./EditView');
var PlayTemplate = require('./template/PlayTemplate');
var seekbars = require('seekbars').seekbars;
var logger = require('Logger');

module.exports = ViewBase.extend({
  el: '#playView',
  template: PlayTemplate,
  playButton: null,
  editView:null,
  events: {
    'click #tapedeck2a': 'togglePlay',
    'click #tapedeck2b' : 'toggleLoop',
    'input input[data-l10n-id="name"]' : 'editMode',
    'change #volumeSlider' : 'volumeChange',
    'mousedown #positionSlider' : 'positionDown',
    'mouseup #positionSlider' : 'positionUp',
    'touchstart #positionSlider' : 'positionDown',
    'touchend #positionSlider' : 'positionUp'
  },
  render : function render() {
    var data = {};
    data.clip = this.model.clip.toJSON();
    data.playing = this.model.running;
    data.duration = this.model.clip.getDuration();
    data.position = this.model.clipTime;
    data.volume = this.model.getVolume();
    data.loop = this.model.loop;

    var tpl = $(this.template(data));
    document.webL10n.translate(tpl[0]);
    this.replaceContent(tpl);
    this.editView = new EditView();
    this.editView.commit = this.commit.bind(this);
    this.editView.rollback = this.rollback.bind(this);
    this.editView.render();
    return this;
  },
  lazyRender: function lazyRender() {
    // Keep references to mutable DOM elements
    this.playButton = this.$('#tapedeck2a span');
    this.loopButton = this.$('#tapedeck2b');
    seekbars.init();
    this.volumeSlider = seekbars.bind(document.getElementById('volumeSlider'));
    this.positionSlider = seekbars.bind(document.getElementById('positionSlider'));
    this.name = this.$('input[data-l10n-id="name"]');

    this.update(this.model);
    this.volumeChange();
  },
  editMode : function editMode() {
    this.editView.activate(true);
  },
  commit : function commit(/*e*/) {
    logger.log('commit');
    this.editView.activate(false);
    this.model.clip.set('name', this.name.val());
    this.model.clip.save({});
  },
  rollback : function rollback(/*e*/) {
    logger.log('rollback');
    this.editView.activate(false);
    this.name.val(this.model.clip.get('name'));
  },
  volumeChange : function volumeChange(/*e*/) {
    if (this.volumeSlider) {
      logger.log('volumeChange', this.volumeSlider.getValue());
      this.model.setVolume(this.volumeSlider.getValue());
    }
  },
  positionDown : function positionDown(/*e*/) {
    logger.log('positionDown', this.positionSlider.getValue());
    if (this.model.running) {
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
    if (this.model.running) {
      this.model.stop();
    } else {
      this.model.start(this.positionSlider.getValue());
    }
    this.update(this.model);
  },
  toggleLoop : function toggleLoop(/*e*/) {
    var loop;
    logger.log('toggleLoop');
    loop = this.model.loop;
    this.model.loop = !loop;
    this.loopButton.attr('pressed', !loop);
  },
  update: function update(model) {
    var self = this;
    // If the model has changed, do not update the UI
    if (self.model === model) {
      this.positionSlider.setValue(model.clipTime);
      if (model.running) {
        this.playButton.addClass('icon-pause');
        this.playButton.removeClass('icon-play');
        requestAnimationFrame(update.bind(self, model));
      } else {
        this.playButton.addClass('icon-play');
        this.playButton.removeClass('icon-pause');
      }
    }
  }
});
