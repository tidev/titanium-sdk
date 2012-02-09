define({
	stop: function(e) {
		if (e) {
			e.preventDefault && e.preventDefault();
			e.stopPropagation && e.stopPropagation();
		}
	},
	off: function(handles) {
		require.each(require.is(handles, "Array") ? handles : [handles], function(h) {
			h && h();
		});
	}
});