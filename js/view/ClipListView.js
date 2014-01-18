define(['view/ViewBase', 'model/ClipModels', 'view/template/ClipListTemplate', 'view/ClipView', 'Logger'],
  function(ViewBase, clipModels, ClipListTemplate, ClipView, logger) {

    "use strict";

    return ViewBase.extend({
      el: '#clipListView',
      template: ClipListTemplate,
      initialize: function initialize() {
        this.collection = clipModels;
        this.listenTo(this.collection, 'add', function(clip) {
          // Cannot call addClip directly because the add notification
          // has a (model, collection, options) signature
          this.addClip(clip, false);
        });
        this.listenTo(this.collection, 'remove', this.removeClip);
        this.listenTo(this.collection, 'reset', this.reset);
      },

      /**
       * @param clip
       * @param skipTransition
       * skip the transition animation: true when
       * the method is invoked as a subroutine by render,
       * false when it is invoked on backbone 'add' event.
       */
      addClip: function addClip(clip, skipTransition) {
        logger.log('ClipListView.addClip', clip);
        var attributes = { 'data-id': clip.id};
        if (skipTransition !== true) {
          attributes.style = 'height:0;';
        }
        var clipView = new ClipView({model: clip, attributes: attributes}).render();
        this.$('ul').prepend(clipView.$el);
        if (skipTransition !== true) {
          this.defer(function() {
            clipView.$el.attr('style', null);
          });
        }
      },

      removeClip: function removeClip(clip) {
        logger.log('ClipListView.removeClip', clip, this);
        var sel = 'li[data-id="' + clip.id + '"]';
        var item = this.$(sel);
        //logger.log("sel", sel);
        //logger.log("Length", item.length);
        if (item.length) {
          this.deferTransition(function() {
            item.remove();
          }, item);
          item[0].style['height'] = 0;
        }
      },

      reset: function reset(/*collection, options*/) {
        logger.log('ClipListView.reset');
        this.$('ul').empty();
      },

      render: function render() {
        logger.log('ClipListView.render');

        var tpl = $(this.template({
          id : clipModels.currentId()
        }));
        document.webL10n.translate(tpl[0]);
        this.replaceContent(tpl);

        var i;
        for (i = this.collection.length - 1; i >= 0; i--) {
          this.addClip(this.collection.at(i), true);
        }
        return this;
      },
      update : function update() {
        this.$('menu[type="toolbar"] a').attr('href', '#/record/' + clipModels.currentId());
      }
    });
  }
);

