define(["Ti/_/declare", "Ti/_/Evented", "Ti/_/Filesystem/Local", "Ti/App/Properties"], function(declare, Evented, Local, Properties) {

	var backend = Properties.getString("ti.fs.backend");

	return declare("Ti.Filesystem.File", [Evented, backend ? require(backend) : Local]);

});