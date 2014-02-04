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

/* global Backbone, $, document, location */

var viewStack = require('ViewStack');
var Player = require('Player');
var Exporter = require('Exporter');
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
var env = require('./AudioEnv');

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

  initialize : function() {
    var stage1 = function stage1() {
      console.log('Stage 1 init complete');
      samples.init({success: stage2.bind(this), error:console.error});
    };
    var stage2 = function stage2() {
      console.log('Stage 2 init complete');
      this.menuView = new MenuView().render();

      // The current clip index to power back / forward buttons in the play view
      this.clipIndex = 0;

      // If clips are available, show the clip list, otherwise record a new clip
      if(clipModels.length) {
        this.list();
      } else {
        this.record(clipModels.currentId());
      }
      $('#loadingView').addClass('hidden');
      install.check({
        onerror: function onerror(e) {
          logger.error(e);
        }
      });
    };
    clipModels.fetch({success: stage1.bind(this), error:console.error});
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
        return playView.model;
      }
    }
    return null;
  },

  play: function play(clipid) {
    var clipModel;

    logger.log('play', clipid);
    if (clipid) {
      if (!this.playView) {
        this.playView = new PlayView();
      }
      clipModel = clipModels.get(clipid);
      if (clipModel) {
        if (this.playView.model !== clipModel) {
          this.playView.model = clipModel;
          if (!clipModel.player) {
            clipModel.player = new Player({clip: clipModel, logger:new StatsLogger(clipModel)});
          }
          this.playView.render();
        }
        viewStack.showView(this.playView, true);
      }
    }
  },

  record: function record(clipid) {
    var clipModel;

    logger.log('record', clipid);
    if (clipid) {

      if (!this.recordView) {
        this.recordView = new RecordView();
      }
      clipModel = clipModels.get(clipid);
      if (!clipModel) {
        clipModel = clipModels.getNewClipModel();
      }
      this.recordView.model = clipModel;
      this.recordView.render();
      viewStack.showView(this.recordView, true);
    }
  },

  list: function list(callback) {
    logger.log('list');
    if (!this.clipListView) {
      this.clipListView = new ClipListView().render();
    }
    this.clipListView.update();
    viewStack.showView(this.clipListView, true, callback);
  },

  erase: function erase(clipid) {
    var clipModel;

    logger.log('erase', clipid);

    clipModel = clipModels.get(clipid);
    if (clipModel) {
      if (confirm(document.webL10n.get('erase', {clipName: clipModel.get('name')}))) {
        // If clips are available, go back to the clip list, otherwise record a new one
        if (clipModels.length >= 2) {
          // Display the list, then erase in order to have a CSS transition
          this.list(function() { clipModel.terminate({}); });
        } else {
          clipModel.terminate(
            {
              success: function() {
                this.record(clipModels.currentId());
              }.bind(this)
            }
          );
        }
      } else {
        this.navigate("play/" + clipid, {trigger: true, replace: true});
      }
    }
  },

  export_: function export_(clipid) {
    var clipModel;

    logger.log('export', clipid);
    if (clipid) {

      if (!this.exportView) {
        this.exportView = new ExportView();
      }
      clipModel = clipModels.get(clipid);
      if (clipModel) {
        var exporterReady = function exporterReady() {
          this.exportView.model = clipModel;
          this.exportView.render();
          viewStack.showView(this.exportView, true);
        }.bind(this);
        if (!clipModel.exporter) {
          Exporter.createExporter({
            clip: clipModel,
            success: function(exporter) {
              clipModel.exporter = exporter;
              exporterReady();
            },
            error: logger.error
          });
        } else {
          exporterReady();
        }
      }
    }
  },

  next: function next() {
    logger.log('next');
    this.clipIndex++;
    if (this.clipIndex >= clipModels.length) {
      this.clipIndex = 0;
    }
    location.hash = '#/play/' + clipModels.at(this.clipIndex).id;
  },

  previous: function previous() {
    logger.log('previous');
    this.clipIndex--;
    if (this.clipIndex < 0) {
      this.clipIndex = clipModels.length - 1;
    }
    location.hash = '#/play/' + clipModels.at(this.clipIndex).id;
  },

  factoryReset: function factoryReset() {
    logger.log('factoryReset');
    if (confirm(document.webL10n.get('factorySettings'))) {
      if (!this.factoryResetView) {
        this.factoryResetView = new FactoryResetView();
      }

      var countReady = function countReady(model) {
        var done = function done() {
          env.setReleaseMic('true');
          this.record(clipModels.currentId());
        }.bind(this);

        var totalWipeOut = function totalWipeOut() {
          clipModels.totalWipeOut(model, done);
        }.bind(this);

        this.factoryResetView.model = model;
        this.factoryResetView.render();
        viewStack.showView(this.factoryResetView, true, totalWipeOut);
      }.bind(this);

      var count = function count() {
        samples.getCounts(countReady);
      }.bind(this);

      clipModels.stopAll({ success: count, error: logger.error });
    } else {
      location.hash = '#/menu';
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
    location.hash = '#/about';
  },

  update : function update() {
    logger.log('update');
    // Only FFOS supports update (in non-packaged hosted mode)
    // This occurs when manifest installed in the device
    // has older version than manifest updated by the appcache
    // a new mozApp.install is required (so that user can re-approve manifest.webapp)
    install.install();
    location.hash = '#/about';
  }
});


