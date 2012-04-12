define(["Ti/_/Layouts/Base", "Ti/_/declare", "Ti/UI"], function(Base, declare, UI) {

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
				rightMostEdge;
				
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
			return computedSize;
		},
		
		_measureNode: function(node) {
		},
		
		_defaultHorizontalAlignment: "center",
		
		_defaultVerticalAlignment: "top"

	});

});
