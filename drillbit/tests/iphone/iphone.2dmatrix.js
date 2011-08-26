describe("iPhone.UI.2DMatrix tests", {
	testCreate2DMatrixValue: function() {
		var matrix1 = Ti.UI.create2DMatrix();
		valueOf(matrix1.a).shouldBe(1);
		valueOf(matrix1.b).shouldBe(0);
		valueOf(matrix1.c).shouldBe(0);
		valueOf(matrix1.d).shouldBe(1);
		valueOf(matrix1.tx).shouldBe(0);
		valueOf(matrix1.ty).shouldBe(0);
	},
	
	testInvertValue: function() {
		var matrix1 = Ti.UI.create2DMatrix();
		matrix1.invert();
		valueOf(matrix1.a).shouldBe(1);
		valueOf(matrix1.b).shouldBe(0);
		valueOf(matrix1.c).shouldBe(0);
		valueOf(matrix1.d).shouldBe(1);
		valueOf(matrix1.tx).shouldBe(0);
		valueOf(matrix1.ty).shouldBe(0);
	},
	
	testMultiplyValue: function() {
		var matrix1 = Ti.UI.create2DMatrix();
		var matrix2 = Ti.UI.create2DMatrix();
		matrix1 = matrix1.multiply(matrix1);
		valueOf(matrix1.a).shouldBe(1);
		valueOf(matrix1.b).shouldBe(0);
		valueOf(matrix1.c).shouldBe(0);
		valueOf(matrix1.d).shouldBe(1);
		valueOf(matrix1.tx).shouldBe(0);
		valueOf(matrix1.ty).shouldBe(0);
		matrix1 = matrix1.rotate(-180);
		matrix2 = matrix2.rotate(-90);
		matrix1 = matrix1.multiply(matrix2);
		valueOf(matrix1.a).shouldBe(0);
		valueOf(matrix1.b).shouldBe(1);
		valueOf(matrix1.c).shouldBe(-1);
		valueOf(matrix1.d).shouldBe(0);
		valueOf(matrix1.tx).shouldBe(0);
		valueOf(matrix1.ty).shouldBe(0);
	},
	
	testRotateValue: function() {
		var matrix1 = Ti.UI.create2DMatrix();
		matrix1 = matrix1.rotate(-180);
		valueOf(matrix1.a).shouldBe(-1);
		valueOf(matrix1.b).shouldBe(0);
		valueOf(matrix1.c).shouldBe(0);
		valueOf(matrix1.d).shouldBe(-1);
		valueOf(matrix1.tx).shouldBe(0);
		valueOf(matrix1.ty).shouldBe(0);
	},
	
	testScaleValue: function() {
		var matrix1 = Ti.UI.create2DMatrix();
		matrix1 = matrix1.scale(5, -5);
		valueOf(matrix1.a).shouldBe(5);
		valueOf(matrix1.b).shouldBe(0);
		valueOf(matrix1.c).shouldBe(0);
		valueOf(matrix1.d).shouldBe(-5);
		valueOf(matrix1.tx).shouldBe(0);
		valueOf(matrix1.ty).shouldBe(0);
	},
	
	testTranslateValue: function() {
		var matrix1 = Ti.UI.create2DMatrix();
		matrix1 = matrix1.translate(5, -10);
		valueOf(matrix1.a).shouldBe(1);
		valueOf(matrix1.b).shouldBe(0);
		valueOf(matrix1.c).shouldBe(0);
		valueOf(matrix1.d).shouldBe(1);
		valueOf(matrix1.tx).shouldBe(5);
		valueOf(matrix1.ty).shouldBe(-10);
	}
});