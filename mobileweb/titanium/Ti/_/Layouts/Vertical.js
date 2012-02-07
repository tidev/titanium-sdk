define(["Ti/_/Layouts/Base", "Ti/_/declare"], function(Base, declare) {

	return declare("Ti._.Layouts.Vertical", Base, {

		_doLayout: function(element, width, height) {
			var computedSize = {width: 0, height: 0},
				currentTop = 0;
			for(var i in element.children) {
				
				// Layout the child
				var child = element.children[i];
				child._doLayout(0,currentTop,width,height,true,false);
				
				// Update the size of the component
				var rightMostEdge = child._measuredWidth + child._measuredLeft + 2 * child._measuredBorderWidth + child._measuredRightPadding;
				currentTop = child._measuredHeight + child._measuredTop + 2 * child._measuredBorderWidth + child._measuredBottomPadding;
				rightMostEdge > computedSize.width && (computedSize.width = rightMostEdge);
				currentTop > computedSize.height && (computedSize.height = currentTop);
			}
			return computedSize;
		}

	});

});
