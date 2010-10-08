var TFS = Titanium.Filesystem;

Titanium.AppCreator = {
	
	osx: function(assetsDir,destination,name,appid,install)
	{
		var src = TFS.getFile(destination,name+'.app');
		src.createDirectory(true);
		var contents = TFS.getFile(src,'Contents');
		contents.createDirectory(true);
		var resources = TFS.getFile(contents,'Resources');
		resources.createDirectory(true);
		var macos = TFS.getFile(contents,'MacOS');
		macos.createDirectory(true);
		var lproj = TFS.getFile(resources,'English.lproj');
		lproj.createDirectory(true);

		var fromMacos = TFS.getFile(assetsDir,'kboot');
		fromMacos.copy(macos);
		var boot = TFS.getFile(macos,'kboot');
		boot.rename(name);
		boot.setExecutable(true);

		var mainMenu = TFS.getFile(assetsDir,'MainMenu.nib');
		mainMenu.copy(lproj);

		var icns = TFS.getFile(assetsDir,'titanium.icns');
		icns.copy(lproj);

		var plist = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"+
		"<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">\n"+
		"<plist version=\"1.0\">\n"+
		"<dict>\n"+
		"	<key>CFBundleDevelopmentRegion</key>\n"+
		"	<string>English</string>\n"+
		"	<key>CFBundleExecutable</key>\n"+
		"	<string>"+name+"</string>\n"+
		"	<key>CFBundleIconFile</key>\n"+
		"	<string>titanium.icns</string>\n"+
		"	<key>CFBundleIdentifier</key>\n"+
		"	<string>"+appid+(install?'.installer':'')+"</string>\n"+
		"	<key>CFBundleInfoDictionaryVersion</key>\n"+
		"	<string>6.0</string>\n"+
		"	<key>CFBundleName</key>\n"+
		"	<string>"+name+"</string>\n"+
		"	<key>CFBundlePackageType</key>\n"+
		"	<string>APPL</string>\n"+
		" 	<key>CFBundleSignature</key>\n"+
		"  	<string>WRUN</string>\n"+
		"  	<key>CFBundleVersion</key>\n"+
		"  	<string>0.1</string>\n"+
		"	<key>NSMainNibFile</key>\n"+
		"	<string>MainMenu</string>\n"+
		"	<key>NSPrincipalClass</key>\n"+
		"	<string>NSApplication</string>\n"+
		"</dict>\n"+
		"</plist>\n";

		var infoplist = TFS.getFile(contents,'Info.plist');
		infoplist.write(plist);
		
		// set our marker file
		var marker = TFS.getFile(contents,'.installed');
		if (!install)
		{
			marker.write(String(new Date()));
		}
		else
		{
			marker.deleteFile();
		}

		return {
			resources:resources,
			base:contents,
			executable:src
		};
	},

	linux: function(assetsDir,destination,name,appid,install)
	{
		var appDir = TFS.getFile(destination,name);
		appDir.createDirectory(true);
		var resources = TFS.getFile(appDir,'Resources');
		resources.createDirectory(true);

		var kboot = TFS.getFile(assetsDir,'kboot');
		var appExecutable = TFS.getFile(appDir, name);
		kboot.copy(appExecutable);

		// set our marker file
		var marker = TFS.getFile(appDir,'.installed');
		if (!install)
		{
			marker.write(String(new Date()));
		}
		else
		{
			marker.deleteFile();
		}

		return {
			resources:resources,
			base:appDir,
			executable:appExecutable
		};
	},

	win32: function(assetsDir,destination,name,appid,install)
	{
		var appDir = TFS.getFile(destination,name);
		appDir.createDirectory(true);
		var resources = TFS.getFile(appDir,'Resources');
		resources.createDirectory(true);

		var kboot = TFS.getFile(assetsDir,'kboot.exe');
		var appExecutable = TFS.getFile(appDir, name + '.exe');
		kboot.copy(appExecutable);
		
		// set our marker file
		var marker = TFS.getFile(appDir,'.installed');
		if (!install)
		{
			marker.write(String(new Date()));
		}
		else
		{
			marker.deleteFile();
		}

		return {
			resources:resources,
			base:appDir,
			executable:appExecutable
		};
	}
};


Titanium.createApp = function(destination,name,appid,install)
{

	// DRILLBIT ONLY: We just grab the bundled SDK here, since we know
	// that's where the assets are.
	var components = Titanium.API.getApplication().getComponents();
	var assetsDir = null;
	for (var i = 0; i < components.length; i++)
	{
		var c = components[i];
		if (c.getType() == Titanium.API.SDK)
		{
			assetsDir = TFS.getFile(components[i].getPath());
			break;
		}
	}
	
	if (!assetsDir.exists())
	{
		Titanium.API.error("Could not find assets directory at: " + assetsDir);
	}
	install = (typeof(install)=='undefined') ? true : install;

	var platform = Titanium.platform;
	var fn = Titanium.AppCreator[platform];
	return fn(assetsDir,destination,name,appid,install);
};

Titanium.linkLibraries = function(runtimeDir)
{
	if (Titanium.platform == 'osx')
	{
		var fw = ['WebKit','WebCore','JavaScriptCore'];
		for (var c=0;c<fw.length;c++)
		{
			var fwn = fw[c];
			var fwd = TFS.getFile(runtimeDir,fwn+'.framework');
			var fwd_name = fwd.name();
			var versions = TFS.getFile(fwd,'Versions');
			var ver = TFS.getFile(versions,'A');
			if (ver.exists()) continue; // skip if already linked
			var current = TFS.getFile(fwd,'Versions','Current');
			ver.createShortcut('Current',versions);
			var hf = TFS.getFile(fwd,'Headers');
			hf.createShortcut('Versions/Current/Headers',fwd);
			var ph = TFS.getFile(fwd,'PrivateHeaders');
			ph.createShortcut('Versions/Current/PrivateHeaders',fwd);
			var rf = TFS.getFile(fwd,'Resources');
			rf.createShortcut('Versions/Current/Resources',fwd);
		}
	}
};
