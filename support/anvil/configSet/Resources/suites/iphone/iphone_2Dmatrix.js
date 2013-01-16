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

	this.name = "iphone_2Dmatrix";
	this.tests = [
		{name: "testCreate2DMatrixValue"},
		{name: "testInvertValue"},
		{name: "testMultiplyValue"},
		{name: "testRotateValue"},
		{name: "testScaleValue"},
		{name: "testTranslateValue"}
	]

	this.testCreate2DMatrixValue = function(testRun) {
		var matrix1 = Ti.UI.create2DMatrix();
		valueOf(testRun, matrix1.a).shouldBe(1);
		valueOf(testRun, matrix1.b).shouldBe(0);
		valueOf(testRun, matrix1.c).shouldBe(0);
		valueOf(testRun, matrix1.d).shouldBe(1);
		valueOf(testRun, matrix1.tx).shouldBe(0);
		valueOf(testRun, matrix1.ty).shouldBe(0);

		finish(testRun);
	}

	this.testInvertValue = function(testRun) {
		var matrix1 = Ti.UI.create2DMatrix();
		matrix1.invert();
		valueOf(testRun, matrix1.a).shouldBe(1);
		valueOf(testRun, matrix1.b).shouldBe(0);
		valueOf(testRun, matrix1.c).shouldBe(0);
		valueOf(testRun, matrix1.d).shouldBe(1);
		valueOf(testRun, matrix1.tx).shouldBe(0);
		valueOf(testRun, matrix1.ty).shouldBe(0);

		finish(testRun);
	}

	this.testMultiplyValue = function(testRun) {
		var matrix1 = Ti.UI.create2DMatrix();
		var matrix2 = Ti.UI.create2DMatrix();
		matrix1 = matrix1.multiply(matrix1);
		valueOf(testRun, matrix1.a).shouldBe(1);
		valueOf(testRun, matrix1.b).shouldBe(0);
		valueOf(testRun, matrix1.c).shouldBe(0);
		valueOf(testRun, matrix1.d).shouldBe(1);
		valueOf(testRun, matrix1.tx).shouldBe(0);
		valueOf(testRun, matrix1.ty).shouldBe(0);
		matrix1 = matrix1.rotate(-180);
		matrix2 = matrix2.rotate(-90);
		matrix1 = matrix1.multiply(matrix2);
		valueOf(testRun, matrix1.a).shouldBe(0);
		valueOf(testRun, matrix1.b).shouldBe(1);
		valueOf(testRun, matrix1.c).shouldBe(-1);
		valueOf(testRun, matrix1.d).shouldBe(0);
		valueOf(testRun, matrix1.tx).shouldBe(0);
		valueOf(testRun, matrix1.ty).shouldBe(0);

		finish(testRun);
	}

	this.testRotateValue = function(testRun) {
		var matrix1 = Ti.UI.create2DMatrix();
		matrix1 = matrix1.rotate(-180);
		valueOf(testRun, matrix1.a).shouldBe(-1);
		valueOf(testRun, matrix1.b).shouldBe(0);
		valueOf(testRun, matrix1.c).shouldBe(0);
		valueOf(testRun, matrix1.d).shouldBe(-1);
		valueOf(testRun, matrix1.tx).shouldBe(0);
		valueOf(testRun, matrix1.ty).shouldBe(0);

		finish(testRun);
	}

	this.testScaleValue = function(testRun) {
		var matrix1 = Ti.UI.create2DMatrix();
		matrix1 = matrix1.scale(5, -5);
		valueOf(testRun, matrix1.a).shouldBe(5);
		valueOf(testRun, matrix1.b).shouldBe(0);
		valueOf(testRun, matrix1.c).shouldBe(0);
		valueOf(testRun, matrix1.d).shouldBe(-5);
		valueOf(testRun, matrix1.tx).shouldBe(0);
		valueOf(testRun, matrix1.ty).shouldBe(0);

		finish(testRun);
	}

	this.testTranslateValue = function(testRun) {
		var matrix1 = Ti.UI.create2DMatrix();
		matrix1 = matrix1.translate(5, -10);
		valueOf(testRun, matrix1.a).shouldBe(1);
		valueOf(testRun, matrix1.b).shouldBe(0);
		valueOf(testRun, matrix1.c).shouldBe(0);
		valueOf(testRun, matrix1.d).shouldBe(1);
		valueOf(testRun, matrix1.tx).shouldBe(5);
		valueOf(testRun, matrix1.ty).shouldBe(-10);

		finish(testRun);
	}
}
