define(["Ti/_/declare", "Ti/_/Evented"], function(declare, Evented) {

	var undef;

	return declare("Ti.UI.Animation", Evented, {

		start: function() {
			this.fireEvent("start");
		},

		complete: function() {
			this.fireEvent("complete");
		},

		properties: {
			autoreverse: undef,
			backgroundColor: undef,
			bottom: undef,
			center: undef,
			color: undef,
			curve: undef,
			delay: undef,
			duration: undef,
			height: undef,
			left: undef,
			opacity: undef,
			repeat: undef,
			right: undef,
			top: undef,
			transform: undef,
			visible: undef,
			width: undef,
			zIndex: undef
		}

	});

});
