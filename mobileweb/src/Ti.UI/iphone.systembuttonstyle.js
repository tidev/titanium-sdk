Ti._5.createClass('Titanium.UI.iPhone.SystemButtonStyle', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'iphone.systembuttonstyle', args, 'iPhone.SystemButtonStyle');

	// Properties
	Ti._5.prop(this, 'BAR');

	Ti._5.prop(this, 'BORDERED');

	Ti._5.prop(this, 'DONE');

	Ti._5.prop(this, 'PLAIN');

	require.mix(this, args);
});