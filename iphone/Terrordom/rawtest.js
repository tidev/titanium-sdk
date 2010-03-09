var win = Titanium.UI.currentWindow;
win.backgroundImage = 'Default.png';

var imgWidth = (273/2);
var imgHeight = (613/2);

var bodyTone = Ti.UI.createMaskedImage({mask:'body_mask.png',
	top:50,left:10,height:imgHeight,width:imgWidth,
	tint:'white'
	});

var bodyOutline = Ti.UI.createMaskedImage({mask:'body_lines.png',
	top:50,left:10,height:imgHeight,width:imgWidth,
	tint:'black'
	});

var head = Ti.UI.createMaskedImage({mask:'head_mask.png',
	top:-10,left:25,height:120,width:80,
	});

win.add(bodyTone);
win.add(bodyOutline);
win.add(head);

var changeHead = Ti.UI.createButton({width:60,top:10,right:10,height:30,title:'Use Pic...'});
win.add(changeHead);

changeHead.addEventListener('click',function(e){
	Titanium.Media.openPhotoGallery({
	success:function(event)
	{
		var image = event.media;
		// set image view
		head.image = image;
	},
	allowImageEditing:true,
	});
});
