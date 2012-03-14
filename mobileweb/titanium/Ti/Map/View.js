define(["Ti/_/declare", "Ti/_/Evented", "Ti/_/Map/Google", "Ti/App/Properties", "Ti/UI/View"], function(declare, Evented, Google, Properties, View) {

	var backend = Properties.getString("ti.map.backend");

	return declare("Ti.Map.View", [Evented, View, backend ? require(backend) : Google]);

});
