Titanium.Media.openPhotoGallery({
	success: function(event)
	{
		
		var emailDialog = Titanium.UI.createEmailDialog()
		emailDialog.setSubject('Hello from Titanium!');
		emailDialog.setToRecipients(['foo@yahoo.com']);
		emailDialog.setCcRecipients(['bar@yahoo.com']);
		emailDialog.setBccRecipients(['blah@yahoo.com']);
		emailDialog.setMessageBody('<b>Appcelerator Titanium Rocks!</b>');
		emailDialog.setHtml(true);
		emailDialog.setBarColor('#336699');

		// attach a blob
		emailDialog.addAttachment(event.media);
		
		// attach a file
		var f = Ti.Filesystem.getFile('cricket.wav');
		emailDialog.addAttachment(f);
		
		emailDialog.addEventListener('complete',function(e)
		{
			if (e.result == emailDialog.SENT)
			{
				alert("message was sent");
			}
			else
			{
				alert("message was not sent. result = "+e.result);
			}
		});
		emailDialog.open();
	},
	error: function(error)
	{
	},
	cancel: function()
	{

	},
	allowImageEditing:true
});