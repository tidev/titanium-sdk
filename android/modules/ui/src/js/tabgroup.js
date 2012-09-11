/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var PersistentHandle = require('ui').PersistentHandle;

exports.bootstrap = function(Titanium) {

  var TabGroup = Titanium.UI.TabGroup;

  function createTabGroup(scopeVars, options) {
    var tabGroup = new TabGroup(options);
    tabGroup.tabs = [];
    return tabGroup;
  }

  Titanium.UI.createTabGroup = createTabGroup;

  var _open = TabGroup.prototype.open;
  TabGroup.prototype.open = function(options) {
    // Retain the tab group until is has closed.
    var handle = new PersistentHandle(this);
    this.on('close', function() {
      handle.dispose();
    });

    _open.call(this, options);
  }

  var _addTab = TabGroup.prototype.addTab;
  TabGroup.prototype.addTab = function(tab) {
    this.tabs.push(tab);
    _addTab.call(this, tab);
  }

  TabGroup.prototype.getTabs = function() {
    return this.tabs;
  }

}

