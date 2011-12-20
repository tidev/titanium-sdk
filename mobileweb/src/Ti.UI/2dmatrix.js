Ti._5.createClass("Ti.UI.2DMatrix", function(prev, matrix) {
	var obj = this,
		ti2d = Ti.UI["2DMatrix"],
		isFF = Ti.Platform.runtime === "gecko";

	require.mix(obj, {
		a: 1,
		b: 0,
		c: 0,
		d: 1,
		tx: 0,
		ty: 0,
		rotation: 0,
		prev: prev
	}, matrix);

	prev && (prev.next = obj);

	function px(x) {
		return isFF ? x + "px" : x;
	}

	function detMinor(y, x, m) {
		var x1 = x == 0 ? 1 : 0,
			x2 = x == 2 ? 1 : 2,
			y1 = y == 0 ? 1 : 0,
			y2 = y == 2 ? 1 : 2;
		return (m[y1][x1] * m[y2][x2]) - (m[y1][x2] * m[y2][x1]);
	}

	function mult(a, b, c, d, tx, ty, r) {
		return {
			a: obj.a * a + obj.b * c,
			b: obj.a * b + obj.b * d,
			c: obj.c * a + obj.d * c,
			d: obj.c * b + obj.d * d,
			tx: obj.a * tx + obj.b * ty + obj.tx,
			ty: obj.c * tx + obj.d * ty + obj.ty,
			rotation: obj.rotation + r
		};
	}

	obj.invert = function() {
		var x = 0,
			y = 0,
			m = [[obj.a, obj.b, obj.tx], [obj.c, obj.d, obj.ty], [0, 0, 1]],
			n = m,
			det = obj.a * detMinor(0, 0, m) - obj.b * detMinor(0, 1, m) + obj.tx * detMinor(0, 2, m);

		if (Math.abs(det) > 1e-10) {
			det = 1.0 / det;
			for (; y < 3; y++) {
				for (; x < 3; x++) {
					n[y][x] = detMinor(x, y, m) * det;
					(x + y) % 2 == 1 && (n[y][x] = -n[y][x]);
				}
			}
		}

		return new ti2d(obj, mult(n[0][0], n[0][1], n[1][0], n[1][1], n[0][2], n[1][2]));
	};

	obj.multiply = function(other) {
		return new ti2d(obj, mult(other.a, other.b, other.c, other.d, other.tx, other.ty, other.rotation));
	};

	obj.rotate = function(angle) {
		return new ti2d(obj, { a: obj.a, b: obj.b, c: obj.c, d: obj.d, tx: obj.tx, ty: obj.ty, rotation: obj.rotation + angle });
	};

	obj.scale = function(x, y) {
		return new ti2d(obj, mult(x, 0, 0, y, 0, 0));
	};

	obj.translate = function(x, y) {
		return new ti2d(obj, mult(0, 0, 0, 0, x, y));
	};

	obj.toCSS = function() {
		var i = 0,
			v = [obj.a, obj.b, obj.c, obj.d, obj.tx, obj.ty];

		for (; i < 6; i++) {
			v[i] = v[i].toFixed(6);
			i > 4 && (v[i] = px(v[i]));
		}

		return "matrix(" + v.join(",") + ") rotate(" + obj.rotation + "deg)";
	};

});
