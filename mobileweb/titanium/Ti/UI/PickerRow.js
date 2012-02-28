define(["Ti/_/declare", "Ti/UI/Label", "Ti/_/dom"],
	function(declare, Label) {

	return declare("Ti.UI.PickerRow", Label, {
		
		properties: {
			title: {
				set: function(value) {
					this.text = value;
					return value;
				}
			}
		}
		
	});
	
});