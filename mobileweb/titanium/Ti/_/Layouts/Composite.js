define(["Ti/_/Layouts/Base", "Ti/_/declare", "Ti/UI", "Ti/_/lang"], function(Base, declare, UI, lang) {
	
	var isDef = lang.isDef;

	return declare("Ti._.Layouts.Composite", Base, {
		
		_doLayout: function(element, width, height, isWidthSize, isHeightSize) {
			var computedSize = this._computedSize = {width: 0, height: 0},
				children = element.children;
			for(var i = 0; i < children.length; i++) {
				
				// Layout the child
				var child = element.children[i];
				if (this.verifyChild(child,element)) {
					if (child._markedForLayout) {
						child._doLayout({
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
						 	positionElement: true,
						 	layoutChildren: true
					 	});
					}
					
					// Update the size of the component
					var rightMostEdge = child._measuredWidth + child._measuredLeft + child._measuredBorderSize.left + child._measuredBorderSize.right + child._measuredRightPadding;
					var bottomMostEdge = child._measuredHeight + child._measuredTop + child._measuredBorderSize.top + child._measuredBorderSize.bottom + child._measuredBottomPadding;
					rightMostEdge > computedSize.width && (computedSize.width = rightMostEdge);
					bottomMostEdge > computedSize.height && (computedSize.height = bottomMostEdge);
				}
			}
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
				centerXValue = parseFloat(centerX, centerXType),
				
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
				
				value,
				units,
				x1, x2, x3,
				measuredDimensions = node._measuredDimensions;
				
			// Apply the default width and pre-process width and height
			!isDef(width) && (isDef(left) + isDef(centerX) + isDef(right) < 2) && (width = node._defaultWidth);
			!isDef(height) && (isDef(top) + isDef(centerY) + isDef(bottom) < 2) && (height = node._defaultHeight);
			var widthType = getValueType(width),
				widthValue = parseFloat(width, widthType),
				heightType = getValueType(height),
				heightValue = parseFloat(height, heightType);
			
			// Width/height rule evaluation
			var paramsSet = {
					width: [widthType, widthValue, leftType, leftValue, centerXType, centerXValue, rightType, rightValue],
					height: [heightType, heightValue, topType, topValue, centerYType, centerYValue, bottomType, bottomValue]
				},
				params, sizeType, sizeValue, startType, startValue, centerType, centerValue, endType, endValue;
			for (var i in paramsSet) {
				
				params = paramsSet[i];
				sizeType = params[0];
				sizeValue = params[1];
				startType = params[2];
				startValue = params[3];
				centerType = params[4];
				centerValue = params[5];
				endType = params[6];
				endValue = params[7];
				
				x1 = 0;
				x2 = 0;
				if (sizeType ===  UI.SIZE) {
					x1 = "defer";
					x2 = "defer";
				} else if (sizeType === UI.FILL) {
					x1 = 1;
					if (startType === "%") {
						x1 -= startValue;
					} else if (startType === "#") {
						x2 = -startValue;
					} else if (endType === "%") {
						x1 -= endValue;
					} else if (endType === "#") {
						x2 = -endValue;
					}
				} else if (sizeType === "%") {
					x1 = sizeValue;
				} else if (sizeType === "#") {
					x2 = sizeValue;
				} else if (startType === "%") {
					if (centerType === "%") {
						x1 = 2 * (centerValue - startValue);
					} else if (centerType === "#") {
						x1 = -2 * startValue;
						x2 = 2 * centerValue;
					} else if (endType === "%") {
						x1 = 1 - startValue - endValue;
					} else if (endType === "#") {
						x1 = 1 - startValue;
						x2 = -endValue;
					}
				} else if (startType === "#") {
					if (centerType === "%") {
						x1 = 2 * centerValue;
						x2 = -2 * startValue;
					} else if (centerType === "#") {
						x2 = 2 * (centerValue - startValue);
					} else if (endType === "%") {
						x1 = 1 - endValue;
						x2 = -startValue;
					} else if (endType === "#") {
						x1 = 1;
						x2 = -endValue - startValue;
					}
				} else if (centerType === "%") {
					if (endType === "%") {
						x1 = 2 * (endValue - centerValue);
					} else if (endType === "#") {
						x1 = -2 * centerValue;
						x2 = 2 * endValue;
					}
				} else if (centerType === "#") {
					if (endType === "%") {
						x1 = 2 * endValue;
						x2 = -2 * centerValue;
					} else if (endType === "#") {
						x2 = 2 * (endValue - centerValue);
					}
				}
				measuredDimensions[i].x1 = x1;
				measuredDimensions[i].x2 = x2;
			}
			
			// Left/top rule evaluation
			paramsSet = {
				left: [leftType, leftValue, centerXType, centerXValue, rightType, rightValue],
				top: [topType, topValue, centerYType, centerYValue, bottomType, bottomValue]
			};
			for (var i in paramsSet) {
				
				params = paramsSet[i];
				startType = params[0];
				startValue = params[1];
				centerType = params[2];
				centerValue = params[3];
				endType = params[4];
				endValue = params[5];
					
				x1 = 0;
				x2 = 0;
				x3 = 0;
				if (startType === "%") {
					x1 = startValue;
				} else if(startType === "#") {
					x3 = startValue;
				} else if (centerType === "%") {
					x1 = centerValue;
					x2 = -0.5;
				} else if (centerType === "#") {
					x2 = -0.5;
					x3 = centerValue;
				} else if (endType === "%") {
					x1 = 1 - endValue;
					x2 = -1;
				} else if (endType === "#") {
					x1 = 1;
					x2 = -1;
					x3 = -endValue;
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
				measuredDimensions[i].x1 = x1;
				measuredDimensions[i].x2 = x2;
				measuredDimensions[i].x3 = x3;
			}
		},
		
		_defaultHorizontalAlignment: "center",
		
		_defaultVerticalAlignment: "center"
		
	});

});
