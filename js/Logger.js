define([],
  function() {
    "use strict";
    var SHOW_LOGS = 'showLogs';
    var showLogs = localStorage.getItem(SHOW_LOGS);
    var logger = {
      getShowLogs : function getShowLogs() {
        return showLogs == 'true';
      },
      setShowLogs : function setShowLogs(value) {
        localStorage.setItem(SHOW_LOGS, value);
        showLogs = value;
      },
      log: function log() {
        if (showLogs == 'true') {
          console.log.apply(console, arguments);
        }
      },
      error: function error() {
        if (showLogs == 'true') {
          console.error.apply(console, arguments);
        }
      },
      logAndProceed: function logAndProceed(next) {
        return function log() {
          this.log.apply(this, arguments);
          if (typeof next === 'function') {
            next.apply(this, arguments);
          }
        }.bind(this);
      }
    };
    // If the setting has not been set explicitely, it is off by default.
    if (showLogs == undefined) {
      logger.setShowLogs('false');
    }
    return logger;
  }
);