Ti._5.createClass('Titanium.UI.iPhone.TableViewScrollPosition', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'iphone.tableviewscrollposition', args, 'iPhone.TableViewScrollPosition');

	// Properties
	Ti._5.prop(this, 'BOTTOM');

	Ti._5.prop(this, 'MIDDLE');

	Ti._5.prop(this, 'NONE');

	Ti._5.prop(this, 'TOP');

	require.mix(this, args);
});