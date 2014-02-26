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
define(['jquery', 'view/ViewBase', 'Logger'],
  function($, ViewBase, logger) {

    "use strict";

    return ViewBase.extend({
      tagName: '#gpl',
      initialize: function (options) {
        if (options) {
          this.path = options.path;
        }
      },
      render : function() {
        var element = this.$('article');
        if (element.children().length == 0) {
          var request = new XMLHttpRequest();
          request.onload = function() {
            var parser = new DOMParser();
            var dom = parser.parseFromString(this.responseText, "text/html").documentElement;
            if ("parsererror" == dom.localName) {
              logger.log("Parsing error", dom.innerText);
            }
            var body = $('body', $(dom));
            element.append(body.children());
          };
          request.open("GET", this.path, true);
          request.send();
        }
        return this;
      }
    });
  }
);

