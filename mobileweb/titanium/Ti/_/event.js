define({
	stop: function(e) {
		if (e) {
			e.preventDefault && e.preventDefault();
			e.stopPropagation && e.stopPropagation();
		}
	},
	off: function(handles) {
		handles = require.is(handles, "Array") ? handles : [handles];
		handles.forEach(function(h) {
			h && h();
		});
		handles.splice(0);
	}
});