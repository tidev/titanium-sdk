var win = Titanium.UI.currentWindow;

// path variables
Titanium.API.info('Resouces Direction :' + Titanium.Filesystem.resourcesDirectory);
Titanium.API.info('Application Direction :' + Titanium.Filesystem.applicationDirectory);
Titanium.API.info('Application Data Direction :' + Titanium.Filesystem.applicationDataDirectory);
Titanium.API.info('External Storage Available :' + Titanium.Filesystem.isExteralStoragePresent);
Titanium.API.info('Separator :' + Titanium.Filesystem.separator);
Titanium.API.info('Line Ending :' + Titanium.Filesystem.lineEnding);


var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'images/atlanta.jpg');
Ti.API.info('nativePath ' + f.nativePath);
Ti.API.info('exists ' + f.exists());
Ti.API.info('size ' + f.size());
Ti.API.info('isReadonly ' + f.isReadonly);
Ti.API.info('isSymbolicLink ' + f.isSymbolicLink);
Ti.API.info('isExecutable ' + f.isExecutable);
Ti.API.info('isHidden ' + f.isHidden);
Ti.API.info('isWritable ' + f.isWritable);
Ti.API.info('name ' + f.name);
Ti.API.info('extension ' + f.extension());
Ti.API.info('resolve ' + f.resolve());

var dir = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory);
Ti.API.info('directoryListing ' + dir.getDirectoryListing());
Ti.API.info('getParent ' + dir.getParent());
Ti.API.info('spaceAvailable ' + dir.spaceAvailable());
	
var l = Titanium.UI.createLabel({text:'Check Log for details', width:300,textAlign:'center'});
win.add(l)

// TODO:WRITE TESTS FOR THESE
//
// -(id)createDirectory:(id)args
// -(id)createFile:(id)args
// -(id)deleteDirectory:(id)args
// -(id)deleteFile:(id)args
// -(id)move:(id)args
// -(id)rename:(id)args
// -(id)read:(id)args
// -(id)write:(id)args
// -(id)description
// +(id)makeTemp:(BOOL)isDirectory
