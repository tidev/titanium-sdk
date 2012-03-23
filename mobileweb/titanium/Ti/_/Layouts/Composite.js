define(["Ti/_/Layouts/Base", "Ti/_/declare"], function(Base, declare) {

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
		
		_defaultHorizontalAlignment: "center",
		
		_defaultVerticalAlignment: "center"
		
	});

});
