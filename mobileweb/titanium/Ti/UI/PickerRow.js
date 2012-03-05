define(["Ti/_/declare", "Ti/_/UI/FontWidget"],
	function(declare, FontWidget) {

	return declare("Ti.UI.PickerRow", FontWidget, {
		
		constructor: function() {
			this._addStyleableDomNode(this.domNode);
		},

		_defaultWidth: Ti.UI.SIZE,

		_defaultHeight: Ti.UI.SIZE,
		
		properties: {
			title: {
				post: function() {
					this._parentColumn && this._parentColumn._updateContentDimensions();
				}
			}
		}
		
	});
	
});