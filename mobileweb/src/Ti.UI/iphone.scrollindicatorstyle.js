Ti._5.createClass('Titanium.UI.iPhone.ScrollIndicatorStyle', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'iphone.scrollindicatorstyle', args, 'iPhone.ScrollIndicatorStyle');

	// Properties
	Ti._5.member(this, 'BLACK');

	Ti._5.member(this, 'DEFAULT');

	Ti._5.member(this, 'WHITE');

	require.mix(this, args);
});