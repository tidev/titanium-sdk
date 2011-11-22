Ti._5.createClass('Titanium.UI.2DMatrix', function(args){
	
	function _multiplyInternal(_a2,_b2,_c2,_d2,_tx2,_ty2) {
		_a = _a * _a2 + _b * _c2;
		_b = _a * _b2 + _b * _d2;
		_c = _c * _a2 + _d * _c2;
		_d = _c * _b2 + _d * _d2;
		_tx = _a * _tx2 + _b * _ty2 + _tx;
		_ty = _c * _tx2 + _d * _ty2 + _ty;
	}
	this._printMatrix = function() {
		console.debug([[_a,_b,_tx],[_c,_d,_ty]]);
	}
	var obj = this;
	
	// Initialize the matrix to unity
	var _a = 1,
		_b = 0,
		_c = 0,
		_d = 1,
		_tx = 0,
		_ty = 0;
	
	// Methods
	this.invert = function(){
		console.debug('Method "Titanium.UI.2DMatrix#.invert" is not implemented yet.');
	};
	this.multiply = function(t2){
		_multiplyInternal(t2._a,t2._b,t2._c,t2._d,t2._tx,t2._ty);
	};
	this.rotate = function(angle){
		// Math.xxx trig functions take radians, so convert first
		angleInRadians = angle * Math.PI / 180;
		_multiplyInternal(Math.cos(angleInRadians),-Math.sin(angleInRadians),Math.sin(angleInRadians),Math.cos(angleInRadians),0,0);
	};
	this.scale = function(sx,sy){
		_multiplyInternal(sx,0,0,sy,0,0);
	};
	this.translate = function(tx,ty){
		_multiplyInternal(1,0,0,1,tx,ty);
	};
});