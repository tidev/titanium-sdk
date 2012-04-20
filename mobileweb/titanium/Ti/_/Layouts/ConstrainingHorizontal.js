define(["Ti/_/Layouts/Base", "Ti/_/declare", "Ti/UI", "Ti/_/lang", "Ti/_/style"], function(Base, declare, UI, lang, style) {
	
	var isDef = lang.isDef,
		setStyle = style.set;

	return declare("Ti._.Layouts.ConstrainingHorizontal", Base, {

		_doLayout: function(element, width, height, isWidthSize, isHeightSize) {
			var computedSize = this._computedSize = {width: 0, height: 0},
				children = element.children,
				child,
				i,
				layoutCoefficients, 
				widthLayoutCoefficients, heightLayoutCoefficients, sandboxWidthLayoutCoefficients, sandboxHeightLayoutCoefficients, topLayoutCoefficients, leftLayoutCoefficients, 
				childSize,
				measuredWidth, measuredHeight, measuredSandboxHeight, measuredSandboxWidth, measuredLeft, measuredTop,
				pixelUnits = "px",
				deferredPositionCalculations = [],
				deferredTopCalculations = [],
				runningWidth = 0,
				fillCount = 0;
				
			// Calculate size for the non-FILL children
			for(i = 0; i < children.length; i++) {
				
				child = element.children[i];
				if (this.verifyChild(child,element)) {
					
					// Border validation
					if (!child._borderSet) {
						this.updateBorder(child);
					}
					
					//if (child._markedForLayout) {
						((child._preLayout && child._preLayout(width, height, isWidthSize, isHeightSize)) || child._needsMeasuring) && this._measureNode(child);
									
						layoutCoefficients = child._layoutCoefficients;
						widthLayoutCoefficients = layoutCoefficients.width;
						
						if (widthLayoutCoefficients.x2 === 0 || isNaN(widthLayoutCoefficients.x2)) {
							heightLayoutCoefficients = layoutCoefficients.height;
							sandboxWidthLayoutCoefficients = layoutCoefficients.sandboxWidth;
							sandboxHeightLayoutCoefficients = layoutCoefficients.sandboxHeight;
							
							measuredHeight = heightLayoutCoefficients.x1 * height + heightLayoutCoefficients.x2;
							measuredWidth = widthLayoutCoefficients.x1 * width + widthLayoutCoefficients.x2 * (width - runningWidth) + widthLayoutCoefficients.x3;
							
							if (child._getContentSize) {
								childSize = child._getContentSize();
							} else {
								childSize = child._layout._doLayout(
									child, 
									isNaN(measuredWidth) ? width : measuredWidth, 
									isNaN(measuredHeight) ? height : measuredHeight, 
									isNaN(measuredWidth), 
									isNaN(measuredHeight));
							}
							isNaN(measuredWidth) && (measuredWidth = childSize.width + child._borderLeftWidth + child._borderRightWidth);
							isNaN(measuredHeight) && (measuredHeight = childSize.height + child._borderTopWidth + child._borderBottomWidth);
							
							measuredSandboxWidth = child._measuredSandboxWidth = sandboxWidthLayoutCoefficients.x1 * width + sandboxWidthLayoutCoefficients.x2 + measuredWidth;
							
							runningWidth += measuredSandboxWidth;
							
							child._measuredWidth = measuredWidth;
							child._measuredHeight = measuredHeight;
						} else {
							fillCount++;
						}
					//}
				}
			}
			
			// Calculate size for the FILL children
			runningWidth = (width - runningWidth) / fillCount; // Temporary repurposing of runningHeight
			for(i = 0; i < children.length; i++) {
				
				child = element.children[i];
				if (this.verifyChild(child,element)) {
					//if (child._markedForLayout) {
									
						layoutCoefficients = child._layoutCoefficients;
						widthLayoutCoefficients = layoutCoefficients.width;
						
						if (widthLayoutCoefficients.x2 !== 0 && !isNaN(widthLayoutCoefficients.x2)) {
							heightLayoutCoefficients = layoutCoefficients.height;
							sandboxWidthLayoutCoefficients = layoutCoefficients.sandboxWidth;
							sandboxHeightLayoutCoefficients = layoutCoefficients.sandboxHeight;
							
							measuredHeight = heightLayoutCoefficients.x1 * height + heightLayoutCoefficients.x2;
							measuredWidth = widthLayoutCoefficients.x1 * width + widthLayoutCoefficients.x2 * runningWidth + widthLayoutCoefficients.x3;
							
							if (child._getContentSize) {
								childSize = child._getContentSize();
							} else {
								childSize = child._layout._doLayout(
									child, 
									isNaN(measuredWidth) ? width : measuredWidth, 
									isNaN(measuredHeight) ? height : measuredHeight, 
									isNaN(measuredWidth), 
									isNaN(measuredHeight));
							}
							isNaN(measuredWidth) && (measuredWidth = childSize.width + child._borderLeftWidth + child._borderRightWidth);
							isNaN(measuredHeight) && (measuredHeight = childSize.height + child._borderTopWidth + child._borderBottomWidth);
							child._measuredWidth = measuredWidth;
							child._measuredHeight = measuredHeight;
							
							measuredSandboxWidth = child._measuredSandboxWidth = sandboxWidthLayoutCoefficients.x1 * width + sandboxWidthLayoutCoefficients.x2 + measuredWidth;
						}
					//}
				}
			}
			
			// Calculate position for the children
			runningWidth = 0
			for(i = 0; i < children.length; i++) {
				
				child = element.children[i];
				if (this.verifyChild(child,element)) {
					//if (child._markedForLayout) {
						layoutCoefficients = child._layoutCoefficients;
						sandboxHeightLayoutCoefficients = layoutCoefficients.sandboxHeight;
						topLayoutCoefficients = layoutCoefficients.top;
						leftLayoutCoefficients = layoutCoefficients.left;
						
						if (isHeightSize && topLayoutCoefficients.x1 !== 0) {
							deferredTopCalculations.push(child);
						} else {
							measuredHeight = child._measuredHeight;
							
							measuredTop = child._measuredTop = topLayoutCoefficients.x1 * height + topLayoutCoefficients.x2 * measuredHeight + topLayoutCoefficients.x3;
							measuredSandboxHeight = child._measuredSandboxHeight = sandboxHeightLayoutCoefficients.x1 * height + sandboxHeightLayoutCoefficients.x2 + measuredHeight + (isNaN(measuredTop) ? 0 : measuredTop);
							measuredSandboxHeight > computedSize.height && (computedSize.height = measuredSandboxHeight);
						}
						measuredLeft = child._measuredLeft = leftLayoutCoefficients.x1 * width + leftLayoutCoefficients.x2 + runningWidth;
						runningWidth += child._measuredSandboxWidth;
					//}
				}
			}
			computedSize.width = runningWidth;
			
			// Calculate the preliminary sandbox heights (missing top, since one of these heights may end up impacting all the tops)
			for(i in deferredTopCalculations) {
				child = deferredTopCalculations[i];
				sandboxHeightLayoutCoefficients = child._layoutCoefficients.sandboxHeight;
				measuredSandboxHeight = child._measuredSandboxHeight = sandboxHeightLayoutCoefficients.x1 * height + sandboxHeightLayoutCoefficients.x2 + child._measuredHeight;
				measuredSandboxHeight > computedSize.height && (computedSize.height = measuredSandboxHeight);
			}
			
			// Second pass, if necessary, to determine the top values
			for(i in deferredTopCalculations) {
				child = deferredTopCalculations[i];
				
				topLayoutCoefficients = child._layoutCoefficients.top;
				sandboxHeightLayoutCoefficients = child._layoutCoefficients.sandboxHeight;
				measuredHeight = child._measuredHeight;
				measuredSandboxHeight = child._measuredSandboxHeight;
				
				measuredSandboxHeight > computedSize.height && (computedSize.height = measuredSandboxHeight);
				measuredTop = child._measuredTop = topLayoutCoefficients.x1 * computedSize.height + topLayoutCoefficients.x2 * measuredHeight + topLayoutCoefficients.x3;
				child._measuredSandboxHeight += (isNaN(measuredTop) ? 0 : measuredTop);
			}
			
			// Position the children
			for(i = 0; i < children.length; i++) {
				
				UI._elementLayoutCount++;
				
				// Set and store the dimensions
				child = children[i];
				setStyle(child.domNode, {
					zIndex: child.zIndex | 0,
					left: Math.round(child._measuredLeft) + pixelUnits,
					top: Math.round(child._measuredTop) + pixelUnits,
					width: Math.round(child._measuredWidth - child._borderLeftWidth - child._borderRightWidth) + pixelUnits,
					height: Math.round(child._measuredHeight - child._borderTopWidth - child._borderBottomWidth) + pixelUnits
				});
				child.fireEvent("postlayout");
			}
			
			return this._computedSize = computedSize;
		},
		
		_getWidth: function(node) {
			
			// Ge the width or default width, depending on which one is needed
			var width = node.width;
			!isDef(width) && (width = node._defaultWidth);
			
			// Check if the width is INHERIT, and if so fetch the inherited width
			if (width === UI.INHERIT) {
				if (node._parent._parent) {
					return node._parent._parent._layout._getWidth(node._parent) === UI.SIZE ? UI.SIZE : UI.FILL;
				} else { // This is the root level content container, which we know has a width of FILL
					return UI.FILL;
				}
			} else {
				return width;
			}
		},
		
		_getHeight: function(node) {
			// Ge the height or default height, depending on which one is needed
			var height = node.height;
			!isDef(height) && (isDef(node.top) + isDef(node.center && node.center.y) + isDef(node.bottom) < 2) && (height = node._defaultHeight);
			
			// Check if the width is INHERIT, and if so fetch the inherited width
			if (height === UI.INHERIT) {
				if (node._parent._parent) {
					return node._parent._parent._layout._getHeight(node._parent) === UI.SIZE ? UI.SIZE : UI.FILL;
				} else { // This is the root level content container, which we know has a width of FILL
					return UI.FILL;
				}
			} else {
				return height;
			}
		},
		
		_measureNode: function(node) {
			
			node._needsMeasuring = false;
			
			// Pre-processing
			var getValueType = this.getValueType,
				computeValue = this.computeValue,
			
				width = this._getWidth(node),
				widthType = getValueType(width),
				widthValue = computeValue(width, widthType),
				
				height = this._getHeight(node),
				heightType = getValueType(height),
				heightValue = computeValue(height, heightType),
				
				left = node.left,
				leftType = getValueType(left),
				leftValue = computeValue(left, leftType),
				
				right = node.right,
				rightType = getValueType(right),
				rightValue = computeValue(right, rightType),
				
				top = node.top,
				topType = getValueType(top),
				topValue = computeValue(top, topType),
				
				centerY = node.center && node.center.y,
				centerYType = getValueType(centerY),
				centerYValue = computeValue(centerY, centerYType),
				
				bottom = node.bottom,
				bottomType = getValueType(bottom),
				bottomValue = computeValue(bottom, bottomType),
				
				x1, x2, x3,
				
				layoutCoefficients = node._layoutCoefficients,
				widthLayoutCoefficients = layoutCoefficients.width,
				heightLayoutCoefficients = layoutCoefficients.height,
				sandboxWidthLayoutCoefficients = layoutCoefficients.sandboxWidth,
				sandboxHeightLayoutCoefficients = layoutCoefficients.sandboxHeight,
				leftLayoutCoefficients = layoutCoefficients.left,
				topLayoutCoefficients = layoutCoefficients.top;
			
			// Height rule evaluation
			x1 = x2 = 0;
			if (heightType === UI.SIZE) {
				x1 = x2 = NaN;
			} else if (heightType === UI.FILL) {
				x1 = 1;
				if (topType === "%") {
					x1 -= topValue;
				} else if (topType === "#") {
					x2 = -topValue;
				} else if (bottomType === "%") {
					x1 -= bottomValue;
				} else if (bottomType === "#") {
					x2 = -bottomValue;
				}
			} else if (heightType === "%") {
				x1 = heightValue;
			} else if (heightType === "#") {
				x2 = heightValue;
			} else if (topType === "%") {
				if (centerYType === "%") {
					x1 = 2 * (centerYValue - topValue);
				} else if (centerYType === "#") {
					x1 = -2 * topValue;
					x2 = 2 * centerYValue;
				} else if (bottomType === "%") {
					x1 = 1 - topValue - bottomValue;
				} else if (bottomType === "#") {
					x1 = 1 - topValue;
					x2 = -bottomValue;
				}
			} else if (topType === "#") {
				if (centerYType === "%") {
					x1 = 2 * centerYValue;
					x2 = -2 * topValue;
				} else if (centerYType === "#") {
					x2 = 2 * (centerYValue - topValue);
				} else if (bottomType === "%") {
					x1 = 1 - bottomValue;
					x2 = -topValue;
				} else if (bottomType === "#") {
					x1 = 1;
					x2 = -bottomValue - topValue;
				}
			} else if (centerYType === "%") {
				if (bottomType === "%") {
					x1 = 2 * (bottomValue - centerYValue);
				} else if (bottomType === "#") {
					x1 = -2 * centerYValue;
					x2 = 2 * bottomValue;
				}
			} else if (centerYType === "#") {
				if (bottomType === "%") {
					x1 = 2 * bottomValue;
					x2 = -2 * centerYValue;
				} else if (bottomType === "#") {
					x2 = 2 * (bottomValue - centerYValue);
				}
			}
			heightLayoutCoefficients.x1 = x1;
			heightLayoutCoefficients.x2 = x2;
			
			// Sandbox height rule evaluation
			sandboxHeightLayoutCoefficients.x1 = bottomType === "%" ? bottomValue : 0;
			sandboxHeightLayoutCoefficients.x2 = bottomType === "#" ? bottomValue : 0;
			
			// Width rule calculation
			x1 = x2 = x3 = 0;
			if (widthType === UI.SIZE) {
				x1 = x2 = x3 = NaN;
			} else if (widthType === UI.FILL) {
				x2 = 1;
				leftType === "%" && (x1 = -leftValue);
				leftType === "#" && (x3 = -leftValue);
				rightType === "%" && (x1 = -rightValue);
				rightType === "#" && (x3 = -rightValue);
			} else if (widthType === "%") {
				x1 = widthValue;
			} else if (widthType === "#") {
				x3 = widthValue;
			}
			widthLayoutCoefficients.x1 = x1;
			widthLayoutCoefficients.x2 = x2;
			widthLayoutCoefficients.x3 = x3;
			
			// Sandbox width rule calculation
			x1 = x2 = 0;
			leftType === "%" && (x1 = leftValue);
			leftType === "#" && (x2 = leftValue);
			rightType === "%" && (x1 += rightValue);
			rightType === "#" && (x2 += rightValue);
			sandboxWidthLayoutCoefficients.x1 = x1;
			sandboxWidthLayoutCoefficients.x2 = x2;
			
			// Top rule calculation
			x1 = x2 = x3 = 0;
			if (topType === "%") {
				x1 = topValue;
			} else if(topType === "#") {
				x3 = topValue;
			} else if (centerYType === "%") {
				x1 = centerYValue;
				x2 = -0.5;
			} else if (centerYType === "#") {
				x2 = -0.5;
				x3 = centerYValue;
			} else if (bottomType === "%") {
				x1 = 1 - bottomValue;
				x2 = -1;
			} else if (bottomType === "#") {
				x1 = 1;
				x2 = -1;
				x3 = -bottomValue;
			} else { 
				switch(this._defaultVerticalAlignment) {
					case "center": 
						x1 = 0.5;
						x2 = -0.5;
						break;
					case "end":
						x1 = 1;
						x2 = -1;
				}
			}
			topLayoutCoefficients.x1 = x1;
			topLayoutCoefficients.x2 = x2;
			topLayoutCoefficients.x3 = x3;
			
			// Left rule calculation
			leftLayoutCoefficients.x1 = leftType === "%" ? leftValue : 0;
			leftLayoutCoefficients.x2 = leftType === "#" ? leftValue : 0;
		},
		
		_defaultHorizontalAlignment: "start",
		
		_defaultVerticalAlignment: "center"

	});

});
