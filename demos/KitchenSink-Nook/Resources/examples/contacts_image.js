var win = Ti.UI.currentWindow;

var imageDisplay = null;

var infoLabel = Ti.UI.createLabel({
	top:20,
	width:'auto',
	height:'auto'
});

var showDisplay = Ti.UI.createButton({
	title:'Get image from picker',
	bottom:140,
	width:200,
	height:40
});
showDisplay.addEventListener('click', function() {
	Titanium.Contacts.showContacts({
	selectedPerson: function(e) {
		var image = e.person.image;
		if (image == null) {
			infoLabel.text = 'No image';
			if (imageDisplay != null) {
				imageDisplay.image = null;
			}
		}
		else {
			infoLabel.text = 'Image for '+e.person.fullName;
			if (imageDisplay == null) {
				imageDisplay = Ti.UI.createImageView({
					image:image,
					width:100,
					height:100,
					top:50
				});
				win.add(imageDisplay);
			}
			else {
				imageDisplay.image = image;
			}
		}
	}
	});
});

win.add(infoLabel);
win.add(showDisplay);

// Android contacts are so far readonly
if (Ti.Platform.osname !== 'android') {
	var removeDisplay = Ti.UI.createButton({
		title:'Remove image via picker',
		bottom:80,
		width:200,
		height:40
	});
	removeDisplay.addEventListener('click', function() {
		Titanium.Contacts.showContacts({
			selectedPerson: function(e) {
				e.person.image = null;
				infoLabel.text = 'Removed image for '+e.person.fullName;
				Titanium.Contacts.save();
			}
		});
	});

	sampleImage = Ti.Filesystem.getFile('images/chat.png').read();
	var setDisplay = Ti.UI.createButton({
		title:'Set image via picker',
		bottom:20,
		height:40,
		width:200
	});
	setDisplay.addEventListener('click', function() {
		Titanium.Contacts.showContacts({
			selectedPerson: function(e) {
				e.person.image = sampleImage;
				infoLabel.text = 'Set image for '+e.person.fullName;
				Titanium.Contacts.save();
			}
		});
	});

	// Android contacts are so far readonly
	win.add(removeDisplay);
	win.add(setDisplay);
}
