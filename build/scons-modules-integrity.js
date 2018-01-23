#!/usr/bin/env node
'use strict';

const async = require('async'),
	utils = require('./utils'),
	modules = require('../support/module/packaged/modules.json');

const platforms = Object.keys(modules);
async.map(platforms, (platform, platformNext) => {
	const platformModuleNames = Object.keys(modules[platform]);
	async.map(platformModuleNames, (modName, modNext) => {
		const modObj = modules[platform][modName];
		utils.generateSSRIHashFromURL(modObj.url, function (e, hash) {
			if (e) {
				return modNext(e);
			}
			const obj = {};
			modObj.integrity = hash;
			obj[modName] = modObj;
			modNext(null, obj);
		});
	}, (e, mods) => {
		if (e) {
			return platformNext(e);
		}
		// Merge the modules array into a single object
		const merged = Object.assign({}, ...mods);
		const platformObj = {};
		platformObj[platform] = merged;
		return platformNext(null, platformObj);
	});
}, (e, results) => {
	if (e) {
		console.error(e);
		process.exit(1);
	}
	// Merge the platforms array into a single object
	const merged = Object.assign({}, ...results);
	console.log(JSON.stringify(merged));
});
