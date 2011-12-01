/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Warning: This file is GENERATED, and should not be modified
 */
var bootstrap = require("bootstrap"),
	lazyGet = bootstrap.lazyGet,
	addInvocationAPI = bootstrap.addInvocationAPI,
	invoker = require("invoker");

var extModule = module.exports = kroll.externalModule("%(moduleClass)s");

extModule.invocationAPIs = [];
extModule.apiName = "%(moduleName)s";

function bootstrapModule(module) {
	%(invocationJS)s
	%(bootstrapJS)s
}

bootstrapModule(extModule);
