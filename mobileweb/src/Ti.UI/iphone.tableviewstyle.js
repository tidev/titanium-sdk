Ti._5.createClass('Titanium.UI.iPhone.TableViewStyle', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'iphone.tableviewstyle', args, 'iPhone.TableViewStyle');

	// Properties
	Ti._5.member(this, 'GROUPED');

	Ti._5.member(this, 'PLAIN');

	require.mix(this, args);
});