define(['view/ViewBase', 'view/template/PlayTemplate', 'model/ClipModels', 'seekbars', 'Logger'],
  function(ViewBase, PlayTemplate, clipModels, utils, logger) {

    "use strict";
    return ViewBase.extend({
      el: '#playView',
      template: PlayTemplate,
      playButton: null,
      events: {
        'click a[data-type="tapedeck"]': 'togglePlay',
        'change input[data-l10n-id="name"]' : 'updateName',
        'change #volumeSlider' : 'volumeChange',
        'mousedown #positionSlider' : 'positionDown',
        'mouseup #positionSlider' : 'positionUp',
        'touchstart #positionSlider' : 'positionDown',
        'touchend #positionSlider' : 'positionUp'

      },
      render : function render() {
        var data = {};
        data.clip = this.model.toJSON();
        data.playing = this.model.isPlaying();
        data.duration = this.model.getDuration();
        data.position = this.model.player.clipTime;
        data.volume = this.model.player.getVolume();

        var tpl = $(this.template(data));
        document.webL10n.translate(tpl[0]);
        this.replaceContent(tpl);

        return this;
      },
      lazyRender: function lazyRender() {
        // Keep references to mutable DOM elements
        this.playButton = this.$('a[data-type="tapedeck"] span');
        utils.seekbars.init();
        this.volumeSlider = utils.seekbars.bind(document.getElementById('volumeSlider'));
        this.positionSlider = utils.seekbars.bind(document.getElementById('positionSlider'));
        this.name = this.$('input[data-l10n-id="name"]');

        this.update(this.model);
      },
      updateName : function updateName(e) {
        this.model.set('name', this.name.val());
        this.model.save({});
      },
      volumeChange : function volumeChange(e) {
        logger.log('volumeChange', this.volumeSlider.getValue());
        this.model.player.setVolume(this.volumeSlider.getValue());
      },
      positionDown : function positionDown(e) {
        logger.log('positionDown', this.positionSlider.getValue());
        if (this.model.isPlaying()) {
          this.togglePlay(null);
          this.suspended = true;
        }
      },
      positionUp : function positionUp(e) {
        logger.log('positionUp', this.positionSlider.getValue());
        if (this.suspended) {
          this.togglePlay(null);
          this.suspended = false;
        }
      },
      togglePlay : function togglePlay(e) {
        logger.log('togglePlay', this.positionSlider.getValue());
        if (this.model.isPlaying()) {
          this.model.player.stop();
        } else {
          this.model.player.start(this.positionSlider.getValue());
        }
        this.update(this.model);
      },
      update: function update(model) {
        // If the model has changed, do not update the UI
        if (this.model === model) {
          this.positionSlider.setValue(model.player.clipTime);
          if (model.isPlaying()) {
            this.playButton.addClass('icon-pause');
            this.playButton.removeClass('icon-play');
            requestAnimationFrame(update.bind(this, model));
          } else {
            this.playButton.addClass('icon-play');
            this.playButton.removeClass('icon-pause');
          }
        }
      }
    });
  }
);
