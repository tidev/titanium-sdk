define("Ti/_/Layouts/Vertical", ["Ti/_/Layouts/Base", "Ti/_/declare"], function(Base, declare) {

	return declare("Ti._.Layouts.Vertical", Base, {

		doLayout: function(element, width, height) {
			var computedSize = {width: 0, height: 0},
				currentTop = 0;
			for(var i = 0; i < element.children.length; i++) {
				
				// Layout the child
				var computedParameters = element.children[i].doLayout(0,currentTop,width,height,true,false);
				
				// Update the size of the component
				var rightMostEdge = computedParameters.width + computedParameters.left;
				currentTop = computedParameters.height + computedParameters.top;
				rightMostEdge > computedSize.width && (computedSize.width = rightMostEdge);
				currentTop > computedSize.height && (computedSize.height = currentTop);
			}
			return computedSize;
		}

	});

});
