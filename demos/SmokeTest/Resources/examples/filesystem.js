var win = Titanium.UI.currentWindow;

// path variables
Titanium.API.info('Resources Directory :' + Titanium.Filesystem.resourcesDirectory);
Titanium.API.info('Temp Directory :' + Titanium.Filesystem.tempDirectory);
Titanium.API.info('Application Directory :' + Titanium.Filesystem.applicationDirectory);
Titanium.API.info('Application Data Directory :' + Titanium.Filesystem.applicationDataDirectory);
Titanium.API.info('Application Support Directory :' + Titanium.Filesystem.applicationSupportDirectory);

Titanium.API.info('External Storage Available :' + Titanium.Filesystem.isExteralStoragePresent);
Titanium.API.info('Separator :' + Titanium.Filesystem.separator);
Titanium.API.info('Line Ending :' + Titanium.Filesystem.lineEnding);


var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'text.txt');
Ti.API.info('file = ' + f);
var contents = f.read();
Ti.API.info("contents blob object = "+contents);
Ti.API.info('contents = ' + contents.text);
Ti.API.info('mime type = ' + contents.mimeType);
Ti.API.info('nativePath = ' + f.nativePath);
Ti.API.info('exists = ' + f.exists());
Ti.API.info('size = ' + f.size);
Ti.API.info('readonly = ' + f.readonly);
Ti.API.info('symbolicLink = ' + f.symbolicLink);
Ti.API.info('executable = ' + f.executable);
Ti.API.info('hidden = ' + f.hidden);
Ti.API.info('writeable = ' + f.writeable);
Ti.API.info('name = ' + f.name);
Ti.API.info('extension = ' + f.extension());
Ti.API.info('resolve = ' + f.resolve());
Ti.API.info('created = ' + String(new Date(f.createTimestamp()))); // #2085 test

var dir = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory);
Ti.API.info('directoryListing = ' + dir.getDirectoryListing());
Ti.API.info('getParent = ' + dir.getParent());
Ti.API.info('spaceAvailable = ' + dir.spaceAvailable());

var newDir = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory,'mydir');
Ti.API.info("Created mydir: " + newDir.createDirectory());
Ti.API.info('newdir ' + newDir);
var newFile = Titanium.Filesystem.getFile(newDir.nativePath,'newfile.txt');
newFile.write(f.read());
Ti.API.info('directoryListing for newDir = ' + newDir.getDirectoryListing());
Ti.API.info("newfile.txt created: " + String(new Date(newFile.createTimestamp())));
Ti.API.info("newfile.txt modified: " + String(new Date(newFile.modificationTimestamp())));

Ti.API.info("newfile.txt deleted: " + newFile.deleteFile());
Ti.API.info("mydir deleted: " + newDir.deleteDirectory());
Ti.API.info('directoryListing for newDir after deleteDirectory = ' + newDir.getDirectoryListing());

if (Ti.Platform.name == 'android') {
	var dir = Titanium.Filesystem.getFile(Titanium.Filesystem.externalStorageDirectory);
	Ti.API.info('external directoryListing = ' + dir.getParent().getDirectoryListing());
}

var l = Titanium.UI.createLabel({text:'Check Log for details', width:300, height:'auto', textAlign:'center'});
win.add(l);

// test to make sure we can still access compiled JS files
var jsfile = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory,'app.js');
Ti.API.info("app.js exists? " + f.exists());
Ti.API.info("app.js size? " + f.size);

