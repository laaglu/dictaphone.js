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

/* global Backbone, MozActivity, window*/

var Modernizr = require('modernizr.custom.24918');
var logger = require('Logger');

module.exports = Backbone.View.extend({
  /**
   * Replaces the contents of $el with the contents of another element
   * @param element
   */
  replaceContent : function(element) {
    this.$el.children().remove();
    this.$el.append(element.children());
  },
  defer: function(f) {
    setTimeout(f, 50);
  },
  deferTransition: function(f, el) {
    (el ? el : this.$el).one('transitionend', f);
  },
  setHPos: function setHPos(pos) {
    this.$el.removeClass('hleft hmid hright');
    this.$el.addClass(pos);
  },
  setZPos: function setZPos(pos) {
    this.$el.removeClass('ztop zmid');
    this.$el.addClass(pos);
  },
  hasHTransition: function hasHTransition() {
    return this.hasClass('htransition');
  },
  setHTransition: function setHTransition(transition) {
    if (transition) {
      this.$el.addClass('htransition');
    } else {
      this.$el.removeClass('htransition');
    }
  },
  isVisible: function isVisible() {
    return !this.hasClass('hidden');
  },
  setVisible: function setVisible(visible) {
    if (visible) {
      this.$el.removeClass('hidden');
    } else {
      this.$el.addClass('hidden');
    }
  },
  hasClass: function hasClass(className) {
    return this.$el.hasClass(className);
  },

  openUrl : function openUrl(evt) {
    var target, activity, href, windowName;
    
    logger.log('openUrl', evt);
    target = evt.target;
    href = target.dataset.href;
    windowName = target.id;
    if (Modernizr.webactivities) {
      activity = new MozActivity({
        // Ask for the "pick" activity
        name: "view",

        // Provide the data required by the filters of the activity
        data: {
          type: "url",
          url : href
        }
      });

      activity.onerror = function onerror() {
        logger.error(this.error);
      };

    } else {
      window.open(href, windowName);
    }
  }
});
