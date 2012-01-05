define("Ti/UI/AlertDialog", ["Ti/_/declare", "Ti/_/Evented"], function(declare, Evented) {

	return declare("Ti.UI.AlertDialog", Evented, {
		show: function() {
			alert(this.message);
		},

		hide: function() {
			// Do nothing since alert() is blocking.
		},
		
		properties: {
			
			buttonNames: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.AlertDialog#.buttonNames" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.AlertDialog#.buttonNames" is not implemented yet.');
					return value;
				}
			},
			
			cancel: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.AlertDialog#.cancel" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.AlertDialog#.cancel" is not implemented yet.');
					return value;
				}
			},
			
			message: "",
			
			messageid: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.AlertDialog#.messageid" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.AlertDialog#.messageid" is not implemented yet.');
					return value;
				}
			},
			
			ok: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.AlertDialog#.ok" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.AlertDialog#.ok" is not implemented yet.');
					return value;
				}
			},
			
			okid: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.AlertDialog#.okid" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.AlertDialog#.okid" is not implemented yet.');
					return value;
				}
			},
			
			title: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.AlertDialog#.title" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.AlertDialog#.title" is not implemented yet.');
					return value;
				}
			},
			
			titleid: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.AlertDialog#.titleid" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.AlertDialog#.titleid" is not implemented yet.');
					return value;
				}
			}
		}

	});

});
