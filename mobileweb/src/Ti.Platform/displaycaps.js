(function(api){
	// Properties
	var _density = null;
	Ti._5.prop(api, 'density', {
		get: function(){
			switch (navigator.userAgent.toLowerCase()) {
				case 'iphone':
					return 'medium';
				case 'ipad':
					return 'medium';
				default:
					return '';
			}
		},
		set: function(val){return false;}
	});

	var _dpi = null;
	Ti._5.prop(api, 'dpi', {
		get: function(){
			switch (navigator.userAgent.toLowerCase()) {
				case 'iphone':
					return 160;
				case 'ipad':
					return 130;
				default:
					return 0;
			}
		},
		set: function(val){return false;}
	});

	Ti._5.prop(api, 'platformHeight', {
		get: function(){return window.innerHeight;},
		set: function(val){return false;}
	});

	Ti._5.prop(api, 'platformWidth', {
		get: function(){return window.innerWidth;},
		set: function(val){return false;}
	});

})(Ti._5.createClass('Titanium.Platform.DisplayCaps'));