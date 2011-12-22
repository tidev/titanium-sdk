define("Ti/_/Layouts/Base", ["Ti/_/css", "Ti/_/declare", "Ti/_/style", "Ti/_/dom"], function(css, declare, style, dom) {

	return declare("Ti._.Layouts.Base", null, {

		constructor: function(element) {
			this.element = element;
			css.add(element.domNode, css.clean(this.declaredClass));
		},

		destroy: function() {
			css.remove(this.element.domNode, css.clean(this.declaredClass));
		},

		doLayout: function(element,isAbsolute) {
			console.debug("Doing layout for " + element.declaredClass);
			if (element.children) {
				
				function isDef(x) {
					return !require.is(x,"Undefined");
				}
				
				var unitize = dom.unitize,
					computeSize = dom.computeSize,
					set = style.set,
					elementHeight = isDef(element.height) ?  computeSize(element.height) : element.domNode.clientHeight,
					elementWidth = isDef(element.width) ?  computeSize(element.width) : element.domNode.clientWidth;
					
				if (isAbsolute) {
					var leftField = "left",
						rightField = "right",
						topField = "top",
						bottomField = "bottom";
				} else {
					var leftField = "marginLeft",
						rightField = "marginRight",
						topField = "marginTop",
						bottomField = "marginBottom";
				}
				
				for(var i = 0; i < element.children.length; i++) {
					
					var child = element.children[i];
					
					// Layout the child
					child.doLayout();
					
					// Sets the vertical position given a center y value
					function processCenterX(x) {
						// TODO Lots of missing edge cases
						var left;
						if (isDef(child.width)) {
							left = computeSize(x,elementWidth) - computeSize(child.width) / 2 + "px";
						} else {
							left = computeSize(x,elementWidth) - child.domNode.clientWidth / 2 + "px";
						}
						left && set(child.domNode, leftField, left);
					}
					
					// Sets the vertical position given a center y value
					function processCenterY(y) {
						// TODO Lots of missing edge cases
						var top;
						if (isDef(child.height)) {
							top = computeSize(y,elementHeight) - computeSize(child.height) / 2 + "px";
						} else {
							top = computeSize(y,elementHeight) - child.domNode.clientHeight / 2 + "px";
						}
						top && set(child.domNode, topField, top);
					}
					
					// Position the child. Note: only set a default position if we are absolutely positioned
					if (isAbsolute && !isDef(child.center) && !isDef(child.top) && !isDef(child.bottom)) {
						processCenterY("50%");
					} else {
						isDef(child.bottom) && set(child.domNode, bottomField, unitize(child.bottom));
						isDef(child.center) && processCenterY(child.center.y);
						isDef(child.top) && set(child.domNode, topField, unitize(child.top));
					}
					isDef(child.height) && set(child.domNode, "height", unitize(child.height));
					if (isAbsolute && !isDef(child.center) && !isDef(child.left) && !isDef(child.right)) {
						processCenterX("50%");
					} else {
						isDef(child.right) && set(child.domNode, rightField, unitize(child.right));
						isDef(child.center) && processCenterX(child.center.x);
						isDef(child.left) && set(child.domNode, leftField, unitize(child.left));
					}
					isDef(child.width) && set(child.domNode, "width", unitize(child.width));
					isDef(child.zIndex) && set(child.domNode, "zIndex", child.zIndex);
				}
			}
		}

	});

});