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

/* global document, $*/

var ViewBase = require('./ViewBase');
var clipModels = require('model/ClipModels');
var MenuTemplate = require('./template/MenuTemplate');

module.exports = ViewBase.extend({
  el: '#menuView',
  template: MenuTemplate,
  render : function() {
    var tpl = $(this.template({ id: clipModels.currentId() }));
    document.webL10n.translate(tpl[0]);
    this.replaceContent(tpl);
    return this;
  },
  update : function() {
    this.$('a[data-l10n-id="newClip"]').attr('href', '#/record/' + clipModels.currentId());
  }
});
