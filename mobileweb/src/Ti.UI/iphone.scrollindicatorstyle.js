Ti._5.createClass('Titanium.UI.iPhone.ScrollIndicatorStyle', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'iphone.scrollindicatorstyle', args, 'iPhone.ScrollIndicatorStyle');

	// Properties
	Ti._5.prop(this, 'BLACK');

	Ti._5.prop(this, 'DEFAULT');

	Ti._5.prop(this, 'WHITE');

	require.mix(this, args);
});