/*global define*/
define(['Ti/_/declare', 'Ti/_/lang'], function (declare, lang) {

	return lang.setObject('Ti._.Gestures.TouchCancel', {
		
		processTouchCancelEvent: function (e) {
			var changed = e.changedTouches,
				i = 0,
				l = changed.length,
				events = {
					'touchcancel': []
				};
			for (; i < l; i++) {
				events.touchcancel.push({
					x: changed[i].clientX,
					y: changed[i].clientY
				});
			}
			return events;
		}

	});

});