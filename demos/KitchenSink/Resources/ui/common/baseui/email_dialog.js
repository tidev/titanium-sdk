/*
function openEmail() {
	var emailDialog = Titanium.UI.createEmailDialog();
	if (Ti.Platform.osname !== 'mobileweb' && !emailDialog.isSupported()) {
		Ti.UI.createAlertDialog({
			title:'Error',
			message:'Email not available'
		}).show();
		return;
	}
	emailDialog.setSubject('Hello from Titanium!');
	emailDialog.setToRecipients(['foo@yahoo.com']);
	emailDialog.setCcRecipients(['bar@yahoo.com']);
	emailDialog.setBccRecipients(['blah@yahoo.com']);
	
	if (Ti.Platform.name == 'iPhone OS') {
		emailDialog.setMessageBody('<b>Appcelerator Titanium Rocks!</b>å');
		emailDialog.setHtml(true);
		emailDialog.setBarColor('#336699');
	} else {
		emailDialog.setMessageBody('Appcelerator Titanium Rocks!');
	}

	// attach a file
	if (Ti.Platform.osname !== 'mobileweb')  {
		var f = Ti.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, '/images/cricket.wav');
		emailDialog.addAttachment(f);
	}
	
	emailDialog.addEventListener('complete',function(e)
	{
		if (e.result == emailDialog.SENT)
		{
			if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
				alert("message was sent");
			}
		}
		else
		{
			alert("message was not sent. result = " + e.result);
		}
	});
	
	try {
		emailDialog.open();
	} catch (e) {
		alert('email not available');	
	}		
}
*/

function email_dialog(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	
	// initialize to all modes
	win.orientationModes = [
		Titanium.UI.PORTRAIT,
		Titanium.UI.LANDSCAPE_LEFT,
		Titanium.UI.LANDSCAPE_RIGHT
	];
	
	win.addEventListener('open', function() {
	
		var dialog = Ti.UI.createAlertDialog({
			message: 'Select a picture from gallery and try to send it using Email',
			ok: 'Ok'
		});

		dialog.addEventListener('click', function (e) {
			Titanium.Media.openPhotoGallery({
				allowEditing:true,
			
				success: function(event)
				{
					var emailDialog = Titanium.UI.createEmailDialog();
					if (!emailDialog.isSupported()) {
						Ti.UI.createAlertDialog({
							title:'Error',
							message:'Email not available'
						}).show();
						return;
					}
					emailDialog.setSubject('Hello from Titanium!');
					emailDialog.setToRecipients(['foo@yahoo.com']);
					emailDialog.setCcRecipients(['bar@yahoo.com']);
					emailDialog.setBccRecipients(['blah@yahoo.com']);
					
					if (Ti.Platform.name == 'iPhone OS') {
						emailDialog.setMessageBody('<b>Appcelerator Titanium Rocks!</b>å');
						emailDialog.setHtml(true);
						emailDialog.setBarColor('#336699');
					} else {
						emailDialog.setMessageBody('Appcelerator Titanium Rocks!');
					}
			
					// attach a blob
					emailDialog.addAttachment(event.media);
					
					// Adding attachments is not supported on Tizen yet (this is a current Tizen limitation).
					if (Ti.Platform.osname != 'tizen') {
						// attach a file
						var f = Ti.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'etc/cricket.wav');
						emailDialog.addAttachment(f);
					}
					
					emailDialog.addEventListener('complete',function(e)
					{
						if (e.result == emailDialog.SENT)
						{
							if (Ti.Platform.osname != 'android' && Ti.Platform.osname != 'tizen') {
								// android doesn't give us useful result codes.
								// it anyway shows a toast.
								alert("message was sent");
							}
						}
						else
						{
							alert("message was not sent. result = " + e.result);
						}
					});
					emailDialog.open();
				},
			
				error: function(error)
				{
			
				},
			
				cancel: function()
				{
			
				}
			});
		});
		dialog.show();
	});
	
	return win;
};

module.exports = email_dialog;