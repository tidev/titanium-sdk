var win = Titanium.UI.currentWindow;

var bgImage	= Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory,"test.jpg");

if(bgImage.exists())
{
	win.backgroundImage = bgImage.nativePath;
}
var add = Titanium.UI.createButton({top:20,width:200,height:40, title:'Select Image'});
win.add(add);
	
add.addEventListener('click',function()
{		
	Titanium.Media.openPhotoGallery(
	{	
		success:function(event)
		{
			var image = event.media;
			bgImage = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory,"test.jpg");
			bgImage.write(image);
						
			win.backgroundImage = null;
			win.backgroundImage = bgImage.nativePath;	
		},
		cancel:function()
		{
	
		},
		error:function(error)
		{
		}
	});
});