function xhr_upload(_args) {
	var win = Titanium.UI.createWindow({
		title:_args.title
	});
	
	var ind=Titanium.UI.createProgressBar({
		width:200,
		height:50,
		min:0,
		max:1,
		value:0,
		style:Titanium.UI.iPhone.ProgressBarStyle.PLAIN,
		top:10,
		message:'Uploading Image',
		font:{fontSize:12, fontWeight:'bold'},
		color:'#888'
	});
	
	win.add(ind);
	ind.show();
	
	Titanium.Media.openPhotoGallery({
	
		success:function(event)
		{
			Ti.API.info("success! event: " + JSON.stringify(event));
			var image = event.media;
		
			var xhr = Titanium.Network.createHTTPClient();
	
			xhr.onerror = function(e)
			{
				Ti.UI.createAlertDialog({title:'Error', message:e.error}).show();
				Ti.API.info('IN ERROR ' + e.error);
			};
			xhr.setTimeout(20000);
			xhr.onload = function(e)
			{
				Ti.UI.createAlertDialog({title:'Success', message:'status code ' + this.status}).show();
				Ti.API.info('IN ONLOAD ' + this.status + ' readyState ' + this.readyState);
				Ti.API.info('Additional Information: ' + this.responseText);
			};
			xhr.onsendstream = function(e)
			{
				ind.value = e.progress ;
				Ti.API.info('ONSENDSTREAM - PROGRESS: ' + e.progress);
			};
			// open the client
			xhr.open('POST','https://api.imgur.com/3/image');
			// set the Authorization header
			xhr.setRequestHeader('Authorization', 'Client-ID 6126cbc35f6f07c');
			// send the data
			xhr.send({image:image, title:'check me out'});
			
		},
		cancel:function()
		{
	
		},
		error:function(error)
		{
		},
		allowEditing:true
	});
	
	return win;
};

module.exports = xhr_upload;
