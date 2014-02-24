/*global define*/
define(['Ti/_/declare', 'Ti/_/lang'], function (declare, lang) {

	return lang.setObject('Ti._.Gestures.TouchMove', {
		
		processTouchMoveEvent: function (e) {
			var changed = e.changedTouches,
				i = 0,
				l = changed.length,
				events = {
					'touchmove': []
				};
			for (; i < l; i++) {
				events.touchmove.push({
					x: changed[i].clientX,
					y: changed[i].clientY
				});
			}
			return events;
		}

	});

});