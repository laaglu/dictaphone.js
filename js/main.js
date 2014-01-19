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

    var started = false;
    var startApp = function startApp() {
      if (!started) {
        started = true;
        console.log('The app has started');
        // The app starts here
        new DictaphoneRouter();
        Backbone.history.start();
      }
    };

    var count = 0,
      intervalId = setInterval(function checkWebL10nReady() {
      if (document.webL10n.getReadyState() === 'complete') {
        console.log('webl10n delayed initialization');
        startApp();
        clearInterval(intervalId);
      } else {
        count++;
        if (count > 20) {
          alert('webl10n initialization error');
          clearInterval(intervalId);
        }
      }
    }, 500);

    document.webL10n.ready(function() {
      console.log('webl10n regular initialization');
      startApp();
    });
  }
);
