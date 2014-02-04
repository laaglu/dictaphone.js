define(['DeviceStorageUtils, Logger'], function(DeviceStorageUtils, logger) {
  function FileHandleWriter(exporter) {
    this.exporter = exporter;
  }
  /**
   * The exporter object
   * @type {Exporter}
   */
  TypedArrayWriter.prototype.exporter = null;

  /**
   * Returns a default name for the exported clip
   */
  FileHandleWriter.defaultExportName = function defaultExportName(options) {
    DeviceStorageUtils.ls({
        storage:'music',
        path:'dictaphone',
        success: function(files) {
          var exportName = DeviceStorageUtils.uniqueName(this.exporter.clip.get('name') + '.wav', files);
          if (typeof(options.success) === 'function') {
            options.success(exportName);
          }
        }.bind(this),
        error: options.error || logger.error
      }
    );
  };

  /**
   * Writes a buffer of data into the wav file
   * @param options
   * success: callback if the write operation succeeds
   * error: callback if the write operation fails
   * data: {ArrayBuffer} a buffer containing the data to write
   * updateSize: {boolean} true to update the number of processed bytes
   */
  FileHandleWriter.writeData = function writeData(options) {
    var lastLoaded = 0,
      fileReq = this.fileHandle.append(options.data);
    fileReq.onsuccess = options.success;
    fileReq.onerror = options.error;
    fileReq.onprogress = function(status) {
      if (options.updateSize) {
        this.exporter.processedSize += status.loaded - lastLoaded;
      }
      lastLoaded = status.loaded;
    }.bind(this);
  };

  FileHandleWriter.prototype.finalize = function finalize(options) {
  };


  return FileHandleWriter;
});

// faire un fileHandle.flush ?

//  var music = navigator.getDeviceStorage('music');
//  var file   = new Blob([], {type: 'audio/wav'});
//
//  var request = music.addNamed(file, 'dictaphone.js/' + clipModel.get('name') + '.wav');
//
//  request.onsuccess = function () {
//    var name = this.result;
//    console.log('File "' + name + '" successfully wrote on the file storage area');
//  }
//
//  // An error typically occur if a file with the same name already exist
//  request.onerror = function () {
//    console.warn('Unable to write the file: ' + this.error);

// TODO: Determiner un nom via:
//  var instanceOfDOMCursor = instanceOfDeviceStorage.enumerateEditable([path][, options]);
// filehandle.truncate
// TODO: Gestion du abort en supprimant le fichier en écriture du device storage.
//  }
