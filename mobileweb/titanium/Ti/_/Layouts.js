define(
	["Ti/_/Layouts/Composite", "Ti/_/Layouts/Horizontal", "Ti/_/Layouts/Vertical", "Ti/_/Layouts/ConstrainingHorizontal", "Ti/_/Layouts/ConstrainingVertical"],
	function(Composite, Horizontal, Vertical, ConstrainingHorizontal, ConstrainingVertical) {

	return {
		Composite: Composite,
		Horizontal: Horizontal,
		Vertical: Vertical,
		
		// Mobile web specific layouts, used for internal controls
		ConstrainingHorizontal: ConstrainingHorizontal,
		ConstrainingVertical: ConstrainingVertical
	};

});