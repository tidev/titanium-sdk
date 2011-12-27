define("Ti/_/Layouts/Base", ["Ti/_/css", "Ti/_/declare", "Ti/_/style", "Ti/_/dom"], function(css, declare, style, dom) {
	
	var unitize = dom.unitize,
		computeSize = dom.computeSize,
		set = style.set,
		isDef = require.isDef,
		undef;

	return declare("Ti._.Layouts.Base", null, {

		constructor: function(element) {
			this.element = element;
			css.add(element.domNode, css.clean(this.declaredClass));
		},

		destroy: function() {
			css.remove(this.element.domNode, css.clean(this.declaredClass));
		},

		doLayout: function(element,isAbsolute) {
			if (element.children) {
				
				var elementHeight = isDef(element.height) ?  computeSize(element.height) : element.domNode.clientHeight,
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
					
					var left = computeSize(child.left),
						top = computeSize(child.top),
						right = computeSize(child.right),
						bottom = computeSize(child.bottom),
						centerX = isDef(child.center) ? computeSize(child.center.X,elementWidth) : undef,
						centerY = isDef(child.center) ? computeSize(child.center.Y,elementHeight) : undef,
						width = computeSize(child.width),
						height = computeSize(child.height);
					
					// Unfortunately css precidence doesn't match the titanium, so we have to handle it ourselves
					if (isDef(width)) {
						if (isDef(left)) {
							right = undef;
						} else if (isDef(centerX)){
							left = centerX - width / 2;
							right = undef;
						} else if (isDef(right)) {
							// Do nothing
						} else {
							// Set the default position if this is an absolute layout
							isAbsolute && (left = computeSize("50%",elementWidth) - width / 2);
						}
					} else {
						if (isDef(centerX)) {
							if (isDef(left)) {
								width = (centerX - left) * 2;
								right = undef;
							} else if (isDef(right)) {
								width = (right - centerX) * 2;
							} else {
								// Set the default position if this is an absolute layout
								width = computeSize(child._defaultWidth);
							}
						} else {
							if (isDef(left) && isDef(right)) {
								// Do nothing
							} else {
								width = computeSize(child._defaultWidth);
								if(!isDef(left) && !isDef(right) & isAbsolute) {
									isAbsolute && (left = computeSize("50%",elementWidth) - (width ? width : 0) / 2);
								}
							}
						}
					}
					if (isDef(height)) {
						if (isDef(top)) {
							bottom = undef;
						} else if (isDef(centerY)){
							top = centerY - height / 2;
							bottom = undef;
						} else if (isDef(bottom)) {
							// Do nothing
						} else {
							// Set the default position if this is an absolute layout
							isAbsolute && (top = computeSize("50%",elementHeight) - height / 2);
						}
					} else {
						if (isDef(centerY)) {
							if (isDef(top)) {
								height = (centerY - top) * 2;
								bottom = undef;
							} else if (isDef(bottom)) {
								height = (bottom - centerY) * 2;
							} else {
								// Set the default position if this is an absolute layout
								height = computeSize(child._defaultHeight);
							}
						} else {
							if (isDef(top) && isDef(bottom)) {
								// Do nothing
							} else {
								height = computeSize(child._defaultHeight);
								if(!isDef(top) && !isDef(bottom) & isAbsolute) {
									isAbsolute && (top = computeSize("50%",elementHeight) - (height ? height : 0) / 2);
								}
							}
						}
					}
					
					!isAbsolute && set(child.domNode,"position","relative");
					
					// Set the position, size and z-index
					isDef(bottom) && set(child.domNode, bottomField, unitize(bottom));
					isDef(top) && set(child.domNode, topField, unitize(top));
					isDef(height) && set(child.domNode, "height", unitize(height));
					isDef(right) && set(child.domNode, rightField, unitize(right));
					isDef(left) && set(child.domNode, leftField, unitize(left));
					isDef(width) && set(child.domNode, "width", unitize(width));
					set(child.domNode, "zIndex", isDef(child.zIndex) ? child.zIndex : 0);
				}
			}
		}

	});

});