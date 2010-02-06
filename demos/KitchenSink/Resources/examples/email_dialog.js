Titanium.Media.openPhotoGallery({
	success: function(event)
	{
		var image = event.media;
		
		var emailDialog = Titanium.UI.createEmailDialog()
		emailDialog.setSubject('foo');
		emailDialog.setToRecipients(['foo@yahoo.com']);
		emailDialog.setCcRecipients(['bar@yahoo.com']);
		emailDialog.setBccRecipients(['obama@whitehouse.gov']);
		emailDialog.setMessageBody('this is a test message');
		emailDialog.addAttachment(image);
		emailDialog.setBarColor('#336699');
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