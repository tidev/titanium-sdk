/*global define*/
define(['Ti/_/Layouts/Base', 'Ti/_/declare', 'Ti/UI', 'Ti/_/lang'], function(Base, declare, UI, lang) {

	var isDef = lang.isDef,
		round = Math.round;

	return declare('Ti._.Layouts.ConstrainingHorizontal', Base, {

		_doLayout: function(element, width, height, isWidthSize, isHeightSize) {
			var computedSize = {width: 0, height: 0},
				children = element._children,
				child,
				i = 0,
				layoutCoefficients,
				widthLayoutCoefficients, heightLayoutCoefficients, sandboxWidthLayoutCoefficients, sandboxHeightLayoutCoefficients, topLayoutCoefficients, leftLayoutCoefficients,
				childSize,
				measuredWidth, measuredHeight, measuredSandboxHeight, measuredSandboxWidth, measuredLeft, measuredTop,
				pixelUnits = 'px',
				deferredTopCalculations = [],
				runningWidth = 0,
				remainingSpace,
				fillCount = 0,
				len = children.length,
				measureNode = this._measureNode,
				style;

			// Calculate size for the non-FILL children
			for(i = 0; i < len; i++) {

				child = element._children[i];
				if (!child._alive || !child.domNode) {
					this.handleInvalidState(child,element);
				} else {

					if (child._markedForLayout) {
						((child._preLayout && child._preLayout(width, height, isWidthSize, isHeightSize)) || child._needsMeasuring) && measureNode(child, child, child._layoutCoefficients, this);

						layoutCoefficients = child._layoutCoefficients;
						widthLayoutCoefficients = layoutCoefficients.width;

						if (widthLayoutCoefficients.x2 === 0 || isNaN(widthLayoutCoefficients.x2)) {
							heightLayoutCoefficients = layoutCoefficients.height;
							sandboxWidthLayoutCoefficients = layoutCoefficients.sandboxWidth;
							sandboxHeightLayoutCoefficients = layoutCoefficients.sandboxHeight;

							measuredHeight = heightLayoutCoefficients.x1 * height + heightLayoutCoefficients.x2;
							measuredWidth = widthLayoutCoefficients.x1 * width + widthLayoutCoefficients.x2 * (width - runningWidth) + widthLayoutCoefficients.x3;

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
							isNaN(measuredHeight) && (measuredHeight = childSize.height + child._borderTopWidth + child._borderBottomWidth);

							measuredSandboxWidth = child._measuredSandboxWidth = sandboxWidthLayoutCoefficients.x1 * width + sandboxWidthLayoutCoefficients.x2 + measuredWidth;

							runningWidth += measuredSandboxWidth;

							child._measuredWidth = measuredWidth;
							child._measuredHeight = measuredHeight;
						} else {
							fillCount++;
						}
					}
				}
			}

			// Calculate size for the FILL children
			remainingSpace = width - runningWidth;
			runningWidth = Math.floor(remainingSpace / fillCount); // Temporary repurposing of runningHeight
			for(i = 0; i < len; i++) {

				child = element._children[i];
				if (child._markedForLayout) {

					layoutCoefficients = child._layoutCoefficients;
					widthLayoutCoefficients = layoutCoefficients.width;

					if (widthLayoutCoefficients.x2 !== 0 && !isNaN(widthLayoutCoefficients.x2)) {
						heightLayoutCoefficients = layoutCoefficients.height;
						sandboxWidthLayoutCoefficients = layoutCoefficients.sandboxWidth;
						sandboxHeightLayoutCoefficients = layoutCoefficients.sandboxHeight;

						measuredHeight = heightLayoutCoefficients.x1 * height + heightLayoutCoefficients.x2;
						measuredWidth = widthLayoutCoefficients.x1 * width + widthLayoutCoefficients.x2 * (i < len - 1 ? runningWidth : remainingSpace - runningWidth * (fillCount - 1)) + widthLayoutCoefficients.x3;

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
						isNaN(measuredHeight) && (measuredHeight = childSize.height + child._borderTopWidth + child._borderBottomWidth);
						child._measuredWidth = measuredWidth;
						child._measuredHeight = measuredHeight;

						measuredSandboxWidth = child._measuredSandboxWidth = sandboxWidthLayoutCoefficients.x1 * width + sandboxWidthLayoutCoefficients.x2 + measuredWidth;
					}
				}
			}

			// Calculate position for the children
			runningWidth = 0;
			for(i = 0; i < len; i++) {

				child = element._children[i];
				child._measuredRunningWidth = runningWidth;
				if (child._markedForLayout) {
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
						child._measuredSandboxHeight > computedSize.height && (computedSize.height = child._measuredSandboxHeight);
					}
					measuredLeft = child._measuredLeft = leftLayoutCoefficients.x1 * width + leftLayoutCoefficients.x2 + runningWidth;
				} else {
					child._measuredSandboxHeight > computedSize.height && (computedSize.height = child._measuredSandboxHeight);
				}
				runningWidth += child._measuredSandboxWidth;
			}
			computedSize.width = runningWidth;

			// Calculate the preliminary sandbox heights (missing top, since one of these heights may end up impacting all the tops)
			len = deferredTopCalculations.length;
			for(i = 0; i < len; i++) {
				child = deferredTopCalculations[i];
				sandboxHeightLayoutCoefficients = child._layoutCoefficients.sandboxHeight;
				measuredSandboxHeight = child._measuredSandboxHeight = sandboxHeightLayoutCoefficients.x1 * height + sandboxHeightLayoutCoefficients.x2 + child._measuredHeight;
				measuredSandboxHeight > computedSize.height && (computedSize.height = measuredSandboxHeight);
			}

			// Second pass, if necessary, to determine the top values
			for(i = 0; i < len; i++) {
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
			len = children.length;
			for(i = 0; i < len; i++) {
				child = children[i];
				if (child._markedForLayout) {
					UI._elementLayoutCount++;
					child = children[i];
					style = child.domNode.style;
					style.zIndex = child.zIndex;
					style.left = round(child._measuredLeft) + pixelUnits;
					style.top = round(child._measuredTop) + pixelUnits;
					style.width = round(child._measuredWidth - child._borderLeftWidth - child._borderRightWidth) + pixelUnits;
					style.height = round(child._measuredHeight - child._borderTopWidth - child._borderBottomWidth) + pixelUnits;
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
			!isDef(height) && (isDef(node.top) + isDef(node.center && node.center.y) + isDef(node.bottom) < 2) && (height = node._defaultHeight);

			// Check if the width is INHERIT, and if so fetch the inherited width
			if (height === UI.INHERIT) {
				if (node._parent._parent) {
					return node._parent._parent._layout._getHeight(node._parent, node._parent.height) === UI.SIZE ? UI.SIZE : UI.FILL;
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
				(!isNaN(layoutCoefficients.height.x1) && layoutCoefficients.height.x1 !== 0) || // height
				layoutCoefficients.sandboxWidth.x1 !== 0 || // sandbox width
				layoutCoefficients.sandboxHeight.x1 !== 0 || // sandbox height
				layoutCoefficients.left.x1 !== 0 || // left
				layoutCoefficients.top.x1 !== 0; // top
		},

		_doAnimationLayout: function(node, animationCoefficients) {

			var parentWidth = node._parent._measuredWidth,
				parentHeight = node._parent._measuredHeight,
				runningWidth = node._measuredRunningWidth,
				height = animationCoefficients.height.x1 * parentHeight + animationCoefficients.height.x2;

			return {
				width: animationCoefficients.width.x1 * parentWidth + animationCoefficients.width.x2 * (parentWidth - runningWidth) + animationCoefficients.width.x3,
				height: height,
				left: animationCoefficients.left.x1 * parentWidth + animationCoefficients.left.x2 + runningWidth,
				top: animationCoefficients.top.x1 * parentHeight + animationCoefficients.top.x2 * height + animationCoefficients.top.x3
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

				centerY = layoutProperties.center && layoutProperties.center.y,
				centerYType = getValueType(centerY),
				centerYValue = computeValue(centerY, centerYType),

				bottom = layoutProperties.bottom,
				bottomType = getValueType(bottom),
				bottomValue = computeValue(bottom, bottomType),

				x1, x2, x3,

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
				if (topType === '%') {
					x1 -= topValue;
				} else if (topType === '#') {
					x2 = -topValue;
				} else if (bottomType === '%') {
					x1 -= bottomValue;
				} else if (bottomType === '#') {
					x2 = -bottomValue;
				}
			} else if (heightType === '%') {
				x1 = heightValue;
			} else if (heightType === '#') {
				x2 = heightValue;
			} else if (topType === '%') {
				if (centerYType === '%') {
					x1 = 2 * (centerYValue - topValue);
				} else if (centerYType === '#') {
					x1 = -2 * topValue;
					x2 = 2 * centerYValue;
				} else if (bottomType === '%') {
					x1 = 1 - topValue - bottomValue;
				} else if (bottomType === '#') {
					x1 = 1 - topValue;
					x2 = -bottomValue;
				}
			} else if (topType === '#') {
				if (centerYType === '%') {
					x1 = 2 * centerYValue;
					x2 = -2 * topValue;
				} else if (centerYType === '#') {
					x2 = 2 * (centerYValue - topValue);
				} else if (bottomType === '%') {
					x1 = 1 - bottomValue;
					x2 = -topValue;
				} else if (bottomType === '#') {
					x1 = 1;
					x2 = -bottomValue - topValue;
				}
			} else if (centerYType === '%') {
				if (bottomType === '%') {
					x1 = 2 * (bottomValue - centerYValue);
				} else if (bottomType === '#') {
					x1 = -2 * centerYValue;
					x2 = 2 * bottomValue;
				}
			} else if (centerYType === '#') {
				if (bottomType === '%') {
					x1 = 2 * bottomValue;
					x2 = -2 * centerYValue;
				} else if (bottomType === '#') {
					x2 = 2 * (bottomValue - centerYValue);
				}
			}
			heightLayoutCoefficients.x1 = x1;
			heightLayoutCoefficients.x2 = x2;

			// Sandbox height rule evaluation
			sandboxHeightLayoutCoefficients.x1 = bottomType === '%' ? bottomValue : 0;
			sandboxHeightLayoutCoefficients.x2 = bottomType === '#' ? bottomValue : 0;

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

			// Top rule calculation
			x1 = x2 = x3 = 0;
			if (topType === '%') {
				x1 = topValue;
			} else if(topType === '#') {
				x3 = topValue;
			} else if (centerYType === '%') {
				x1 = centerYValue;
				x2 = -0.5;
			} else if (centerYType === '#') {
				x2 = -0.5;
				x3 = centerYValue;
			} else if (bottomType === '%') {
				x1 = 1 - bottomValue;
				x2 = -1;
			} else if (bottomType === '#') {
				x1 = 1;
				x2 = -1;
				x3 = -bottomValue;
			} else {
				switch(self._defaultVerticalAlignment) {
					case 'center':
						x1 = 0.5;
						x2 = -0.5;
						break;
					case 'end':
						x1 = 1;
						x2 = -1;
				}
			}
			topLayoutCoefficients.x1 = x1;
			topLayoutCoefficients.x2 = x2;
			topLayoutCoefficients.x3 = x3;

			// Left rule calculation
			leftLayoutCoefficients.x1 = leftType === '%' ? leftValue : 0;
			leftLayoutCoefficients.x2 = leftType === '#' ? leftValue : 0;
		},

		_defaultHorizontalAlignment: 'start',

		_defaultVerticalAlignment: 'center'

	});

});
