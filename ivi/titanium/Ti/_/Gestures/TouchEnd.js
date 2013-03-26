/*global define*/
define(['Ti/_/declare', 'Ti/_/lang'], function (declare, lang) {

	return lang.setObject('Ti._.Gestures.TouchEnd', {

		processTouchEndEvent: function (e) {
			var changed = e.changedTouches,
				i = 0,
				l = changed.length,
				events = {
					'touchend': []
				};
			for (; i < l; i++) {
				events.touchend.push({
					x: changed[i].clientX,
					y: changed[i].clientY
				});
			}
			return events;
		}

	});

});