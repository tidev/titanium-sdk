define("Ti/_/Layouts/Horizontal", ["Ti/_/Layouts/Base", "Ti/_/declare"], function(Base, declare) {

	return declare("Ti._.Layouts.Horizontal", Base, {

		doLayout: function(element, width, height) {
			var computedSize = {width: 0, height: 0},
				currentLeft = 0;
			for(var i in element.children) {
				
				// Layout the child
				var child = element.children[i];
				child.doLayout(currentLeft,0,width,height,false,false);
				
				// Update the size of the component
				currentLeft = child._measuredLeft + child._measuredWidth + 2 * child._measuredBorderWidth + child._measuredRightPadding;
				var bottomMostEdge = child._measuredTop + child._measuredHeight + 2 * child._measuredBorderWidth + child._measuredBottomPadding;
				currentLeft > computedSize.width && (computedSize.width = currentLeft);
				bottomMostEdge > computedSize.height && (computedSize.height = bottomMostEdge);
			}
			return computedSize;
		}

	});

});
