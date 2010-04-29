var win = Ti.UI.currentWindow;

// initialize to all modes
win.orientationModes = [
	Titanium.UI.PORTRAIT,
	Titanium.UI.LANDSCAPE_LEFT,
	Titanium.UI.LANDSCAPE_RIGHT
];

var emailDialog = Titanium.UI.createEmailDialog();

if (Titanium.Platform.name == 'iPhone OS') {
    Titanium.Media.openPhotoGallery({
        success: function(event)
        {
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
            
        },
        error: function(error)
        {
        },
        cancel: function()
        {

        },
        allowImageEditing:true
    });
} else {
    // 29 Apr 2010 - Our current Android implementation has not implemented
    // something required for the photo gallery example above. Just
    // attach a normal file.
    emailDialog.setSubject('Hello from Titanium!');
    emailDialog.setToRecipients(['foo@yahoo.com']);
    emailDialog.setCcRecipients(['bar@yahoo.com']);
    emailDialog.setBccRecipients(['blah@yahoo.com']);
    emailDialog.setMessageBody('Appcelerator Titanium Rocks!');

    // attach a file
    var f = Ti.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'cricket.wav');
    emailDialog.addAttachment(f);
}

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
