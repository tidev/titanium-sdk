(function(oParentNamespace) {
	// Create interface
	oParentNamespace.Clickable = function(obj) {
		if ('function' != typeof obj.addEventListener) {
			oParentNamespace.EventDriven(obj);
		}

		obj.dom.addEventListener('click', function(event) {
			var oEvent = {
				globalPoint	: { x:event.pageX, y:event.pageY }, 
				source		: obj,
				type		: event.type,
				x			: event.pageX,
				y			: event.pageY
			};
			obj.fireEvent('click', oEvent);
		}, false);
		
		obj.dom.addEventListener('dblclick', function(event) {
			var oEvent = {
				globalPoint	: { x:event.pageX, y:event.pageY }, 
				source		: obj,
				type		: event.type,
				x			: event.pageX,
				y			: event.pageY
			};
			obj.fireEvent('dblclick', oEvent);
		}, false);
	}
	
})(Ti._5);	