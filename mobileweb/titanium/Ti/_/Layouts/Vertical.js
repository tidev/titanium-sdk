define(["Ti/_/Layouts/Base", "Ti/_/declare"], function(Base, declare) {

	return declare("Ti._.Layouts.Vertical", Base, {

		_doLayout: function(element, width, height, isWidthSize, isHeightSize) {
			var computedSize = this._computedSize = {width: 0, height: 0},
				currentTop = 0;
			for(var i in element.children) {
				
				// Layout the child
				var child = element.children[i];
				child._doLayout({
				 	origin: {
				 		x: 0,
				 		y: currentTop
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
				 	}
			 	});
				
				// Update the size of the component
				var rightMostEdge = child._measuredWidth + child._measuredLeft + child._measuredBorderSize.left + child._measuredBorderSize.right + child._measuredRightPadding;
				currentTop = child._measuredHeight + child._measuredTop + child._measuredBorderSize.top + child._measuredBorderSize.bottom + child._measuredBottomPadding;
				rightMostEdge > computedSize.width && (computedSize.width = rightMostEdge);
				currentTop > computedSize.height && (computedSize.height = currentTop);
			}
			return computedSize;
		},
		
		_defaultHorizontalAlignment: "center",
		
		_defaultVerticalAlignment: "top"

	});

});
