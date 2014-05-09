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
var clipModels =  require('model/ClipModels');
var ClipListTemplate = require('./template/ClipListTemplate');
var ClipView = require('./ClipView');
var logger = require('Logger');

module.exports = ViewBase.extend({
  el: '#clipListView',
  template: ClipListTemplate,
  initialize: function initialize() {
    this.collection = clipModels;
    this.listenTo(this.collection, 'add', function(clip) {
      // Cannot call addClip directly because the add notification
      // has a (model, collection, options) signature
      this.addClip(clip, false);
    });
    this.listenTo(this.collection, 'remove', this.removeClip);
    this.listenTo(this.collection, 'reset', this.reset);
  },

  /**
   * @param clip
   * @param skipTransition
   * skip the transition animation: true when
   * the method is invoked as a subroutine by render,
   * false when it is invoked on backbone 'add' event.
   */
  addClip: function addClip(clip, skipTransition) {
    logger.log('ClipListView.addClip', clip);
    var attributes = { 'data-id': clip.id};
    if (skipTransition !== true) {
      attributes.style = 'height:0;';
    }
    var clipView = new ClipView({model: clip, attributes: attributes}).render();
    this.$('ul').prepend(clipView.$el);
    if (skipTransition !== true) {
      this.defer(function() {
        clipView.$el.attr('style', null);
      });
    }
  },

  removeClip: function removeClip(clip) {
    logger.log('ClipListView.removeClip', clip, this);
    var sel = 'li[data-id="' + clip.id + '"]';
    var item = this.$(sel);
    //logger.log("sel", sel);
    //logger.log("Length", item.length);
    if (item.length) {
      this.deferTransition(function() {
        item.remove();
      }, item);
      item[0].style.height = 0;
    }
  },

  reset: function reset(/*collection, options*/) {
    logger.log('ClipListView.reset');
    this.$('ul').empty();
  },

  render: function render() {
    logger.log('ClipListView.render');

    var tpl = $(this.template({
      id : clipModels.currentId()
    }));
    document.webL10n.translate(tpl[0]);
    this.replaceContent(tpl);

    var i;
    for (i = this.collection.length - 1; i >= 0; i--) {
      this.addClip(this.collection.at(i), true);
    }
    return this;
  },
  update : function update() {
    this.$('menu[type="toolbar"] a').attr('href', '#/record/' + clipModels.currentId());
  }
});
