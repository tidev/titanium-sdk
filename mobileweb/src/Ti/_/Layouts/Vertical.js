define("Ti/_/Layouts/Vertical", ["Ti/_/Layouts/Base", "Ti/_/declare", "Ti/_/style", "Ti/_/dom"], function(Base, declare, style, dom) {

	return declare("Ti._.Layouts.Vertical", Base, {

		doLayout: function(element) {
			console.debug("Doing layout for " + element.declaredClass);
			if (element.children) {
				for(var i = 0; i < element.children.length; i++) {
					
					var child = element.children[i];
					
					// Layout the child
					child.doLayout();
					
					// Position the child
					var unitize = dom.unitize,
						set = style.set,
						is = require.is;
					!is(child.bottom,"Undefined") && set(child.domNode, "marginBottom", unitize(child.bottom));
					if (!is(child.center,"Undefined")) {
						
						// TODO calculate center when expressed as a percentage and when other supporting info is also expressed as a percent
						
						// Calculate the parent height
						var top;
						if (is(child.height,"Undefined")) {
							top = computeSize(child.center.y) - child.domNode.clientHeight / 2 + "px";
						} else {
							top = computeSize(child.center.y) - computeSize(child.height) / 2 + "px";
						}
						set(child.domNode, "marginTop", top);
					}
					!is(child.top,"Undefined") && set(child.domNode, "marginTop", unitize(child.top));
					!is(child.height,"Undefined") && set(child.domNode, "height", unitize(child.height));
					!is(child.right,"Undefined") && set(child.domNode, "marginRight", unitize(child.right));
					if (!is(child.center,"Undefined")) {
						
						// TODO calculate center when expressed as a percentage and when other supporting info is also expressed as a percent
						
						// Calculate the parent width
						var left;
						if (is(child.width,"Undefined")) {
							left = computeSize(child.center.x) - child.domNode.clientWidth / 2 + "px";
						} else {
							left = computeSize(child.center.x) - computeSize(child.width) / 2 + "px";
						}
						set(child.domNode, "marginLeft", left);
					}
					!is(child.left,"Undefined") && set(child.domNode, "marginLeft", unitize(child.left));
					!is(child.width,"Undefined") && set(child.domNode, "width", unitize(child.width));
					!is(child.zIndex,"Undefined") && set(child.domNode, "zIndex", child.zIndex);
				}
			}
		}

	});

});
