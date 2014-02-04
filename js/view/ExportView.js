define(['view/ViewBase', 'view/template/ExportTemplate', 'model/ClipModels', 'Logger'],
  function(ViewBase, ExportTemplate, clipModels, logger) {

    "use strict";
    return ViewBase.extend({
      el: '#exportView',
      template: ExportTemplate,
      exportButton: null,
      events: {
        'click a[data-type="tapedeck"]': 'toggleExport',
        'change input[data-l10n-id="name"]' : 'updateName'
      },
      render : function render() {
        var data = {};
        data.fileName = this.model.exporter.fileName;
        data.clip = this.model.toJSON();
        data.exporting = this.model.isExporting();
        var tpl = $(this.template(data));
        document.webL10n.translate(tpl[0]);
        this.replaceContent(tpl);

        this.progress = $('progress');
        this.exportButton = this.$('a[data-type="tapedeck"] span');
        this.fileNameInput = $('input[data-l10n-id="fileName"]');

        this.update(this.model);
        return this;
      },
      updateName : function updateName(e) {
        logger.log('updateName', e);
      },
      toggleExport : function toggleExport(e) {
        logger.log('toggleExport', e);
        if (this.model.isExporting()) {
          this.exportButton.addClass('icon-export');
          this.exportButton.removeClass('icon-stop');
          this.fileNameInput.attr('disabled', null);
          this.model.exporter.abort();
        } else {
          this.exportButton.addClass('icon-stop');
          this.exportButton.removeClass('icon-export');
          this.fileNameInput.attr('disabled', 'true');
          this.model.exporter.export_();
        }
        this.update(this.model);
      },
      update: function update(model) {
        var totalSize, completion;
        totalSize = +this.model.get('totalSize');
        // If the model has changed, do not update the UI
        if (this.model === model) {
          completion = model.exporter.processedSize / totalSize;
          this.progress.val(completion);
          if (model.isExporting()) {
            requestAnimationFrame(update.bind(this, model));
          } else if (completion >= 1) {
            // Discard the exporter object
            this.model.exporter = null;
            // Display the clip list view
            location.hash = '#/list';
          }
        }
      }
    });
  }
);
