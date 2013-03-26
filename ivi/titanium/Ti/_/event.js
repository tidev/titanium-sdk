define({
	stop: function(e) {
		if (e) {
			e.preventDefault && e.preventDefault();
			e.stopPropagation && e.stopPropagation();
		}
	},
	off: function(handles) {
		var handles = require.is(handles, "Array") ? handles : [handles],
			h,
			i = 0,
			l = handles.length;
		while (i < l) {
			(h = handles[i++]) && h();
		}
		handles.splice(0);
	}
});