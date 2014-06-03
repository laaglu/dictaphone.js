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

/* global Backbone, $, document, RSVP */

var viewStack = require('ViewStack');
var commands = require('cmd/Commands');
var PlayCmd = require('cmd/PlayCmd');
var RecordCmd = require('cmd/RecordCmd');
var ExportCmd = require('cmd/ExportCmd');
var install = require('model/Installation');
var clipModels = require('model/ClipModels');
var samples = require('model/Samples');
var MenuView = require('view/MenuView');
var PlayView = require('view/PlayView');
var RecordView = require('view/RecordView');
var ClipListView = require('view/ClipListView');
var FactoryResetView = require('view/FactoryResetView');
var ExportView = require('view/ExportView');
var ViewBase = require('view/ViewBase');
var LazyView = require('view/LazyView');
var AboutView = require('view/AboutView');
var SettingsView = require('view/SettingsView');
var logger = require('Logger');
var StatsLogger = require('StatsLogger');
var env = require('AudioEnv');

module.exports = Backbone.Router.extend({
  routes: {
    'play/:clipid':               'play',
    'record/:clipid':             'record',
    'menu':                       'menu',
    'list':                       'list',
    'erase/:clipid':              'erase',
    'export/:clipid':             'export_',
    'next':                       'next',
    'previous':                   'previous',
    'factoryReset':               'factoryReset',
    'about':                      'about',
    'settings':                   'settings',
    'translations':               'translations',
    'legal':                      'legal',
    'install':                    'install',
    'update':                     'update',
    'releaseNotes':               'releaseNotes',
    'gpl':                        'gpl'
  },
  currentPath : '',
  execute: function(callback, args) {
    var newPath = [], result;
    if (callback && callback.name) {
      newPath.push(callback.name);
    }
    if (args && args.length > 1) {
      Array.prototype.push.call(newPath, args.slice(0, args.length -1));
    }
    if (callback) {
      result = callback.apply(this, args);
      if ('rollback' === result) {
        console.log('Rollback:', this.currentPath);
        if (newPath !== this.currentPath) {
          this.navigate(this.currentPath, {trigger: true, replace: true});
        }
      } else {
        this.currentPath = newPath.join('/');
        console.log('Commit:', this.currentPath);
      }
    }
  },

  initialize : function() {
    var self = this;
    return new RSVP.Promise(function(resolve, reject) {
      clipModels.fetch({
        success: resolve, 
        error: reject});
      })
      .then(samples.init)
      .then(function() {
        self.menuView = new MenuView().render();

        // The current clip index to power back / forward buttons in the play view
        self.clipIndex = 0;

        // If clips are available, show the clip list, otherwise record a new clip
        if(clipModels.length) {
          self.list();
        } else {
          self.record(clipModels.currentId());
        }
        $('#loadingView').addClass('hidden');
        install.check({ onerror: logger.error });
      }).then(null, logger.error);
  },

  menu: function() {
    logger.log('menu', this);
    if (this.menuView) {
      this.menuView.update(this.getCurrentClip());
    }
    viewStack.showMenu();
  },

  getCurrentClip : function getCurrentClip() {
    var playView = this.playView, entry;

    if (playView) {
      entry = viewStack.peek();
      if (entry && entry.view === playView) {
        return playView.model.clip;
      }
    }
    return null;
  },

  play: function play(clipid) {
    var clip, cmd;

    logger.log('play', clipid);
    if (clipid) {
      if (!this.playView) {
        this.playView = new PlayView();
      }
      clip = clipModels.get(clipid);
      if (clip) {
        cmd = commands.get(clipid, PlayCmd.cmdid);
        if (!cmd) {
          cmd = commands.add(new PlayCmd({clip: clip, logger:new StatsLogger(clip)}));
        }
        if (this.playView.model !== cmd) {
          this.playView.model = cmd;
          this.playView.render();
        }
        viewStack.showView(this.playView, true);
        return 'commit';
      }
    }
    return 'rollback';
  },

  record: function record(clipid) {
    var clip, cmd;

    logger.log('record', clipid);
    if (clipid) {
      if (!this.recordView) {
        this.recordView = new RecordView();
      }
      clip = clipModels.get(clipid);
      if (!clip) {
        if (+clipModels.currentId() !== +clipid) {
          return 'rollback';
        }
        clip = clipModels.getNewClipModel();
      }
      cmd = commands.get(clipid, RecordCmd.cmdid);
      if (!cmd) {
        cmd = commands.add(new RecordCmd({clip: clip}));
      }
      if (this.recordView.model !== cmd) {
        this.recordView.model = cmd;
        this.recordView.render();
      }
      viewStack.showView(this.recordView, true);
      return 'commit';
    }
    return 'rollback';
  },

  list: function list() {
    logger.log('list');
    if (!this.clipListView) {
      this.clipListView = new ClipListView().render();
    }
    this.clipListView.update();
    return viewStack.showView(this.clipListView, true);
  },

  erase: function erase(clipid) {
    var self = this, clipModel;

    logger.log('erase', clipid);

    clipModel = clipModels.get(clipid);
    if (clipModel) {
      if (confirm(document.webL10n.get('erase', {clipName: clipModel.get('name')}))) {
        // If clips are available, go back to the clip list, otherwise record a new one
        if (clipModels.length >= 2) {
          // Display the list, then erase in order to have a CSS transition
          self.list()
           .then(function() { return clipModel.terminate(); })
           .then(null, logger.error);
        } else {
          clipModel.terminate()
           .then(function() { self.navigate('record/' + clipModels.currentId(), {trigger: true, replace: true}); })
           .then(null, logger.error);
        }
      } else {
        self.navigate("play/" + clipid, {trigger: true, replace: true});
      }
    }
  },

  export_: function export_(clipid) {
    var clip, cmd, self = this;
    logger.log('export', clipid);
    if (clipid) {
      if (!this.exportView) {
        this.exportView = new ExportView();
      }
      clip = clipModels.get(clipid);
      if (clip) {
        cmd = commands.get(clipid, ExportCmd.cmdid);
        if (!cmd) {
          cmd = ExportCmd.createExportCmd({ clip: clip })
            .then(function(cmd) {
              return commands.add(cmd);
            });
        } else {
          cmd = RSVP.Promise.resolve(cmd);
        }
        cmd
          .then(function(cmd) {
            self.exportView.model = cmd;
            self.exportView.render();
            viewStack.showView(self.exportView, true);
          })
          .then(null, logger.error);
        return 'commit';
      }
      return 'rollback';
    }
  },

  next: function next() {
    logger.log('next');
    this.clipIndex++;
    if (this.clipIndex >= clipModels.length) {
      this.clipIndex = 0;
    }
    this.navigate('play/' + clipModels.at(this.clipIndex).id, {trigger: true, replace: false});
  },

  previous: function previous() {
    logger.log('previous');
    this.clipIndex--;
    if (this.clipIndex < 0) {
      this.clipIndex = clipModels.length - 1;
    }
    this.navigate('play/' + clipModels.at(this.clipIndex).id, {trigger: true, replace: false});
  },

  factoryReset: function factoryReset() {
    var self = this;
    logger.log('factoryReset');
    if (confirm(document.webL10n.get('factorySettings'))) {
      if (!self.factoryResetView) {
        self.factoryResetView = new FactoryResetView();
      }
      commands.reset()
        .then(function() {
          return samples.getCounts();
        })
        .then(function(model) {
          self.factoryResetView.model = model;
          self.factoryResetView.render();
          return viewStack.showView(self.factoryResetView, true);
        })
        .then(function() {
          return clipModels.totalWipeOut(self.factoryResetView.model);
        })
        .then(function() {
          env.setReleaseMic('true');
          self.navigate('record/' + clipModels.currentId(), {trigger: true, replace: true});
        }).
        then(null, logger.error);
    } else {
      self.navigate('menu/', {trigger: true, replace: true});
    }
  },

  about: function about() {
    logger.log('about');
    if (!this.aboutView) {
      this.aboutView = new AboutView().render();
    }
    viewStack.showView(this.aboutView);
  },

  settings: function settings() {
    logger.log('settings');
    if (!this.settingsView) {
      this.settingsView = new SettingsView().render();
    }
    viewStack.showView(this.settingsView);
  },

  translations: function translations() {
    logger.log('translations');
    if (!this.translationsView) {
      this.translationsView = new LazyView({el : $('#translationsView')[0], path:'/data/translations.html'}).render();
    }
    viewStack.showView(this.translationsView);
  },

  legal: function legal() {
    logger.log('legal');
    if (!this.legalView) {
      this.legalView = new ViewBase({
        el : $('#legalView')[0], 
        events: { 'click #repo' : 'openUrl' }});
    } 
    viewStack.showView(this.legalView);
  },

  releaseNotes : function releaseNotes() {
    logger.log('releaseNotes');
    if (!this.releaseNotesView) {
      this.releaseNotesView = new LazyView({el : $('#releaseNotesView')[0], path:'/data/releaseNotes.html'}).render();
    }
    viewStack.showView(this.releaseNotesView);
  },

  gpl: function gpl() {
    logger.log('gpl');
    if (!this.gplView) {
      this.gplView = new LazyView({el : $('#gplView')[0], path:'/data/gpl-3.0-standalone.html'}).render();
    }
    viewStack.showView(this.gplView);
  },

  install : function install() {
    logger.log('install');
    install.install();
    this.navigate('about/', {trigger: true, replace: true});
  },

  update : function update() {
    logger.log('update');
    // Only FFOS supports update (in non-packaged hosted mode)
    // This occurs when manifest installed in the device
    // has older version than manifest updated by the appcache
    // a new mozApp.install is required (so that user can re-approve manifest.webapp)
    install.install();
    this.navigate('about/', {trigger: true, replace: true});
  }
});


