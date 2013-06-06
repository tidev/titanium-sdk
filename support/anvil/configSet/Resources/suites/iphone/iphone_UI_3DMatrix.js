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

	this.name = "iphone_UI_3DMatrix";
	this.tests = [
		{name: "testInvert"},
		{name: "testMultiply"},
		{name: "testRotate"},
		{name: "testTranslate"},
		{name: "testScale"},
		{name: "testCreate3DMatrixValue"},
		{name: "testInvertValue"},
		{name: "testRotateValue"},
		{name: "testScaleValue"},
		{name: "testTranslateValue"},
		{name: "testMultiplyValue"}
	]

	this.testInvert = function(testRun) {
		var matrix1 = Ti.UI.create3DMatrix();
	    var matrix2 = Ti.UI.create3DMatrix();
	    valueOf(testRun, matrix1.invert()).shouldBeObject();
	    matrix1 = matrix1.scale(2, 2, 2);
	    valueOf(testRun, matrix1.invert()).shouldBeObject();
	    matrix1 = matrix1.rotate(90, 90, 90, 90);
	    valueOf(testRun, matrix1.invert()).shouldBeObject();
	    matrix1 = matrix1.translate(2, 2, 2);
	    valueOf(testRun, matrix1.invert()).shouldBeObject();
	    matrix1 = matrix1.multiply(matrix2);
	    valueOf(testRun, matrix1.invert()).shouldBeObject();

		finish(testRun);
	}

	this.testMultiply = function(testRun) {
		var matrix1 = Ti.UI.create3DMatrix();
	    var matrix2 = Ti.UI.create3DMatrix();
	    valueOf(testRun, matrix1.multiply(matrix2)).shouldBeObject();
	    valueOf(testRun, matrix1.multiply(matrix1)).shouldBeObject();

		finish(testRun);
	}

	this.testRotate = function(testRun) {
		var matrix1 = Ti.UI.create3DMatrix();
	    valueOf(testRun, matrix1.rotate(0, 0, 0, 0)).shouldBeObject();
	    valueOf(testRun, matrix1.rotate(90, 1, 0, 0)).shouldBeObject();
	    valueOf(testRun, matrix1.rotate(90, 0, 1, 0)).shouldBeObject();
	    valueOf(testRun, matrix1.rotate(90, 0, 0, 1)).shouldBeObject();
	    valueOf(testRun, matrix1.rotate(360.0, 0, 0, 0)).shouldBeObject();
	    valueOf(testRun, matrix1.rotate(360.0, 1.0, 0, 0)).shouldBeObject();
	    valueOf(testRun, matrix1.rotate(360.0, 0, 1.0, 0)).shouldBeObject();
	    valueOf(testRun, matrix1.rotate(360.0, 0, 0, 1.0)).shouldBeObject();
	    valueOf(testRun, matrix1.rotate(-180.0, -1.0, 0, 0)).shouldBeObject();
	    valueOf(testRun, matrix1.rotate(-180.0, 0, 0, 0)).shouldBeObject();
	    valueOf(testRun, matrix1.rotate(-720, 0, 0, 0)).shouldBeObject();
	    valueOf(testRun, matrix1.rotate(-0, 0, 0, 0)).shouldBeObject();

		finish(testRun);
	}

	this.testTranslate = function(testRun) {
		var matrix1 = Ti.UI.create3DMatrix();
	    valueOf(testRun, matrix1.translate(-1.0, 0, 0)).shouldBeObject();
	    valueOf(testRun, matrix1.translate(0, -1.0, 0)).shouldBeObject();
	    valueOf(testRun, matrix1.translate(0, 0, -1.0)).shouldBeObject();
	    valueOf(testRun, matrix1.translate(50.0, 50, 50.0)).shouldBeObject();
	    valueOf(testRun, matrix1.translate(50.0, -50, 50.0)).shouldBeObject();
	    valueOf(testRun, matrix1.translate(-50, 50.0, 50)).shouldBeObject();
	    valueOf(testRun, matrix1.translate(50.0, 50.0, -50.0)).shouldBeObject();
	    valueOf(testRun, matrix1.translate(-100, -100.0, 100)).shouldBeObject();
	    valueOf(testRun, matrix1.translate(-50.0, 50, -50.0)).shouldBeObject();
	    valueOf(testRun, matrix1.translate(-100, -100.0, -100)).shouldBeObject();

		finish(testRun);
	}

	this.testScale = function(testRun) {
		var matrix1 = Ti.UI.create3DMatrix();
	    valueOf(testRun, matrix1.scale()).shouldBeObject();
	    valueOf(testRun, matrix1.scale(1.0)).shouldBeObject();
	    valueOf(testRun, matrix1.scale(-1.0)).shouldBeObject();
	    valueOf(testRun, matrix1.scale(50.0, 50)).shouldBeObject();
	    valueOf(testRun, matrix1.scale(0, -1)).shouldBeObject();
	    valueOf(testRun, matrix1.scale(-10, -50.0)).shouldBeObject();
	    valueOf(testRun, matrix1.scale(50, 50.0, 50)).shouldBeObject();
	    valueOf(testRun, matrix1.scale(-50, 50, 50.0)).shouldBeObject();
	    valueOf(testRun, matrix1.scale(-50, 50, -50.0)).shouldBeObject();
	    valueOf(testRun, matrix1.scale(-50, -50, -50.0)).shouldBeObject();

		finish(testRun);
	}

	this.testCreate3DMatrixValue = function(testRun) {
		var matrix1 = Ti.UI.create3DMatrix();
	    valueOf(testRun, matrix1.m11).shouldBe(1);
	    valueOf(testRun, matrix1.m12).shouldBe(0);
	    valueOf(testRun, matrix1.m13).shouldBe(0);
	    valueOf(testRun, matrix1.m14).shouldBe(0);
	    valueOf(testRun, matrix1.m21).shouldBe(0);
	    valueOf(testRun, matrix1.m22).shouldBe(1);
	    valueOf(testRun, matrix1.m23).shouldBe(0);
	    valueOf(testRun, matrix1.m24).shouldBe(0);
	    valueOf(testRun, matrix1.m31).shouldBe(0);
	    valueOf(testRun, matrix1.m32).shouldBe(0);
	    valueOf(testRun, matrix1.m33).shouldBe(1);
	    valueOf(testRun, matrix1.m34).shouldBe(0);
	    valueOf(testRun, matrix1.m41).shouldBe(0);
	    valueOf(testRun, matrix1.m42).shouldBe(0);
	    valueOf(testRun, matrix1.m43).shouldBe(0);
	    valueOf(testRun, matrix1.m44).shouldBe(1);

		finish(testRun);
	}

	this.testInvertValue = function(testRun) {
		var matrix1 = Ti.UI.create3DMatrix();
	    matrix1.invert();
	    valueOf(testRun, matrix1.m11).shouldBe(1);
	    valueOf(testRun, matrix1.m12).shouldBe(0);
	    valueOf(testRun, matrix1.m13).shouldBe(0);
	    valueOf(testRun, matrix1.m14).shouldBe(0);
	    valueOf(testRun, matrix1.m21).shouldBe(0);
	    valueOf(testRun, matrix1.m22).shouldBe(1);
	    valueOf(testRun, matrix1.m23).shouldBe(0);
	    valueOf(testRun, matrix1.m24).shouldBe(0);
	    valueOf(testRun, matrix1.m31).shouldBe(0);
	    valueOf(testRun, matrix1.m32).shouldBe(0);
	    valueOf(testRun, matrix1.m33).shouldBe(1);
	    valueOf(testRun, matrix1.m34).shouldBe(0);
	    valueOf(testRun, matrix1.m41).shouldBe(0);
	    valueOf(testRun, matrix1.m42).shouldBe(0);
	    valueOf(testRun, matrix1.m43).shouldBe(0);
	    valueOf(testRun, matrix1.m44).shouldBe(1);

		finish(testRun);
	}

	this.testRotateValue = function(testRun) {
		var matrix1 = Ti.UI.create3DMatrix();
	    matrix1 = matrix1.rotate(-180, 50, 0, 0);
	    valueOf(testRun, matrix1.m11).shouldBe(1);
	    valueOf(testRun, matrix1.m12).shouldBe(0);
	    valueOf(testRun, matrix1.m13).shouldBe(0);
	    valueOf(testRun, matrix1.m14).shouldBe(0);
	    valueOf(testRun, matrix1.m21).shouldBe(0);
	    valueOf(testRun, matrix1.m22).shouldBe(-1);
	    valueOf(testRun, matrix1.m23).shouldBe(0);
	    valueOf(testRun, matrix1.m24).shouldBe(0);
	    valueOf(testRun, matrix1.m31).shouldBe(0);
	    valueOf(testRun, matrix1.m32).shouldBe(0);
	    valueOf(testRun, matrix1.m33).shouldBe(-1);
	    valueOf(testRun, matrix1.m34).shouldBe(0);
	    valueOf(testRun, matrix1.m41).shouldBe(0);
	    valueOf(testRun, matrix1.m42).shouldBe(0);
	    valueOf(testRun, matrix1.m43).shouldBe(0);
	    valueOf(testRun, matrix1.m44).shouldBe(1);

		finish(testRun);
	}

	this.testScaleValue = function(testRun) {
		var matrix1 = Ti.UI.create3DMatrix();
	    matrix1 = matrix1.scale(5, -5, 0);
	    valueOf(testRun, matrix1.m11).shouldBe(5);
	    valueOf(testRun, matrix1.m12).shouldBe(0);
	    valueOf(testRun, matrix1.m13).shouldBe(0);
	    valueOf(testRun, matrix1.m14).shouldBe(0);
	    valueOf(testRun, matrix1.m21).shouldBe(0);
	    valueOf(testRun, matrix1.m22).shouldBe(-5);
	    valueOf(testRun, matrix1.m23).shouldBe(0);
	    valueOf(testRun, matrix1.m24).shouldBe(0);
	    valueOf(testRun, matrix1.m31).shouldBe(0);
	    valueOf(testRun, matrix1.m32).shouldBe(0);
	    valueOf(testRun, matrix1.m33).shouldBe(0.00009999999747378752);
	    valueOf(testRun, matrix1.m34).shouldBe(0);
	    valueOf(testRun, matrix1.m41).shouldBe(0);
	    valueOf(testRun, matrix1.m42).shouldBe(0);
	    valueOf(testRun, matrix1.m43).shouldBe(0);
	    valueOf(testRun, matrix1.m44).shouldBe(1);

		finish(testRun);
	}

	this.testTranslateValue = function(testRun) {
		var matrix1 = Ti.UI.create3DMatrix();
	    matrix1 = matrix1.translate(5, -10, 5);
	    valueOf(testRun, matrix1.m11).shouldBe(1);
	    valueOf(testRun, matrix1.m12).shouldBe(0);
	    valueOf(testRun, matrix1.m13).shouldBe(0);
	    valueOf(testRun, matrix1.m14).shouldBe(0);
	    valueOf(testRun, matrix1.m21).shouldBe(0);
	    valueOf(testRun, matrix1.m22).shouldBe(1);
	    valueOf(testRun, matrix1.m23).shouldBe(0);
	    valueOf(testRun, matrix1.m24).shouldBe(0);
	    valueOf(testRun, matrix1.m31).shouldBe(0);
	    valueOf(testRun, matrix1.m32).shouldBe(0);
	    valueOf(testRun, matrix1.m33).shouldBe(1);
	    valueOf(testRun, matrix1.m34).shouldBe(0);
	    valueOf(testRun, matrix1.m41).shouldBe(5);
	    valueOf(testRun, matrix1.m42).shouldBe(-10);
	    valueOf(testRun, matrix1.m43).shouldBe(5);
        valueOf(testRun, matrix1.m44).shouldBe(1);

		finish(testRun);
	}

	this.testMultiplyValue = function(testRun) {
		var matrix1 = Ti.UI.create3DMatrix();
	    var matrix2 = Ti.UI.create3DMatrix();
	    matrix1 = matrix1.multiply(matrix1);
	    valueOf(testRun, matrix1.m11).shouldBe(1);
	    valueOf(testRun, matrix1.m12).shouldBe(0);
	    valueOf(testRun, matrix1.m13).shouldBe(0);
	    valueOf(testRun, matrix1.m14).shouldBe(0);
	    valueOf(testRun, matrix1.m21).shouldBe(0);
	    valueOf(testRun, matrix1.m22).shouldBe(1);
	    valueOf(testRun, matrix1.m23).shouldBe(0);
	    valueOf(testRun, matrix1.m24).shouldBe(0);
	    valueOf(testRun, matrix1.m31).shouldBe(0);
	    valueOf(testRun, matrix1.m32).shouldBe(0);
	    valueOf(testRun, matrix1.m33).shouldBe(1);
	    valueOf(testRun, matrix1.m34).shouldBe(0);
	    valueOf(testRun, matrix1.m41).shouldBe(0);
	    valueOf(testRun, matrix1.m42).shouldBe(0);
	    valueOf(testRun, matrix1.m43).shouldBe(0);
	    valueOf(testRun, matrix1.m44).shouldBe(1);
	    matrix1 = matrix1.rotate(-180, 1, 1, 1);
	    matrix2 = matrix2.rotate(-90, 1, 1, 1);
	    matrix1 = matrix1.multiply(matrix2);
	    valueOf(testRun, matrix1.m11).shouldBe(0.333333283662796);
	    valueOf(testRun, matrix1.m12).shouldBe(0.9106835126876831);
	    valueOf(testRun, matrix1.m13).shouldBe(-0.24401699006557465);
	    valueOf(testRun, matrix1.m14).shouldBe(0);
	    valueOf(testRun, matrix1.m21).shouldBe(-0.24401699006557465);
	    valueOf(testRun, matrix1.m22).shouldBe(0.333333283662796);
	    valueOf(testRun, matrix1.m23).shouldBe(0.9106835126876831);
	    valueOf(testRun, matrix1.m24).shouldBe(0);
	    valueOf(testRun, matrix1.m31).shouldBe(0.9106835126876831);
	    valueOf(testRun, matrix1.m32).shouldBe(-0.24401699006557465);
	    valueOf(testRun, matrix1.m33).shouldBe(0.333333283662796);
	    valueOf(testRun, matrix1.m34).shouldBe(0);
	    valueOf(testRun, matrix1.m41).shouldBe(0);
	    valueOf(testRun, matrix1.m42).shouldBe(0);
	    valueOf(testRun, matrix1.m43).shouldBe(0);
	    valueOf(testRun, matrix1.m44).shouldBe(1);

		finish(testRun);
	}
}
