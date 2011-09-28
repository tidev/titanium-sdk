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
    }
    
});