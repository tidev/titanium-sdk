Ti._5.createClass("Ti.UI.ImageView", function(args){
	args = require.mix({
		unselectable: true
	}, args);

	var obj = this,
		domNode = Ti._5.DOMView(obj, "img", args, "ImageView"),
		domStyle = domNode.style,
		isError = false,
		_reverse = false,
		_canScale = true,
		_src = "",
		_images = [],
		_preventDefaultImage = false,
		_height;

	// Interfaces
	Ti._5.Touchable(obj, args);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);
	Ti._5.Clickable(obj, args);

	function loadImages(images) {
		isError = false;
		_preventDefaultImage || (domNode.src = Ti._5.getAbsolutePath(obj.defaultImage));

		var counter = 0,
			img = new Image(),
			h = require.on(img, "load", function () {
				h && h();
				if (++counter < images.length) {
					domNode.src = Ti._5.getAbsolutePath(images[0]);
					obj.fireEvent("load", {
						state: images.length > 1 ? obj.images : obj.image
					});
				}
			});

		require.on(img, "error",  function () {
			isError = true;
			h && h();
			counter++;
		});

		// start preloading
		require.each(images, function(i) {
			domNode.src = Ti._5.getAbsolutePath(i);
		});
	}

	// Properties
	Ti._5.prop(obj, {
		animating: null,
		canScale: {
			get: function(){return _canScale;},
			set: function(val){
				_canScale = !!val;
				if (!_canScale) {
					domStyle.width = "auto";
					domStyle.height = "auto";
				}
			}
		},
		defaultImage: "",
		duration: null,
		enableZoomControls: true,
		height: {
			get: function() {
				return _height;
			},
			set: function(val) {
				_height = val;
				domStyle.height = Ti._5.px(val);
			}
		},
		// indicates whether or not the source image is in 2x resolution for retina displays. 
		// Use for remote images ONLY. (iOS)
		hires: false,
		image: {
			get: function(){return _src;},
			set: function(val){loadImages([_src = val]);}
		},
		images: {
			get: function(){return _images;},
			set: function(val){
				_images = -1 != val.constructor.toString().indexOf("Array") ? val : [val];
				loadImages(_images);
			}
		},
		paused: null,
		preventDefaultImage: {
			get: function(){return _preventDefaultImage;},
			set: function(val){_preventDefaultImage = !!val;}
		},
		repeatCount: 0,
		reverse: {
			get: function(){return _reverse;},
			set: function(val){_reverse = !!val;}
		},
		size: {
			get: function() {
				return {
					width	: obj.width,
					height	: obj.height
				}
			},
			set: function(val) {
				val.width && (obj.width = Ti._5.px(val.width));
				val.height && (obj.height = Ti._5.px(val.height));
			}
		},
		width: {
			get: function() {
				if (!domStyle.width || !obj.canScale) {
					return "";
				}
				return /%/.test(domStyle.width) ? parseInt(domStyle.width)+"%" : parseInt(domStyle.width);
			},
			set: function(val) {
				obj.canScale && (domStyle.width = /%/.test(val+"") ? parseInt(val) + "%" : parseInt(val) + "px");
			}
		}
	});

	require.mix(obj, args);

	// Methods
	obj.pause = function(){
		console.debug('Method "Titanium.UI.ImageView#.pause" is not implemented yet.');
	};
	obj.start = function(){
		console.debug('Method "Titanium.UI.ImageView#.start" is not implemented yet.');
	};
	obj.stop = function(){
		console.debug('Method "Titanium.UI.ImageView#.stop" is not implemented yet.');
	};
	obj.toBlob = function(){
		console.debug('Method "Titanium.UI.ImageView#.toBlob" is not implemented yet.');
	};

	// Events
	obj.addEventListener("change", function(){
		console.debug('Event "change" is not implemented yet.');
	});
	obj.addEventListener("start", function(){
		console.debug('Event "start" is not implemented yet.');
	});
	obj.addEventListener("stop", function(){
		console.debug('Event "stop" is not implemented yet.');
	});
});
