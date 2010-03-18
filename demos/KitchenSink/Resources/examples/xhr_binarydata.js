// var win = Titanium.UI.currentWindow;
// 
// var l = Titanium.UI.createLabel({
// 	text:'Downloading image...',
// 	font:{fontSize:13},
// 	top:10,
// 	left:10,
// 	width:300,
// 	color:'#888'
// });
// win.add(l);
// var imageView = Titanium.UI.createImageView({
// 	top:50,
// 	left:10,
// 	height:100,
// 	width:80
// });
// win.add(imageView);
// 
// var xhr = Titanium.Network.createHTTPClient();
// 
// xhr.onload = function()
// {
// 	var f = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory,'ti.png');
// 	f.write(this.responseData);
// 	imageView.url = f.nativePath;
// };
// // open the client
// xhr.open('GET','http://www.appcelerator.com/wp-content/uploads/2009/06/titanium_desk.png');
// 
// // send the data
// xhr.send();


var win = Titanium.UI.currentWindow;
win.layout = 'vertical';

function getJSON(url, callback){
	var xhr = Titanium.Network.createHTTPClient();
	var data;
	
	xhr.onreadystatechange = function() {
		Titanium.API.info('readyState: ' + this.readyState);

	    if (this.readyState == 3) {		
			Ti.API.info('>> Content-Type HTTP header: ' + xhr.getResponseHeader('Content-Type'));
			Ti.API.info('>> WWW-Authenticate HTTP headers: ' + xhr.getResponseHeader('Www-Authenticate'));
			
			httpstatus_label.text = 'HTTP Status code: ' + xhr.status;
			ct_label.text = 'Content-Type: ' + xhr.getResponseHeader('Content-Type');
			auth_label.text = 'WWW-Authenticate: ' + xhr.getResponseHeader('Www-Authenticate');

        	callback(this.responseText);

	    }

	};
	xhr.onerror = function(e)
	{
		Ti.API.info('ERROR ' + e.error);
		Ti.API.info('>> Content-Type HTTP header: ' + xhr.getResponseHeader('Content-Type'));
		Ti.API.info('>> WWW-Authenticate HTTP headers: ' + xhr.getResponseHeader('Www-Authenticate'));
		
		httpstatus_label.text = 'HTTP Status code: ' + xhr.status;
		ct_label.text = 'Content-Type: ' + xhr.getResponseHeader('Content-Type');
		auth_label.text = 'WWW-Authenticate: ' + xhr.getResponseHeader('Www-Authenticate');

	}

	Ti.API.debug('XHR fetching: ' + url);
	xhr.open('GET', url);
	xhr.send();
};


var b1 = Titanium.UI.createButton({
	title:'Public JSON',
	width:280,
	height:40,
	top:10,
	layout: 'vertical'
});
b1.addEventListener('click', function(e){
	result.value = 'Fetching public JSON...';
	getJSON('http://search.twitter.com/search.json?q=%23titanium', function(response){
		result.value = response;
	});
});

var b2 = Titanium.UI.createButton({
	title:'oAuth protected JSON',
	width:280,
	height:40,
	top:10,
	layout: 'vertical'
});
b2.addEventListener('click', function(e){
	result.value = 'Fetching oAuth protected JSON...';
	getJSON('http://query.yahooapis.com/v1/yql?q=select%20*%20from%20search.news%20where%20query%3D%22obama%22&format=json', function(response){
		result.value = response;
	});

});

var httpstatus_label = Titanium.UI.createLabel({
	text:'HTTP Status code: ',
	width:280,
	height:'auto',
	top:5,
	layout: 'vertical',
	font : { fontSize: 12 }
});
var ct_label = Titanium.UI.createLabel({
	text:'Content-Type: ',
	width:280,
	height:'auto',
	top:5,
	layout: 'vertical',
	font : { fontSize: 12 }
});
var auth_label = Titanium.UI.createLabel({
	text:'WWW-Authenticate: ',
	width:280,
	height:'auto',
	top:5,
	layout: 'vertical',
	font : { fontSize: 12 }
});



var result = Titanium.UI.createTextArea({
	value:'',
	editable: false,
	borderRadius: 10,
	borderWidth: 2,
	borderColor: '#eee',
	width:280,
	height:190,
	top:10,
	layout: 'vertical',
	font : {
		fontSize: 12
	}
});


win.add(b1);
win.add(b2);
win.add(httpstatus_label);
win.add(ct_label);
win.add(auth_label);
win.add(result);




