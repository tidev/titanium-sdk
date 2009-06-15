var Titanium = new function() {
	this.window = window;
	this.document = document;
	this.mediaProxy = window.TitaniumMedia;
	this.desktopProxy = window.TitaniumDesktop;
	this.platformProxy = window.TitaniumPlatform;
}

Titanium.Desktop = {
	openApplication : function(app) {
		return Titanium.desktopProxy.openApplication(app);
	},
	openUrl : function(url) {
		return Titanium.desktopProxy.openUrl(url);
	},
	logInstalledApplicationNames : function() {
		return Titanium.desktopProxy.logInstalledApplicationNames();
	},
}

Titanium.Filesystem = {
	createTempFile : function() {
		//TODO implement Filesystem.createTempFile
	},
	createTempDirectory : function() {
		//TODO implement Filesystem.createTempDirectory
	},
	getFile : function() {
		//TODO implement Filesystem.getFile
	},
	getFileStream : function() {
		//TODO implement Filesystem.getFileStream
	},
	getProgramsDirectory : function() {
		//TODO implement Filesystem.getProgramsDirectory
	},
	getApplicationDirectory : function() {
		//TODO implement Filesystem.getApplicationDirectory
	},
	getApplicationDataDirectory : function() {
		//TODO implement Filesystem.getApplicationDataDirectory
	},
	getRuntimeBaseDirectory : function() {
		//TODO implement Filesystem.getRuntimeBaseDirectory
	},
	getResourcesDirectory : function() {
		//TODO implement Filesystem.getResourcesDirectory
	},
	getDesktopDirectory : function() {
		//TODO implement Filesystem.getDesktopDirectory
	},
	getDocumentsDirectory : function() {
		//TODO implement Filesystem.getDocumentsDirectory
	},
	getUserDirectory : function() {
		//TODO implement Filesystem.getUserDirectory
	},
	getLineEnding : function() {
		//TODO implement Filesystem.getLineEnding
	},
	getSeparator : function() {
		//TODO implement Filesystem.getSeparator
	},
	getRootDirectories : function() {
		//TODO implement Filesystem.getRootDirectories
	},
	asyncCopy : function() {
		//TODO implement Filesystem.asyncCopy
	},

}

var Sound = function() {
	this.obj;

	this.play = function() {
		//Titanium.Android.invoke(this.obj, "play");
		this.obj.play();
	}
	this.pause = function() {
		this.obj.pause();
	}
	this.stop = function() {
		this.obj.stop();
	}
	this.reset = function() {
		this.obj.reset();
	}
	this.setVolume = function(v) {
		this.obj.setVolume(v);
	}
	this.getVolume = function() {
		return this.obj.getVolume();
	}
	this.setLooping = function(loop) {
		this.obj.setLooping(loop);
	}
	this.isLooping = function() {
		return this.obj.isLooping();
	}
	this.isPlaying = function() {
		return this.obj.isPlaying();
	}
	this.isPaused = function() {
		return this.obj.isPaused;
	}
	this.onComplete = function() {
		//TODO implement Sound.
	}
}

Titanium.Media = {
	beep : function() {
		Titanium.mediaProxy.beep();
	},
	createSound : function(url) {
		var s = new Sound();
		s.obj = Titanium.mediaProxy.createSound(url);

		return s;
	},
}

Titanium.Network = {
	createTCPSocket : function() {
		//TODO implement Network.createTCPSocket
	},
	createIRCClient : function() {
		//TODO implement Network.IRCClient
	},
	createIPAddress : function() {
		//TODO implement Network.createIPAddress
	},
	createHTTPClient : function() {
		//TODO implement Network.createHTTPClient
	},
	getHostByName : function() {
		//TODO implement Network.getHostByName
	},
	getHostByAddress : function() {
		//TODO implement Network.getHostByAddress
	},
	encodeURIComponent : function() {
		//TODO implement Network.encodeURIComponent
	},
	decodeURIComponent : function() {
		//TODO implement Network.decodeURIComponent
	},

	addConnectivityListener : function() {
		//TODO implement Network.addConnectivityListener
	},
	removeConnectivityListener : function() {
		//TODO implement Network.removeConnectivityListener
	},
}

Titanium.Platform = {
	ostype : function() {
		return Titanium.platformProxy.getOsType();
	},
	name : function() {
		return Titanium.platformProxy.getName();
	},
	version : function() {
		return Titanium.platformProxy.getVersion();
	},
	architecture : function() {
		return Titanium.platformProxy.getArchitecture();
	},
	address : function() {
		return Titanium.platformProxy.getAddress();
	},
	id : function() {
		return Titanium.platformProxy.getId();
	},
	macaddress : function() {
		return Titanium.platformProxy.getMacAddress();
	},
	processorCount : function() {
		return Titanium.platformProxy.getProcessorCount();
	},
	username : function() {
		return Titanium.platformProxy.getUsername();
	},
	createUUID : function() {
		return Titanium.platformProxy.createUUID();
	},
}

Titanium.Process = {
	getEnv : function() {
		//TODO implement Process.getEnv
	},
	setEnv : function() {
		//TODO implement Process.setEnv
	},
	hasEnv : function() {
		//TODO implement Process.hasEnv
	},
	launch : function() {
		//TODO implement Process.launch
	},

}

Titanium.UI = {
	createMenu : function() {
		//TODO implement UI.createMenu
	},
	createTrayMenu : function() {
		//TODO implement UI.createTrayMenu
	},
	setMenu : function() {
		//TODO implement UI.setMenu
	},
	getMenu : function() {
		//TODO implement UI.getMenu
	},
	setContextMenu : function() {
		//TODO implement UI.setContextMenu
	},
	getContextMenu : function() {
		//TODO implement UI.getContextMenu
	},
	setIcon : function() {
		//TODO implement UI.setIcon
	},
	addTray : function() {
		//TODO implement UI.addTray
	},
	clearTray : function() {
		//TODO implement UI.clearTray
	},

	setDockIcon : function() {
		//TODO implement UI.setDockIcon
	},
	setDockMenu : function() {
		//TODO implement UI.setDockMenu
	},
	setBadge : function() {
		//TODO implement UI.setBadge
	},
	setBadgeImage : function() {
		//TODO implement UI.setBadgeImage
	},

	getIdleTime : function() {
		//TODO implement UI.getIdleTime
	},

	windows : function() {
		//TODO implement UI.windows as value
	},
}
