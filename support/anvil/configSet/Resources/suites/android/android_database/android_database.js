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

	this.name = "android_database";
	this.tests = [
		{name: "dataKeepsPrecision"}
	]

	this.dataKeepsPrecision = function(testRun) {
		var longData = 109951162777512099;
		var doubleData = 1.2345678901234567;
		var db = Ti.Database.install("test.db", "test_dataKeepsPrecision");

		var rs = db.execute("select * from data");
		valueOf(testRun, rs.isValidRow()).shouldBeTrue();

		valueOf(testRun, rs.getFieldByName("longdata")).shouldBe(longData);
		valueOf(testRun, rs.getFieldByName("doubledata")).shouldBe(doubleData);

		finish(testRun);
	}
}
