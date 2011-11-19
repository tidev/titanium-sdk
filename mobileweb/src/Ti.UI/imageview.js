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
			obj.dom.src = Ti._5.getAbsolutePath(_defaultImage);
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
	var _animating = null;
	Object.defineProperty(this, 'animating', {
		get: function(){return _animating;},
		set: function(val){return _animating = val;}
	});

	var _duration = null;
	Object.defineProperty(this, 'duration', {
		get: function(){return _duration;},
		set: function(val){return _duration = val;}
	});
	
	var _paused = null;
	Object.defineProperty(this, 'paused', {
		get: function(){return _paused;},
		set: function(val){return _paused = val;}
	});
	
	var _repeatCount = 0;
	Object.defineProperty(this, 'repeatCount', {
		get: function(){return _repeatCount;},
		set: function(val){return _repeatCount = val;}
	});

	var _reverse = false;
	Object.defineProperty(this, 'reverse', {
		get: function(){return _reverse;},
		set: function(val){return _reverse = val ? true : false;}
	});

	var _enableZoomControls = true;
	Object.defineProperty(this, 'enableZoomControls', {
		get: function(){return _enableZoomControls;},
		set: function(val){return _enableZoomControls = val;}
	});

	// indicates whether or not the source image is in 2x resolution for retina displays. 
	// Use for remote images ONLY. (iOS)
	var _hires = null;
	Object.defineProperty(this, 'hires', {
		get: function(){return _hires;},
		set: function(val){return false;}
	});
	
	var _canScale = true;
	Object.defineProperty(this, 'canScale', {
		get: function(){return _canScale;},
		set: function(val){
			_canScale = val ? true : false;
			if (!_canScale) {
				obj.dom.style.width = 'auto';
				obj.dom.style.height = 'auto';
			}
		}
	});

	var _defaultImage = "";
	Object.defineProperty(this, 'defaultImage', {
		get: function(){return _defaultImage;},
		set: function(val){return _defaultImage = val;}
	});
	
	var _src = "";
	Object.defineProperty(this, 'image', {
		get: function(){return _src;},
		set: function(val){_src = val; _loadImages([val]);}
	});

	var _images = [];
	Object.defineProperty(this, 'images', {
		get: function(){return _images;},
		set: function(val){
			_images = -1 != val.constructor.toString().indexOf('Array') ? val : [val];
			_loadImages(_images);
		}
	});

	var _preventDefaultImage = false;
	Object.defineProperty(this, 'preventDefaultImage', {
		get: function(){return _preventDefaultImage;},
		set: function(val){return _preventDefaultImage = val ? true : false;}
	});

	// deprecated since 1.5.0
	Object.defineProperty(this, 'url', {
		get: function(){return obj.image;},
		set: function(val){obj.image = val;}
	});
   
	Object.defineProperty(this, 'size', {
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
		}
	});
	
	Object.defineProperty(this, 'width', {
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
		}
	});	
	
	var _height;
	Object.defineProperty(this, 'height', {
		get: function() {
			return _height;
		},
		set: function(val) {
			_height = val;
			obj.dom.style.height =  val + (/^\d+$/.test(val) ? 'px' : "");
		}
	});
	
	Ti._5.preset(this, ["preventDefaultImage", "defaultImage", "image", "images", "url", "size",
		"canScale", "height", "width"], args);	
	Ti._5.presetUserDefinedElements(this, args);

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
