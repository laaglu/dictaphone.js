exports.config = {
  conventions: {
    assets: function(path) {
      return /^assets/.test(path) &&
       !(/manifest\.properties$/.test(path) || /translation\.properties$/.test(path));
    }
  },
  paths: {
    'public' : '../dictaphone-brunch',
    watched: [
      'app', 'styles', 'assets'
    ]
  },
  files: {
    javascripts: {
      joinTo: {
        'app.js': function(path) {
          return /^app/.test(path);
        },
        'vendor.js': function(path) {
          //console.log('VENDOR', path);
          return /^(?!app)/.test(path);
        }
      },
      order: {
        before: [
          'bower_components/jquery/jquery.js',
          'bower_components/underscore/underscore.js',
          'bower_components/backbone/backbone.js',
          'bower_components/backbone/backbone-indexeddb.js',
          'bower_components/webL10n/l10n.js'
        ]
      }
    },
    stylesheets: {
      joinTo: {
        'app.css' : /^styles/
      }
    },
    templates: {
      defaultExtension: 'hbs',
      joinTo: {
        'app.js': /^app/
      }
    }
  },
  plugins: {
    appcache: {
      manifestFile: 'index.appcache',
      network:[],
      ignore:/manifest\.properties|translation\.properties$/
    }
  },
  server: {
    port:2345
  }
};

