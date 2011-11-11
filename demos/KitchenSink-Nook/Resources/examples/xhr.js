Ti.include('../common.js');

var data = [
	{title:'Error Callback', test:'../examples/xhr_error.js'},
	{title:'Binary Data', test:'../examples/xhr_binarydata.js'},
	{title:'XML Data', test:'../examples/xhr_xml.js'},
	{title:'XML Properties', test:'../examples/xhr_properties.js'},
	{title:'File Download', test:'../examples/xhr_filedownload.js'},
	{title:'UTF-8 + GET/POST', test:'../examples/xhr_utf8.js'},
	{title:'Cookies', test:'../examples/xhr_cookie.js'},
	{title:'setTimeout', test:'../examples/xhr_settimeout.js'}
];

Titanium.UI.currentWindow.add(NookKS.createNavigationTableView(data));