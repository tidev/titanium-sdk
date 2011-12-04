Ti._5.createClass('Titanium.UI.iPhone.StatusBar', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'iphone.statusbar', args, 'iPhone.StatusBar');

	// Properties
	Ti._5.member(this, 'DEFAULT');

	Ti._5.member(this, 'GRAY');

	Ti._5.member(this, 'OPAQUE_BLACK');

	Ti._5.member(this, 'TRANSLUCENT_BLACK');

	require.mix(this, args);
});