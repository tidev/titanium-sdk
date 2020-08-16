/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');
const utilities = require('./utilities/utilities');

describe('Titanium.UI.EmailDialog', function () {
	it('apiName', function () {
		const emailDialog = Ti.UI.createEmailDialog({
			subject: 'this is some text'
		});
		should(emailDialog).have.readOnlyProperty('apiName').which.is.a.String();
		should(emailDialog.apiName).be.eql('Ti.UI.EmailDialog');
	});

	// FIXME constant may hang on instances for iOS and Android? But I think we should enforce being able to reference them as Ti.UI.EmailDialog.FAILED
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('FAILED', function () {
		should(Ti.UI.EmailDialog).have.constant('FAILED').which.is.a.Number();
	});

	// FIXME constant may hang on instances for iOS and Android? But I think we should enforce being able to reference them as Ti.UI.EmailDialog.SENT
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('SENT', function () {
		should(Ti.UI.EmailDialog).have.constant('SENT').which.is.a.Number();
	});

	// FIXME constant may hang on instances for iOS and Android? But I think we should enforce being able to reference them as Ti.UI.EmailDialog.SAVED
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('SAVED', function () {
		should(Ti.UI.EmailDialog).have.constant('SAVED').which.is.a.Number();
	});

	// FIXME constant may hang on instances for iOS and Android? But I think we should enforce being able to reference them as Ti.UI.EmailDialog.CANCELLED
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('CANCELLED', function () {
		should(Ti.UI.EmailDialog).have.constant('CANCELLED').which.is.a.Number();
	});

	(utilities.isWindowsDesktop() ? it.skip : it)('subject', function () {
		var email = Ti.UI.createEmailDialog({
			subject: 'this is some text'
		});
		should(email.subject).be.a.String();
		should(email.getSubject).be.a.Function();
		should(email.subject).eql('this is some text');
		should(email.getSubject()).eql('this is some text');
		email.subject = 'other text';
		should(email.subject).eql('other text');
		should(email.getSubject()).eql('other text');
	});

	(utilities.isWindowsDesktop() ? it.skip : it)('messageBody', function () {
		var email = Ti.UI.createEmailDialog({
			messageBody: 'this is some text'
		});
		should(email.messageBody).be.a.String();
		should(email.getMessageBody).be.a.Function();
		should(email.messageBody).eql('this is some text');
		should(email.getMessageBody()).eql('this is some text');
		email.messageBody = 'other text';
		should(email.messageBody).eql('other text');
		should(email.getMessageBody()).eql('other text');
	});

	(utilities.isWindowsDesktop() ? it.skip : it)('toRecipients', function () {
		var email = Ti.UI.createEmailDialog({
			toRecipients: [ 'me@example.com' ]
		});
		should(email.toRecipients).be.an.Array();
		should(email.getToRecipients).be.a.Function();
		should(email.toRecipients).eql([ 'me@example.com' ]);
		should(email.getToRecipients()).eql([ 'me@example.com' ]);
		email.toRecipients = [ 'other@example.com' ];
		should(email.toRecipients).eql([ 'other@example.com' ]);
		should(email.getToRecipients()).eql([ 'other@example.com' ]);
	});

	(utilities.isWindowsDesktop() ? it.skip : it)('ccRecipients', function () {
		var email = Ti.UI.createEmailDialog({
			ccRecipients: [ 'me@example.com' ]
		});
		should(email.ccRecipients).be.an.Array();
		should(email.getCcRecipients).be.a.Function();
		should(email.ccRecipients).eql([ 'me@example.com' ]);
		should(email.getCcRecipients()).eql([ 'me@example.com' ]);
		email.ccRecipients = [ 'other@example.com' ];
		should(email.ccRecipients).eql([ 'other@example.com' ]);
		should(email.getCcRecipients()).eql([ 'other@example.com' ]);
	});

	(utilities.isWindowsDesktop() ? it.skip : it)('bccRecipients', function () {
		var email = Ti.UI.createEmailDialog({
			bccRecipients: [ 'me@example.com' ]
		});
		should(email.bccRecipients).be.an.Array();
		should(email.getBccRecipients).be.a.Function();
		should(email.bccRecipients).eql([ 'me@example.com' ]);
		should(email.getBccRecipients()).eql([ 'me@example.com' ]);
		email.bccRecipients = [ 'other@example.com' ];
		should(email.bccRecipients).eql([ 'other@example.com' ]);
		should(email.getBccRecipients()).eql([ 'other@example.com' ]);
	});

	(utilities.isWindowsDesktop() ? it.skip : it)('addAttachment', function () {
		var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'File.txt'),
			blob,
			email;
		file.write('File test.');
		blob = Ti.createBuffer({ value: 'Blob test.' }).toBlob();
		email = Ti.UI.createEmailDialog();
		email.addAttachment(file);
		email.addAttachment(blob);
	});
});
