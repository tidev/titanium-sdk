define(["Ti/_/Layouts/Base", "Ti/_/declare", "Ti/UI", "Ti/_/lang", "Ti/_/style"], function(Base, declare, UI, lang, style) {

	var isDef = lang.isDef,
		setStyle = style.set;

	return declare("Ti._.Layouts.Horizontal", Base, {

		_doLayout: function(element, width, height, isWidthSize, isHeightSize) {
			var computedSize = this._computedSize = {width: 0, height: 0},
				children = element.children,
				child,
				i, j,
				layoutCoefficients, 
				widthLayoutCoefficients, heightLayoutCoefficients, sandboxWidthLayoutCoefficients, sandboxHeightLayoutCoefficients, topLayoutCoefficients, leftLayoutCoefficients,
				childSize,
				measuredWidth, measuredHeight, measuredSandboxHeight, measuredSandboxWidth, measuredLeft, measuredTop,
				pixelUnits = "px",
				runningHeight = 0, runningWidth = 0, 
				rows = [[]], row,
				rowHeights = [], rowHeight,
				deferredTopCalculations = [],
				deferHeight,
				sizeHeight,
				verticalAlignmentOffset = 0;
				
			// Calculate horizontal size and position for the children
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
					leftLayoutCoefficients = layoutCoefficients.left;
					
					measuredWidth = widthLayoutCoefficients.x1 * width + widthLayoutCoefficients.x2 * (width - runningWidth) + widthLayoutCoefficients.x3;
					measuredHeight = heightLayoutCoefficients.x2 === 0 ? heightLayoutCoefficients.x1 * height + heightLayoutCoefficients.x3 : NaN;
					
					if (isNaN(measuredWidth) || isNaN(heightLayoutCoefficients.x1)) {
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
						isNaN(heightLayoutCoefficients.x1) && (measuredHeight = childSize.height + child._borderTopWidth + child._borderBottomWidth);
						
						child._childrenLaidOut = true;
						if (heightLayoutCoefficients.x2 !== 0 && !isNaN(heightLayoutCoefficients.x2)) {
							console.warn("Child of width SIZE and height FILL detected in a horizontal layout. Performance degradation may occur.");
							child._childrenLaidOut = false;
						}
					} else {
						child._childrenLaidOut = false;
					}
					child._measuredWidth = measuredWidth;
					child._measuredHeight = measuredHeight;
					
					measuredSandboxWidth = child._measuredSandboxWidth = sandboxWidthLayoutCoefficients.x1 * width + sandboxWidthLayoutCoefficients.x2 + measuredWidth;
					
					measuredLeft = leftLayoutCoefficients.x1 * width + leftLayoutCoefficients.x2 + runningWidth;
					if (!isWidthSize && Math.floor(measuredSandboxWidth + runningWidth) > Math.ceil(width)) {
						rows.push([]);
						measuredLeft -= runningWidth;
						runningWidth = 0;
					}
					child._measuredLeft = measuredLeft;
					rows[rows.length - 1].push(child);
					runningWidth += measuredSandboxWidth;
					runningWidth > computedSize.width && (computedSize.width = runningWidth);
					//}
				}
			}
			
			// Calculate vertical size and position for the children
			runningHeight = 0;
			for(i = 0; i < rows.length; i++) {
				row = rows[i];
				rowHeight = 0;
				for (j = 0; j < row.length; j++) {
					child = row[j];
				
					if (this.verifyChild(child,element)) {
						//if (child._markedForLayout) {
						layoutCoefficients = child._layoutCoefficients;
						topLayoutCoefficients = layoutCoefficients.top;
						heightLayoutCoefficients = layoutCoefficients.height;
						sandboxHeightLayoutCoefficients = layoutCoefficients.sandboxHeight;
						measuredHeight = child._measuredHeight;
						isNaN(measuredHeight) && (child._measuredHeight = measuredHeight = heightLayoutCoefficients.x1 * height + heightLayoutCoefficients.x2 * (height - runningHeight) + heightLayoutCoefficients.x3);
						
						if (!child._childrenLaidOut) {
							measuredWidth = child._measuredWidth;
							child._childrenLaidOut = true;
							child._layout._doLayout(
								child, 
								isNaN(measuredWidth) ? width : measuredWidth, 
								isNaN(measuredHeight) ? height : measuredHeight, 
								isNaN(measuredWidth), 
								isNaN(measuredHeight));
						}
						
						if (topLayoutCoefficients.x2 !== 0) {
							deferredTopCalculations.push(child);
							measuredTop = 0; // Temporary for use in calculating row height
						} else {
							child._measuredTop = measuredTop = topLayoutCoefficients.x1 * height + topLayoutCoefficients.x3 * measuredHeight + topLayoutCoefficients.x4 + runningHeight;
						}
						
						child._measuredSandboxHeight = measuredSandboxHeight = sandboxHeightLayoutCoefficients.x1 * height + sandboxHeightLayoutCoefficients.x2 + measuredHeight + measuredTop - runningHeight;
						rowHeight < measuredSandboxHeight && (rowHeight = measuredSandboxHeight);
						//}
					}
				}
				rowHeights.push(rowHeight);
				runningHeight += rowHeight;
			}
			
			// Second pass, if necessary, to determine the top values
			runningHeight = 0;
			for(i = 0; i < rows.length; i++) {
				row = rows[i];
				rowHeight = rowHeights[i];
				for (j = 0; j < row.length; j++) {
					child = row[j];
				
					if (~deferredTopCalculations.indexOf(child) && this.verifyChild(child,element) ) {
						//if (child._markedForLayout) {
							measuredHeight = child._measuredHeight;
							topLayoutCoefficients = child._layoutCoefficients.top;
							child._measuredTop = topLayoutCoefficients.x1 * height + topLayoutCoefficients.x2 * rowHeight + topLayoutCoefficients.x3 * measuredHeight + topLayoutCoefficients.x4 + runningHeight;
						//}
					}
				}
				runningHeight += rowHeight;
			}
			computedSize.height = runningHeight;
			
			// Calculate the alignment offset (mobile web specific)
			if(!isHeightSize) { 
				switch(this._defaultVerticalAlignment) {
					case "end": 
						verticalAlignmentOffset = height - runningHeight;
					case "center":
						verticalAlignmentOffset /= 2;
				}
			}
			
			// Position the children
			for(i = 0; i < children.length; i++) {
				
				UI._elementLayoutCount++;
				
				// Set and store the dimensions
				child = children[i];
				setStyle(child.domNode, {
					zIndex: child.zIndex | 0,
					left: Math.round(child._measuredLeft) + pixelUnits,
					top: Math.round(verticalAlignmentOffset + child._measuredTop) + pixelUnits,
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
			!isDef(height) && (height = node._defaultHeight);
			
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
			x1 = x2 = x3 = 0;
			if (heightType === UI.SIZE) {
				x1 = x2 = x3 = NaN;
			} else if (heightType === UI.FILL) {
				x2 = 1;
				topType === "%" && (x1 = -topValue);
				topType === "#" && (x3 = -topValue);
			} else if (heightType === "%") {
				x1 = heightValue;
			} else if (heightType === "#") {
				x3 = heightValue;
			}
			heightLayoutCoefficients.x1 = x1;
			heightLayoutCoefficients.x2 = x2;
			heightLayoutCoefficients.x3 = x3;
			
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
