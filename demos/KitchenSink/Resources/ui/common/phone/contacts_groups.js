function contacts_group(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	
	var imageDisplay = null;
	
	var infoLabel = Ti.UI.createLabel({
		top:20,
		width:Ti.UI.SIZE,
		height:Ti.UI.SIZE
	});
	
	var groups = Titanium.Contacts.getAllGroups();
	
	// Create a test group IF we need it
	if (groups.length === 0) {
		Titanium.Contacts.save(); // Need to save before creating groups
		var testGroup = Titanium.Contacts.createGroup();
		testGroup.name = '__KSTESTGROUP';
		Titanium.Contacts.save();
	
		groups = Titanium.Contacts.getAllGroups();
	}
	
	var selectedGroup = groups[0];
	var data = [];
	var people = [];
	
	var updatePeople = function() {
		people = selectedGroup.members();
		var text = 'People: ';
		if (people != null) {
			for (var i=0; i < people.length; i++) {
				text += people[i].fullName +', ';
			}
		}
		else {
			people = [];
		}
		infoLabel.text = text;
	};
	
	updatePeople();
	
	for (var i=0; i < groups.length; i++) {
		data[i] = Ti.UI.createPickerRow({title:groups[i].name});
	}
	
	var groupPicker = Ti.UI.createPicker({
		top:50
	});
	groupPicker.addEventListener('change', function(e) {
		selectedGroup = groups[e.rowIndex];
		updatePeople();
	});
	
	groupPicker.selectionIndicator = true;
	groupPicker.add(data);
	
	var addPerson = Ti.UI.createButton({
		title:'Add person',
		left:10,
		bottom:20,
		width:120,
		height:40
	});
	addPerson.addEventListener('click', function() {
		Titanium.Contacts.showContacts({
			selectedPerson: function(e) {
				selectedGroup.add(e.person);
				Titanium.Contacts.save();
				updatePeople();
			}
		});
	});
	
	var removePerson = Ti.UI.createButton({
		title:'Remove person',
		right:10,
		bottom:20,
		width:120,
		height:40
	});
	removePerson.addEventListener('click', function() {
		Titanium.Contacts.showContacts({
			selectedPerson: function(e) {
				selectedGroup.remove(e.person);
				Titanium.Contacts.save();
				updatePeople();
			}
		});
	});
	
	win.add(infoLabel);
	win.add(groupPicker);
	win.add(addPerson);
	win.add(removePerson);
	
	var reloadHandler = function(){
		addPerson.enabled = false;
		removePerson.enabled = false;
		addPerson.visible = false;
		removePerson.visible = false;
		infoLabel.text = 'Contacts fired reload Event. Please reopen window to modify more groups.'
	}
	
	// Nasty thing to get around picker bug where we can't select before
	// drawing, and then also have to change the value to fire an event.
	win.addEventListener('open', function() {
		if (data.length > 1) {
			groupPicker.setSelectedRow(0,1,false);
			groupPicker.setSelectedRow(0,0,false);
		}
	});
	
	Ti.Contacts.addEventListener('reload',reloadHandler);
	
	win.addEventListener('close',function(){
		Ti.Contacts.removeEventListener('reload',reloadHandler);
	});
	
	return win;
};

module.exports = contacts_group;