describe("Ti.UI.iOS.3DMatrix Tests", {

    testInvert: function() {
	    var matrix1 = Ti.UI.iOS.create3DMatrix();
	    var matrix2 = Ti.UI.iOS.create3DMatrix();
	    valueOf(matrix1.invert()).shouldBeObject();
	    matrix1 = matrix1.scale(2, 2, 2);
	    valueOf(matrix1.invert()).shouldBeObject();
	    matrix1 = matrix1.rotate(90, 90, 90, 90);
	    valueOf(matrix1.invert()).shouldBeObject();
	    matrix1 = matrix1.translate(2, 2, 2);
	    valueOf(matrix1.invert()).shouldBeObject();
	    matrix1 = matrix1.multiply(matrix2);
	    valueOf(matrix1.invert()).shouldBeObject();
    },
    
    testMultiply: function() {
	    var matrix1 = Ti.UI.iOS.create3DMatrix();
	    var matrix2 = Ti.UI.iOS.create3DMatrix();
	    valueOf(matrix1.multiply(matrix2)).shouldBeObject();
	    valueOf(matrix1.multiply(matrix1)).shouldBeObject();
    },

    testRotate: function() {
	    var matrix1 = Ti.UI.iOS.create3DMatrix();
	    valueOf(matrix1.rotate(0, 0, 0, 0)).shouldBeObject();
	    valueOf(matrix1.rotate(90, 1, 0, 0)).shouldBeObject();
	    valueOf(matrix1.rotate(90, 0, 1, 0)).shouldBeObject();
	    valueOf(matrix1.rotate(90, 0, 0, 1)).shouldBeObject();
	    valueOf(matrix1.rotate(360.0, 0, 0, 0)).shouldBeObject();
	    valueOf(matrix1.rotate(360.0, 1.0, 0, 0)).shouldBeObject();
	    valueOf(matrix1.rotate(360.0, 0, 1.0, 0)).shouldBeObject();
	    valueOf(matrix1.rotate(360.0, 0, 0, 1.0)).shouldBeObject();
	    valueOf(matrix1.rotate(-180.0, -1.0, 0, 0)).shouldBeObject();
	    valueOf(matrix1.rotate(-180.0, 0, 0, 0)).shouldBeObject();
	    valueOf(matrix1.rotate(-720, 0, 0, 0)).shouldBeObject();
	    valueOf(matrix1.rotate(-0, 0, 0, 0)).shouldBeObject();
    },
    
    testTranslate: function() {
	    var matrix1 = Ti.UI.iOS.create3DMatrix();
	    valueOf(matrix1.translate(-1.0, 0, 0)).shouldBeObject();
	    valueOf(matrix1.translate(0, -1.0, 0)).shouldBeObject();
	    valueOf(matrix1.translate(0, 0, -1.0)).shouldBeObject();
	    valueOf(matrix1.translate(50.0, 50, 50.0)).shouldBeObject();
	    valueOf(matrix1.translate(50.0, -50, 50.0)).shouldBeObject();
	    valueOf(matrix1.translate(-50, 50.0, 50)).shouldBeObject();
	    valueOf(matrix1.translate(50.0, 50.0, -50.0)).shouldBeObject();
	    valueOf(matrix1.translate(-100, -100.0, 100)).shouldBeObject();
	    valueOf(matrix1.translate(-50.0, 50, -50.0)).shouldBeObject();
	    valueOf(matrix1.translate(-100, -100.0, -100)).shouldBeObject();
    },
    
    testScale: function() {
	    var matrix1 = Ti.UI.iOS.create3DMatrix();
	    valueOf(matrix1.scale()).shouldBeObject();
	    valueOf(matrix1.scale(1.0)).shouldBeObject();
	    valueOf(matrix1.scale(-1.0)).shouldBeObject();
	    valueOf(matrix1.scale(50.0, 50)).shouldBeObject();
	    valueOf(matrix1.scale(0, -1)).shouldBeObject();
	    valueOf(matrix1.scale(-10, -50.0)).shouldBeObject();
	    valueOf(matrix1.scale(50, 50.0, 50)).shouldBeObject();
	    valueOf(matrix1.scale(-50, 50, 50.0)).shouldBeObject();
	    valueOf(matrix1.scale(-50, 50, -50.0)).shouldBeObject();
	    valueOf(matrix1.scale(-50, -50, -50.0)).shouldBeObject();
    },
    
    testCreate3DMatrixValue: function() {
	    var matrix1 = Ti.UI.iOS.create3DMatrix();
	    valueOf(matrix1.m11).shouldBe(1);
	    valueOf(matrix1.m12).shouldBe(0);
	    valueOf(matrix1.m13).shouldBe(0);
	    valueOf(matrix1.m14).shouldBe(0);
	    valueOf(matrix1.m21).shouldBe(0);
	    valueOf(matrix1.m22).shouldBe(1);
	    valueOf(matrix1.m23).shouldBe(0);
	    valueOf(matrix1.m24).shouldBe(0);
	    valueOf(matrix1.m31).shouldBe(0);
	    valueOf(matrix1.m32).shouldBe(0);
	    valueOf(matrix1.m33).shouldBe(1);
	    valueOf(matrix1.m34).shouldBe(0);
	    valueOf(matrix1.m41).shouldBe(0);
	    valueOf(matrix1.m42).shouldBe(0);
	    valueOf(matrix1.m43).shouldBe(0);
	    valueOf(matrix1.m44).shouldBe(1);              
    },
    
    testInvertValue: function() {
	    var matrix1 = Ti.UI.iOS.create3DMatrix();
	    matrix1.invert();
	    valueOf(matrix1.m11).shouldBe(1);
	    valueOf(matrix1.m12).shouldBe(0);
	    valueOf(matrix1.m13).shouldBe(0);
	    valueOf(matrix1.m14).shouldBe(0);
	    valueOf(matrix1.m21).shouldBe(0);
	    valueOf(matrix1.m22).shouldBe(1);
	    valueOf(matrix1.m23).shouldBe(0);
	    valueOf(matrix1.m24).shouldBe(0);
	    valueOf(matrix1.m31).shouldBe(0);
	    valueOf(matrix1.m32).shouldBe(0);
	    valueOf(matrix1.m33).shouldBe(1);
	    valueOf(matrix1.m34).shouldBe(0);
	    valueOf(matrix1.m41).shouldBe(0);
	    valueOf(matrix1.m42).shouldBe(0);
	    valueOf(matrix1.m43).shouldBe(0);
	    valueOf(matrix1.m44).shouldBe(1); 
    },

    testRotateValue: function() {
	    var matrix1 = Ti.UI.iOS.create3DMatrix();
	    matrix1 = matrix1.rotate(-180, 50, 0, 0);
	    valueOf(matrix1.m11).shouldBe(1);
	    valueOf(matrix1.m12).shouldBe(0);
	    valueOf(matrix1.m13).shouldBe(0);
	    valueOf(matrix1.m14).shouldBe(0);
	    valueOf(matrix1.m21).shouldBe(0);
	    valueOf(matrix1.m22).shouldBe(-1);
	    valueOf(matrix1.m23).shouldBe(0);
	    valueOf(matrix1.m24).shouldBe(0);
	    valueOf(matrix1.m31).shouldBe(0);
	    valueOf(matrix1.m32).shouldBe(0);
	    valueOf(matrix1.m33).shouldBe(-1);
	    valueOf(matrix1.m34).shouldBe(0);
	    valueOf(matrix1.m41).shouldBe(0);
	    valueOf(matrix1.m42).shouldBe(0);
	    valueOf(matrix1.m43).shouldBe(0);
	    valueOf(matrix1.m44).shouldBe(1);
    },

    testScaleValue: function() {
	    var matrix1 = Ti.UI.iOS.create3DMatrix();
	    matrix1 = matrix1.scale(5, -5, 0);
	    valueOf(matrix1.m11).shouldBe(5);
	    valueOf(matrix1.m12).shouldBe(0);
	    valueOf(matrix1.m13).shouldBe(0);
	    valueOf(matrix1.m14).shouldBe(0);
	    valueOf(matrix1.m21).shouldBe(0);
	    valueOf(matrix1.m22).shouldBe(-5);
	    valueOf(matrix1.m23).shouldBe(0);
	    valueOf(matrix1.m24).shouldBe(0);
	    valueOf(matrix1.m31).shouldBe(0);
	    valueOf(matrix1.m32).shouldBe(0);
	    valueOf(matrix1.m33).shouldBe(0.00009999999747378752);
	    valueOf(matrix1.m34).shouldBe(0);
	    valueOf(matrix1.m41).shouldBe(0);
	    valueOf(matrix1.m42).shouldBe(0);
	    valueOf(matrix1.m43).shouldBe(0);
	    valueOf(matrix1.m44).shouldBe(1);
    },

    testTranslateValue: function() {
	    var matrix1 = Ti.UI.iOS.create3DMatrix();
	    matrix1 = matrix1.translate(5, -10, 5);
	    valueOf(matrix1.m11).shouldBe(1);
	    valueOf(matrix1.m12).shouldBe(0);
	    valueOf(matrix1.m13).shouldBe(0);
	    valueOf(matrix1.m14).shouldBe(0);
	    valueOf(matrix1.m21).shouldBe(0);
	    valueOf(matrix1.m22).shouldBe(1);
	    valueOf(matrix1.m23).shouldBe(0);
	    valueOf(matrix1.m24).shouldBe(0);
	    valueOf(matrix1.m31).shouldBe(0);
	    valueOf(matrix1.m32).shouldBe(0);
	    valueOf(matrix1.m33).shouldBe(1);
	    valueOf(matrix1.m34).shouldBe(0);
	    valueOf(matrix1.m41).shouldBe(5);
	    valueOf(matrix1.m42).shouldBe(-10);
	    valueOf(matrix1.m43).shouldBe(5);
        valueOf(matrix1.m44).shouldBe(1);
   },
    
   testMultiplyValue: function() {
	    var matrix1 = Ti.UI.iOS.create3DMatrix();
	    var matrix2 = Ti.UI.iOS.create3DMatrix();
	    matrix1 = matrix1.multiply(matrix1);
	    valueOf(matrix1.m11).shouldBe(1);
	    valueOf(matrix1.m12).shouldBe(0);
	    valueOf(matrix1.m13).shouldBe(0);
	    valueOf(matrix1.m14).shouldBe(0);
	    valueOf(matrix1.m21).shouldBe(0);
	    valueOf(matrix1.m22).shouldBe(1);
	    valueOf(matrix1.m23).shouldBe(0);
	    valueOf(matrix1.m24).shouldBe(0);
	    valueOf(matrix1.m31).shouldBe(0);
	    valueOf(matrix1.m32).shouldBe(0);
	    valueOf(matrix1.m33).shouldBe(1);
	    valueOf(matrix1.m34).shouldBe(0);
	    valueOf(matrix1.m41).shouldBe(0);
	    valueOf(matrix1.m42).shouldBe(0);
	    valueOf(matrix1.m43).shouldBe(0);
	    valueOf(matrix1.m44).shouldBe(1);
	    matrix1 = matrix1.rotate(-180, 1, 1, 1);
	    matrix2 = matrix2.rotate(-90, 1, 1, 1);
	    matrix1 = matrix1.multiply(matrix2);
	    valueOf(matrix1.m11).shouldBe(0.333333283662796);
	    valueOf(matrix1.m12).shouldBe(0.9106835126876831);
	    valueOf(matrix1.m13).shouldBe(-0.24401699006557465);
	    valueOf(matrix1.m14).shouldBe(0);
	    valueOf(matrix1.m21).shouldBe(-0.24401699006557465);
	    valueOf(matrix1.m22).shouldBe(0.333333283662796);
	    valueOf(matrix1.m23).shouldBe(0.9106835126876831);
	    valueOf(matrix1.m24).shouldBe(0);
	    valueOf(matrix1.m31).shouldBe(0.9106835126876831);
	    valueOf(matrix1.m32).shouldBe(-0.24401699006557465);
	    valueOf(matrix1.m33).shouldBe(0.333333283662796);
	    valueOf(matrix1.m34).shouldBe(0);
	    valueOf(matrix1.m41).shouldBe(0);
	    valueOf(matrix1.m42).shouldBe(0);
	    valueOf(matrix1.m43).shouldBe(0);
	    valueOf(matrix1.m44).shouldBe(1);
   }
    
});