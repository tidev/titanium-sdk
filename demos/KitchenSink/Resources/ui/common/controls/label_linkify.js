// Label linkification test. Specific to Tizen.

function label_linkify() {
	var win = Ti.UI.createWindow({
			backgroundColor: 'white'
		}),
		
		// Label to be linkified.
		l = Ti.UI.createLabel({
			autoLink: Ti.UI.AUTOLINK_ALL,
			left: 5, 
			top: 5, 
			right: 5, 
			height: 100,
			backgroundColor: '#222',
			text: 'Contact\n test@test.com\n 817-555-5555\n http://bit.ly\n 444 Castro Street, Mountain View, CA'
		}),

		// Button that will cause all supported link types to be activated.
		btnAll = Ti.UI.createButton({
			title: 'All', 
			width: 150, 
			height: 40,
			top: 110
		}),

		// Button that will cause email addresses to be linkified.
		btnEmail = Ti.UI.createButton({
			title: 'Email Addresses', 
			width: 150, 
			height: 40,
			top: 200
		}),

		// Button that will cause all links to be removed.
		btnNONE = Ti.UI.createButton({
			title: 'None', 
			width: 150, 
			height: 40,
			top: 155
		}),

		// Button that will cause phone numbers to be linkified.
		btnPhone = Ti.UI.createButton({
			title: 'Phone Numbers', 
			width: 150, 
			height: 40,
			top: 245
		}),

		// Button that will cause web URLs to be linkified.
		btnWeb = Ti.UI.createButton({
			title: 'Web URLs', 
			width: 150, 
			height: 40,
			top: 290
		}),

		// Text field that can replace the label's contents.
		ta = Ti.UI.createTextArea({
			left: 5, 
			top: 335, 
			right: 5, 
			bottom: 5 
		});

	btnAll.addEventListener('click', function(e) {
		l.autoLink = Ti.UI.AUTOLINK_ALL;
	});

	btnEmail.addEventListener('click', function(e) {
		l.autoLink = Ti.UI.AUTOLINK_EMAIL_ADDRESSES;
	});

	btnNONE.addEventListener('click', function(){
		l.autoLink = Ti.UI.AUTOLINK_NONE;
	});

	btnPhone.addEventListener('click', function(e) {
		l.autoLink = Ti.UI.AUTOLINK_PHONE_NUMBERS;
	});

	btnWeb.addEventListener('click', function(e) {
		l.autoLink = Ti.UI.AUTOLINK_URLS;
	});

	ta.addEventListener('return', function(e) {
		l.text = e.value;
	});	

	win.add(l);
	win.add(btnAll);
	win.add(btnEmail);
	win.add(btnNONE);
	win.add(btnPhone);
	win.add(btnWeb);
	win.add(ta);

	return win;
}

module.exports = label_linkify;
