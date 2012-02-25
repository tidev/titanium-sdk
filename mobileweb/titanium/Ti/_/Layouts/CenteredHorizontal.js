define(["Ti/_/Layouts/Base", "Ti/_/declare"], function(Base, declare) {

	return declare("Ti._.Layouts.CenteredHorizontal", Base, {

		_doLayout: function(element, width, height, isAutoWidth, isAutoHeight) {
			var computedSize = this._computedSize = {width: 0, height: 0},
				currentLeft = 0;
			for(var i in element.children) {
				
				// Layout the child
				var child = element.children[i];
				child._doLayout(currentLeft,0,width,height,false,true,isAutoWidth,isAutoHeight);
				
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
