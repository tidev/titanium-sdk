(function(oParentNamespace) {
	// Create interface
	oParentNamespace.Interactable = function(obj, isNotSearch) {
		if ('function' != typeof obj.addEventListener) {
			oParentNamespace.EventDriven(obj);
		}
		
		obj.dom.addEventListener('focus', function(event) {
			var oEvent = {
				source: obj,
				type: event.type
			};
			if (obj.dom && 'undefined' != typeof obj.dom.value) {
				oEvent.value = obj.dom.value;
			}
			obj.fireEvent('focus', oEvent);
		}, true);
		
		obj.dom.addEventListener('blur', function(event) {
			var oEvent = {
				source: obj,
				type: event.type
			};
			if (obj.dom && 'undefined' != typeof obj.dom.value) {
				oEvent.value = obj.dom.value;
			}
			obj.fireEvent('blur', oEvent);
		}, true);

		var _changeListener = function(event) {
			var oEvent = {
				source: obj,
				type: 'change'
			};
			if (obj.dom && 'undefined' != typeof obj.dom.value) {
				oEvent.value = obj.dom.value;
			}
			obj.fireEvent('change', oEvent);
		};
		
		obj.dom.addEventListener('change', _changeListener, false);
		obj.dom.addEventListener('input', _changeListener, false);
		obj.dom.addEventListener('paste', _changeListener, false);

		if (!isNotSearch) {
			obj.dom.addEventListener('keyup', function(event) {
				if (!obj.suppressReturn && !event.altKey && !event.ctrlKeyKey && event.keyCode && 13 == event.keyCode) {
					var oEvent = {
						source: event.target,
						type: event.type
					};
					if (obj.dom && 'undefined' != typeof obj.dom.value) {
						oEvent.value = obj.dom.value;
					}
					obj.fireEvent('return', oEvent);
				}
			}, false);
		}
	}
})(Ti._5);
