Ti._5.createClass("Ti.UI.ButtonBar", function(args){

	// Interfaces
	Ti._5.DOMView(this, "buttonbar", args, "ButtonBar");
	Ti._5.Touchable(this, args);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);

	// Properties
	Ti._5.prop(this, {
		index: args.index,
		labels: args.labels,
		style: args.style
	});
});
