define(["Ti/_/declare", "Ti/_/Filesystem/Local", "Ti/App/Properties"], function(declare, Local, Properties) {

	var backend = Properties.getString("ti.fs.backend");

	return declare("Ti.Filesystem.File", backend ? require(backend) : Local);

});