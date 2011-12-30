define("Ti/_/Layouts/Absolute", ["Ti/_/Layouts/Base", "Ti/_/declare"], function(Base, declare) {

	return declare("Ti._.Layouts.Absolute", Base, {

		doLayout: function(element, width, height) {
			var computedSize = {width: 0, height: 0};
			for(var i = 0; i < element.children.length; i++) {
				
				// Layout the child
				var computedParameters = element.children[i].doLayout(0,0,width,height,true,true);
				
				// Update the size of the component
				var rightMostEdge = computedParameters.width + computedParameters.left;
				var bottomMostEdge = computedParameters.height + computedParameters.top;
				rightMostEdge > computedSize.width && (computedSize.width = rightMostEdge);
				bottomMostEdge > computedSize.height && (computedSize.height = bottomMostEdge);
			}
			return computedSize;
		}

	});

});
