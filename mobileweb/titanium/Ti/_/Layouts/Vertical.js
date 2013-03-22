/*global define*/
define(['Ti/_/Layouts/Base', 'Ti/_/declare', 'Ti/UI', 'Ti/_/lang'], function(Base, declare, UI, lang) {

	var isDef = lang.isDef,
		round = Math.round;

	return declare('Ti._.Layouts.Vertical', Base, {

		_doLayout: function(element, width, height, isWidthSize, isHeightSize) {
			var computedSize = {width: 0, height: 0},
				children = element._children,
				child,
				i = 0,
				layoutCoefficients,
				widthLayoutCoefficients, heightLayoutCoefficients, sandboxWidthLayoutCoefficients, sandboxHeightLayoutCoefficients, topLayoutCoefficients, leftLayoutCoefficients,
				childSize,
				measuredWidth, measuredHeight, measuredSandboxHeight, measuredSandboxWidth, measuredLeft,
				pixelUnits = 'px',
				deferredLeftCalculations = [],
				runningHeight = 0,
				len = children.length,
				measureNode = this._measureNode,
				style;

			// Calculate size and position for the children
			for(i = 0; i < len; i++) {

				child = element._children[i];
				if (!child._alive || !child.domNode) {
					this.handleInvalidState(child,element);
				} else {

					child._measuredRunningHeight = runningHeight;

					if (child._markedForLayout) {
						((child._preLayout && child._preLayout(width, height, isWidthSize, isHeightSize)) || child._needsMeasuring) && measureNode(child, child, child._layoutCoefficients, this);

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

						if (isWidthSize && leftLayoutCoefficients.x1 !== 0) {
							deferredLeftCalculations.push(child);
						} else {
							measuredLeft = child._measuredLeft = leftLayoutCoefficients.x1 * width + leftLayoutCoefficients.x2 * measuredWidth + leftLayoutCoefficients.x3;
							measuredSandboxWidth = child._measuredSandboxWidth = sandboxWidthLayoutCoefficients.x1 * width + sandboxWidthLayoutCoefficients.x2 + measuredWidth + (isNaN(measuredLeft) ? 0 : measuredLeft);
						}
						child._measuredTop = topLayoutCoefficients.x1 * height + topLayoutCoefficients.x2 + runningHeight;

						measuredSandboxHeight = child._measuredSandboxHeight = sandboxHeightLayoutCoefficients.x1 * height + sandboxHeightLayoutCoefficients.x2 + measuredHeight;
					}
					child._measuredSandboxWidth > computedSize.width && (computedSize.width = child._measuredSandboxWidth);
					runningHeight = (computedSize.height += child._measuredSandboxHeight);
				}
			}

			// Calculate the preliminary sandbox widths (missing left, since one of these widths may end up impacting all the lefts)
			len = deferredLeftCalculations.length;
			for(i = 0; i < len; i++) {
				child = deferredLeftCalculations[i];
				sandboxWidthLayoutCoefficients = child._layoutCoefficients.sandboxWidth;
				measuredSandboxWidth = child._measuredSandboxWidth = sandboxWidthLayoutCoefficients.x1 * width + sandboxWidthLayoutCoefficients.x2 + child._measuredWidth;
				measuredSandboxWidth > computedSize.width && (computedSize.width = measuredSandboxWidth);
			}

			// Second pass, if necessary, to determine the left values
			for(i = 0; i < len; i++) {
				child = deferredLeftCalculations[i];

				leftLayoutCoefficients = child._layoutCoefficients.left;
				sandboxWidthLayoutCoefficients = child._layoutCoefficients.sandboxWidth;
				measuredWidth = child._measuredWidth;
				measuredSandboxWidth = child._measuredSandboxWidth;

				measuredSandboxWidth > computedSize.width && (computedSize.width = measuredSandboxWidth);
				measuredLeft = child._measuredLeft = leftLayoutCoefficients.x1 * computedSize.width + leftLayoutCoefficients.x2 * measuredWidth + leftLayoutCoefficients.x3;
				child._measuredSandboxWidth += (isNaN(measuredLeft) ? 0 : measuredLeft);
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
			!isDef(width) && (isDef(node.left) + isDef(node.center && node.center.x) + isDef(node.right) < 2) && (width = node._defaultWidth);

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
					return node._parent._parent._layout._getHeight(node._parent, node._parent.height) === UI.SIZE ? UI.SIZE : UI.FILL;
				}
				// This is the root level content container, which we know has a width of FILL
				return UI.FILL;
			}
			return height;
		},

		_isDependentOnParent: function(node){
			var layoutCoefficients = node._layoutCoefficients;
			return (!isNaN(layoutCoefficients.width.x1) && layoutCoefficients.width.x1 !== 0) || // width
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
				runningHeight = node._measuredRunningHeight,
				width = animationCoefficients.width.x1 * parentWidth + animationCoefficients.width.x2;

			return {
				width: width,
				height: animationCoefficients.height.x1 * parentHeight + animationCoefficients.height.x2 * (parentHeight - runningHeight) + animationCoefficients.height.x3,
				left: animationCoefficients.left.x1 * parentWidth + animationCoefficients.left.x2 * width + animationCoefficients.left.x3,
				top: animationCoefficients.top.x1 * parentHeight + animationCoefficients.top.x2 + runningHeight
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

				centerX = layoutProperties.center && layoutProperties.center.x,
				centerXType = getValueType(centerX),
				centerXValue = computeValue(centerX, centerXType),

				right = layoutProperties.right,
				rightType = getValueType(right),
				rightValue = computeValue(right, rightType),

				top = layoutProperties.top,
				topType = getValueType(top),
				topValue = computeValue(top, topType),

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

			// Width rule evaluation
			x1 = x2 = 0;
			if (widthType === UI.SIZE) {
				x1 = x2 = NaN;
			} else if (widthType === UI.FILL) {
				x1 = 1;
				if (leftType === '%') {
					x1 -= leftValue;
				} else if (leftType === '#') {
					x2 = -leftValue;
				} else if (rightType === '%') {
					x1 -= rightValue;
				} else if (rightType === '#') {
					x2 = -rightValue;
				}
			} else if (widthType === '%') {
				x1 = widthValue;
			} else if (widthType === '#') {
				x2 = widthValue;
			} else if (leftType === '%') {
				if (centerXType === '%') {
					x1 = 2 * (centerXValue - leftValue);
				} else if (centerXType === '#') {
					x1 = -2 * leftValue;
					x2 = 2 * centerXValue;
				} else if (rightType === '%') {
					x1 = 1 - leftValue - rightValue;
				} else if (rightType === '#') {
					x1 = 1 - leftValue;
					x2 = -rightValue;
				}
			} else if (leftType === '#') {
				if (centerXType === '%') {
					x1 = 2 * centerXValue;
					x2 = -2 * leftValue;
				} else if (centerXType === '#') {
					x2 = 2 * (centerXValue - leftValue);
				} else if (rightType === '%') {
					x1 = 1 - rightValue;
					x2 = -leftValue;
				} else if (rightType === '#') {
					x1 = 1;
					x2 = -rightValue - leftValue;
				}
			} else if (centerXType === '%') {
				if (rightType === '%') {
					x1 = 2 * (rightValue - centerXValue);
				} else if (rightType === '#') {
					x1 = -2 * centerXValue;
					x2 = 2 * rightValue;
				}
			} else if (centerXType === '#') {
				if (rightType === '%') {
					x1 = 2 * rightValue;
					x2 = -2 * centerXValue;
				} else if (rightType === '#') {
					x2 = 2 * (rightValue - centerXValue);
				}
			}
			widthLayoutCoefficients.x1 = x1;
			widthLayoutCoefficients.x2 = x2;

			// Sandbox width/height rule evaluation
			sandboxWidthLayoutCoefficients.x1 = rightType === '%' ? rightValue : 0;
			sandboxWidthLayoutCoefficients.x2 = rightType === '#' ? rightValue : 0;

			// Height rule calculation
			x1 = x2 = x3 = 0;
			if (heightType === UI.SIZE) {
				x1 = x2 = x3 = NaN;
			} else if (heightType === UI.FILL) {
				x2 = 1;
				topType === '%' && (x1 = -topValue);
				topType === '#' && (x3 = -topValue);
				bottomType === '%' && (x1 = -bottomValue);
				bottomType === '#' && (x3 = -bottomValue);
			} else if (heightType === '%') {
				x1 = heightValue;
			} else if (heightType === '#') {
				x3 = heightValue;
			}
			heightLayoutCoefficients.x1 = x1;
			heightLayoutCoefficients.x2 = x2;
			heightLayoutCoefficients.x3 = x3;

			// Sandbox height rule calculation
			x1 = x2 = 0;
			topType === '%' && (x1 = topValue);
			topType === '#' && (x2 = topValue);
			bottomType === '%' && (x1 += bottomValue);
			bottomType === '#' && (x2 += bottomValue);
			sandboxHeightLayoutCoefficients.x1 = x1;
			sandboxHeightLayoutCoefficients.x2 = x2;

			// Left rule calculation
			x1 = x2 = x3 = 0;
			if (leftType === '%') {
				x1 = leftValue;
			} else if(leftType === '#') {
				x3 = leftValue;
			} else if (centerXType === '%') {
				x1 = centerXValue;
				x2 = -0.5;
			} else if (centerXType === '#') {
				x2 = -0.5;
				x3 = centerXValue;
			} else if (rightType === '%') {
				x1 = 1 - rightValue;
				x2 = -1;
			} else if (rightType === '#') {
				x1 = 1;
				x2 = -1;
				x3 = -rightValue;
			} else {
				switch(self._defaultHorizontalAlignment) {
					case 'center':
						x1 = 0.5;
						x2 = -0.5;
						break;
					case 'end':
						x1 = 1;
						x2 = -1;
				}
			}
			leftLayoutCoefficients.x1 = x1;
			leftLayoutCoefficients.x2 = x2;
			leftLayoutCoefficients.x3 = x3;

			// Top rule calculation
			topLayoutCoefficients.x1 = topType === '%' ? topValue : 0;
			topLayoutCoefficients.x2 = topType === '#' ? topValue : 0;
		},

		_defaultHorizontalAlignment: 'center',

		_defaultVerticalAlignment: 'start'

	});

});
