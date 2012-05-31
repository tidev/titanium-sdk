define(["Ti/_/declare", "Ti/_/Evented"], function(declare, Evented) {

	var activeList = [];

	// animator
	// - animates all scheduled animations
	// - fires start/complete events
		// question: what is fired first? start() or start event
		// anim.start()
		// anim.fireEvent("start");
		// anim.complete()
		// anim.fireEvent("complete");
debugger;
	return declare("Ti.UI.Animation", Evented, {

		_play: function(elem) {
			this._elem = elem;
			
			// TODO:
			// - check if this element is already being animated
			//   - if so, override animated properties
			
			// TODO: check if this element is already
			
			// TODO: notify the animator we need to do work!
		},

		_pause: function() {
		},

		properties: {
			autoreverse: void 0,
			backgroundColor: void 0,
			bottom: void 0,
			center: void 0,
			color: void 0,
			curve: void 0, // "ease", "ease-in", "ease-in-out", "ease-out", "linear"
			delay: void 0,
			duration: void 0,
			height: void 0,
			left: void 0,
			opacity: void 0,
			repeat: void 0,
			right: void 0,
			top: void 0,
			transform: void 0,
			visible: void 0,
			width: void 0,
			zIndex: void 0
		}

	});

});
