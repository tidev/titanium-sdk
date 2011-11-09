(function(api){
	// Properties
	var _albumArtist = null;
	Object.defineProperty(api, 'albumArtist', {
		get: function(){return _albumArtist;},
		set: function(val){return _albumArtist = val;}
	});

	var _albumTitle = null;
	Object.defineProperty(api, 'albumTitle', {
		get: function(){return _albumTitle;},
		set: function(val){return _albumTitle = val;}
	});

	var _albumTrackCount = null;
	Object.defineProperty(api, 'albumTrackCount', {
		get: function(){return _albumTrackCount;},
		set: function(val){return _albumTrackCount = val;}
	});

	var _albumTrackNumber = null;
	Object.defineProperty(api, 'albumTrackNumber', {
		get: function(){return _albumTrackNumber;},
		set: function(val){return _albumTrackNumber = val;}
	});

	var _artist = null;
	Object.defineProperty(api, 'artist', {
		get: function(){return _artist;},
		set: function(val){return _artist = val;}
	});

	var _artwork = null;
	Object.defineProperty(api, 'artwork', {
		get: function(){return _artwork;},
		set: function(val){return _artwork = val;}
	});

	var _composer = null;
	Object.defineProperty(api, 'composer', {
		get: function(){return _composer;},
		set: function(val){return _composer = val;}
	});

	var _discCount = null;
	Object.defineProperty(api, 'discCount', {
		get: function(){return _discCount;},
		set: function(val){return _discCount = val;}
	});

	var _discNumber = null;
	Object.defineProperty(api, 'discNumber', {
		get: function(){return _discNumber;},
		set: function(val){return _discNumber = val;}
	});

	var _genre = null;
	Object.defineProperty(api, 'genre', {
		get: function(){return _genre;},
		set: function(val){return _genre = val;}
	});

	var _isCompilation = null;
	Object.defineProperty(api, 'isCompilation', {
		get: function(){return _isCompilation;},
		set: function(val){return _isCompilation = val;}
	});

	var _lyrics = null;
	Object.defineProperty(api, 'lyrics', {
		get: function(){return _lyrics;},
		set: function(val){return _lyrics = val;}
	});

	var _mediaType = null;
	Object.defineProperty(api, 'mediaType', {
		get: function(){return _mediaType;},
		set: function(val){return _mediaType = val;}
	});

	var _playCount = null;
	Object.defineProperty(api, 'playCount', {
		get: function(){return _playCount;},
		set: function(val){return _playCount = val;}
	});

	var _playbackDuration = null;
	Object.defineProperty(api, 'playbackDuration', {
		get: function(){return _playbackDuration;},
		set: function(val){return _playbackDuration = val;}
	});

	var _podcastTitle = null;
	Object.defineProperty(api, 'podcastTitle', {
		get: function(){return _podcastTitle;},
		set: function(val){return _podcastTitle = val;}
	});

	var _rating = null;
	Object.defineProperty(api, 'rating', {
		get: function(){return _rating;},
		set: function(val){return _rating = val;}
	});

	var _skipCount = null;
	Object.defineProperty(api, 'skipCount', {
		get: function(){return _skipCount;},
		set: function(val){return _skipCount = val;}
	});

	var _title = null;
	Object.defineProperty(api, 'title', {
		get: function(){return _title;},
		set: function(val){return _title = val;}
	});

})(Ti._5.createClass('Titanium.Media.Item'));