define([], function() {
  var DeviceStorageUtils = {
    /**
     * @param options
     * storage: device storage name (music, images...)
     * path: path for the enumerate call
     * options: path for the options call
     * success: a success callback(File[])
     * error: error callback(Error)
     */
    ls : function ls(options) {
      var files = {},
        storage = navigator.getDeviceStorage(options.storage);
        fileReq = storage.enumerate(options.path, options.options);
      fileReq.onsuccess = function onsuccess() {
        var file = this.result, path, name;
        if (file) {
          path = file.name;
          name = path.substring( 1 + path.lastIndexOf('/'));
          files[name] = file;
          fileReq.continue();
        } else if (typeof options.success === 'function') {
          options.success(files);
        }
      };
      fileReq.onerror = options.error;
    },
    /**
     * Returns a name derived from the supplied name and which
     * is guaranteed not to be in names. The derived name has
     * the form: <basename>-<incr>[.ext]
     * @param {string} name The to test for unicity.
     * @param {Object} names A hash of names
     * @returns {string}
     */
    uniqueName : function uniqueName(name, names) {
      var index = names.lastIndexOf('.'),
        extension = index != -1 ? name.substring(1 + index) : null,
        baseName = index != -1 ? name.substring(0, index) : name,
        uniqueName = name,
        count = 0,
        parts;
      while(uniqueName in names) {
        parts = [baseName, '-', count++];
        if (extension) {
          parts.push('.', extension);
        }
        uniqueName = parts.join('');
      }
      return uniqueName;
    }
  };

  return DeviceStorageUtils;
});
