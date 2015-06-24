var win = Ti.UI.createWindow({
	backgroundColor: 'white'
});

var btn = Ti.UI.createButton({
	title: 'authorization status?',
	top:'10%'
});

btn.addEventListener('click', function(e){
	alert(Ti.Contacts.contactsAuthorization);
});

var btn2 = Ti.UI.createButton({
	title: 'grant authorization',
	top:'20%'
});

btn2.addEventListener('click', function(e){
	Ti.Contacts.requestAuthorization(function(e) {
		if (e.success == true) {
			alert('success');
		}
		else {
			alert('no');
		}
	});
});

var btn3 = Ti.UI.createButton({
	title: 'show Contacts',
	top:'30%'
});

btn3.addEventListener('click', function(e){
	Ti.Contacts.showContacts({
		cancel: function(e) {
			alert('cancelled');
		},
		selectedPerson: function(e) {
			var person = e.person;
			alert('person selected is ' + person.fullName + ' with identifier ' + person.identifier);
		},
//		selectedProperty: function(e) {
//			alert('property selected');
//		}
	});
});

var btn4 = Ti.UI.createButton({
	title: 'get All Contacts',
	top:'40%'
});

btn4.addEventListener('click', function(e){
	var people = Ti.Contacts.getAllPeople();
	Ti.API.info(people);
	for (var i = people.length - 1; i >= 0; i--) {
		Ti.API.info(people[i].fullName);
	};
});

var btn5 = Ti.UI.createButton({
	title: 'get All Groups',
	top:'50%'
});

btn5.addEventListener('click', function(e){
	var groups = Ti.Contacts.getAllGroups();
	Ti.API.info(groups);
	for (var i = groups.length - 1; i >= 0; i--) {
		Ti.API.info(groups[i].name);
	};
});

var btn6 = Ti.UI.createButton({
	title: 'get John AppleSeed',
	top:'60%'
});

btn6.addEventListener('click', function(e){
	var people = Ti.Contacts.getAllPeople();
	var person = Ti.Contacts.getPersonByIdentifier(people[0].identifier);
	alert(person.fullName);
});
var btn7 = Ti.UI.createButton({
	title: 'get first group',
	top:'70%'
});

btn7.addEventListener('click', function(e){
	var groups = Ti.Contacts.getAllGroups();
	var group = Ti.Contacts.getGroupByIdentifier(groups[0].identifier);
	alert(group.name);
});
var btn8 = Ti.UI.createButton({
	title: 'get people with names john',
	top:'80%'
});

btn8.addEventListener('click', function(e){
	var people = Ti.Contacts.getPeopleWithName('john');
	for (var i = people.length - 1; i >= 0; i--) {
		Ti.API.info(people[i].fullName);
		Ti.API.info(people[i].lastName);
	};
});

Ti.Contacts.addEventListener('reload', function() {
	Ti.API.info('contacts changed outside!');
});
win.add(btn);
win.add(btn2);
win.add(btn3);
win.add(btn4);
win.add(btn5);
win.add(btn6);
win.add(btn7);
win.add(btn8);
win.open();