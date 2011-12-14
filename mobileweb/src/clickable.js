Ti._5.Clickable = function(obj) {
	obj.addEventListener || oParentNamespace.EventDriven(obj);

	require.on(obj.dom, "click", function(evt) {
		obj.fireEvent("click", {
			x: evt.pageX,
			y: evt.pageY
		});
	});

	require.on(obj.dom, "dblclick", function(evt) {
		obj.fireEvent("dblclick", {
			x: evt.pageX,
			y: evt.pageY
		});
	});
};
