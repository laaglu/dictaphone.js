define(['backbone', 'model/dbconfig', 'model/ClipModel', 'model/Samples', 'AudioEnv'],
  function(Backbone, dbconfig, ClipModel, samples, env) {

    "use strict";
    var CLIP_MODEL_SEQ = 'clipModelSeq';
    var ClipModels = Backbone.Collection.extend({
      database: dbconfig,
      storeName: 'clip',
      model : ClipModel,
      newClip : null,
      comparator : function comparator(l1, l2) {
        // The clip view is sorted to display most recently played clips first.
        // If a clip has never been played, it creation date is taken into account instead.
        var d1 = l1.has('lastPlayed') ? l1.get('lastPlayed') : l1.get('creationDate');
        var d2 = l2.has('lastPlayed') ? l2.get('lastPlayed') : l2.get('creationDate');
        return +d2 - +d1;
      },
      getNewClipModel: function getNewClipModel() {
        if (!this.newClip) {
          var clipid = this.currentId();
          this.newClip = new ClipModel({
            id: clipid,
            name: document.webL10n.get('clip') + '-' + clipid,
            sampleRate: env.context.sampleRate
          });
        }
        return this.newClip;
      },
      currentId: function currentId() {
        return localStorage.getItem(CLIP_MODEL_SEQ) || 1;
      },
      nextId: function nextId() {
        var id = this.currentId();
        localStorage.setItem(CLIP_MODEL_SEQ, ++id);
        this.newClip = null;
        return id;
      },
      totalWipeOut: function totalWipeOut(status, callback) {
        var deleteNext = function deleteNext() {
          if (clipModels.length == 0) {
            clipModels.reset();
            localStorage.clear();
            clipModels.newClip = null;
            if (typeof callback === 'function') {
              callback();
            }
            return;
          }
          clipModels.at(0).terminate({
            success: deleteNext,
            status: status
          });
        };
        deleteNext();
      },

      /**
       * @param options
       * success: success callback
       * error: error callback
       */
      stopAll: function stopAll(options) {
        var stack = [], model;

        // Stop pending playing and recording clips
        this.each(function(clip /*, key, list*/) {
          if (clip.isPlaying()) {
            clip.player.stop();
          } else if (clip.isRecording()) {
            stack.push(clip);
          }
        });

        var stopRecording = function stopRecording() {
          if (stack.length) {
            model = stack.pop();
            model.recorder.stop({ success: stopRecording, error: options.error });
          } else if (options && typeof options.success === 'function') {
            options.success();
          }
        }.bind(this);

        stopRecording();
      }
    });
    var clipModels = new ClipModels();
    return clipModels;
  }
);
