var win = Titanium.UI.currentWindow;


var label1 = Titanium.UI.createLabel({
    color:'#999',
    text:'Testing timeout with send data and without',
    font:{fontSize:20,fontFamily:'Helvetica Neue'},
    textAlign:'center',
    width:300,
	height:50,
	top:10
});

win.add(label1);

var button1 = Ti.UI.createButton({
	title:'Toggle Send',
	height:30,
	width:300,
	top:70
});

win.add(button1);

var withData = false;
button1.addEventListener('click', function()
{
	if (!withData)
	{
		withData=true;
		label1.text = 'sending with data'

		var xhr = Ti.Network.createHTTPClient();
		xhr.setTimeout(30000);
		var start;
		xhr.onload = function()
		{
		    label1.text = 'Received the response.';
		};

		xhr.onerror = function(e)
		{
		    var now = new Date();
		    var time = (((now - start) / 1000) | 0);
		    label1.text = 'Registered error: time passed = ' + (now-start) + ' seconds';
			Ti.API.info('error ' + e.error)
		};

		// use any ip address that is not on the network
		var notExistIP = 'http://192.168.1.23';

		// use any unreachable IP address
		xhr.open('GET',notExistIP);
		start = new Date();
		var data = {
		    value1: 'value1',
		    value2: 'value2'
		};

		xhr.send(data);
	}
	else
	{
		withData=false;
		label1.text = 'sending without data'
		var xhr = Ti.Network.createHTTPClient();
		xhr.setTimeout(30000);
		var start;
		xhr.onload = function()
		{
		    label1.text = 'Received the response.';
		};

		xhr.onerror = function(e)
		{
		    var now = new Date();
		    var time = (((now - start) / 1000) | 0);
		    label1.text = 'Registered error: time passed = ' + (now-start) + ' seconds';
			Ti.API.info('error ' + e.error)
		
		};

		// use any ip address that is not on the network
		var notExistIP = 'http://192.168.1.23';

		// use any unreachable IP address
		xhr.open('GET',notExistIP);
		start = new Date();
		xhr.send();
	}
});

