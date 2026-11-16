/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint mocha/no-identical-title: "off" */
'use strict';
const should = require('./utilities/assertions');
const utilities = require('./utilities/utilities');

describe('Titanium.UI.EmailDialog', () => {
	it('.apiName', () => {
		const emailDialog = Ti.UI.createEmailDialog({
			subject: 'this is some text'
		});
		should(emailDialog).have.readOnlyProperty('apiName').which.is.a.String();
		should(emailDialog.apiName).be.eql('Ti.UI.EmailDialog');
	});

	// FIXME constant may hang on instances for iOS and Android? But I think we should enforce being able to reference them as Ti.UI.EmailDialog.FAILED
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('FAILED', () => {
		should(Ti.UI.EmailDialog).have.constant('FAILED').which.is.a.Number();
	});

	// FIXME constant may hang on instances for iOS and Android? But I think we should enforce being able to reference them as Ti.UI.EmailDialog.SENT
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('SENT', () => {
		should(Ti.UI.EmailDialog).have.constant('SENT').which.is.a.Number();
	});

	// FIXME constant may hang on instances for iOS and Android? But I think we should enforce being able to reference them as Ti.UI.EmailDialog.SAVED
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('SAVED', () => {
		should(Ti.UI.EmailDialog).have.constant('SAVED').which.is.a.Number();
	});

	// FIXME constant may hang on instances for iOS and Android? But I think we should enforce being able to reference them as Ti.UI.EmailDialog.CANCELLED
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('CANCELLED', () => {
		should(Ti.UI.EmailDialog).have.constant('CANCELLED').which.is.a.Number();
	});

	it.windowsDesktopBroken('.subject', () => {
		it('is a String', () => {
			const email = Ti.UI.createEmailDialog({
				subject: 'this is some text'
			});
			should(email.subject).be.a.String();
			should(email.subject).eql('this is some text');
			email.subject = 'other text';
			should(email.subject).eql('other text');
		});

		it('has no accessors', () => {
			const email = Ti.UI.createEmailDialog({
				subject: 'this is some text'
			});
			should(email).not.have.accessors('subject');
		});
	});

	it.windowsDesktopBroken('.messageBody', () => {
		it('is a String', () => {
			const email = Ti.UI.createEmailDialog({
				messageBody: 'this is some text'
			});
			should(email.messageBody).be.a.String();
			should(email.messageBody).eql('this is some text');
			email.messageBody = 'other text';
			should(email.messageBody).eql('other text');
		});

		it('has no accessors', () => {
			const email = Ti.UI.createEmailDialog({
				messageBody: 'this is some text'
			});
			should(email).not.have.accessors('messageBody');
		});
	});

	it.windowsDesktopBroken('.toRecipients', () => {
		it('is a string[]', () => {
			const email = Ti.UI.createEmailDialog({
				toRecipients: [ 'me@example.com' ]
			});
			should(email.toRecipients).be.an.Array();
			should(email.toRecipients).eql([ 'me@example.com' ]);
			email.toRecipients = [ 'other@example.com' ];
			should(email.toRecipients).eql([ 'other@example.com' ]);
		});

		it('has no accessors', () => {
			const email = Ti.UI.createEmailDialog({
				toRecipients: [ 'me@example.com' ]
			});
			should(email).not.have.accessors('toRecipients');
		});
	});

	it.windowsDesktopBroken('.ccRecipients', () => {
		it('is a string[]', () => {
			const email = Ti.UI.createEmailDialog({
				ccRecipients: [ 'me@example.com' ]
			});
			should(email.ccRecipients).be.an.Array();
			should(email.ccRecipients).eql([ 'me@example.com' ]);
			email.ccRecipients = [ 'other@example.com' ];
			should(email.ccRecipients).eql([ 'other@example.com' ]);
		});

		it('has no accessors', () => {
			const email = Ti.UI.createEmailDialog({
				ccRecipients: [ 'me@example.com' ]
			});
			should(email).not.have.accessors('ccRecipients');
		});
	});

	it.windowsDesktopBroken('.bccRecipients', () => {
		it('is a string[]', () => {
			const email = Ti.UI.createEmailDialog({
				bccRecipients: [ 'me@example.com' ]
			});
			should(email.bccRecipients).be.an.Array();
			should(email.bccRecipients).eql([ 'me@example.com' ]);
			email.bccRecipients = [ 'other@example.com' ];
			should(email.bccRecipients).eql([ 'other@example.com' ]);
		});

		it('has no accessors', () => {
			const email = Ti.UI.createEmailDialog({
				bccRecipients: [ 'me@example.com' ]
			});
			should(email).not.have.accessors('bccRecipients');
		});
	});

	// FIXME: macOS pops a permission prompt for Documents folder
	it.macAndWindowsDesktopBroken('#addAttachment()', () => {
		const file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'File.txt');
		file.write('File test.');
		const blob = Ti.createBuffer({ value: 'Blob test.' }).toBlob();
		const email = Ti.UI.createEmailDialog();
		email.addAttachment(file);
		email.addAttachment(blob);
	});
});
