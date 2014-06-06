'use strict';

/* global _, RSVP*/

var clipidToCmds = {};

function add(cmd, cmdid) {
  var commands = clipidToCmds[cmd.clip.id];
  if (!commands) {
    commands = clipidToCmds[cmd.clip.id] = {};
  }
  commands[cmdid] = cmd;
  return cmd;
}

function remove(cmd) {
  var commands = clipidToCmds[cmd.clip.id];
  if (commands) {
    delete commands[cmd.constructor.cmdid];
  }
}

function get(clipid, cmdid) {
  var commands;
  if (clipid) {
    commands = clipidToCmds[clipid];
    if (commands) {
      return cmdid ? commands[cmdid] : commands;
    }
    return null;
  }
  return _.flatten(_.map(_.values(clipidToCmds), function(cmds) { return _.values(cmds); } ));
}

function isRunning(clipid, cmdid) {
  var commands = clipidToCmds[clipid];
  if (commands) {
    var command = commands[cmdid];
    return command && command.running;
  }
  return false;
}

function reset() {
  // Stop all running commands
  var runningCommands = _.filter(get(), function(cmd) { return cmd.running; } );
  return RSVP.Promise.all(_.map(runningCommands, function(cmd) { return cmd.stop(); }))
    .then(function() {
      clipidToCmds = {};
    }); 
}

var commands = {
  add: add,
  remove: remove,
  get: get,
  isRunning: isRunning,
  reset: reset,
  PLAY: 'play',
  RECORD: 'record',
  EXPORT: 'export'
};

module.exports = commands;
