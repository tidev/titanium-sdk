function app_data(_args) {
	var win = Titanium.UI.createWindow({
		title:_args.title
	});
	
	var data = '';
	
	data+= 'ID: ' + Titanium.App.getID() + '\n';
	data+= 'Name: ' + Titanium.App.getName() + '\n';
	data+= 'Version: ' + Titanium.App.getVersion() + '\n';
	data+= 'Publisher: ' + Titanium.App.getPublisher() + '\n';
	data+= 'URL: ' + Titanium.App.getURL() + '\n';
	data+= 'Description: ' + Titanium.App.getDescription() + '\n';
	data+= 'Copyright: ' + Titanium.App.getCopyright() + '\n';
	data+= 'GUID: ' + Titanium.App.getGUID() + '\n';
	if (Titanium.Platform.osname === 'mobileweb') {
		data+= 'Path: ' + Titanium.App.appURLToPath('index.html') + '\n';
	}
	data+= 'Build: ' + Titanium.version + '.' + Titanium.buildHash + ' (' + Titanium.buildDate + ')\n';
	
	
	var label = Titanium.UI.createLabel({
		text:data,
		top:20,
		font:{fontFamily:'Helvetica Neue',fontSize:16,fontWeight:'bold'},
		textAlign:'left',
		width:Ti.UI.SIZE,
		height:Ti.UI.SIZE
	});
	win.add(label);

	return win;
};

module.exports = app_data;