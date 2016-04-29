/**
 * Tests windowslib's certs module.
 *
 * @copyright
 * Copyright (c) 2016 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const
	fs = require('fs'),
	path = require('path'),
	windowslib = require('..'),
	CERT_FILE = path.join(__dirname, 'Windows_TemporaryKey.pfx');

describe('certs', function () {
	it('namespace should be an object', function () {
		should(windowslib.certs).be.an.Object;
	});

	it('parseCertUtilOutput() retrieves sha1 thumbprint from Italian output', function (done) {
		var output = "================ Certificato 0 ================\r\n" +
			"================ Inizio nidificazione livello 1 ================\r\n" +
			"Elemento 0:\r\n" +
			"Numero di serie: 11b6d24418117bb246138341b49e9bfe\r\n" +
			"Autorità emittente: CN=FEC38FFF-D0C5-4AA7-9644-5E96476CB034\r\n" +
			" NotBefore: 08/01/2016 10:53\r\n" +
			" NotAfter: 08/01/2018 01:00\r\n" +
			"Soggetto: CN=FEC38FFF-D0C5-4AA7-9644-5E96476CB034\r\n" +
			"La firma elettronica corrisponde alla chiave pubblica\r\n" +
			"Certificato radice: soggetto corrispondente all'autorità emittente\r\n" +
			"Hash certificato (sha1): f4 23 1f 8e 13 c7 fa 6f 22 14 dd 54 59 8e 10 e4 25 3a 40 7a\r\n" +
			"----------------  Fine nidificazione livello 1  ----------------\r\n" +
			"  Provider = Microsoft Strong Cryptographic Provider\r\n" +
			"Verifica firma riuscita\r\n" +
			"CertUtil: - Esecuzione comando dump riuscita.";
		windowslib.certs.test.parseCertUtilOutput(CERT_FILE, output, function (err, value) {
			if (err) {
				return done(err);
			}

			should(value).equal('F4231F8E13C7FA6F2214DD54598E10E4253A407A');

			done();
		});
	});

	it('parseCertUtilOutput() retrieves sha1 thumbprint from English output', function (done) {
		var output = "Certificates: Not Encrypted\r\n" +
			"================ Certificate 0 ================\r\n" +
			"================ Begin Nesting Level 1 ================\r\n" +
			"Element 0:\r\n" +
			"Serial Number: ae0bba023dbbe5ac42782735199df0fc\r\n" +
			"Issuer: CN=CMake Test Cert\r\n" +
			" NotBefore: 1/1/2014 3:00 AM\r\n" +
			" NotAfter: 1/1/2100 3:00 AM\r\n" +
			"Subject: CN=CMake Test Cert\r\n" +
			"Signature matches Public Key\r\n" +
			"Root Certificate: Subject matches Issuer\r\n" +
			"Cert Hash(sha1): f6 3a ac 84 a0 88 4c db 01 26 c3 cd ea 99 1e 36 df 06 4b 3e\r\n" +
			"----------------  End Nesting Level 1  ----------------\r\n" +
			"  Provider = Microsoft Strong Cryptographic Provider\r\n" +
			"Signature test passed\r\n" +
			"CertUtil: -dump command completed successfully..";
		windowslib.certs.test.parseCertUtilOutput(CERT_FILE, output, function (err, value) {
			if (err) {
				return done(err);
			}

			should(value).equal('F63AAC84A0884CDB0126C3CDEA991E36DF064B3E');

			done();
		});
	});

	(process.platform === 'win32' ? it : it.skip)('thumbprint retrieves sha1 thumbprint of cmake temp key with no password', function (done) {
		this.timeout(5000);
		this.slow(4000);

		windowslib.certs.thumbprint(CERT_FILE, null, function (err, value) {
			if (err) {
				return done(err);
			}

			should(value).equal('F63AAC84A0884CDB0126C3CDEA991E36DF064B3E');

			done();
		});
	});
});
