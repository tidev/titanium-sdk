/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "android_filesystem";
	this.tests = [
		{name: "externalStorageAPI"},
		{name: "filesInResourceDirectoryExists"},
		{name: "filesInApplicationDataDirectoryExists"}
	]

	this.externalStorageAPI = function(testRun) {
		valueOf(testRun, Ti.Filesystem.isExternalStoragePresent).shouldBeFunction();
		valueOf(testRun, Ti.Filesystem.externalStoragePresent).shouldBeBoolean();

		finish(testRun);
	}

	// http://jira.appcelerator.org/browse/TIMOB-4469
	this.filesInResourceDirectoryExists = function(testRun) {
		var resourcesFileDoesExist = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'app.js');
		var resourcesFileDoesNotExist = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'this-file-does-not-exist.js');

		valueOf(testRun, resourcesFileDoesExist.exists()).shouldBeTrue();
		valueOf(testRun, resourcesFileDoesNotExist.exists()).shouldBeFalse();

		finish(testRun);
	}

	this.filesInApplicationDataDirectoryExists = function(testRun) {
		var newDirectory = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory,'newDir');
		newDirectory.createDirectory();

		var newFile = Ti.Filesystem.getFile(newDirectory.getNativePath(),'this-file-exists.js');
		newFile.write("testing a file");

		var appDataFileDoesExist = Ti.Filesystem.getFile(newDirectory.getNativePath(), 'this-file-exists.js');
		var appDataFileDoesNotExist = Ti.Filesystem.getFile(newDirectory.getNativePath(), 'this-file-does-not-exist.js');

		valueOf(testRun, newDirectory.isDirectory()).shouldBeTrue();
		valueOf(testRun, newDirectory.exists()).shouldBeTrue();
		valueOf(testRun, appDataFileDoesExist.exists()).shouldBeTrue();
		valueOf(testRun, appDataFileDoesNotExist.exists()).shouldBeFalse();

		finish(testRun);
	}
}
