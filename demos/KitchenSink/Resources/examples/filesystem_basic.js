var win = Titanium.UI.currentWindow;

Titanium.API.info('Resouces Direction :' + Titanium.Filesystem.resourcesDirectory);
Titanium.API.info('Application Direction :' + Titanium.Filesystem.applicationDirectory);
Titanium.API.info('Application Data Direction :' + Titanium.Filesystem.applicationDataDirectory);
Titanium.API.info('External Storage Available :' + Titanium.Filesystem.isExteralStoragePresent);


var b1 = Titanium.UI.createButton({
	title:'Read File',
	width:200,
	height:40,
	top:10
});
win.add(b1);
b1.addEventListener('click', function()
{
	var dir = Titanium.Filesystem.resourcesDirectory + '/images/atlanta.jpg';

	var f = Titanium.Filesystem.getFile(dir);
	Ti.API.info('f ' + f + ' exists ' + f.exists() + ' f.size ' + f.size);

	for (v in f)
	{
		Ti.API.info('v ' + v + ' f[v] ' + f[v])
	}
	
});

// -(id)nativePath
// -(id)exists:(id)args
// -(id)isReadonly
// -(id)isSymbolicLink
// -(id)isWritable
// 
// @property(nonatomic,readonly) NSString *resourcesDirectory;
// @property(nonatomic,readonly) NSString *applicationDirectory;
// @property(nonatomic,readonly) NSString *applicationDataDirectory;
// @property(nonatomic,readonly) NSString *separator;
// @property(nonatomic,readonly) NSString *lineEnding;
// 
// @property(nonatomic,readonly) NSNumber *MODE_APPEND;
// @property(nonatomic,readonly) NSNumber *MODE_WRITE;
// @property(nonatomic,readonly) NSNumber *MODE_READ;
// 
// FILENOOP(isExecutable);
// FILENOOP(isHidden);
// FILENOOP(setReadonly:(id)x);
// FILENOOP(setExecutable:(id)x);
// FILENOOP(setHidden:(id)x);
// 
// -(id)createTimestamp:(id)args
// -(id)modificationTimestamp:(id)args
// 
// -(id)getDirectoryListing:(id)args
// -(id)size:(id)args
// -(id)spaceAvailable:(id)args
// getFile
// -(id)createDirectory:(id)args
// -(id)createFile:(id)args
// -(id)deleteDirectory:(id)args
// -(id)deleteFile:(id)args
// -(id)move:(id)args
// -(id)rename:(id)args
// -(id)read:(id)args
// -(id)write:(id)args
// -(id)extension:(id)args
// -(id)getParent:(id)args
// -(id)name
// 
// -(id)resolve:(id)args
// -(id)description
// +(id)makeTemp:(BOOL)isDirectory
// 
// @end
