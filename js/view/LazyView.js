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

