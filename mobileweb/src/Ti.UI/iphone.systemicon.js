Ti._5.createClass('Titanium.UI.iPhone.SystemIcon', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'iphone.systemicon', args, 'iPhone.SystemIcon');

	// Properties
	Ti._5.prop(this, 'BOOKMARKS');

	Ti._5.prop(this, 'CONTACTS');

	Ti._5.prop(this, 'DOWNLOADS');

	Ti._5.prop(this, 'FAVORITES');

	Ti._5.prop(this, 'FEATURED');

	Ti._5.prop(this, 'HISTORY');

	Ti._5.prop(this, 'MORE');

	Ti._5.prop(this, 'MOST_RECENT');

	Ti._5.prop(this, 'MOST_VIEWED');

	Ti._5.prop(this, 'RECENTS');

	Ti._5.prop(this, 'SEARCH');

	Ti._5.prop(this, 'TOP_RATED');

	require.mix(this, args);
});