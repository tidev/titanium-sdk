(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	Ti._5.prop(api, 'MODAL_PRESENTATION_CURRENT_CONTEXT');

	Ti._5.prop(api, 'MODAL_PRESENTATION_FORMSHEET');

	Ti._5.prop(api, 'MODAL_PRESENTATION_FULLSCREEN');

	Ti._5.prop(api, 'MODAL_PRESENTATION_PAGESHEET');

	Ti._5.prop(api, 'MODAL_TRANSITION_STYLE_COVER_VERTICAL');

	Ti._5.prop(api, 'MODAL_TRANSITION_STYLE_CROSS_DISSOLVE');

	Ti._5.prop(api, 'MODAL_TRANSITION_STYLE_FLIP_HORIZONTAL');

	Ti._5.prop(api, 'MODAL_TRANSITION_STYLE_PARTIAL_CURL');

	Ti._5.prop(api, 'appBadge');

	Ti._5.prop(api, 'appSupportsShakeToEdit');

	Ti._5.prop(api, 'statusBarHidden');

	Ti._5.prop(api, 'statusBarStyle');

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