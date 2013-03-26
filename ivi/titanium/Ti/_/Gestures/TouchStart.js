/*global define*/
define(['Ti/_/declare', 'Ti/_/lang'], function (declare, lang) {

	return lang.setObject('Ti._.Gestures.TouchStart', {

		processTouchStartEvent: function (e) {
			var changed = e.changedTouches,
				i = 0,
				l = changed.length,
				events = {
					'touchstart': []
				};
			for (; i < l; i++) {
				events.touchstart.push({
					x: changed[i].clientX,
					y: changed[i].clientY
				});
			}
			return events;
		}

	});

});