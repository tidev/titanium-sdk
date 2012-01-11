Ti._5.createClass('Titanium.UI.iPhone.StatusBar', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'iphone.statusbar', args, 'iPhone.StatusBar');

	// Properties
	Ti._5.prop(this, 'DEFAULT');

	Ti._5.prop(this, 'GRAY');

	Ti._5.prop(this, 'OPAQUE_BLACK');

	Ti._5.prop(this, 'TRANSLUCENT_BLACK');

	require.mix(this, args);
});