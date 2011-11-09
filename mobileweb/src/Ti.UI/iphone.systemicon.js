Ti._5.createClass('Titanium.UI.iPhone.SystemIcon', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'iphone.systemicon', args, 'iPhone.SystemIcon');

	// Properties
	var _BOOKMARKS = null;
	Object.defineProperty(this, 'BOOKMARKS', {
		get: function(){return _BOOKMARKS;},
		set: function(val){return _BOOKMARKS = val;}
	});

	var _CONTACTS = null;
	Object.defineProperty(this, 'CONTACTS', {
		get: function(){return _CONTACTS;},
		set: function(val){return _CONTACTS = val;}
	});

	var _DOWNLOADS = null;
	Object.defineProperty(this, 'DOWNLOADS', {
		get: function(){return _DOWNLOADS;},
		set: function(val){return _DOWNLOADS = val;}
	});

	var _FAVORITES = null;
	Object.defineProperty(this, 'FAVORITES', {
		get: function(){return _FAVORITES;},
		set: function(val){return _FAVORITES = val;}
	});

	var _FEATURED = null;
	Object.defineProperty(this, 'FEATURED', {
		get: function(){return _FEATURED;},
		set: function(val){return _FEATURED = val;}
	});

	var _HISTORY = null;
	Object.defineProperty(this, 'HISTORY', {
		get: function(){return _HISTORY;},
		set: function(val){return _HISTORY = val;}
	});

	var _MORE = null;
	Object.defineProperty(this, 'MORE', {
		get: function(){return _MORE;},
		set: function(val){return _MORE = val;}
	});

	var _MOST_RECENT = null;
	Object.defineProperty(this, 'MOST_RECENT', {
		get: function(){return _MOST_RECENT;},
		set: function(val){return _MOST_RECENT = val;}
	});

	var _MOST_VIEWED = null;
	Object.defineProperty(this, 'MOST_VIEWED', {
		get: function(){return _MOST_VIEWED;},
		set: function(val){return _MOST_VIEWED = val;}
	});

	var _RECENTS = null;
	Object.defineProperty(this, 'RECENTS', {
		get: function(){return _RECENTS;},
		set: function(val){return _RECENTS = val;}
	});

	var _SEARCH = null;
	Object.defineProperty(this, 'SEARCH', {
		get: function(){return _SEARCH;},
		set: function(val){return _SEARCH = val;}
	});

	var _TOP_RATED = null;
	Object.defineProperty(this, 'TOP_RATED', {
		get: function(){return _TOP_RATED;},
		set: function(val){return _TOP_RATED = val;}
	});

	Ti._5.presetUserDefinedElements(this, args);
});