({
  appDir: "./",
  baseUrl: "js",
  dir: "../dictaphone.js.optimized",
  name: "main",
  include: "vendor/almond",
  optimize: 'uglify2',
  optimizeCss: 'standard',
  preserveLicenseComments: false,
  generateSourceMaps: false,
  removeCombined: true,
  paths: {
    jquery: 'vendor/jquery-1.10.2.min',
    underscore: 'vendor/underscore',
    backbone: 'vendor/backbone',
    moment: 'vendor/moment-langs-2.2.1.min',
    handlebars: 'vendor/handlebars'
  },
  shim: {
    'jquery': {
      exports: '$'
    },
    'handlebars': {
      exports: 'Handlebars'
    }
  }
})