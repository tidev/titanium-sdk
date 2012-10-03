define(["Ti/_/declare", "Ti/_/lang"], function(declare,lang) {

	return declare("Ti._.Gestures.GestureRecognizer", null, {
		
		blocking: null,
		
		constructor: function() {
			this.blocking = [];
		},
		
		getSourceNode: function(evt, node) {
			var currentNode = evt.target,
				sourceWidgetId = currentNode && currentNode.getAttribute && currentNode.getAttribute("data-widget-id"),
				nodeStack = [node],
				i,
				len,
				children;
				
			// Find the first fully fledged Ti component
			while(!sourceWidgetId) {
				currentNode = currentNode.parentNode;
				if (!currentNode || !currentNode.getAttribute) {
					return;
				}
				sourceWidgetId = currentNode.getAttribute("data-widget-id");
			}
			
			// Find the instance corresponding to the widget id
			while(nodeStack.length > 0) {
				currentNode = nodeStack.pop();
				if (currentNode._alive) {
					if (currentNode.widgetId === sourceWidgetId) {
						
						// Find the top most published node
						while(currentNode && !currentNode._isPublished) {
							currentNode = currentNode._parent;
						}
						return currentNode;
					}
					children = currentNode._children;
					for (i = 0, len = children.length; i < len; i++) {
						nodeStack.push(children[i]);
					}
				}
			}
		},
		
		processTouchStartEvent: function(e, element){
		},
		finalizeTouchStartEvent: function(){
		},
		
		processTouchEndEvent: function(e, element){
		},
		finalizeTouchEndEvent: function(){
		},
		
		processTouchMoveEvent: function(e, element){
		},
		finalizeTouchMoveEvent: function(){
		},
		
		processTouchCancelEvent: function(e, element){
		},
		finalizeTouchCancelEvent: function(){
		}

	});

});