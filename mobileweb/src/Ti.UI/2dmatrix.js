Ti._5.createClass('Titanium.UI.2DMatrix', function(args){
	var obj = this;
	
	// Initialize the matrix to unity
	obj._a = 1,
	obj._b = 0,
	obj._c = 0,
	obj._d = 1,
	obj._tx = 0,
	obj._ty = 0;
	
	// Internal methods
	function _multiplyInternal(_a2,_b2,_c2,_d2,_tx2,_ty2) {
		var newMatrix = Ti.UI.create2DMatrix();
		newMatrix._a = obj._a * _a2 + obj._b * _c2,
		newMatrix._b = obj._a * _b2 + obj._b * _d2;
		newMatrix._c = obj._c * _a2 + obj._d * _c2;
		newMatrix._d = obj._c * _b2 + obj._d * _d2;
		newMatrix._tx = obj._a * _tx2 + obj._b * _ty2 + obj._tx;
		newMatrix._ty = obj._c * _tx2 + obj._d * _ty2 + obj._ty;
		return newMatrix;
	}
	
	this._toCSS = function() {
		
		// Round off the elements because scientific notation in CSS isn't allowed (apparently)
		var roundedValues = [obj._a.toFixed(6),obj._b.toFixed(6),obj._c.toFixed(6),obj._d.toFixed(6),obj._tx.toFixed(6),obj._ty.toFixed(6)];
		
		// Firefox requires tx and ty to have "px" postfixed, but the other browsers require it *not* to be there.
		if (navigator.userAgent.indexOf("Firefox")!=-1) {
			roundedValues[4] += "px";
			roundedValues[5] += "px";
		}
		return "matrix(" + roundedValues.join(",") + ")";
	}
	this._fromCSS = function(matrixString) {
		parsedString = matrixString.substring(7,matrixString.length - 1).split(",");
		obj._a = parseFloat(parsedString[0]);
		obj._b = parseFloat(parsedString[1]);
		obj._c = parseFloat(parsedString[2]);
		obj._d = parseFloat(parsedString[3]);
		obj._tx = parseFloat(parsedString[4]);
		obj._ty = parseFloat(parsedString[5]);
	}
	
	// Methods
	this.invert = function(){
		console.debug('Method "Titanium.UI.2DMatrix#.invert" is not implemented yet.');
	};
	this.multiply = function(t2){
		return _multiplyInternal(t2._a,t2._b,t2._c,t2._d,t2._tx,t2._ty);
	};
	this.rotate = function(angle){
		// Math.xxx trig functions take radians, so convert from degrees first
        angleInRadians = angle * Math.PI / 180;
		return _multiplyInternal(Math.cos(angleInRadians),Math.sin(angleInRadians),-Math.sin(angleInRadians),Math.cos(angleInRadians),0,0);
	};
	this.scale = function(sx,sy){
		return _multiplyInternal(sx,0,0,sy,0,0);
	};
	this.translate = function(tx,ty){
		return _multiplyInternal(1,0,0,1,tx,ty);
	};
});