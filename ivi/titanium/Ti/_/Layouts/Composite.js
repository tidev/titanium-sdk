/*global define*/
define(['Ti/_/Layouts/Base', 'Ti/_/declare', 'Ti/UI', 'Ti/_/lang'], function(Base, declare, UI, lang) {

	var isDef = lang.isDef,
		pixelUnits = 'px',
		round = Math.round;

	return declare('Ti._.Layouts.Composite', Base, {

		_doLayout: function(element, width, height, isWidthSize, isHeightSize) {
			var computedSize = {width: 0, height: 0},
				children = element._children,
				child,
				i = 0,
				layoutCoefficients,
				widthLayoutCoefficients, heightLayoutCoefficients, sandboxWidthLayoutCoefficients, sandboxHeightLayoutCoefficients, topLayoutCoefficients, leftLayoutCoefficients,
				minWidthLayoutCoefficients, minHeightLayoutCoefficients,
				childSize,
				measuredWidth, measuredHeight, measuredSandboxHeight, measuredSandboxWidth, measuredLeft, measuredTop,
				deferredLeftCalculations = [],
				deferredTopCalculations = [],
				len = children.length,
				measureNode = this._measureNode,
				style;

			// Calculate size and position for the children
			for(i = 0; i < len; i++) {

				child = element._children[i];
				if (!child._alive || !child.domNode) {
					this.handleInvalidState(child,element);
				} else {

					if (child._markedForLayout) {
						((child._preLayout && child._preLayout(width, height, isWidthSize, isHeightSize)) || child._needsMeasuring) && measureNode(child, child, child._layoutCoefficients, this);

						layoutCoefficients = child._layoutCoefficients;
						widthLayoutCoefficients = layoutCoefficients.width;
						minWidthLayoutCoefficients = layoutCoefficients.minWidth;
						heightLayoutCoefficients = layoutCoefficients.height;
						minHeightLayoutCoefficients = layoutCoefficients.minHeight;
						sandboxWidthLayoutCoefficients = layoutCoefficients.sandboxWidth;
						sandboxHeightLayoutCoefficients = layoutCoefficients.sandboxHeight;
						leftLayoutCoefficients = layoutCoefficients.left;
						topLayoutCoefficients = layoutCoefficients.top;

						measuredWidth = widthLayoutCoefficients.x1 * width + widthLayoutCoefficients.x2;
						minWidthLayoutCoefficients.x1 !== void 0 && (measuredWidth = Math.max(measuredWidth,
							minWidthLayoutCoefficients.x1 * width + minWidthLayoutCoefficients.x2));

						measuredHeight = heightLayoutCoefficients.x1 * height + heightLayoutCoefficients.x2;
						minHeightLayoutCoefficients.x1 !== void 0 && (measuredHeight = Math.max(measuredHeight,
							minHeightLayoutCoefficients.x1 * height + minHeightLayoutCoefficients.x2));

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

						if (isNaN(measuredWidth)) {
							measuredWidth = childSize.width + child._borderLeftWidth + child._borderRightWidth;
							minWidthLayoutCoefficients.x1 !== void 0 && (measuredWidth = Math.max(measuredWidth,
								minWidthLayoutCoefficients.x1 * width + minWidthLayoutCoefficients.x2));
						}
						if (isNaN(measuredHeight)) {
							measuredHeight = childSize.height + child._borderTopWidth + child._borderBottomWidth;
							minHeightLayoutCoefficients.x1 !== void 0 && (measuredHeight = Math.max(measuredHeight,
								minHeightLayoutCoefficients.x1 * height + minHeightLayoutCoefficients.x2));
						}

						if (isWidthSize && leftLayoutCoefficients.x1 !== 0) {
							deferredLeftCalculations.push(child);
						} else {
							measuredLeft = leftLayoutCoefficients.x1 * width + leftLayoutCoefficients.x2 * measuredWidth + leftLayoutCoefficients.x3;
						}
						if (isHeightSize && topLayoutCoefficients.x1 !== 0) {
							deferredTopCalculations.push(child);
						} else {
							measuredTop = topLayoutCoefficients.x1 * height + topLayoutCoefficients.x2 * measuredHeight + topLayoutCoefficients.x3;
						}

						child._measuredSandboxWidth = measuredSandboxWidth = sandboxWidthLayoutCoefficients.x1 * height + sandboxWidthLayoutCoefficients.x2 + measuredWidth + (isNaN(measuredLeft) ? 0 : measuredLeft);
						child._measuredSandboxHeight = measuredSandboxHeight = sandboxHeightLayoutCoefficients.x1 * height + sandboxHeightLayoutCoefficients.x2 + measuredHeight + (isNaN(measuredTop) ? 0 : measuredTop);

						child._measuredWidth = measuredWidth;
						child._measuredHeight = measuredHeight;
						child._measuredLeft = measuredLeft;
						child._measuredTop = measuredTop;
					}

					// Update the size of the component
					child._measuredSandboxWidth > computedSize.width && (computedSize.width = child._measuredSandboxWidth);
					child._measuredSandboxHeight > computedSize.height && (computedSize.height = child._measuredSandboxHeight);
				}
			}

			// Second pass, if necessary, to determine the left/top values
			len = deferredLeftCalculations.length;
			for(i = 0; i < len; i++) {
				child = deferredLeftCalculations[i];
				leftLayoutCoefficients = child._layoutCoefficients.left;
				sandboxWidthLayoutCoefficients = child._layoutCoefficients.sandboxWidth;
				child._measuredLeft = measuredLeft = leftLayoutCoefficients.x1 * computedSize.width + leftLayoutCoefficients.x2 * measuredWidth + leftLayoutCoefficients.x3;
				child._measuredSandboxWidth = measuredSandboxWidth = sandboxWidthLayoutCoefficients.x1 * height + sandboxWidthLayoutCoefficients.x2 + child._measuredWidth + measuredLeft;

				// Update the size of the component
				measuredSandboxWidth = child._measuredSandboxWidth;
				measuredSandboxWidth > computedSize.width && (computedSize.width = measuredSandboxWidth);
			}
			len = deferredTopCalculations.length;
			for(i = 0; i < len; i++) {
				child = deferredTopCalculations[i];
				topLayoutCoefficients = child._layoutCoefficients.top;
				sandboxHeightLayoutCoefficients = child._layoutCoefficients.sandboxHeight;
				child._measuredTop = measuredTop = topLayoutCoefficients.x1 * computedSize.height + topLayoutCoefficients.x2 * measuredHeight + topLayoutCoefficients.x3;
				child._measuredSandboxHeight = measuredSandboxHeight = sandboxHeightLayoutCoefficients.x1 * height + sandboxHeightLayoutCoefficients.x2 + child._measuredHeight + measuredTop;

				// Update the size of the component
				measuredSandboxHeight = child._measuredSandboxHeight;
				measuredSandboxHeight > computedSize.height && (computedSize.height = measuredSandboxHeight);
			}

			// Position the children
			len = children.length;
			for(i = 0; i < len; i++) {
				child = children[i];
				if (child._markedForLayout) {
					UI._elementLayoutCount++;
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
			return (!isNaN(layoutCoefficients.width.x1) && layoutCoefficients.width.x1 !== 0) || // width
				(!isNaN(layoutCoefficients.height.x1) && layoutCoefficients.height.x1 !== 0) || // height
				layoutCoefficients.left.x1 !== 0 || // left
				layoutCoefficients.top.x1 !== 0; // top
		},

		_doAnimationLayout: function(node, animationCoefficients) {

			var parentWidth = node._parent._measuredWidth,
				parentHeight = node._parent._measuredHeight,
				width = animationCoefficients.width.x1 * parentWidth + animationCoefficients.width.x2,
				height = animationCoefficients.height.x1 * parentHeight + animationCoefficients.height.x2;

			return {
				width: width,
				height: height,
				left: animationCoefficients.left.x1 * parentWidth + animationCoefficients.left.x2 * width + animationCoefficients.left.x3,
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

				minWidth = layoutProperties._minWidth,
				minWidthType = getValueType(minWidth),
				minWidthValue = computeValue(minWidth, minWidthType),

				height = self._getHeight(node, layoutProperties.height),
				heightType = getValueType(height),
				heightValue = computeValue(height, heightType),

				minHeight = layoutProperties._minHeight,
				minHeightType = getValueType(minHeight),
				minHeightValue = computeValue(minHeight, minHeightType),

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

				centerY = layoutProperties.center && layoutProperties.center.y,
				centerYType = getValueType(centerY),
				centerYValue = computeValue(centerY, centerYType),

				bottom = layoutProperties.bottom,
				bottomType = getValueType(bottom),
				bottomValue = computeValue(bottom, bottomType),

				x1, x2, x3,

				sandboxWidthLayoutCoefficients = layoutCoefficients.sandboxWidth,
				sandboxHeightLayoutCoefficients = layoutCoefficients.sandboxHeight,

				// Width/height rule evaluation
				paramsSet = [
					[widthType, widthValue, leftType, leftValue, centerXType, centerXValue, rightType, rightValue],
					[heightType, heightValue, topType, topValue, centerYType, centerYValue, bottomType, bottomValue]
				],
				params, sizeType, sizeValue, startType, startValue, centerType, centerValue, endType, endValue,
				i = 0,
				type;
			for (; i < 2; i++) {

				params = paramsSet[i];
				sizeType = params[0];
				sizeValue = params[1];
				startType = params[2];
				startValue = params[3];
				centerType = params[4];
				centerValue = params[5];
				endType = params[6];
				endValue = params[7];

				x1 = x2 = 0;
				if (sizeType === UI.SIZE) {
					x1 = x2 = NaN;
				} else if (sizeType === UI.FILL) {
					x1 = 1;
					if (startType === '%') {
						x1 -= startValue;
					} else if (startType === '#') {
						x2 = -startValue;
					} else if (endType === '%') {
						x1 -= endValue;
					} else if (endType === '#') {
						x2 = -endValue;
					}
				} else if (sizeType === '%') {
					x1 = sizeValue;
				} else if (sizeType === '#') {
					x2 = sizeValue;
				} else if (startType === '%') {
					if (centerType === '%') {
						x1 = 2 * (centerValue - startValue);
					} else if (centerType === '#') {
						x1 = -2 * startValue;
						x2 = 2 * centerValue;
					} else if (endType === '%') {
						x1 = 1 - startValue - endValue;
					} else if (endType === '#') {
						x1 = 1 - startValue;
						x2 = -endValue;
					}
				} else if (startType === '#') {
					if (centerType === '%') {
						x1 = 2 * centerValue;
						x2 = -2 * startValue;
					} else if (centerType === '#') {
						x2 = 2 * (centerValue - startValue);
					} else if (endType === '%') {
						x1 = 1 - endValue;
						x2 = -startValue;
					} else if (endType === '#') {
						x1 = 1;
						x2 = -endValue - startValue;
					}
				} else if (centerType === '%') {
					if (endType === '%') {
						x1 = 2 * (endValue - centerValue);
					} else if (endType === '#') {
						x1 = -2 * centerValue;
						x2 = 2 * endValue;
					}
				} else if (centerType === '#') {
					if (endType === '%') {
						x1 = 2 * endValue;
						x2 = -2 * centerValue;
					} else if (endType === '#') {
						x2 = 2 * (endValue - centerValue);
					}
				}
				layoutCoefficients[type = i === 0 ? 'width' : 'height'].x1 = x1;
				layoutCoefficients[type].x2 = x2;
			}

			// Min width/height rule evaluation
			paramsSet = {
				minWidth: [minWidthType, minWidthValue, leftType, leftValue, centerXType, centerXValue, rightType, rightValue],
				minHeight: [minHeightType, minHeightValue, topType, topValue, centerYType, centerYValue, bottomType, bottomValue]
			};
			for (i in paramsSet) {

				params = paramsSet[i];
				sizeType = params[0];
				sizeValue = params[1];
				startType = params[2];
				startValue = params[3];
				centerType = params[4];
				centerValue = params[5];
				endType = params[6];
				endValue = params[7];

				x1 = x2 = x3 = 0;
				if (sizeType === UI.SIZE) {
					x1 = x2 = NaN;
				} else if (sizeType === UI.FILL) {
					x1 = 1;
					if (startType === '%') {
						x1 -= startValue;
					} else if (startType === '#') {
						x2 = -startValue;
					} else if (endType === '%') {
						x1 -= endValue;
					} else if (endType === '#') {
						x2 = -endValue;
					}
				} else if (sizeType === '%') {
					x1 = sizeValue;
				} else if (sizeType === '#') {
					x2 = sizeValue;
				} else {
					x1 = x2 = x3 = void 0;
				}
				layoutCoefficients[i].x1 = x1;
				layoutCoefficients[i].x2 = x2;
				layoutCoefficients[i].x3 = x3;
			}

			// Left/top rule evaluation
			paramsSet = [
				[leftType, leftValue, centerXType, centerXValue, rightType, rightValue],
				[topType, topValue, centerYType, centerYValue, bottomType, bottomValue]
			];
			for (i = 0; i < 2; i++) {

				params = paramsSet[i];
				startType = params[0];
				startValue = params[1];
				centerType = params[2];
				centerValue = params[3];
				endType = params[4];
				endValue = params[5];

				x1 = x2 = x3 = 0;
				if (startType === '%') {
					x1 = startValue;
				} else if(startType === '#') {
					x3 = startValue;
				} else if (centerType === '%') {
					x1 = centerValue;
					x2 = -0.5;
				} else if (centerType === '#') {
					x2 = -0.5;
					x3 = centerValue;
				} else if (endType === '%') {
					x1 = 1 - endValue;
					x2 = -1;
				} else if (endType === '#') {
					x1 = 1;
					x2 = -1;
					x3 = -endValue;
				} else {
					switch(i === 'left' ? self._defaultHorizontalAlignment : self._defaultVerticalAlignment) {
						case 'center':
							x1 = 0.5;
							x2 = -0.5;
							break;
						case 'end':
							x1 = 1;
							x2 = -1;
					}
				}
				layoutCoefficients[type = i === 0 ? 'left' : 'top'].x1 = x1;
				layoutCoefficients[type].x2 = x2;
				layoutCoefficients[type].x3 = x3;
			}

			// Sandbox width/height rule evaluation
			sandboxWidthLayoutCoefficients.x1 = rightType === '%' ? rightValue : 0;
			sandboxWidthLayoutCoefficients.x2 = rightType === '#' ? rightValue : 0;
			sandboxHeightLayoutCoefficients.x1 = bottomType === '%' ? bottomValue : 0;
			sandboxHeightLayoutCoefficients.x2 = bottomType === '#' ? bottomValue : 0;
		},

		_defaultHorizontalAlignment: 'center',

		_defaultVerticalAlignment: 'center'

	});

});
