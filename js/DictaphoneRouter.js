define([
  'jquery',
  'backbone',
  'ViewStack',
  'Player',
  'model/Installation',
  'model/ClipModels',
  'model/Samples',
  'view/MenuView',
  'view/PlayView',
  'view/RecordView',
  'view/ClipListView',
  'view/FactoryResetView',
  'view/ViewBase',
  'view/LazyView',
  'view/AboutView',
  'Logger',
  'StatsLogger'],
  function(
    $,
    Backbone,
    viewStack,
    Player,
    install,
    clipModels,
    samples,
    MenuView,
    PlayView,
    RecordView,
    ClipListView,
    FactoryResetView,
    ViewBase,
    LazyView,
    AboutView,
    logger,
    StatsLogger) {

    "use strict";

    return Backbone.Router.extend({
      routes: {
        'play/:clipid':               'play',
        'record/:clipid':             'record',
        'menu':                       'menu',
        'list':                       'list',
        'erase/:clipid':              'erase',
        'next':                       'next',
        'previous':                   'previous',
        'factoryReset':               'factoryReset',
        'about':                      'about',
        'legal':                      'legal',
        'install':                    'install',
        'update':                     'update',
        'releaseNotes':               'releaseNotes',
        'gpl':                        'gpl',
        'source':                     'source'
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
          this.menuView.update();
        }
        viewStack.showMenu();
      },

      play: function(clipid) {
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

      record: function(clipid) {
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

      list: function(callback) {
        logger.log('list');
        if (!this.clipListView) {
          this.clipListView = new ClipListView().render();
        }
        this.clipListView.update();
        viewStack.showView(this.clipListView, true, callback);
      },

      erase: function(clipid) {
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

      next: function() {
        logger.log('next');
        this.clipIndex++;
        if (this.clipIndex >= clipModels.length) {
          this.clipIndex = 0;
        }
        location.hash = '#/play/' + clipModels.at(this.clipIndex).id;
      },

      previous: function() {
        logger.log('previous');
        this.clipIndex--;
        if (this.clipIndex < 0) {
          this.clipIndex = clipModels.length - 1;
        }
        location.hash = '#/play/' + clipModels.at(this.clipIndex).id;
      },

      factoryReset: function() {
        logger.log('factoryReset');
        if (confirm(document.webL10n.get('factorySettings'))) {
          if (!this.factoryResetView) {
            this.factoryResetView = new FactoryResetView();
          }

          var countReady = function countReady(model) {
            var done = function done() {
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

      about: function() {
        logger.log('about');
        if (!this.aboutView) {
          this.aboutView = new AboutView().render();
        }
        viewStack.showView(this.aboutView);
      },

      legal: function() {
        var states = [];
        logger.log('legal');
        if (!this.legalView) {
          this.legalView = new ViewBase({el : $('#legalView')[0]});
        }
        viewStack.showView(this.legalView);
      },

      releaseNotes : function() {
        logger.log('releaseNotes');
        if (!this.releaseNotesView) {
          this.releaseNotesView = new LazyView({el : $('#releaseNotesView')[0], path:'/data/releaseNotes.html'}).render();
        }
        viewStack.showView(this.releaseNotesView);
      },

      gpl: function() {
        logger.log('gpl');
        if (!this.gplView) {
          this.gplView = new LazyView({el : $('#gplView')[0], path:'/data/gpl-3.0-standalone.html'}).render();
        }
        viewStack.showView(this.gplView);
      },

      source: function() {
        logger.log('source');
        if (!this.sourceView) {
          this.sourceView = new LazyView({el : $('#sourceView')[0], path:'/data/source.html'}).render();
        }
        viewStack.showView(this.sourceView);
      },

      install : function() {
        logger.log('install');
        install.install();
        location.hash = '#/about';
      },

      update : function() {
        logger.log('update');
        // Only FFOS supports update (in non-packaged hosted mode)
        // This occurs when manifest installed in the device
        // has older version than manifest updated by the appcache
        // a new mozApp.install is required (so that user can re-approve manifest.webapp)
        install.install();
        location.hash = '#/about';
      }
    });
  }
);
