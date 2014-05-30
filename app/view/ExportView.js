/**********************************************
 * Copyright (C) 2014 Lukas Laag
 * This file is part of dictaphone.js.
 * 
 * dictaphone.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * dictaphone.js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with dictaphone.js.  If not, see http://www.gnu.org/licenses/
 **********************************************/
'use strict';

/* global document, $, requestAnimationFrame, location*/

var ViewBase = require('./ViewBase');
var ExportTemplate = require('./template/ExportTemplate');
var logger = require('Logger');

module.exports = ViewBase.extend({
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
      console.log('COMPLETION', completion, model.isExporting());
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

// TODO: bloquer le bouton si le filename est invalide (taille zéro, caractères interdits...)
// TODO: afficher une notif à la fin de l'export en cas de succès ou d'erreur.
// TODO: rendre le filename non editable quand l'export a démarré.
