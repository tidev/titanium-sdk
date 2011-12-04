Ti._5.createClass('Titanium.UI.ImageView', function(args){
	var obj = this;
	
	args = Ti._5.extend({}, args);
	args.unselectable = true;
		
	// Interfaces
	Ti._5.DOMView(this, 'img', args, 'ImageView');
	Ti._5.Touchable(this, args);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);
	Ti._5.Clickable(this, args);
	
	var _isError = false;
	function _loadImages (aImages) {
		_isError = false;
		if (!_preventDefaultImage) {
			obj.dom.src = Ti._5.getAbsolutePath(obj.defaultImage);
		}
		// create object
		var oImage = new Image();
		var _loaded = function () {
			if (iCounter < aImages.length) return true;
			obj.dom.src = Ti._5.getAbsolutePath(aImages[0]);
			oImage.removeEventListener('load', _loaded, false);
			obj.fireEvent('load', {
				source	: obj,
				state	: 2 < aImages.length ? obj.image : obj.images,
				type	: 'load'
			});
		};
		oImage.addEventListener('error',  function () {
			_isError = true;
			oImage.removeEventListener('load', _loaded, false);
		}, false);
		oImage.addEventListener('load', _loaded, false);

		// start preloading
		for(var iCounter=0; iCounter < aImages.length; iCounter++) {
			oImage.src = Ti._5.getAbsolutePath(aImages[iCounter]);
		}
	}

	// Properties
	Ti._5.member(this, 'animating');

	Ti._5.member(this, 'duration');
	
	Ti._5.member(this, 'paused');
	
	Ti._5.member(this, 'repeatCount', 0);

	var _reverse = false;
	Ti._5.prop(this, 'reverse', {
		get: function(){return _reverse;},
		set: function(val){return _reverse = val ? true : false;}
	});

	Ti._5.member(this, 'enableZoomControls', true);

	// indicates whether or not the source image is in 2x resolution for retina displays. 
	// Use for remote images ONLY. (iOS)
	Ti._5.member(this, 'hires', false);
	
	var _canScale = true;
	Ti._5.prop(this, 'canScale', {
		get: function(){return _canScale;},
		set: function(val){
			_canScale = val ? true : false;
			if (!_canScale) {
				obj.dom.style.width = 'auto';
				obj.dom.style.height = 'auto';
			}
			return _canScale;
		}
	});

	Ti._5.member(this, 'defaultImage', '');
	
	var _src = "";
	Ti._5.prop(this, 'image', {
		get: function(){return _src;},
		set: function(val){_src = val; return _loadImages([val]);}
	});

	var _images = [];
	Ti._5.prop(this, 'images', {
		get: function(){return _images;},
		set: function(val){
			_images = -1 != val.constructor.toString().indexOf('Array') ? val : [val];
			_loadImages(_images);
			return _images;
		}
	});

	var _preventDefaultImage = false;
	Ti._5.prop(this, 'preventDefaultImage', {
		get: function(){return _preventDefaultImage;},
		set: function(val){return _preventDefaultImage = val ? true : false;}
	});

	// deprecated since 1.5.0
	Ti._5.prop(this, 'url', {
		get: function(){return obj.image;},
		set: function(val){return obj.image = val;}
	});
   
	Ti._5.prop(this, 'size', {
		get: function() {
			return {
				width	: obj.width,
				height	: obj.height
			}
		},
		set: function(val) {
			if (val.width) {
				obj.width = Ti._5.parseLength(val.width);
			}
			if (val.height) {
				obj.height = Ti._5.parseLength(val.height);
			}
			return val;
		}
	});
	
	Ti._5.prop(this, 'width', {
		get: function() {
			if (!obj.dom.style.width || !obj.canScale) {
				return '';
			}
			return /%/.test(obj.dom.style.width) ? parseInt(obj.dom.style.width)+'%' : parseInt(obj.dom.style.width);
		},
		set: function(val) {
			if (obj.canScale) {
				obj.dom.style.width = /%/.test(val+'') ? parseInt(val) + '%' : parseInt(val) + 'px';
			}
			return val;
		}
	});	
	
	var _height;
	Ti._5.prop(this, 'height', {
		get: function() {
			return _height;
		},
		set: function(val) {
			_height = val;
			obj.dom.style.height =  val + (/^\d+$/.test(val) ? 'px' : "");
			return obj.dom.style.height;
		}
	});
	
	require.mix(this, args);

	// Methods
	this.pause = function(){
		console.debug('Method "Titanium.UI.ImageView#.pause" is not implemented yet.');
	};
	this.start = function(){
		console.debug('Method "Titanium.UI.ImageView#.start" is not implemented yet.');
	};
	this.stop = function(){
		console.debug('Method "Titanium.UI.ImageView#.stop" is not implemented yet.');
	};
	this.toBlob = function(){
		console.debug('Method "Titanium.UI.ImageView#.toBlob" is not implemented yet.');
	};

	// Events
	this.addEventListener('change', function(){
		console.debug('Event "change" is not implemented yet.');
	});
	this.addEventListener('start', function(){
		console.debug('Event "start" is not implemented yet.');
	});
	this.addEventListener('stop', function(){
		console.debug('Event "stop" is not implemented yet.');
	});
});
