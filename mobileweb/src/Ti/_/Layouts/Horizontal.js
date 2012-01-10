define("Ti/_/Layouts/Horizontal", ["Ti/_/Layouts/Base", "Ti/_/declare"], function(Base, declare) {

	return declare("Ti._.Layouts.Horizontal", Base, {

		doLayout: function(element, width, height) {
			var computedSize = {width: 0, height: 0},
				currentLeft = 0;
			for(var i = 0; i < element.children.length; i++) {
				
				// Layout the child
				var child = element.children[i];
				var computedParameters = element.children[i].doLayout(currentLeft,0,width,height,false,false);
				
				// Update the size of the component
				currentLeft = child._measuredWidth + child._measuredLeft + child._measuredRightPadding;
				var bottomMostEdge = child._measuredHeight + child._measuredTop + child._measuredBottomPadding;
				currentLeft > computedSize.width && (computedSize.width = currentLeft);
				bottomMostEdge > computedSize.height && (computedSize.height = bottomMostEdge);
			}
			return computedSize;
		}

	});

});
