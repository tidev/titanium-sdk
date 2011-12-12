Ti._5.createClass('Ti.UI.2DMatrix', function(args) {
	var obj = this;

	// Initialize the matrix to unity
	require.mix(obj, {
		a: 1,
		b: 0,
		c: 0,
		d: 1,
		tx: 0,
		ty: 0
	}, args);

	// Internal methods
	function _multiplyInternal(a, b, c, d, tx, ty) {
		return Ti.UI.create2DMatrix({
			a: obj.a * a + obj.b * c,
			b: obj.a * b + obj.b * d,
			c: obj.c * a + obj.d * c,
			d: obj.c * b + obj.d * d,
			tx: obj.a * tx + obj.b * ty + obj.tx,
			ty: obj.c * tx + obj.d * ty + obj.ty
		});
	}
	
	this.toCSS = function() {
		// Round off the elements because scientific notation in CSS isn't allowed (apparently)
		var roundedValues = [obj.a.toFixed(6), obj.b.toFixed(6), obj.c.toFixed(6), obj.d.toFixed(6), obj.tx.toFixed(6), obj.ty.toFixed(6)];

		// Firefox requires tx and ty to have "px" postfixed, but the other browsers require it *not* to be there.
		if (navigator.userAgent.indexOf("Firefox") !== -1) {
			roundedValues[4] += "px";
			roundedValues[5] += "px";
		}

		return "matrix(" + roundedValues.join(",") + ")";
	};

	this.fromCSS = function(matrixString) {
		var parsedString = matrixString.replace(/^matrix\((.+)\)$/, function(x, y){ return y; }).split(",");
		obj.a = parseFloat(parsedString[0] | 0);
		obj.b = parseFloat(parsedString[1] | 0);
		obj.c = parseFloat(parsedString[2] | 0);
		obj.d = parseFloat(parsedString[3] | 0);
		obj.tx = parseFloat(parsedString[4] | 0);
		obj.ty = parseFloat(parsedString[5] | 0);
	};

	// Methods
	this.invert = function() {
		console.debug('Method "Titanium.UI.2DMatrix#.invert" is not implemented yet.');
	};
	this.multiply = function(m) {
		return _multiplyInternal(m.a, m.b, m.c, m.d, m.tx, m.ty);
	};
	this.rotate = function(angle) {
		// Math.* trig functions take radians, so convert from degrees first
		var angleInRadians = angle * Math.PI / 180;
		return _multiplyInternal(Math.cos(angleInRadians), Math.sin(angleInRadians), -Math.sin(angleInRadians), Math.cos(angleInRadians), 0, 0);
	};
	this.scale = function(sx, sy) {
		return _multiplyInternal(sx, 0, 0, sy, 0, 0);
	};
	this.translate = function(tx, ty) {
		return _multiplyInternal(1, 0, 0, 1, tx, ty);
	};
});