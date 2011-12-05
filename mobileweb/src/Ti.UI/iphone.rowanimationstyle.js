Ti._5.createClass('Titanium.UI.iPhone.RowAnimationStyle', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'iphone.rowanimationstyle', args, 'iPhone.RowAnimationStyle');

	// Properties
	Ti._5.prop(this, 'BOTTOM');

	Ti._5.prop(this, 'FADE');

	Ti._5.prop(this, 'LEFT');

	Ti._5.prop(this, 'NONE');

	Ti._5.prop(this, 'RIGHT');

	Ti._5.prop(this, 'TOP');

	require.mix(this, args);
});