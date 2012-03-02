define(["Ti/_/Layouts/Base", "Ti/_/declare"], function(Base, declare) {

	return declare("Ti._.Layouts.Vertical", Base, {

		_doLayout: function(element, width, height, isAutoWidth, isAutoHeight) {
			var computedSize = this._computedSize = {width: 0, height: 0},
				currentTop = 0;
			for(var i in element.children) {
				
				// Layout the child
				var child = element.children[i];
				child._doLayout(0,currentTop,width,height,this._defaultHorizontalAlignment,this._defaultVerticalAlignment,isAutoWidth,isAutoHeight);
				
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
