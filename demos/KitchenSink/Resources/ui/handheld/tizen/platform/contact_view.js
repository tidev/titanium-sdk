// Test for contact functionality. Although the contact functionality is exposed through the
// regular Titanium Contacts API, this test makes use of some Tizen-specific calls and features,
// therefore it's Tizen-only.
//
// This test verifies contact viewing. It is initiated from the "contacts_find" test.

function view_contact(args) {
	var win = Ti.UI.createWindow({
			title: args.title
		}),
		// the contact selected in the "contacts_find" test:
		person = Ti.Contacts.getPersonByID(args.contactId),
		labelLeftPos = 10,
		labelWidth = '40%',
		height = 30,
		top = 10,
		inputLeftPos = '45%',
		inputWidth = '50%',
		address = (person.address.home &&  (person.address.home.length > 0)) ? person.address.home[0] : {},
		email = (person.email.home && (person.email.home.length > 0)) ? person.email.home[0] : '',
		phoneNumber = (person.phone.home && (person.phone.home.length > 0)) ? person.phone.home[0] : '';
	
	// Add controls for first name
	var firstNameLabel = Ti.UI.createLabel({
		left: labelLeftPos,
		top: top,
		height: height,
		width: labelWidth,
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		text: 'First name:'
	});	
	win.add(firstNameLabel);
	
	var firstNameLabelVal = Ti.UI.createLabel({
		top: top,
		left: inputLeftPos,
		width: inputWidth,
		height: height,
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		text: person.firstName || ''
	});
	win.add(firstNameLabelVal);
	
	top += height + 10;
	
	// Add controls for last name
	var lastNameLabel = Ti.UI.createLabel({
		left: labelLeftPos,
		top: top,
		width: labelWidth,
		height: height,
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		text: 'Last name:'
	}); 
	win.add(lastNameLabel);
	
	var lastNameLabelVal = Ti.UI.createLabel({
		top: top,
		left: inputLeftPos,
		width: inputWidth,
		height: height,
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		text: person.lastName || ''		
	});
	win.add(lastNameLabelVal);
	
	top += height + 10;
	
	// Add controls for email
	var emailLabel = Ti.UI.createLabel({
		left: labelLeftPos,
		top: top,
		width: labelWidth,
		height: height,
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		text: 'Home email:'
	}); 
	win.add(emailLabel);
	
	var emailLabelVal = Ti.UI.createLabel({
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		top: top,
		left: inputLeftPos,
		width: inputWidth,
		height: height	,
		text: email
	});
	win.add(emailLabelVal);
	
	top += height + 10;	
	
	// Add controls for phone number
	var phoneNumberLabel = Ti.UI.createLabel({
		left: labelLeftPos,
		top: top,
		width: labelWidth,
		height: height,
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		text: 'Home phone number:'
	}); 
	win.add(phoneNumberLabel);
	
	var phoneNumberLabelVal = Ti.UI.createLabel({
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		top: top,
		left: inputLeftPos,
		width: inputWidth,
		height: height	,
		text: phoneNumber
	});
	win.add(phoneNumberLabelVal);
	
	top += height + 10;		
	
	// Add controls for city
	var cityLabel = Ti.UI.createLabel({
		left: labelLeftPos,
		top: top,
		width: labelWidth,
		height: height,
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		text: 'Home city:'
	}); 
	win.add(cityLabel);
	
	var cityLabelVal = Ti.UI.createLabel({
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		top: top,
		left: inputLeftPos,
		width: inputWidth,
		height: height,
		text: address.City || ''
	});
	win.add(cityLabelVal);
	
	top += height + 10;		
	
	// Add controls for street
	var streetLabel = Ti.UI.createLabel({
		left: labelLeftPos,
		top: top,
		width: labelWidth,
		height: height,
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		text: 'Home street:'
	}); 
	win.add(streetLabel);
	
	var streetLabelVal = Ti.UI.createLabel({
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		top: top,
		left: inputLeftPos,
		width: inputWidth,
		height: height,
		text: address.Street || ''
	});
	win.add(streetLabelVal);
	
	top += height + 10;		
	
	
	// Add controls for ZIP
	var zipLabel = Ti.UI.createLabel({
		left: labelLeftPos,
		top: top,
		width: labelWidth,
		height: height,
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		text: 'Home ZIP:'
	}); 
	win.add(zipLabel);
	
	var zipLabelVal = Ti.UI.createLabel({
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		top: top,
		left: inputLeftPos,
		width: inputWidth,
		height: height,
		text: address.ZIP || '',
	});
	win.add(zipLabelVal);	
		
	return win;	
}
module.exports = view_contact;