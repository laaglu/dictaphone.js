define(['view/ViewBase', 'view/template/RecordTemplate', 'model/ClipModels', 'Recorder', 'AudioEnv', 'Logger'],
  function(ViewBase, RecordTemplate, clipModels, Recorder, env, logger) {

    "use strict";

    return ViewBase.extend({
      el: '#recordView',
      template: RecordTemplate,
      recordButton: null,
      events: {
        'click a[data-type="tapedeck"]': 'toggleRecord',
        'change input[data-l10n-id="name"]' : 'updateName'
      },
      render : function render() {
        var data = {};
        data.clip = this.model.toJSON();
        data.recording = this.model.isRecording();
        data.duration = this.model.getDuration();

        var tpl = $(this.template(data));
        document.webL10n.translate(tpl[0]);
        this.replaceContent(tpl);

        // Keep references to mutable DOM elements
        this.recordButton = this.$('a[data-type="tapedeck"] span');
        this.duration = this.$('input[data-l10n-id="duration"]');
        this.name = this.$('input[data-l10n-id="name"]');

        this.update(this.model);
        return this;
      },
      updateName : function updateName(e) {
        this.model.set('name', this.name.val());
      },
      toggleRecord : function toggleRecord(e) {
        if (this.model.isRecording()) {
          this.recordButton.addClass('icon-record');
          this.recordButton.removeClass('icon-stop');
          var terminate = function terminate() {
            // Display the clip list view
            location.hash = '#/list';
          }.bind(this);
          this.model.recorder.stop({ success: terminate, error:logger.error });
        } else {
          var ready = function ready(localMediaStream) {
            this.recordButton.addClass('icon-stop');
            this.recordButton.removeClass('icon-record');
            clipModels.nextId();
            clipModels.add(this.model);
            this.model.recorder = new Recorder({model: this.model});
            this.model.recorder.start(localMediaStream);
            this.update(this.model);
          }.bind(this);
          env.getLocalMediaStream({success: ready });
        }
      },
      update: function update(model) {
        // If the model has changed, do not update the UI
        if (this.model === model) {
          this.duration.val(this.model.getDuration());
          if (model.isRecording()) {
            requestAnimationFrame(update.bind(this, model));
          }
        }
      }
    });
  }
);
