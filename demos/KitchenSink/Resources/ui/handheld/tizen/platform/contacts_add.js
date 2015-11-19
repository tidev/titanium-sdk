function add_contacts(args) {
	var win = Ti.UI.createWindow({
			title: args.title
		}),
		labelLeftPos = 10,
		labelWidth = '40%',
		height = 30,
		top = 10,
		inputLeftPos = '45%',
		inputWidth = '50%';
		
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
		height: height
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
		height: height		
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
		height: height	,
		keyboardType: Ti.UI.KEYBOARD_EMAIL	
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
		height: height	,
		keyboardType: Ti.UI.KEYBOARD_NUMBER_PAD	
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
		height: height
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
		height: height
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
		keyboardType: Ti.UI.KEYBOARD_NUMBER_PAD	
	});
	win.add(zipInput);
	
	top += height + 20;	
	
	var saveButton = Ti.UI.createButton({
		title: 'Add contact',
		top: top
	});	
	win.add(saveButton);
	
	saveButton.addEventListener('click', function(e) {
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
			var person = Ti.Contacts.createPerson({
				firstName: firstName,
				lastName: lastName,
				address: {
					home: [{
						City: city,
						Street: street,
						ZIP: zip
					}]
				},
				email: {
					home: [email]
				},
				phone: {
					home: [phoneNumber]
				}
			});
			firstNameInput.value = "";
			lastNameInput.value = "";
			phoneNumberInput.value = "";
			emailInput.value = "";
			cityInput.value = "";
			streetInput.value = "";
			zipInput.value = "";
			alert('Contact was added successfully. Contact ID = ' + person.id);
		}
	});
	
	return win;
}
module.exports = add_contacts;