define(['view/ViewBase', 'view/template/FactoryResetTemplate'],
  function(ViewBase, FactoryResetTemplate) {

    "use strict";

    return ViewBase.extend({
      el: '#factoryResetView',
      template: FactoryResetTemplate,
      render : function render() {
        this.total = this.getTotal();
        var tpl = $(this.template({total: this.total}));
        document.webL10n.translate(tpl[0]);
        this.replaceContent(tpl);
        this.progress = this.$('progress');
        this.update();
        return this;
      },
      getTotal : function getTotal() {
        return this.model.clipCount + this.model.sampleCount;
      },
      update: function update() {
        var value = this.total - this.getTotal();
        this.progress.val(value);
        if (value < this.total) {
          requestAnimationFrame(update.bind(this));
        }
      }
    });
  }
);
