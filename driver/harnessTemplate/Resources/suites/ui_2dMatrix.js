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

	this.name = "ui_2dMatrix";
	this.tests = [
		{name: "testInvert"},
		{name: "testMultiply"},
		{name: "testRotate"},
		{name: "testScale"},
		{name: "testTranslate"},
	]

	this.testInvert = function(testRun) {
		var matrix1 = Ti.UI.create2DMatrix();
		var matrix2 = Ti.UI.create2DMatrix();
		valueOf(testRun, matrix1.invert()).shouldBeObject();
		matrix1 = matrix1.scale(2, 2);
		valueOf(testRun, matrix1.invert()).shouldBeObject();
		matrix1 = matrix1.rotate(90);
		valueOf(testRun, matrix1.invert()).shouldBeObject();
		matrix1 = matrix1.translate(2, 2);
		valueOf(testRun, matrix1.invert()).shouldBeObject();
		matrix1 = matrix1.multiply(matrix2);
		valueOf(testRun, matrix1.invert()).shouldBeObject();

		finish(testRun);
	}

	this.testMultiply = function(testRun) {
		var matrix1 = Ti.UI.create2DMatrix();
		var matrix2 = Ti.UI.create2DMatrix();
		valueOf(testRun, matrix1.multiply(matrix2)).shouldBeObject();
		valueOf(testRun, matrix1.multiply(matrix1)).shouldBeObject();
		if (Ti.Platform.osname === 'android') {
			matrix1 = matrix1.rotate(90);
			matrix2 = matrix2.scale(2,1);
			var matrix3 = matrix1.multiply(matrix2);
			var values = matrix3.finalValuesAfterInterpolation(50,100);
			valueOf(testRun, values[0]).shouldBe(0.0);
			valueOf(testRun, values[1]).shouldBe(-2.0);
			valueOf(testRun, values[2]).shouldBe(125.0);
			valueOf(testRun, values[3]).shouldBe(1.0);
			valueOf(testRun, values[4]).shouldBe(0.0);
			valueOf(testRun, values[5]).shouldBe(25.0);
			valueOf(testRun, values[6]).shouldBe(0.0);
			valueOf(testRun, values[7]).shouldBe(0.0);
			valueOf(testRun, values[8]).shouldBe(1.0);
		}

		finish(testRun);
	}

	this.testRotate = function(testRun) {
		var matrix1 = Ti.UI.create2DMatrix();
		valueOf(testRun, matrix1.rotate(0)).shouldBeObject();
		valueOf(testRun, matrix1.rotate(90)).shouldBeObject();
		valueOf(testRun, matrix1.rotate(360.0)).shouldBeObject();
		valueOf(testRun, matrix1.rotate(-180.0)).shouldBeObject();
		valueOf(testRun, matrix1.rotate(-720)).shouldBeObject();
		valueOf(testRun, matrix1.rotate(-0)).shouldBeObject();

		finish(testRun);
	}

	this.testScale = function(testRun) {
		var matrix1 = Ti.UI.create2DMatrix();
		valueOf(testRun, matrix1.scale()).shouldBeObject();
		valueOf(testRun, matrix1.scale(-1.0)).shouldBeObject();
		valueOf(testRun, matrix1.scale(50.0, 50)).shouldBeObject();
		valueOf(testRun, matrix1.scale(0, -1)).shouldBeObject();
		valueOf(testRun, matrix1.scale(-100, -100.0)).shouldBeObject();

		finish(testRun);
	}

	this.testTranslate = function(testRun) {
		var matrix1 = Ti.UI.create2DMatrix();
		valueOf(testRun, matrix1.translate(-1.0, 0)).shouldBeObject();
		valueOf(testRun, matrix1.translate(50.0, 50)).shouldBeObject();
		valueOf(testRun, matrix1.translate(0, -1)).shouldBeObject();
		valueOf(testRun, matrix1.translate(-100, -100.0)).shouldBeObject();

		finish(testRun);
	}
}
