define(["Ti/_/declare", "Ti/_/Evented", "Ti/_/Map/Google", "Ti/App/Properties"], function(declare, Evented, Google, Properties) {

	var backend = Properties.getString("ti.map.backend");

	return declare("Ti.Map.View", [Evented, backend ? require(backend) : Google]);

});
