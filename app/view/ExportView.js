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

/* global document, $, requestAnimationFrame, window */

var ViewBase = require('./ViewBase');
var ExportTemplate = require('./template/ExportTemplate');
var logger = require('Logger');
var commands = require('cmd/Commands');
var status = require('status').status;

module.exports = ViewBase.extend({
  el: '#exportView',
  template: ExportTemplate,
  exportButton: null,
  exportIcon: null,
  events: {
    'click a[data-type="tapedeck"]': 'toggleExport',
    'input input[data-l10n-id="fileName"]' : 'updateName'
  },
  render : function render() {
    var data = {};
    data.fileName = this.model.fileName;
    data.clip = this.model.clip.toJSON();
    data.exporting = this.model.running;
    var tpl = $(this.template(data));
    document.webL10n.translate(tpl[0]);
    this.replaceContent(tpl);

    this.progress = $('progress');
    this.exportButton = this.$('a[data-type="tapedeck"]');
    this.exportIcon = $('span', this.exportButton);
    this.fileNameInput = $('input[data-l10n-id="fileName"]');

    this.update(this.model);
    return this;
  },
  updateName : function updateName(e) {
    if (e.target.value.length) {
      if (this.exportButton.attr('aria-disabled')) {
        this.exportButton.removeAttr('aria-disabled');
      }
    } else {
      if (!this.exportButton.attr('aria-disabled')) {
        this.exportButton.attr('aria-disabled', 'true');
      }
    }
  },
  toggleExport : function toggleExport(e) {
    var self = this;
    logger.log('toggleExport', e);
    if (self.model.running) {
      self.fileNameInput.prop('disabled', false);
      self.exportIcon.addClass('icon-export');
      self.exportIcon.removeClass('icon-stop');
      self.fileNameInput.attr('disabled', null);
      self.model.stop()
        .then(function() {
          commands.remove(self.model);
          // Display the clip list view
          window.router.navigate('list', {trigger: true, replace: true});
        })
        .then(null, function(err) {
          logger.error(err);
          status.show(document.webL10n.get('exportError', {fileName: err}), 2000);
        });
    } else {
      self.fileNameInput.prop('disabled', true);
      self.exportIcon.addClass('icon-stop');
      self.exportIcon.removeClass('icon-export');
      self.fileNameInput.attr('disabled', 'true');
      self.model.export_();
    }
    self.update(self.model);
  },
  update: function update(model) {
    var totalSize, completion;
    totalSize = +this.model.clip.get('totalSize');
    // If the model has changed, do not update the UI
    if (this.model === model) {
      completion = model.processedSize / totalSize;
      this.progress.val(completion);
      console.log('COMPLETION', completion, model.running);
      if (model.running) {
        requestAnimationFrame(update.bind(this, model));
      } else if (completion >= 1) {
        // Display the clip list view
        window.router.list().then(function() {
          status.show(document.webL10n.get('exportDone', {fileName: model.fileName}), 2000);
          window.router.navigate('list', {trigger: false, replace: true});
        });
      }
    }
  }
});
