(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	var _MODAL_PRESENTATION_CURRENT_CONTEXT = null;
	Object.defineProperty(api, 'MODAL_PRESENTATION_CURRENT_CONTEXT', {
		get: function(){return _MODAL_PRESENTATION_CURRENT_CONTEXT;},
		set: function(val){return _MODAL_PRESENTATION_CURRENT_CONTEXT = val;}
	});

	var _MODAL_PRESENTATION_FORMSHEET = null;
	Object.defineProperty(api, 'MODAL_PRESENTATION_FORMSHEET', {
		get: function(){return _MODAL_PRESENTATION_FORMSHEET;},
		set: function(val){return _MODAL_PRESENTATION_FORMSHEET = val;}
	});

	var _MODAL_PRESENTATION_FULLSCREEN = null;
	Object.defineProperty(api, 'MODAL_PRESENTATION_FULLSCREEN', {
		get: function(){return _MODAL_PRESENTATION_FULLSCREEN;},
		set: function(val){return _MODAL_PRESENTATION_FULLSCREEN = val;}
	});

	var _MODAL_PRESENTATION_PAGESHEET = null;
	Object.defineProperty(api, 'MODAL_PRESENTATION_PAGESHEET', {
		get: function(){return _MODAL_PRESENTATION_PAGESHEET;},
		set: function(val){return _MODAL_PRESENTATION_PAGESHEET = val;}
	});

	var _MODAL_TRANSITION_STYLE_COVER_VERTICAL = null;
	Object.defineProperty(api, 'MODAL_TRANSITION_STYLE_COVER_VERTICAL', {
		get: function(){return _MODAL_TRANSITION_STYLE_COVER_VERTICAL;},
		set: function(val){return _MODAL_TRANSITION_STYLE_COVER_VERTICAL = val;}
	});

	var _MODAL_TRANSITION_STYLE_CROSS_DISSOLVE = null;
	Object.defineProperty(api, 'MODAL_TRANSITION_STYLE_CROSS_DISSOLVE', {
		get: function(){return _MODAL_TRANSITION_STYLE_CROSS_DISSOLVE;},
		set: function(val){return _MODAL_TRANSITION_STYLE_CROSS_DISSOLVE = val;}
	});

	var _MODAL_TRANSITION_STYLE_FLIP_HORIZONTAL = null;
	Object.defineProperty(api, 'MODAL_TRANSITION_STYLE_FLIP_HORIZONTAL', {
		get: function(){return _MODAL_TRANSITION_STYLE_FLIP_HORIZONTAL;},
		set: function(val){return _MODAL_TRANSITION_STYLE_FLIP_HORIZONTAL = val;}
	});

	var _MODAL_TRANSITION_STYLE_PARTIAL_CURL = null;
	Object.defineProperty(api, 'MODAL_TRANSITION_STYLE_PARTIAL_CURL', {
		get: function(){return _MODAL_TRANSITION_STYLE_PARTIAL_CURL;},
		set: function(val){return _MODAL_TRANSITION_STYLE_PARTIAL_CURL = val;}
	});

	var _appBadge = null;
	Object.defineProperty(api, 'appBadge', {
		get: function(){return _appBadge;},
		set: function(val){return _appBadge = val;}
	});

	var _appSupportsShakeToEdit = null;
	Object.defineProperty(api, 'appSupportsShakeToEdit', {
		get: function(){return _appSupportsShakeToEdit;},
		set: function(val){return _appSupportsShakeToEdit = val;}
	});

	var _statusBarHidden = null;
	Object.defineProperty(api, 'statusBarHidden', {
		get: function(){return _statusBarHidden;},
		set: function(val){return _statusBarHidden = val;}
	});

	var _statusBarStyle = null;
	Object.defineProperty(api, 'statusBarStyle', {
		get: function(){return _statusBarStyle;},
		set: function(val){return _statusBarStyle = val;}
	});

	// Methods
	api.createNavigationGroup = function(){
		console.debug('Method "Titanium.UI.iPhone#.createNavigationGroup" is not implemented yet.');
	};
	api.hideStatusBar = function(){
		console.debug('Method "Titanium.UI.iPhone#.hideStatusBar" is not implemented yet.');
	};
	api.showStatusBar = function(){
		console.debug('Method "Titanium.UI.iPhone#.showStatusBar" is not implemented yet.');
	};
})(Ti._5.createClass('Titanium.UI.iPhone'));