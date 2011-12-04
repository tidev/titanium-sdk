Ti._5.createClass('Titanium.UI.iPhone.ProgressBarStyle', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'iphone.progressbarstyle', args, 'iPhone.ProgressBarStyle');

	// Properties
	Ti._5.member(this, 'BAR');

	Ti._5.member(this, 'DEFAULT');

	Ti._5.member(this, 'PLAIN');


	require.mix(this, args);
});