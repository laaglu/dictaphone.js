define(['view/ViewBase', 'view/template/MenuTemplate', 'model/ClipModels'],
  function(ViewBase, MenuTemplate, clipModels) {

    "use strict";

    return ViewBase.extend({
      el: '#menuView',
      template: MenuTemplate,
      render : function() {
        var tpl = $(this.template({ id: clipModels.currentId() }));
        document.webL10n.translate(tpl[0]);
        this.replaceContent(tpl);
        return this;
      },
      update : function() {
        this.$('a[data-l10n-id="newClip"]').attr('href', '#/record/' + clipModels.currentId());
      }
    });
  }
);

