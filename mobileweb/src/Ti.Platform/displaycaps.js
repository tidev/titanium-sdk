(function(api){
	Titanium.Platform.displayCaps = api;

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
		}
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
		}
	});

	Ti._5.propReadOnly(api, 'platformHeight', window.innerHeight);

	Ti._5.propReadOnly(api, 'platformWidth', window.innerWidth);

})(Ti._5.createClass('Titanium.Platform.DisplayCaps'));