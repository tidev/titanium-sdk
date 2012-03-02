define(["Ti/_/Layouts/Base", "Ti/_/declare"], function(Base, declare) {

	return declare("Ti._.Layouts.Horizontal", Base, {

		_doLayout: function(element, width, height, isWidthSize, isHeightSize) {
			var computedSize = this._computedSize = {width: 0, height: 0},
				currentLeft = 0;
			for(var i in element.children) {
				
				// Layout the child
				var child = element.children[i];
				child._doLayout({
				 	origin: {
				 		x: currentLeft,
				 		y: 0
				 	},
				 	parentSize: {
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
				 	fillSpace: {
				 		width: width - currentLeft,
				 		height: height
				 	}
			 	});
				
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
