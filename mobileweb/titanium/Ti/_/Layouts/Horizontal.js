define(["Ti/_/Layouts/Base", "Ti/_/declare", "Ti/UI"], function(Base, declare, UI) {

	return declare("Ti._.Layouts.Horizontal", Base, {

		_doLayout: function(element, width, height, isWidthSize, isHeightSize) {
			var computedSize = this._computedSize = {width: 0, height: 0},
				currentLeft = 0,
				children = element.children,
				availableWidth = width,
				childrenWithFillWidth = false;
				
			// Determine if any children have fill height
			for (var i = 0; i < children.length; i++) {
				children[i]._hasFillWidth() && (childrenWithFillWidth = true);
			}
			
			if (childrenWithFillWidth) {
				for (var i = 0; i < children.length; i++) {
					var child = children[i];
					if (this.verifyChild(child,element) && !child._hasFillWidth()) {
						var childWidth;
						if (child._markedForLayout) {
							childWidth = child._doLayout({
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
							}).effectiveWidth;
						} else {
							childWidth = child._measuredEffectiveWidth;
						}
						availableWidth -= childWidth;
					}
				}
			}
			
			for(var i = 0; i < children.length; i++) {
				
				// Layout the child
				var child = children[i],
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
					 		height: height
					 	},
					 	alignment: {
					 		horizontal: this._defaultHorizontalAlignment,
					 		vertical: this._defaultVerticalAlignment
					 	},
						rightIsMargin: true,
					 	positionElement: true,
					 	layoutChildren: !childrenWithFillWidth || isWidthFill
				 	});
			 	}
				
				// Update the size of the component
				currentLeft = child._measuredLeft + child._measuredWidth + child._measuredBorderSize.left + child._measuredBorderSize.right + child._measuredRightPadding;
				var bottomMostEdge = child._measuredTop + child._measuredHeight + child._measuredBorderSize.top + child._measuredBorderSize.bottom + child._measuredBottomPadding;
				currentLeft > computedSize.width && (computedSize.width = currentLeft);
				bottomMostEdge > computedSize.height && (computedSize.height = bottomMostEdge);
			}
			return computedSize;
		},
		
		_defaultHorizontalAlignment: "left",
		
		_defaultVerticalAlignment: "top"

	});

});
