Ti.include('../common.js');

var data = [
	{title:'Local', test:'../examples/sound_local.js'},
	{title:'Local with File', test:'../examples/sound_file.js'},
	{title:'Local with File URL', test:'../examples/sound_file_url.js'},
	{title:'Remote URL', test:'../examples/sound_remote_url.js'},
	{title:'Remote Streaming', test:'../examples/sound_remote.js'}

];

Titanium.UI.currentWindow.add(NookKS.createNavigationTableView(data));
