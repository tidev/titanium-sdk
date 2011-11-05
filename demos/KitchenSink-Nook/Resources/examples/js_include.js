Titanium.include('../my_js_include.js', '../my_js_include_2.js', 'local_include.js');

Ti.UI.createAlertDialog({
	title:'JS Includes',
	message:'first name: ' + myFirstName + ' middle name: ' + myMiddleName +' last name: ' + myLastName,
	buttonNames: ['OK']
}).show();
