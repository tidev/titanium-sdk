var win = Titanium.UI.currentWindow;

var data = '';

data+= 'ID: ' + Titanium.App.getID() + '\n';
data+= 'Name: ' + Titanium.App.getName() + '\n';
data+= 'Version: ' + Titanium.App.getVersion() + '\n';
data+= 'Publisher: ' + Titanium.App.getPublisher() + '\n';
data+= 'URL: ' + Titanium.App.getURL() + '\n';
data+= 'Description: ' + Titanium.App.getDescription() + '\n';
data+= 'Copyright: ' + Titanium.App.getCopyright() + '\n';
data+= 'GUID: ' + Titanium.App.getGUID() + '\n';
data+= 'SessionId: ' + Titanium.App.getSessionId() + '\n';
data+= 'DeployType: ' + Titanium.App.getDeployType() + '\n';
data+= 'Path: ' + Titanium.App.appURLToPath('index.html') + '\n';
data+= 'Arguments: ' + JSON.stringify(Titanium.App.getArguments()) + '\n';
data+= 'Build: ' + Titanium.version + '.' + Titanium.buildHash + ' (' + Titanium.buildDate + ')\n';


var label = Titanium.UI.createLabel({
	text:data,
	top:20,
	font:{fontFamily:'Helvetica Neue',fontSize:16,fontWeight:'bold'},
	textAlign:'left',
	width:'auto',
	height:'auto'
});
win.add(label);
