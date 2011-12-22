define("Ti/UI/Tab", ["Ti/_/declare", "Ti/_/UI/SuperView"], function(declare, SuperView) {

	var undef;

	return declare("Ti.UI.Tab", SuperView, {

		open: function(win) {
		},

		close: function(args) {
			// TODO: if args, then do animation on close
		},

		properties: {
			title: {
				set: function(value) {
					// TODO: set title
					return value;
				}
			},

			titleid: undef,

			window: {
				get: function() {
					// TODO: return root-level window
				},
				set: function(value) {
					// TODO: set root-level window
					return value;
				}
			}
		}

	});

});
