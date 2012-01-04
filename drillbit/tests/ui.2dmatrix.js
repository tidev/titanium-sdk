describe("Ti.UI.2DMatrix tests", {
	testInvert: function() {
		var matrix1 = Ti.UI.create2DMatrix();
		var matrix2 = Ti.UI.create2DMatrix();
		valueOf(matrix1.invert()).shouldBeObject();
		matrix1 = matrix1.scale(2, 2);
		valueOf(matrix1.invert()).shouldBeObject();
		matrix1 = matrix1.rotate(90);
		valueOf(matrix1.invert()).shouldBeObject();
		matrix1 = matrix1.translate(2, 2);
		valueOf(matrix1.invert()).shouldBeObject();
		matrix1 = matrix1.multiply(matrix2);
		valueOf(matrix1.invert()).shouldBeObject();
	},
	
	testMultiply: function() {
		var matrix1 = Ti.UI.create2DMatrix();
		var matrix2 = Ti.UI.create2DMatrix();
		valueOf(matrix1.multiply(matrix2)).shouldBeObject();
		valueOf(matrix1.multiply(matrix1)).shouldBeObject();
		matrix1 = matrix1.rotate(90);
		matrix2 = matrix2.scale(2,1);
		var matrix3 = matrix1.multiply(matrix2);
		valueOf(matrix3.finalValuesAfterInterpolation(50,100)).shouldBe("Matrix{[0.0, -2.0, 150.0][1.0, 0.0, 25.0][0.0, 0.0, 1.0]}");
	},
	
	testRotate: function() {
		var matrix1 = Ti.UI.create2DMatrix();
		valueOf(matrix1.rotate(0)).shouldBeObject();
		valueOf(matrix1.rotate(90)).shouldBeObject();
		valueOf(matrix1.rotate(360.0)).shouldBeObject();
		valueOf(matrix1.rotate(-180.0)).shouldBeObject();
		valueOf(matrix1.rotate(-720)).shouldBeObject();
		valueOf(matrix1.rotate(-0)).shouldBeObject();
	},
	
	testScale: function() {
		var matrix1 = Ti.UI.create2DMatrix();
		valueOf(matrix1.scale()).shouldBeObject();
		valueOf(matrix1.scale(-1.0)).shouldBeObject();
		valueOf(matrix1.scale(50.0, 50)).shouldBeObject();
		valueOf(matrix1.scale(0, -1)).shouldBeObject();
		valueOf(matrix1.scale(-100, -100.0)).shouldBeObject();
	},
	
	testTranslate: function() {
		var matrix1 = Ti.UI.create2DMatrix();
		valueOf(matrix1.translate(-1.0, 0)).shouldBeObject();
		valueOf(matrix1.translate(50.0, 50)).shouldBeObject();
		valueOf(matrix1.translate(0, -1)).shouldBeObject();
		valueOf(matrix1.translate(-100, -100.0)).shouldBeObject();
	}
});
		
		