Ti._5.createClass('Titanium.UI.iPhone.SystemIcon', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'iphone.systemicon', args, 'iPhone.SystemIcon');

	// Properties
	Ti._5.member(this, 'BOOKMARKS');

	Ti._5.member(this, 'CONTACTS');

	Ti._5.member(this, 'DOWNLOADS');

	Ti._5.member(this, 'FAVORITES');

	Ti._5.member(this, 'FEATURED');

	Ti._5.member(this, 'HISTORY');

	Ti._5.member(this, 'MORE');

	Ti._5.member(this, 'MOST_RECENT');

	Ti._5.member(this, 'MOST_VIEWED');

	Ti._5.member(this, 'RECENTS');

	Ti._5.member(this, 'SEARCH');

	Ti._5.member(this, 'TOP_RATED');

	require.mix(this, args);
});