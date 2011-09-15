var Kroll = {
	moduleInfo: {},
	externalChildModules: {},

	addModuleInfo: function(info) {
		customModuleInfo[info.id] = info;
	},

	getModuleInfo: function(id) {
		return customModuleInfo[id];
	},

	getCustomModuleIds: function() {
		return Object.keys(customModuleInfo);
	}
};