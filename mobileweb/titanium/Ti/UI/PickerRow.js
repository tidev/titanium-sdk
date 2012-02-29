define(["Ti/_/declare", "Ti/_/UI/FontWidget", "Ti/_/dom"],
	function(declare, FontWidget) {

	return declare("Ti.UI.PickerRow", FontWidget, {
		
		constructor: function() {
			this._addStyleableDomNode(this.domNode);
		},
		
		properties: {
			title: {
				set: function(value) {
					this._parentColumn && this._parentColumn._updateContentDimensions();
					return value;
				}
			}
		}
		
	});
	
});