/*global define*/
define(['Ti/_/Layouts/Base', 'Ti/_/declare', 'Ti/API', 'Ti/UI', 'Ti/_/lang'],
	function(Base, declare, API, UI, lang) {

	var isDef = lang.isDef,
		round = Math.round,
		floor = Math.floor,
		ceil = Math.ceil;

	return declare('Ti._.Layouts.Horizontal', Base, {

		_doLayout: function(element, width, height, isWidthSize, isHeightSize) {
			var computedSize = {width: 0, height: 0},
				children = element._children,
				child,
				i = 0, j,
				layoutCoefficients,
				widthLayoutCoefficients, heightLayoutCoefficients, sandboxWidthLayoutCoefficients, sandboxHeightLayoutCoefficients, topLayoutCoefficients, leftLayoutCoefficients,
				childSize,
				measuredWidth, measuredHeight, measuredSandboxHeight, measuredSandboxWidth, measuredLeft, measuredTop,
				pixelUnits = 'px',
				runningHeight = 0, runningWidth = 0,
				rows = [[]], row,
				rowHeights = [], rowHeight,
				deferredTopCalculations = [],
				verticalAlignmentOffset = 0,
				len = children.length, rowLen,
				measureNode = this._measureNode,
				nodeStyle;

			// Calculate horizontal size and position for the children
			for(i = 0; i < len; i++) {

				child = element._children[i];
				if (!child._alive || !child.domNode) {
					this.handleInvalidState(child,element);
				} else {

					child._measuredRunningWidth = runningWidth;

					if (child._markedForLayout) {
						((child._preLayout && child._preLayout(width, height, isWidthSize, isHeightSize)) || child._needsMeasuring) && measureNode(child, child, child._layoutCoefficients, this);

						layoutCoefficients = child._layoutCoefficients;
						widthLayoutCoefficients = layoutCoefficients.width;
						heightLayoutCoefficients = layoutCoefficients.height;
						sandboxWidthLayoutCoefficients = layoutCoefficients.sandboxWidth;
						leftLayoutCoefficients = layoutCoefficients.left;

						measuredWidth = widthLayoutCoefficients.x1 * width + widthLayoutCoefficients.x2 * (width - runningWidth) + widthLayoutCoefficients.x3;
						measuredHeight = heightLayoutCoefficients.x2 === 0 ? heightLayoutCoefficients.x1 * height + heightLayoutCoefficients.x3 : NaN;

						if (isNaN(measuredWidth) || isNaN(heightLayoutCoefficients.x1)) {
							if (child._getContentSize) {
								childSize = child._getContentSize(measuredWidth, measuredHeight);
							} else {
								childSize = child._layout._doLayout(
									child,
									isNaN(measuredWidth) ? width : measuredWidth - child._borderLeftWidth - child._borderRightWidth,
									isNaN(measuredHeight) ? height : measuredHeight - child._borderTopWidth - child._borderBottomWidth,
									isNaN(measuredWidth),
									isNaN(measuredHeight));
							}
							isNaN(measuredWidth) && (measuredWidth = childSize.width + child._borderLeftWidth + child._borderRightWidth);
							isNaN(heightLayoutCoefficients.x1) && (measuredHeight = childSize.height + child._borderTopWidth + child._borderBottomWidth);

							child._childrenLaidOut = true;
							if (heightLayoutCoefficients.x2 !== 0 && !isNaN(heightLayoutCoefficients.x2)) {
								API.warn('Child of width SIZE and height FILL detected in a horizontal layout. Performance degradation may occur.');
								child._childrenLaidOut = false;
							}
						} else {
							child._childrenLaidOut = false;
						}
						child._measuredWidth = measuredWidth;
						child._measuredHeight = measuredHeight;

						measuredSandboxWidth = child._measuredSandboxWidth = sandboxWidthLayoutCoefficients.x1 * width + sandboxWidthLayoutCoefficients.x2 + measuredWidth;

						measuredLeft = leftLayoutCoefficients.x1 * width + leftLayoutCoefficients.x2 + runningWidth;
						if (!isWidthSize && floor(measuredSandboxWidth + runningWidth) > ceil(width)) {
							rows.push([]);
							measuredLeft -= runningWidth;
							runningWidth = 0;
						}
						child._measuredLeft = measuredLeft;
						rows[rows.length - 1].push(child);
						runningWidth += measuredSandboxWidth;
					}
					runningWidth > computedSize.width && (computedSize.width = runningWidth);
				}
			}

			// Calculate vertical size and position for the children
			len = rows.length;
			for(i = 0; i < len; i++) {
				row = rows[i];
				rowHeight = 0;
				rowLen = row.length;
				for (j = 0; j < rowLen; j++) {
					child = row[j];

					if (child._markedForLayout) {
						layoutCoefficients = child._layoutCoefficients;
						topLayoutCoefficients = layoutCoefficients.top;
						heightLayoutCoefficients = layoutCoefficients.height;
						sandboxHeightLayoutCoefficients = layoutCoefficients.sandboxHeight;
						measuredHeight = child._measuredHeight;
						isNaN(measuredHeight) && (child._measuredHeight = measuredHeight = heightLayoutCoefficients.x1 *
							height + heightLayoutCoefficients.x2 * (height - runningHeight) + heightLayoutCoefficients.x3);

						if (!child._childrenLaidOut) {
							measuredWidth = child._measuredWidth;
							child._childrenLaidOut = true;
							child._layout._doLayout(
								child,
								isNaN(measuredWidth) ? width : measuredWidth - child._borderLeftWidth - child._borderRightWidth,
								isNaN(measuredHeight) ? height : measuredHeight - child._borderTopWidth - child._borderBottomWidth,
								isNaN(measuredWidth),
								isNaN(measuredHeight));
						}

						if (topLayoutCoefficients.x2 !== 0) {
							deferredTopCalculations.push(child);
							measuredTop = runningHeight; // Temporary for use in calculating row height
						} else {
							child._measuredTop = measuredTop = topLayoutCoefficients.x1 * height +
								topLayoutCoefficients.x3 * measuredHeight + topLayoutCoefficients.x4 + runningHeight;
						}

						child._measuredSandboxHeight = measuredSandboxHeight = sandboxHeightLayoutCoefficients.x1 * height + sandboxHeightLayoutCoefficients.x2 + measuredHeight + measuredTop - runningHeight;
						rowHeight < measuredSandboxHeight && (rowHeight = measuredSandboxHeight);
					}
				}
				rowHeights.push(rowHeight);
				runningHeight += rowHeight;
			}

			// Second pass, if necessary, to determine the top values
			runningHeight = 0;
			len = rows.length;
			for(i = 0; i < len; i++) {
				row = rows[i];
				rowHeight = rowHeights[i];
				rowLen = row.length;
				for (j = 0; j < rowLen; j++) {
					child = row[j];
					child._measuredRunningHeight = runningHeight;
					child._measuredRowHeight = rowHeight;
					if (~deferredTopCalculations.indexOf(child) && child._markedForLayout) {
						measuredHeight = child._measuredHeight;
						topLayoutCoefficients = child._layoutCoefficients.top;
						child._measuredTop = topLayoutCoefficients.x1 * height + topLayoutCoefficients.x2 * rowHeight + topLayoutCoefficients.x3 * measuredHeight + topLayoutCoefficients.x4 + runningHeight;
					}
				}
				runningHeight += rowHeight;
			}
			computedSize.height = runningHeight;

			// Calculate the alignment offset (mobile web specific)
			if(!isHeightSize) {
				switch(this._defaultVerticalAlignment) {
					case 'end':
						verticalAlignmentOffset = height - runningHeight;
					case 'center':
						verticalAlignmentOffset /= 2;
				}
			}

			// Position the children
			len = children.length;
			for(i = 0; i < len; i++) {
				child = children[i];
				if (child._markedForLayout) {
					UI._elementLayoutCount++;
					child = children[i];
					nodeStyle = child.domNode.style;
					nodeStyle.zIndex = child.zIndex;
					nodeStyle.left = round(child._measuredLeft) + pixelUnits;
					nodeStyle.top = round(child._measuredTop) + pixelUnits;
					nodeStyle.width = round(child._measuredWidth - child._borderLeftWidth - child._borderRightWidth) + pixelUnits;
					nodeStyle.height = round(child._measuredHeight - child._borderTopWidth - child._borderBottomWidth) + pixelUnits;
					child._markedForLayout = false;
					child.fireEvent('postlayout');
				}
			}

			return this._computedSize = computedSize;
		},

		_getWidth: function(node, width) {

			// Get the width or default width, depending on which one is needed
			!isDef(width) && (width = node._defaultWidth);

			// Check if the width is INHERIT, and if so fetch the inherited width
			if (width === UI.INHERIT) {
				if (node._parent._parent) {
					return node._parent._parent._layout._getWidth(node._parent, node._parent.width) === UI.SIZE ? UI.SIZE : UI.FILL;
				}
				// This is the root level content container, which we know has a width of FILL
				return UI.FILL;
			}
			return width;
		},

		_getHeight: function(node, height) {

			// Get the height or default height, depending on which one is needed
			!isDef(height) && (height = node._defaultHeight);

			// Check if the width is INHERIT, and if so fetch the inherited width
			if (height === UI.INHERIT) {
				if (node._parent._parent) {
					return node._parent._parent._layout._getHeight(node._parent, node._height) === UI.SIZE ? UI.SIZE : UI.FILL;
				}
				// This is the root level content container, which we know has a width of FILL
				return UI.FILL;
			}
			return height;
		},

		_isDependentOnParent: function(node){
			var layoutCoefficients = node._layoutCoefficients;
			return (!isNaN(layoutCoefficients.width.x1) && layoutCoefficients.width.x1 !== 0) ||
				(!isNaN(layoutCoefficients.width.x2) && layoutCoefficients.width.x2 !== 0) || // width
				(!isNaN(layoutCoefficients.height.x1) && layoutCoefficients.height.x1 !== 0) ||
				(!isNaN(layoutCoefficients.height.x2) && layoutCoefficients.height.x2 !== 0) || // height
				layoutCoefficients.sandboxWidth.x1 !== 0 || // sandbox width
				layoutCoefficients.sandboxHeight.x1 !== 0 || // sandbox height
				layoutCoefficients.left.x1 !== 0 || // left
				layoutCoefficients.top.x1 !== 0; // top
		},

		_doAnimationLayout: function(node, animationCoefficients) {

			var parentWidth = node._parent._measuredWidth,
				parentHeight = node._parent._measuredHeight,
				nodeHeight = node._measuredHeight,
				runningWidth = node._measuredRunningWidth,
				runningHeight = node._measuredRunningHeight,
				rowHeight = node._measuredRowHeight;

			return {
				width: animationCoefficients.width.x1 * parentWidth + animationCoefficients.width.x2 * (parentWidth - runningWidth) + animationCoefficients.width.x3,
				height: animationCoefficients.height.x1 * parentHeight + animationCoefficients.height.x2 * (parentHeight - runningHeight) + animationCoefficients.height.x3,
				left: animationCoefficients.left.x1 * parentWidth + animationCoefficients.left.x2  + runningWidth,
				top: animationCoefficients.top.x1 * parentHeight + animationCoefficients.top.x2 * rowHeight + animationCoefficients.top.x3 * nodeHeight + animationCoefficients.top.x4 + runningHeight
			};
		},

		_measureNode: function(node, layoutProperties, layoutCoefficients, self) {

			node._needsMeasuring = false;

			// Pre-processing
			var getValueType = self.getValueType,
				computeValue = self.computeValue,

				width = self._getWidth(node, layoutProperties.width),
				widthType = getValueType(width),
				widthValue = computeValue(width, widthType),

				height = self._getHeight(node, layoutProperties.height),
				heightType = getValueType(height),
				heightValue = computeValue(height, heightType),

				left = layoutProperties.left,
				leftType = getValueType(left),
				leftValue = computeValue(left, leftType),

				right = layoutProperties.right,
				rightType = getValueType(right),
				rightValue = computeValue(right, rightType),

				top = layoutProperties.top,
				topType = getValueType(top),
				topValue = computeValue(top, topType),

				bottom = layoutProperties.bottom,
				bottomType = getValueType(bottom),
				bottomValue = computeValue(bottom, bottomType),

				x1, x2, x3, x4,

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
				leftType === '%' && (x1 = -leftValue);
				leftType === '#' && (x3 = -leftValue);
				rightType === '%' && (x1 = -rightValue);
				rightType === '#' && (x3 = -rightValue);
			} else if (widthType === '%') {
				x1 = widthValue;
			} else if (widthType === '#') {
				x3 = widthValue;
			}
			widthLayoutCoefficients.x1 = x1;
			widthLayoutCoefficients.x2 = x2;
			widthLayoutCoefficients.x3 = x3;

			// Sandbox width rule calculation
			x1 = x2 = 0;
			leftType === '%' && (x1 = leftValue);
			leftType === '#' && (x2 = leftValue);
			rightType === '%' && (x1 += rightValue);
			rightType === '#' && (x2 += rightValue);
			sandboxWidthLayoutCoefficients.x1 = x1;
			sandboxWidthLayoutCoefficients.x2 = x2;

			// Height rule calculation
			x1 = x2 = x3 = 0;
			if (heightType === UI.SIZE) {
				x1 = x2 = x3 = NaN;
			} else if (heightType === UI.FILL) {
				x2 = 1;
				topType === '%' && (x1 = -topValue);
				topType === '#' && (x3 = -topValue);
			} else if (heightType === '%') {
				x1 = heightValue;
			} else if (heightType === '#') {
				x3 = heightValue;
			}
			heightLayoutCoefficients.x1 = x1;
			heightLayoutCoefficients.x2 = x2;
			heightLayoutCoefficients.x3 = x3;

			// Sandbox height rule calculation
			sandboxHeightLayoutCoefficients.x1 = bottomType === '%' ? bottomValue : 0;
			sandboxHeightLayoutCoefficients.x2 = bottomType === '#' ? bottomValue : 0;

			// Left rule calculation
			leftLayoutCoefficients.x1 = leftType === '%' ? leftValue : 0;
			leftLayoutCoefficients.x2 = leftType === '#' ? leftValue : 0;

			// Top rule calculation
			x1 = x2 = x3 = x4 = 0;
			if (topType === '%') {
				x1 = topValue;
			} else if(topType === '#') {
				x4 = topValue;
			} else if(bottomType === '%') {
				x1 = 1 - bottomValue;
				x3 = -1;
			} else if(bottomType === '#') {
				x1 = 1;
				x3 = -1;
				x4 = -bottomValue;
			} else {
				switch(self._defaultRowAlignment) {
					case 'center':
						x2 = 0.5;
						x3 = -0.5;
						break;
					case 'end':
						x2 = 1;
						x3 = -1;
				}
			}
			topLayoutCoefficients.x1 = x1;
			topLayoutCoefficients.x2 = x2;
			topLayoutCoefficients.x3 = x3;
			topLayoutCoefficients.x4 = x4;
		},

		_defaultHorizontalAlignment: 'start',

		_defaultVerticalAlignment: 'start',

		_defaultRowAlignment: 'center'

	});

});
