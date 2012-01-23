define("Ti/_/Layouts/Absolute", ["Ti/_/Layouts/Base", "Ti/_/declare"], function(Base, declare) {

	return declare("Ti._.Layouts.Absolute", Base, {

		doLayout: function(element, width, height) {
			var computedSize = {width: 0, height: 0};
			for(var i = 0; i < element.children.length; i++) {
				
				// Layout the child
				var child = element.children[i];
				child.doLayout(0,0,width,height,true,true);
				
				// Update the size of the component
				var rightMostEdge = child._measuredWidth + child._measuredLeft + 2 * child._measuredBorderWidth + child._measuredRightPadding;
				var bottomMostEdge = child._measuredHeight + child._measuredTop + 2 * child._measuredBorderWidth + child._measuredBottomPadding;
				rightMostEdge > computedSize.width && (computedSize.width = rightMostEdge);
				bottomMostEdge > computedSize.height && (computedSize.height = bottomMostEdge);
			}
			return computedSize;
		}

	});

});
