Ti._5.createClass('Titanium.UI.iPhone.AnimationStyle', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'iphone.animationstyle', args, 'iPhone.AnimationStyle');

	// Properties
	Ti._5.member(this, 'CURL_DOWN');

	Ti._5.member(this, 'CURL_UP');

	Ti._5.member(this, 'FLIP_FROM_LEFT');

	Ti._5.member(this, 'FLIP_FROM_RIGHT');

	Ti._5.member(this, 'NONE');

	require.mix(this, args);
});