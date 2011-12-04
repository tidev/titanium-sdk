Ti._5.createClass('Titanium.UI.iPhone.RowAnimationStyle', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'iphone.rowanimationstyle', args, 'iPhone.RowAnimationStyle');

	// Properties
	Ti._5.member(this, 'BOTTOM');

	Ti._5.member(this, 'FADE');

	Ti._5.member(this, 'LEFT');

	Ti._5.member(this, 'NONE');

	Ti._5.member(this, 'RIGHT');

	Ti._5.member(this, 'TOP');

	require.mix(this, args);
});