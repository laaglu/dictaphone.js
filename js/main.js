requirejs.config({
  paths: {
    jquery: 'vendor/jquery-1.10.2.min',
    underscore: 'vendor/underscore',
    backbone: 'vendor/backbone',
    moment: 'vendor/moment-langs-2.2.1.min',
    handlebars: 'vendor/handlebars'
  },
  shim: {
    'jquery': {
      exports: '$'
    },
    'handlebars': {
      exports: 'Handlebars'
    }
  }
});
require(['backbone', 'DictaphoneRouter'],
  function (backbone, DictaphoneRouter) {
    // Polyfill for requestAnimationFrame and getMedia
    (function () {
      var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
      window.requestAnimationFrame = requestAnimationFrame;
    })();

    navigator.getMedia = ( navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia);

    document.webL10n.ready(function() {
      // The app starts here
      new DictaphoneRouter();
      Backbone.history.start();
    });
  }
);
