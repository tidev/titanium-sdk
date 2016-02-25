'use strict';


function _setTarget(grunt, name, options) {

  var config;
  var isMultiTask = name.indexOf('.') > -1;

  if (isMultiTask) {
    config = options;
  } else {
    config = {
      options: options
    };
  }

  grunt.config.set(name, config);

}

function extendBump(grunt, plugin, targets) {

  plugin(grunt);

  for (var key in targets) {
    if (targets.hasOwnProperty(key)) {
      _setTarget(grunt, key, targets[key]);
    }
  }

}

module.exports = extendBump;

