define(["Ti/_/Layouts/Base", "Ti/_/declare", "Ti/UI", "Ti/_/lang"], function(Base, declare, UI, lang) {
	
	var isDef = lang.isDef;

	return declare("Ti._.Layouts.Vertical", Base, {

		_doLayout: function(element, width, height, isWidthSize, isHeightSize) {
			var computedSize = this._computedSize = {width: 0, height: 0},
				currentTop = 0,
				children = element.children,
				availableHeight = height,
				widestChildWidth = 0,
				child,
				childDimensions,
				childHeight,
				i,
				precalculate = isHeightSize,
				isHeightFill,
				rightMostEdge,
				layoutCoefficients, widthLayoutCoefficients, heightLayoutCoefficients, topLayoutCoefficients, leftLayoutCoefficients, sandboxHeightCoefficients,
				childSize,
				measuredWidth, measuredHeight, measuredSandboxHeight, measuredLeft, measuredTop,
				deferredLeftCalculations = [],
				runningHeight;
				
			/**** START OF OLD ALGORITHM ****/
				
			// Determine if any children have fill height
			for (i = 0; i < children.length; i++) {
				children[i]._hasFillHeight() && (precalculate = true);
			}
				
			// Measure the children
			if (precalculate) {
				for (i = 0; i < children.length; i++) {
					child = children[i];
					if (this.verifyChild(child,element) && !child._hasFillHeight()) {
						childHeight;
						if (child._markedForLayout) {
							childDimensions = child._doLayout({
								origin: {
							 		x: 0,
							 		y: 0
							 	},
							 	isParentSize: {
							 		width: isWidthSize,
							 		height: isHeightSize
							 	},
							 	boundingSize: {
							 		width: width,
							 		height: height
							 	},
							 	alignment: {
							 		horizontal: this._defaultHorizontalAlignment,
							 		vertical: this._defaultVerticalAlignment
							 	},
							 	bottomIsMargin: true,
								positionElement: false,
						 		layoutChildren: true
							});
							widestChildWidth = Math.max(widestChildWidth,childDimensions.effectiveWidth);
							childHeight = childDimensions.effectiveHeight;
						} else {
							widestChildWidth = Math.max(widestChildWidth,child._measuredEffectiveWidth);
							childHeight = child._measuredEffectiveHeight;
						}
						availableHeight -= childHeight;
					}
				}
			}
			
			// Layout the children
			for(i = 0; i < children.length; i++) {
				
				// Layout the child
				child = children[i];
				isHeightFill = child._hasFillHeight();
				if (child._markedForLayout) {
					child._doLayout({
					 	origin: {
					 		x: 0,
					 		y: currentTop
					 	},
					 	isParentSize: {
					 		width: isWidthSize,
					 		height: isHeightSize
					 	},
					 	boundingSize: {
					 		width: width,
					 		sizeWidth: widestChildWidth,
					 		height: isHeightFill ? availableHeight : height
					 	},
					 	alignment: {
					 		horizontal: this._defaultHorizontalAlignment,
					 		vertical: this._defaultVerticalAlignment
					 	},
						bottomIsMargin: true,
					 	positionElement: true,
					 	layoutChildren: !precalculate || isHeightFill
				 	});
				 }
				
				// Update the size of the component
				rightMostEdge = child._measuredWidth + child._measuredLeft + child._measuredBorderSize.left + child._measuredBorderSize.right + child._measuredRightPadding;
				currentTop = child._measuredHeight + child._measuredTop + child._measuredBorderSize.top + child._measuredBorderSize.bottom + child._measuredBottomPadding;
				rightMostEdge > computedSize.width && (computedSize.width = rightMostEdge);
				currentTop > computedSize.height && (computedSize.height = currentTop);
			}
			
			/**** END OF OLD ALGORITHM ****/
			
			/**** START OF NEW ALGORITHM ****/
			
			runningHeight = 0;
			for(i = 0; i < children.length; i++) {
				
				// Layout the child
				child = element.children[i];
				if (this.verifyChild(child,element)) {
					//if (child._markedForLayout) {
						child._needsMeasuring && this._measureNode(child);
									
						layoutCoefficients = child._layoutCoefficients;
						widthLayoutCoefficients = layoutCoefficients.width;
						heightLayoutCoefficients = layoutCoefficients.height;
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
						isNaN(widthLayoutCoefficients.x1) && (measuredWidth = childSize.width);
						isNaN(heightLayoutCoefficients.x1) && (measuredHeight = childSize.height);
						
						measuredSandboxHeight = sandboxHeightLayoutCoefficients.x1 * height + sandboxHeightLayoutCoefficients.x2 + measuredHeight;
						
						if (isWidthSize && leftLayoutCoefficients.x1 !== 0) {
							deferredLeftCalculations.push(child);
						} else {
							measuredLeft = leftLayoutCoefficients.x1 * width + leftLayoutCoefficients.x2 * measuredWidth + leftLayoutCoefficients.x3;
						}
						measuredTop = topLayoutCoefficients.x1 * height + topLayoutCoefficients.x2 + runningHeight;
						
						child._newMeasuredWidth = measuredWidth;
						child._newMeasuredHeight = measuredHeight;
						child._newMeasuredSandboxHeight = measuredSandboxHeight;
						child._newMeasuredLeft = measuredLeft;
						child._newMeasuredTop = measuredTop;
					//}
					runningHeight += child._newMeasuredSandboxHeight;
				
					// Update the size of the component
					rightMostEdge = child._measuredWidth + child._measuredLeft + child._measuredBorderSize.left + child._measuredBorderSize.right + child._measuredRightPadding;
					currentTop = child._measuredHeight + child._measuredTop + child._measuredBorderSize.top + child._measuredBorderSize.bottom + child._measuredBottomPadding;
					rightMostEdge > computedSize.width && (computedSize.width = rightMostEdge);
					currentTop > computedSize.height && (computedSize.height = currentTop);
				}
			}
			
			// Second pass, if necessary, to determine the left bounds
			for(i in deferredLeftCalculations) {
				child = deferredLeftCalculations[i];
				leftLayoutCoefficients = child._layoutCoefficients.left;
				child._newMeasuredLeft = leftLayoutCoefficients.x1 * rightMostEdge + leftLayoutCoefficients.x2 * measuredWidth + leftLayoutCoefficients.x3;
			}
							
			// Debugging
			for(i = 0; i < children.length; i++) {
				var child = children[i];
				measuredWidth = Math.round(child._newMeasuredWidth);
				measuredHeight = Math.round(child._newMeasuredHeight);
				measuredLeft = Math.round(child._newMeasuredLeft);
				measuredTop = Math.round(child._newMeasuredTop);
				var	pass = Math.abs(child._measuredWidth - measuredWidth) < 2 && 
					Math.abs(child._measuredHeight - measuredHeight) < 2 && 
					Math.abs(child._measuredLeft - measuredLeft) < 2 && 
					Math.abs(child._measuredTop - measuredTop) < 2,
					consoleOp = pass ? "log" : "error";
				console[consoleOp](
					child.widgetId + 
					(pass ? " Passed" : " Failed" +
					" m width:(" + child._measuredWidth + "," + measuredWidth + ")" + 
					" m height:(" + child._measuredHeight + "," + measuredHeight + ")" + 
					" m left:(" + child._measuredLeft + "," + measuredLeft + ")" + 
					" m top:(" + child._measuredTop + "," + measuredTop + ")\n" + 
					" width:" + child.width + 
					" height:" + child.height + 
					" left:" + child.left + 
					" right:" + child.right + 
					" top:" + child.top + 
					" bottom:" + child.bottom + 
					" center:" + child.center));
			}
			
			/**** END OF NEW ALGORITHM ****/
			
			return computedSize;
		},
		
		_measureNode: function(node) {
			
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
