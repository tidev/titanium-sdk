Ti._5.createClass('Titanium.UI.Android', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'android', args, 'Android');

	// Properties
	api.SWITCH_STYLE_CHECKBOX = 1;
	api.SWITCH_STYLE_TOGGLEBUTTON = 2;

	Ti._5.prop(this, 'LINKIFY_ALL');

	Ti._5.prop(this, 'LINKIFY_EMAIL_ADDRESSES');

	Ti._5.prop(this, 'LINKIFY_MAP_ADDRESSES');

	Ti._5.prop(this, 'LINKIFY_MAP_LINKS');

	Ti._5.prop(this, 'LINKIFY_PHONE_NUMBERS');

	Ti._5.prop(this, 'LINKIFY_WEB_URLS');

	Ti._5.prop(this, 'SOFT_INPUT_ADJUST_PAN');

	Ti._5.prop(this, 'SOFT_INPUT_ADJUST_RESIZE');

	Ti._5.prop(this, 'SOFT_INPUT_ADJUST_UNSPECIFIED');

	Ti._5.prop(this, 'SOFT_INPUT_STATE_HIDDEN');

	Ti._5.prop(this, 'SOFT_INPUT_STATE_UNSPECIFIED');

	Ti._5.prop(this, 'SOFT_INPUT_STATE_VISIBLE');

	Ti._5.prop(this, 'SOFT_KEYBOARD_DEFAULT_ON_FOCUS');

	Ti._5.prop(this, 'SOFT_KEYBOARD_HIDE_ON_FOCUS');

	Ti._5.prop(this, 'SOFT_KEYBOARD_SHOW_ON_FOCUS');

	// Methods
	this.hideSoftKeyboard = function(){
		console.debug('Method "Titanium.UI.Android#.hideSoftKeyboard" is not implemented yet.');
	};
	this.openPreferences = function(){
		console.debug('Method "Titanium.UI.Android#.openPreferences" is not implemented yet.');
	};

	require.mix(this, args);
});