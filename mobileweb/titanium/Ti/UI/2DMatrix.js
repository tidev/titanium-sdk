define(["Ti/_/declare", "Ti/_/Evented", "Ti/_/lang", "Ti/Platform"],
	function(declare, Evented, lang, Platform) {

	var isFF = Platform.runtime === "gecko",
		api,
		px = function(x) {
			return isFF ? x + "px" : x;
		};

	function detMinor(y, x, m) {
		var x1 = x == 0 ? 1 : 0,
			x2 = x == 2 ? 1 : 2,
			y1 = y == 0 ? 1 : 0,
			y2 = y == 2 ? 1 : 2;
		return (m[y1][x1] * m[y2][x2]) - (m[y1][x2] * m[y2][x1]);
	}

	function mult(obj, a, b, c, d, tx, ty, r) {
		return {
			a: obj.a * a + obj.b * c,
			b: obj.a * b + obj.b * d,
			c: obj.c * a + obj.d * c,
			d: obj.c * b + obj.d * d,
			tx: obj.a * tx + obj.b * ty + obj.tx,
			ty: obj.c * tx + obj.d * ty + obj.ty,
			rotation: obj.rotation + (r | 0)
		};
	}

	return api = declare("Ti.UI.2DMatrix", Evented, {

		properties: {
			a: 1,
			b: 0,
			c: 0,
			d: 1,
			tx: 0,
			ty: 0,
			rotation: 0
		},

		constructor: function(matrix) {
			matrix && require.mix(this, matrix);
		},

		invert: function() {
			var x = 0,
				y = 0,
				m = [[this.a, this.b, this.tx], [this.c, this.d, this.ty], [0, 0, 1]],
				n = m,
				det = this.a * detMinor(0, 0, m) - this.b * detMinor(0, 1, m) + this.tx * detMinor(0, 2, m);

			if (Math.abs(det) > 1e-10) {
				det = 1.0 / det;
				for (; y < 3; y++) {
					for (; x < 3; x++) {
						n[y][x] = detMinor(x, y, m) * det;
						(x + y) % 2 == 1 && (n[y][x] = -n[y][x]);
					}
				}
			}

			return new api(mult(this, n[0][0], n[0][1], n[1][0], n[1][1], n[0][2], n[1][2]));
		},

		multiply: function(other) {
			return new api(mult(this, other.a, other.b, other.c, other.d, other.tx, other.ty, other.rotation));
		},

		rotate: function(angle) {
			return new api({ a: this.a, b: this.b, c: this.c, d: this.d, tx: this.tx, ty: this.ty, rotation: this.rotation + angle });
		},

		scale: function(x, y) {
			return new api(mult(this, x, 0, 0, lang.val(y, x), 0, 0));
		},

		translate: function(x, y) {
			return new api(mult(this, 1, 0, 0, 1, x, y));
		},

		toCSS: function() {
			var i = 0,
				v = [this.a, this.b, this.c, this.d, this.tx, this.ty];
	
			for (; i < 6; i++) {
				v[i] = v[i].toFixed(6);
				i > 4 && (v[i] = px(v[i]));
			}

			return "matrix(" + v.join(",") + ") rotate(" + this.rotation + "deg)";
		}

	});

});
