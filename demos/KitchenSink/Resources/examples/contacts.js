var win = Titanium.UI.currentWindow;

// build contacts table view
var contacts = [];

function getContacts()
{
	var data = [{title:'Add Contact'},{title:'Find Contact'},{title:'Find Contact Detail'}];
	contacts = Titanium.Contacts.getAllContacts();
	for (var i=0;i<contacts.length;i++)
	{
		var c = contacts[i]
		data.push({title:c.firstName + ' ' + c.lastName,hasChild:true});
	}
	return data;
};

var data = getContacts();

var tableview = Titanium.UI.createTableView({
	data:data,
});


tableview.addEventListener('click', function(e)
{
	try
	{
		var fn = Titanium.UI.createTextField({
			width:200,
			hintText:'First Name',
			top:10,
			borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
			height:35,
		});
		var ln = Titanium.UI.createTextField({
			width:200,
			hintText:'Last Name',
			top:55,
			borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
			height:35
		});
		var middleName = Titanium.UI.createTextField({
			width:200,
			hintText:'Middle Name',
			top:100,
			borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
			autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
			height:35
		});
		var email = Titanium.UI.createTextField({
			width:200,
			hintText:'Email Address',
			top:145,
			borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
			autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
			height:35
		});
		var prefix = Titanium.UI.createTextField({
			width:200,
			hintText:'Prefix',
			top:190,
			borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
			autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
			height:35
		});
		var suffix = Titanium.UI.createTextField({
			width:200,
			hintText:'Suffix',
			top:235,
			borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
			autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
			height:35
		});
		var nickname = Titanium.UI.createTextField({
			width:200,
			hintText:'Nickname',
			top:280,
			borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
			autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
			height:35
		});
		var phoneticFN = Titanium.UI.createTextField({
			width:200,
			hintText:'Phonetic First Name',
			top:325,
			borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
			autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
			height:35
		});
		var phoneticMN = Titanium.UI.createTextField({
			width:200,
			hintText:'Phonetic Middle Name',
			top:370,
			borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
			autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
			height:35
		});
		var phoneticLN = Titanium.UI.createTextField({
			width:200,
			hintText:'Phonetic Last Name',
			top:415,
			borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
			autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
			height:35
		});
		var organization = Titanium.UI.createTextField({
			width:200,
			hintText:'Organization',
			top:460,
			borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
			autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
			height:35
		});
		var jobTitle = Titanium.UI.createTextField({
			width:200,
			hintText:'Job Title',
			top:505,
			borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
			autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
			height:35
		});
		var department = Titanium.UI.createTextField({
			width:200,
			hintText:'Department',
			top:550,
			borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
			autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
			height:35
		});
		var birthday = Titanium.UI.createTextField({
			width:200,
			hintText:'Birthday',
			top:595,
			borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
			autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
			height:35
		});
		var note = Titanium.UI.createTextField({
			width:200,
			hintText:'Note',
			top:640,
			borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
			autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
			height:35
		});
		var city = Titanium.UI.createTextField({
			width:200,
			hintText:'City',
			top:685,
			borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
			autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
			height:35
		});
		var region1 = Titanium.UI.createTextField({
			width:200,
			hintText:'Region 1',
			top:730,
			borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
			autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
			height:35
		});
		var region2 = Titanium.UI.createTextField({
			width:200,
			hintText:'Region 2',
			top:775,
			borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
			autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
			height:35
		});
		var postalCode = Titanium.UI.createTextField({
			width:200,
			hintText:'Postal Code',
			top:820,
			borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
			autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
			height:35
		});
		var country = Titanium.UI.createTextField({
			width:200,
			hintText:'Country',
			top:865,
			borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
			autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
			height:35
		});
		var countryCode = Titanium.UI.createTextField({
			width:200,
			hintText:'Country Code',
			top:910,
			borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
			autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
			height:35
		});
		var phone = Titanium.UI.createTextField({
			width:200,
			hintText:'Phone Number',
			top:955,
			borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
			autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
			height:35
		});
		var instantMessenger = Titanium.UI.createTextField({
			width:200,
			hintText:'IM',
			top:1000,
			borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
			autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
			height:35
		});
		var url = Titanium.UI.createTextField({
			width:200,
			hintText:'URL',
			top:1045,
			borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
			autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
			height:35
		});

		// EDIT MODE
		var deleteButton = null;
		if (e.index >  2)
		{
			fn.value = contacts[(e.index-3)].firstName;
			ln.value = contacts[(e.index-3)].lastName;
			email.value = contacts[(e.index-3)].email;
			middleName.value = contacts[(e.index-3)].middleName;
			prefix.value = contacts[(e.index-3)].prefix;
			suffix.value = contacts[(e.index-3)].suffix;
			nickname.value = contacts[(e.index-3)].nickname;
			phoneticFN.value = contacts[(e.index-3)].phoneticFirstName;
			phoneticMN.value = contacts[(e.index-3)].phoneticMiddleName;
			phoneticLN.value = contacts[(e.index-3)].phoneticLastName;
			organization.value = contacts[(e.index-3)].organization;
			jobTitle.value = contacts[(e.index-3)].jobTitle;
			department.value = contacts[(e.index-3)].department;
			birthday.value = contacts[(e.index-3)].birthday;
			note.value = contacts[(e.index-3)].note;
			
			if (contacts[(e.index-3)].address)
			{
				city.value = contacts[(e.index-3)].address.city;
				region1.value = contacts[(e.index-3)].address.region1;
				region2.value = contacts[(e.index-3)].address.region2;
				postalCode.value = contacts[(e.index-3)].address.postalCode;
				countryCode.value = contacts[(e.index-3)].address.countryCode;
				country.value = contacts[(e.index-3)].address.country;
			}
			phone.value = contacts[(e.index-3)].phone;
			instantMessenger.value = contacts[(e.index-3)].instantMessenger;
			url.value = contacts[(e.index-3)].url;
			
			//
			// DELETE A CONTACT
			//
			deleteButton = Titanium.UI.createButton({
				title:'Delete Contact',
				width:200,
				height:40,
				top:1130
			});
			deleteButton.addEventListener('click', function(e)
			{
				contact.remove();
				Titanium.UI.createAlertDialog({title:'Contact Test', message:'Contact Deleted'}).show();
				editWin.close();
				var data = getContacts();
				tableview.setData(data);
			});
		}
		var contact = contacts[(e.index-3)];

		//
		// CREATE OR SAVE A CONTACT
		//
		var button = Ti.UI.createButton({
			title:'Save Contact',
			height:40,
			width:200,
			top:1080	
		});
		button.addEventListener('click', function()
		{
			// create contact if first row was clicked
			if (e.index == 0)
			{
				var contact = contacts.createContact();
			}
			
			// retrieve field values
			contact.firstName = fn.value;
			contact.lastName = ln.value;
			contact.email = email.value;
			contact.middleName = middleName.value;
			contact.prefix = prefix.value;
			contact.suffix = suffix.value;
			contact.nickname = nickname.value;
			contact.phoneticFirstName = phoneticFN.value;
			contact.phoneticMiddleName = phoneticMN.value;
			contact.phoneticLastName = phoneticLN.value;
			contact.organization = organization.value;
			contact.jobTitle = jobTitle.value;
			contact.department = department.value;
			contact.birthday = birthday.value;
			contact.note = note.value;
			contact.address.city = city.value;
			contact.address.region1 = region1.value;
			contact.address.region2 = region2.value;
			contact.address.postalCode = postalCode.value;
			contact.address.countryCode = countryCode.value;
			contact.address.country = country.value;
			contact.phone = phone.value;
			contact.instantMessenger = instantMessenger.value;
			contact.url = instantMessanger.url;
			
			contact.save();
			
			// close window and reload contacts
			editWin.close();
			var data = getContacts();
			tableview.setData(data);

		});

		// other supported properties
		//-----------------------------
		// creationDate
		// modificationDate
		// relatives
		// date
		 // [NSNumber numberWithInt:kABPersonPhoneProperty],@"phone",
		 // [NSNumber numberWithInt:kABPersonInstantMessageProperty],@"instantMessenger",
		 // [NSNumber numberWithInt:kABPersonURLProperty],@"url",

		var editWin = Titanium.UI.createWindow({title:((e.index==0)?'New Contact':'Edit Contact')});
		var editView = Titanium.UI.createScrollView({
			contentWidth:320,
			contentHeight:'auto',
			top:0
		});
		
		editWin.backgroundColor = '#13386c'
		editView.add(fn);
		editView.add(ln);
		editView.add(middleName);
		editView.add(email);
		editView.add(prefix);
		editView.add(suffix);
		editView.add(nickname);
		editView.add(phoneticFN);
		editView.add(phoneticMN);
		editView.add(phoneticLN);
		editView.add(organization);
		editView.add(jobTitle);
		editView.add(department);
		editView.add(birthday);
		editView.add(note);
		editView.add(city);
		editView.add(region1);
		editView.add(region2);
		editView.add(postalCode);
		editView.add(country);
		editView.add(countryCode);
		editView.add(phone);
		editView.add(instantMessenger);
		editView.add(url);
		editView.add(button);
		
		if (deleteButton != null) editView.add(deleteButton);
		
		editWin.add(editView);
		
		Titanium.UI.currentTab.open(editWin,{animated:true});		
	}
	catch(e)
	{
		Ti.API.info('error ' + e)
	}


});
win.add(tableview);



