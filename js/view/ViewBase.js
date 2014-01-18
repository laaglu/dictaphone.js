define(['backbone'],
  function(Backbone) {

    "use strict";

    return Backbone.View.extend({
      /**
       * Replaces the contents of $el with the contents of another element
       * @param element
       */
      replaceContent : function(element) {
        this.$el.children().remove();
        this.$el.append(element.children());
      },
      defer: function(f) {
        setTimeout(f, 50);
      },
      deferTransition: function(f, el) {
        (el ? el : this.$el).one('transitionend', f);
      },
      setHPos: function setHPos(pos) {
        this.$el.removeClass('hleft hmid hright');
        this.$el.addClass(pos);
      },
      setZPos: function setZPos(pos) {
        this.$el.removeClass('ztop zmid');
        this.$el.addClass(pos);
      },
      hasHTransition: function hasHTransition() {
        return this.hasClass('htransition')
      },
      setHTransition: function setHTransition(transition) {
        if (transition) {
          this.$el.addClass('htransition');
        } else {
          this.$el.removeClass('htransition');
        }
      },
      isVisible: function isVisible() {
        return !this.hasClass('hidden')
      },
      setVisible: function setVisible(visible) {
        if (visible) {
          this.$el.removeClass('hidden');
        } else {
          this.$el.addClass('hidden');
        }
      },
      hasClass: function hasClass(className) {
        return this.$el.hasClass(className);
      }
    });
  }
);