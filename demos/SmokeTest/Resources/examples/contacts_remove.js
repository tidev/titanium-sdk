
var win = Titanium.UI.currentWindow;

var b1 = Ti.UI.createButton({
	title:'Delete via picker',
	width:200,
	height:40
});
b1.addEventListener('click', function() {
	Titanium.Contacts.showContacts({
		selectedPerson:function(e) {
			Titanium.Contacts.removePerson(e.person);
			Titanium.Contacts.save();
		}
	});
});
win.add(b1);