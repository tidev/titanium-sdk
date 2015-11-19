function contacts_remove(_args) {
	var win = Titanium.UI.createWindow({
		title:_args.title
	});
	
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
	
	return win;
};

module.exports = contacts_remove;
