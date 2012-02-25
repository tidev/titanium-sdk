define(["Ti/_/declare", "Ti/_/Evented", "Ti/_/Filesystem/Local"], function(declare, Evented, Local) {

	var backend = (require.config.filesystem || {}).backend;

	return declare("Ti.Filesystem.File", [Evented, backend ? require(backend) : Local]);

});