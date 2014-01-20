define(['view/ViewBase', 'view/template/PrereqTemplate'],
  function(ViewBase, PrereqTemplate) {

    "use strict";

    return ViewBase.extend({
      el: '#prereqView',
      template: PrereqTemplate,
      render : function render() {
        var tpl = $(this.template(this.model));
        document.webL10n.translate(tpl[0]);
        this.replaceContent(tpl);
        return this;
      }
    });
  }
);
