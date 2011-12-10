(function(oParentNamespace) {
	// Create interface
	oParentNamespace.Interactable = function(obj, isNotSearch) {
		obj.addEventListener || oParentNamespace.EventDriven(obj);

		var on = require.on,
			domNode = obj.dom;

		function fire(eventName) {
			var v = domNode && domNode.value;
			obj.fireEvent(eventName, v !== undefined && { value: v });
		}

		on(domNode, "focus", function() {
			fire("focus");
		});

		on(domNode, "blur", function() {
			fire("blur");
		});

		function change() {
			fire("change");
		}

		on(domNode, "change", change);
		on(domNode, "input", change);
		on(domNode, "paste", change);

		isNotSearch || on(domNode, "keyup", function(evt) {
			!obj.suppressReturn && !evt.altKey && !evt.ctrlKey && evt.keyCode === 13 && fire("return");
		});
	}
})(Ti._5);
