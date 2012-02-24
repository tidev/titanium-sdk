define(
	["Ti/_/Layouts/UncenteredAbsolute", "Ti/_/Layouts/Absolute", "Ti/_/Layouts/Horizontal", "Ti/_/Layouts/CenteredHorizontal", "Ti/_/Layouts/Vertical"],
	function(UncenteredAbsolute, Absolute, CenteredHorizontal, Horizontal, Vertical) {

	return {
		Absolute: Absolute,
		UncenteredAbsolute: UncenteredAbsolute,
		Horizontal: Horizontal,
		CenteredHorizontal: CenteredHorizontal,
		Vertical: Vertical
	};

});