define(["Ti/_/declare", "Ti/_/UI/FontWidget", "Ti/UI"],
	function(declare, FontWidget, UI) {

	return declare("Ti.UI.PickerRow", FontWidget, {
		
		constructor: function() {
			this._addStyleableDomNode(this.domNode);
		},

		_defaultWidth: UI.SIZE,

		_defaultHeight: UI.SIZE,
		
		properties: {
			title: {
				post: function() {
					this._parentColumn && this._parentColumn._updateContentDimensions();
				}
			}
		}
		
	});
	
});