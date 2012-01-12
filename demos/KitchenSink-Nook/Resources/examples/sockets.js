Ti.include('../common.js');

var data = [
	{title:'Connecting socket', test:'../examples/socket_connect.js'},
	{title:'Listening socket', test:'../examples/socket_listener.js'},
	{title:'Server and client example', test:'../examples/socket_server_client.js'}
];

Titanium.UI.currentWindow.add(NookKS.createNavigationTableView(data));