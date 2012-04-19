define(["Ti/_/Layouts/Base", "Ti/_/declare", "Ti/UI", "Ti/_/lang", "Ti/_/style"], function(Base, declare, UI, lang, style) {
	
	var isDef = lang.isDef,
		setStyle = style.set;

	return declare("Ti._.Layouts.Vertical", Base, {

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
				deferredLeftCalculations = [],
				runningHeight = 0;
				
			// Calculate size and position for the children
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
						heightLayoutCoefficients = layoutCoefficients.height;
						sandboxWidthLayoutCoefficients = layoutCoefficients.sandboxWidth;
						sandboxHeightLayoutCoefficients = layoutCoefficients.sandboxHeight;
						leftLayoutCoefficients = layoutCoefficients.left;
						topLayoutCoefficients = layoutCoefficients.top;
						
						measuredWidth = widthLayoutCoefficients.x1 * width + widthLayoutCoefficients.x2;
						measuredHeight = heightLayoutCoefficients.x1 * height + heightLayoutCoefficients.x2 * (height - runningHeight) + heightLayoutCoefficients.x3;
						
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
						
						if (isWidthSize && leftLayoutCoefficients.x1 !== 0) {
							deferredLeftCalculations.push(child);
						} else {
							measuredLeft = leftLayoutCoefficients.x1 * width + leftLayoutCoefficients.x2 * measuredWidth + leftLayoutCoefficients.x3;
						}
						measuredTop = topLayoutCoefficients.x1 * height + topLayoutCoefficients.x2 + runningHeight;
						
						measuredSandboxWidth = sandboxWidthLayoutCoefficients.x1 * width + sandboxWidthLayoutCoefficients.x2 + measuredWidth + (isNaN(measuredLeft) ? 0 : measuredLeft);
						measuredSandboxHeight = sandboxHeightLayoutCoefficients.x1 * height + sandboxHeightLayoutCoefficients.x2 + measuredHeight;
				
						// Update the size of the component
						measuredSandboxWidth > computedSize.width && (computedSize.width = measuredSandboxWidth);
						computedSize.height += measuredSandboxHeight;
						
						child._measuredWidth = measuredWidth;
						child._measuredHeight = measuredHeight;
						child._measuredSandboxWidth = measuredSandboxWidth;
						child._measuredSandboxHeight = measuredSandboxHeight;
						child._measuredLeft = measuredLeft;
						child._measuredTop = measuredTop;
					//}
					runningHeight += child._measuredSandboxHeight;
				}
			}
			
			// Second pass, if necessary, to determine the left values
			for(i in deferredLeftCalculations) {
				child = deferredLeftCalculations[i];
				leftLayoutCoefficients = child._layoutCoefficients.left;
				sandboxWidthLayoutCoefficients = child._layoutCoefficients.sandboxWidth;
				child._measuredLeft = measuredLeft = leftLayoutCoefficients.x1 * computedSize.width + leftLayoutCoefficients.x2 * measuredWidth + leftLayoutCoefficients.x3;
				child._measuredSandboxWidth = measuredSandboxWidth = sandboxWidthLayoutCoefficients.x1 * width + sandboxWidthLayoutCoefficients.x2 + measuredWidth + (isNaN(measuredLeft) ? 0 : measuredLeft);
				
				// Update the size of the component
				measuredSandboxWidth = child._measuredSandboxWidth;
				measuredSandboxWidth > computedSize.width && (computedSize.width = measuredSandboxWidth);
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
		
		_measureNode: function(node) {
			
			node._needsMeasuring = false;
			
			// Pre-processing
			var getValueType = this.getValueType,
				computeValue = this.computeValue,
			
				width = node.width === UI.INHERIT ? node._getInheritedWidth() : node.width,
				
				height = node.height === UI.INHERIT ? node._getInheritedHeight() : node.height,
				
				left = node.left,
				leftType = getValueType(left),
				leftValue = computeValue(left, leftType),
				
				centerX = node.center && node.center.x,
				centerXType = getValueType(centerX),
				centerXValue = computeValue(centerX, centerXType),
				
				right = node.right,
				rightType = getValueType(right),
				rightValue = computeValue(right, rightType),
				
				top = node.top,
				topType = getValueType(top),
				topValue = computeValue(top, topType),
				
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
				
			// Apply the default width and pre-process width and height
			!isDef(width) && (width = node._defaultWidth === UI.INHERIT ? node._getInheritedWidth() : node._defaultWidth);
			!isDef(height) && (height = node._defaultHeight === UI.INHERIT ? node._getInheritedHeight() : node._defaultHeight);
			var widthType = getValueType(width),
				widthValue = computeValue(width, widthType),
				heightType = getValueType(height),
				heightValue = computeValue(height, heightType);
			
			// Width rule evaluation
			x1 = x2 = 0;
			if (widthType === UI.SIZE) {
				x1 = x2 = NaN;
			} else if (widthType === UI.FILL) {
				x1 = 1;
				if (leftType === "%") {
					x1 -= leftValue;
				} else if (leftType === "#") {
					x2 = -leftValue;
				} else if (rightType === "%") {
					x1 -= rightValue;
				} else if (rightType === "#") {
					x2 = -rightValue;
				}
			} else if (widthType === "%") {
				x1 = widthValue;
			} else if (widthType === "#") {
				x2 = widthValue;
			} else if (leftType === "%") {
				if (centerXType === "%") {
					x1 = 2 * (centerXValue - leftValue);
				} else if (centerXType === "#") {
					x1 = -2 * leftValue;
					x2 = 2 * centerXValue;
				} else if (rightType === "%") {
					x1 = 1 - leftValue - rightValue;
				} else if (rightType === "#") {
					x1 = 1 - leftValue;
					x2 = -rightValue;
				}
			} else if (leftType === "#") {
				if (centerXType === "%") {
					x1 = 2 * centerXValue;
					x2 = -2 * leftValue;
				} else if (centerXType === "#") {
					x2 = 2 * (centerXValue - leftValue);
				} else if (rightType === "%") {
					x1 = 1 - rightValue;
					x2 = -leftValue;
				} else if (rightType === "#") {
					x1 = 1;
					x2 = -rightValue - leftValue;
				}
			} else if (centerXType === "%") {
				if (rightType === "%") {
					x1 = 2 * (rightValue - centerXValue);
				} else if (rightType === "#") {
					x1 = -2 * centerXValue;
					x2 = 2 * rightValue;
				}
			} else if (centerXType === "#") {
				if (rightType === "%") {
					x1 = 2 * rightValue;
					x2 = -2 * centerXValue;
				} else if (rightType === "#") {
					x2 = 2 * (rightValue - centerXValue);
				}
			}
			widthLayoutCoefficients.x1 = x1;
			widthLayoutCoefficients.x2 = x2;
			
			// Sandbox width/height rule evaluation
			sandboxWidthLayoutCoefficients.x1 = rightType === "%" ? rightValue : 0;
			sandboxWidthLayoutCoefficients.x2 = rightType === "#" ? rightValue : 0;
			
			// Height rule calculation
			x1 = x2 = x3 = 0;
			if (heightType === UI.SIZE) {
				x1 = x2 = x3 = NaN;
			} else if (heightType === UI.FILL) {
				x2 = 1;
				topType === "%" && (x1 = -topValue);
				topType === "#" && (x3 = -topValue);
				bottomType === "%" && (x1 = -bottomValue);
				bottomType === "#" && (x3 = -bottomValue);
			} else if (heightType === "%") {
				x1 = heightValue;
			} else if (heightType === "#") {
				x3 = heightValue;
			}
			heightLayoutCoefficients.x1 = x1;
			heightLayoutCoefficients.x2 = x2;
			heightLayoutCoefficients.x3 = x3;
			
			// Sandbox height rule calculation
			x1 = x2 = 0;
			topType === "%" && (x1 = topValue);
			topType === "#" && (x2 = topValue);
			bottomType === "%" && (x1 += bottomValue);
			bottomType === "#" && (x2 += bottomValue);
			sandboxHeightLayoutCoefficients.x1 = x1;
			sandboxHeightLayoutCoefficients.x2 = x2;
			
			// Left rule calculation
			x1 = x2 = x3 = 0;
			if (leftType === "%") {
				x1 = leftValue;
			} else if(leftType === "#") {
				x3 = leftValue;
			} else if (centerXType === "%") {
				x1 = centerXValue;
				x2 = -0.5;
			} else if (centerXType === "#") {
				x2 = -0.5;
				x3 = centerXValue;
			} else if (rightType === "%") {
				x1 = 1 - rightValue;
				x2 = -1;
			} else if (rightType === "#") {
				x1 = 1;
				x2 = -1;
				x3 = -rightValue;
			} else { 
				switch(this._defaultHorizontalAlignment) {
					case "center": 
						x1 = 0.5;
						x2 = -0.5;
						break;
					case "end":
						x1 = 1;
						x2 = -1;
				}
			}
			leftLayoutCoefficients.x1 = x1;
			leftLayoutCoefficients.x2 = x2;
			leftLayoutCoefficients.x3 = x3;
			
			// Top rule calculation
			topLayoutCoefficients.x1 = topType === "%" ? topValue : 0;
			topLayoutCoefficients.x2 = topType === "#" ? topValue : 0;
		},
		
		_defaultHorizontalAlignment: "center",
		
		_defaultVerticalAlignment: "start"

	});

});
