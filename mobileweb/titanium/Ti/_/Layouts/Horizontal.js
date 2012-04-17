define(["Ti/_/Layouts/Base", "Ti/_/declare", "Ti/UI", "Ti/_/lang"], function(Base, declare, UI, lang) {

	var isDef = lang.isDef;

	return declare("Ti._.Layouts.Horizontal", Base, {

		_doLayout: function(element, width, height, isWidthSize, isHeightSize) {
			var computedSize = this._computedSize = {width: 0, height: 0},
				currentLeft = 0,
				children = element.children,
				availableWidth = width,
				tallestChildHeight = 0,
				child,
				childDimensions,
				childWidth,
				i, j,
				precalculate = isHeightSize,
				isWidthFill,
				bottomMostEdge,
				layoutCoefficients, 
				childSize,
				measuredWidth, measuredHeight, measuredSandboxWidth, measuredSandboxHeight, measuredLeft, measuredTop,
				rows = [[]], row,
				rowHeights = [], rowHeight,
				deferredTopCalculations = [],
				runningHeight, runningWidth;
				
			/**** START OF OLD ALGORITHM ****/
				
			// Determine if any children have fill height
			for (i = 0; i < children.length; i++) {
				children[i]._hasFillWidth() && (precalculate = true);
			}
			
			if (precalculate) {
				for (i = 0; i < children.length; i++) {
					child = children[i];
					if (this.verifyChild(child,element) && !child._hasFillWidth()) {
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
							 	rightIsMargin: true,
								positionElement: false,
						 		layoutChildren: true
							});
							tallestChildHeight = Math.max(tallestChildHeight,childDimensions.effectiveHeight);
							childWidth = childDimensions.effectiveWidth;
						} else {
							tallestChildHeight = Math.max(tallestChildHeight,child._measuredEffectiveHeight);
							childWidth = child._measuredEffectiveWidth;
						}
						availableWidth -= childWidth;
					}
				}
			}
			
			for(i = 0; i < children.length; i++) {
				
				// Layout the child
				child = children[i];
				isWidthFill = child._hasFillWidth();
				
				if (child._markedForLayout) {
					child._doLayout({
					 	origin: {
					 		x: currentLeft,
					 		y: 0
					 	},
					 	isParentSize: {
					 		width: isWidthSize,
					 		height: isHeightSize
					 	},
					 	boundingSize: {
					 		width: isWidthFill ? availableWidth : width,
					 		height: height,
					 		sizeHeight: tallestChildHeight
					 	},
					 	alignment: {
					 		horizontal: this._defaultHorizontalAlignment,
					 		vertical: this._defaultVerticalAlignment
					 	},
						rightIsMargin: true,
					 	positionElement: true,
					 	layoutChildren: !precalculate || isWidthFill
				 	});
			 	}
				
				// Update the size of the component
				currentLeft = child._measuredLeft + child._measuredWidth + child._measuredBorderSize.left + child._measuredBorderSize.right + child._measuredRightPadding;
				bottomMostEdge = child._measuredTop + child._measuredHeight + child._measuredBorderSize.top + child._measuredBorderSize.bottom + child._measuredBottomPadding;
				currentLeft > computedSize.width && (computedSize.width = currentLeft);
				bottomMostEdge > computedSize.height && (computedSize.height = bottomMostEdge);
			}
			
			/**** END OF OLD ALGORITHM ****/
			
			/**** START OF NEW ALGORITHM ****/
			
			// Horizontal parameter calculation
			runningWidth = runningHeight = 0;
			for(i = 0; i < children.length; i++) {
				
				child = element.children[i];
				if (this.verifyChild(child,element)) {
					//if (child._markedForLayout) {
						child._needsMeasuring && this._measureNode(child);
									
						layoutCoefficients = child._layoutCoefficients;
						widthLayoutCoefficients = layoutCoefficients.width;
						heightLayoutCoefficients = layoutCoefficients.height;
						sandboxWidthLayoutCoefficients = layoutCoefficients.sandboxWidth;
						leftLayoutCoefficients = layoutCoefficients.left;
						
						measuredWidth = widthLayoutCoefficients.x1 * width + widthLayoutCoefficients.x2 * (width - runningWidth) + widthLayoutCoefficients.x3;
						measuredHeight = heightLayoutCoefficients.x1 * height + heightLayoutCoefficients.x2;
						
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
						
						measuredSandboxWidth = sandboxWidthLayoutCoefficients.x1 * width + sandboxWidthLayoutCoefficients.x2 + measuredWidth;
						
						measuredLeft = leftLayoutCoefficients.x1 * width + leftLayoutCoefficients.x2 + runningWidth;
						if (!isWidthSize && Math.floor(measuredSandboxWidth + runningWidth) > Math.ceil(width)) {
							rows.push([]);
							measuredLeft -= runningWidth;
							runningWidth = 0;
						}
						rows[rows.length - 1].push(child);
						runningWidth += measuredSandboxWidth;
						
						child._newMeasuredWidth = measuredWidth;
						child._newMeasuredHeight = measuredHeight; // Height is only set if auto, otherwise it is calculated in the next phase
						child._newMeasuredSandboxWidth = measuredSandboxWidth;
						child._newMeasuredLeft = measuredLeft;
					//}
				}
			}
			
			for(i = 0; i < rows.length; i++) {
				row = rows[i];
				rowHeight = 0;
				for (j = 0; j < row.length; j++) {
					child = row[j];
				
					if (this.verifyChild(child,element)) {
						//if (child._markedForLayout) {
							
							layoutCoefficients = child._layoutCoefficients;
							topLayoutCoefficients = layoutCoefficients.top;
							sandboxHeightLayoutCoefficients = layoutCoefficients.sandboxHeight;
							measuredHeight = child._newMeasuredHeight;
							
							if (topLayoutCoefficients.x2 !== 0) {
								deferredTopCalculations.push(child);
								measuredTop = 0; // Temporary for use in calculating row height
							} else {
								child._newMeasuredTop = measuredTop = topLayoutCoefficients.x1 * height + topLayoutCoefficients.x3 * measuredHeight + topLayoutCoefficients.x4 + runningHeight;
							}
							
							child._measuredSandboxHeight = measuredSandboxHeight = sandboxHeightLayoutCoefficients.x1 * height + sandboxHeightLayoutCoefficients.x2 + measuredHeight + measuredTop;
							rowHeight < measuredSandboxHeight && (rowHeight = measuredSandboxHeight);
						//}
					
						// Update the size of the component
						rightMostEdge = child._measuredWidth + child._measuredLeft + child._measuredBorderSize.left + child._measuredBorderSize.right + child._measuredRightPadding;
						currentTop = child._measuredHeight + child._measuredTop + child._measuredBorderSize.top + child._measuredBorderSize.bottom + child._measuredBottomPadding;
						rightMostEdge > computedSize.width && (computedSize.width = rightMostEdge);
						currentTop > computedSize.height && (computedSize.height = currentTop);
					}
				}
				rowHeights.push(rowHeight);
				runningHeight += rowHeight;
			}
			
			// Second pass, if necessary, to determine the left bounds
			runningHeight = 0;
			for(i = 0; i < rows.length; i++) {
				row = rows[i];
				rowHeight = rowHeights[i];
				for (j = 0; j < row.length; j++) {
					child = row[j];
				
					if (this.verifyChild(child,element) && ~deferredTopCalculations.indexOf(child)) {
						//if (child._markedForLayout) {
							measuredHeight = child._newMeasuredHeight;
							topLayoutCoefficients = child._layoutCoefficients.top;
							child._newMeasuredTop = topLayoutCoefficients.x1 * height + topLayoutCoefficients.x2 * rowHeight + topLayoutCoefficients.x3 * measuredHeight + topLayoutCoefficients.x4 + runningHeight;
						//}
					}
				}
				runningHeight += rowHeight;
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
				
				right = node.right,
				rightType = getValueType(right),
				rightValue = computeValue(right, rightType),
				
				top = node.top,
				topType = getValueType(top),
				topValue = computeValue(top, topType),
				
				bottom = node.bottom,
				bottomType = getValueType(bottom),
				bottomValue = computeValue(bottom, bottomType),
				
				x1, x2, x3, x4,
				
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
			
			// Height rule calculation
			x1 = x2 = 0;
			if (heightType === UI.SIZE) {
				x1 = x2 = NaN;
			} else if (heightType === UI.FILL) {
				x1 = 1;
				topType === "%" && (x1 = -topValue);
				topType === "#" && (x2 = -topValue);
				bottomType === "%" && (x1 = -bottomValue);
				bottomType === "#" && (x2 = -bottomValue);
			} else if (heightType === "%") {
				x1 = heightValue;
			} else if (heightType === "#") {
				x2 = heightValue;
			}
			heightLayoutCoefficients.x1 = x1;
			heightLayoutCoefficients.x2 = x2;
			
			// Sandbox height rule calculation
			sandboxHeightLayoutCoefficients.x1 = bottomType === "%" ? bottomValue : 0;
			sandboxHeightLayoutCoefficients.x2 = bottomType === "#" ? bottomValue : 0;
			
			// Left rule calculation
			leftLayoutCoefficients.x1 = leftType === "%" ? leftValue : 0;
			leftLayoutCoefficients.x2 = leftType === "#" ? leftValue : 0;
			
			// Top rule calculation
			x1 = x2 = x3 = x4 = 0;
			if (topType === "%") {
				x1 = topValue;
			} else if(topType === "#") {
				x4 = topValue;
			} else { 
				switch(this._defaultRowAlignment) {
					case "center": 
						x2 = 0.5;
						x3 = -0.5;
						break;
					case "end":
						x2 = 1;
						x3 = -1;
				}
			}
			topLayoutCoefficients.x1 = x1;
			topLayoutCoefficients.x2 = x2;
			topLayoutCoefficients.x3 = x3;
			topLayoutCoefficients.x4 = x4;
		},
		
		_defaultHorizontalAlignment: "start",
		
		_defaultVerticalAlignment: "start",
		
		_defaultRowAlignment: "center"

	});

});
