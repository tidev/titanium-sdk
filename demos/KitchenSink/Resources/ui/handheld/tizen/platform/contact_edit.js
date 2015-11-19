// Test for contact functionality. Although the contact functionality is exposed through the
// regular Titanium Contacts API, this test makes use of some Tizen-specific calls and features,
// therefore it's Tizen-only.
//
// This test verifies contact editing. It is initiated from the "contacts_find" test.

function edit_contact(args) {
	var win = Ti.UI.createWindow({
			title: args.title
		}),
		// the contact selected in the "contacts_find" test:
		person = Ti.Contacts.getPersonByID(args.contactId),
		// stuff related to contact editing UI:
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

	var firstNameInput = Ti.UI.createTextField({
		borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
		top: top,
		left: inputLeftPos,
		width: inputWidth,
		height: height,
		value: person.firstName || ''
	});
	win.add(firstNameInput);

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

	var lastNameInput = Ti.UI.createTextField({
		borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
		top: top,
		left: inputLeftPos,
		width: inputWidth,
		height: height,
		value: person.lastName || ''
	});
	win.add(lastNameInput);

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

	var emailInput = Ti.UI.createTextField({
		borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
		top: top,
		left: inputLeftPos,
		width: inputWidth,
		height: height,
		keyboardType: Ti.UI.KEYBOARD_EMAIL,
		value: email
	});
	win.add(emailInput);

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

	var phoneNumberInput = Ti.UI.createTextField({
		borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
		top: top,
		left: inputLeftPos,
		width: inputWidth,
		height: height,
		keyboardType: Ti.UI.KEYBOARD_NUMBER_PAD,
		value: phoneNumber
	});
	win.add(phoneNumberInput);

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

	var cityInput = Ti.UI.createTextField({
		borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
		top: top,
		left: inputLeftPos,
		width: inputWidth,
		height: height,
		value: address.City || ''
	});
	win.add(cityInput);

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

	var streetInput = Ti.UI.createTextField({
		borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
		top: top,
		left: inputLeftPos,
		width: inputWidth,
		height: height,
		value: address.Street || ''
	});
	win.add(streetInput);

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

	var zipInput = Ti.UI.createTextField({
		borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
		top: top,
		left: inputLeftPos,
		width: inputWidth,
		height: height,
		value: address.ZIP || '',
		keyboardType: Ti.UI.KEYBOARD_NUMBER_PAD	
	});
	win.add(zipInput);

	top += height + 20;	

	var updateButton = Ti.UI.createButton({
		title: 'Update contact',
		top: top
	});
	win.add(updateButton);

	// Contact updating
	updateButton.addEventListener('click', function(e) {
		var firstName = firstNameInput.value.trim(),
			lastName = lastNameInput.value.trim(),
			phoneNumber = phoneNumberInput.value.trim(),
			email = emailInput.value.trim(),
			city = cityInput.value.trim(),
			street = streetInput.value.trim(),
			zip = zipInput.value.trim();
		
		if (!(firstName || lastName || email || phoneNumber || city || street || zip)) {
			alert('At least one field should not be empty');
			return false;
		} else {
			
			person.firstName = firstName;
			person.lastName = lastName;
			if (Object.prototype.toString.call(person.address.home) === '[object Array]') {
				person.address.home[0].City = city
				person.address.home[0].Street = street;
				person.address.home[0].ZIP = zip;
			} else {
				person.address.home = [{
					City: city,
					Street: street,
					ZIP: zip
				}];
			}
			// If the array was empty, add the first item. Otherwise, overwrite the first item.
			(Object.prototype.toString.call(person.email.home) === '[object Array]') ? person.email.home[0] = email : person.email.home = [email];
			(Object.prototype.toString.call(person.phone.home) === '[object Array]') ? person.phone.home[0] = phoneNumber : person.phone.home = [phoneNumber];

			Ti.Contacts.save([person]);

			alert('Contact was updated successfully. Contact ID = ' + person.id);
		}
	});	
	
	return win;
}
module.exports = edit_contact;