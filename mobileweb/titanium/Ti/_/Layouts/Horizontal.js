define(["Ti/_/Layouts/Base", "Ti/_/declare", "Ti/UI"], function(Base, declare, UI) {

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
				i,
				precalculate = isHeightSize,
				isWidthFill,
				bottomMostEdge;
				
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
			return computedSize;
		},
		
		_defaultHorizontalAlignment: "left",
		
		_defaultVerticalAlignment: "top"

	});

});
