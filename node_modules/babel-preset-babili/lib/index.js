"use strict";

var isPlainObject = require("lodash.isplainobject");

var _require = require("./options-manager"),
    group = _require.group,
    option = _require.option,
    proxy = _require.proxy,
    generate = _require.generate;

// the flat plugin map
// This is to prevent dynamic requires - require('babel-plugin-' + name);
// as it suffers during bundling of this code with webpack/browserify


var PLUGINS = [["booleans", require("babel-plugin-transform-minify-booleans"), true], ["consecutiveAdds", require("babel-plugin-transform-inline-consecutive-adds"), true], ["deadcode", require("babel-plugin-minify-dead-code-elimination"), true], ["evaluate", require("babel-plugin-minify-constant-folding"), true], ["flipComparisons", require("babel-plugin-minify-flip-comparisons"), true], ["guards", require("babel-plugin-minify-guarded-expressions"), true], ["infinity", require("babel-plugin-minify-infinity"), true], ["mangle", require("babel-plugin-minify-mangle-names"), true], ["memberExpressions", require("babel-plugin-transform-member-expression-literals"), true], ["mergeVars", require("babel-plugin-transform-merge-sibling-variables"), true], ["numericLiterals", require("babel-plugin-minify-numeric-literals"), true], ["propertyLiterals", require("babel-plugin-transform-property-literals"), true], ["regexpConstructors", require("babel-plugin-transform-regexp-constructors"), true], ["removeConsole", require("babel-plugin-transform-remove-console"), false], ["removeDebugger", require("babel-plugin-transform-remove-debugger"), false], ["removeUndefined", require("babel-plugin-transform-remove-undefined"), true], ["replace", require("babel-plugin-minify-replace"), true], ["simplify", require("babel-plugin-minify-simplify"), true], ["simplifyComparisons", require("babel-plugin-transform-simplify-comparison-operators"), true], ["typeConstructors", require("babel-plugin-minify-type-constructors"), true], ["undefinedToVoid", require("babel-plugin-transform-undefined-to-void"), true], ["builtIns", require("babel-plugin-minify-builtins"), true]];

module.exports = preset;

function preset(context) {
  var _opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var opts = isPlainObject(_opts) ? _opts : {};

  // to track every plugin is used
  var usedPlugins = new Set();

  var optionsMap = PLUGINS.map(function (plugin) {
    return option(plugin[0], plugin[1], plugin[2]);
  }).reduce(function (acc, cur) {
    Object.defineProperty(acc, cur.name, {
      get() {
        usedPlugins.add(cur.name);
        return cur;
      }
    });
    return acc;
  }, {});

  var optionsTree = group("options", [optionsMap.evaluate, optionsMap.deadcode, group("unsafe", [optionsMap.flipComparisons, optionsMap.simplifyComparisons, optionsMap.guards, optionsMap.typeConstructors]), optionsMap.infinity, optionsMap.mangle, optionsMap.numericLiterals, optionsMap.replace, optionsMap.simplify, optionsMap.builtIns, group("properties", [optionsMap.consecutiveAdds, optionsMap.memberExpressions, optionsMap.propertyLiterals]), optionsMap.mergeVars, optionsMap.booleans, optionsMap.undefinedToVoid, optionsMap.regexpConstructors, optionsMap.removeConsole, optionsMap.removeDebugger, optionsMap.removeUndefined, proxy("keepFnName", [optionsMap.mangle, optionsMap.deadcode]), proxy("keepClassName", [optionsMap.mangle, optionsMap.deadcode])], "some");

  // verify all plugins are used
  if (usedPlugins.size !== PLUGINS.length) {
    var unusedPlugins = PLUGINS.filter(function (plugin) {
      return !usedPlugins.has(plugin[0]);
    }).map(function (plugin) {
      return plugin[0];
    });
    throw new Error("Some imported plugins unused\n" + unusedPlugins);
  }

  var plugins = generate(optionsTree, opts);

  return {
    minified: true,
    comments: false,
    presets: [{ plugins }],
    passPerPreset: true
  };
}