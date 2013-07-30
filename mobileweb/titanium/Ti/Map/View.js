define(["Ti/_/declare", "Ti/_/Map/Google", "Ti/App/Properties"], function(declare, Google, Properties) {

	var backend = Properties.getString("ti.map.backend");

	return declare("Ti.Map.View", backend ? require(backend) : Google);

});
