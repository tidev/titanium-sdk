node-x509
=========

[![Build Status](https://secure.travis-ci.org/Southern/node-x509.png?branch=master)](http://travis-ci.org/Southern/node-x509)
[![NPM version](https://badge.fury.io/js/x509.png)](http://badge.fury.io/js/x509)

Simple X509 certificate parser.

## Installation

From NPM *(recommended)*: `npm install x509`

Building and testing from source:
```
sudo npm install -g node-gyp
npm install
npm test
```

## Usage
Reading from a file:
```js
var x509 = require('x509');

var issuer = x509.getIssuer(__dirname + '/certs/your.crt');
```

Reading from a string:
```js
var fs = require('fs'),
    x509 = require('x509');

var issuer = x509.getIssuer(fs.readFileSync('./certs/your.crt').toString());
```

## Methods
**Notes:**
- `cert` may be a filename or a raw base64 encoded PEM string in any of these methods.


#### x509.getAltNames(`cert`)
Parse certificate with `x509.parseCert` and return the alternate names.

```js
var x509 = require('x509');

var altNames = x509.getAltNames(__dirname + '/certs/nodejitsu.com.crt');
/*
altNames = [ '*.nodejitsu.com', 'nodejitsu.com' ]
*/
```

#### x509.getIssuer(`cert`)
Parse certificate with `x509.parseCert` and return the issuer.

```js
var x509 = require('x509');

var issuer = x509.getIssuer(__dirname + '/certs/nodejitsu.com.crt');
/*
issuer = { countryName: 'GB',
  stateOrProvinceName: 'Greater Manchester',
  localityName: 'Salford',
  organizationName: 'COMODO CA Limited',
  commonName: 'COMODO High-Assurance Secure Server CA' }
*/
```

#### x509.getSubject(`cert`)
Parse certificate with `x509.parseCert` and return the subject.

```js
var x509 = require('x509');

var subject = x509.getSubject(__dirname + '/certs/nodejitsu.com.crt');
/*
subject = { countryName: 'US',
  postalCode: '10010',
  stateOrProvinceName: 'NY',
  localityName: 'New York',
  streetAddress: '902 Broadway, 4th Floor',
  organizationName: 'Nodejitsu',
  organizationalUnitName: 'PremiumSSL Wildcard',
  commonName: '*.nodejitsu.com' }
*/
```

#### x509.parseCert(`cert`)
Parse subject, issuer, valid before and after date, and alternate names from certificate.

```js
var x509 = require('x509');

var cert = x509.parseCert(__dirname + '/certs/nodejitsu.com.crt');
/*
cert = { subject: 
   { countryName: 'US',
     postalCode: '10010',
     stateOrProvinceName: 'NY',
     localityName: 'New York',
     streetAddress: '902 Broadway, 4th Floor',
     organizationName: 'Nodejitsu',
     organizationalUnitName: 'PremiumSSL Wildcard',
     commonName: '*.nodejitsu.com' },
  issuer: 
   { countryName: 'GB',
     stateOrProvinceName: 'Greater Manchester',
     localityName: 'Salford',
     organizationName: 'COMODO CA Limited',
     commonName: 'COMODO High-Assurance Secure Server CA' },
  notBefore: Sun Oct 28 2012 20:00:00 GMT-0400 (EDT),
  notAfter: Wed Nov 26 2014 18:59:59 GMT-0500 (EST),
  altNames: [ '*.nodejitsu.com', 'nodejitsu.com' ] }
*/
```

## Examples
Checking the date to make sure the certificate is active:
```js
var x509 = require('x509'),
    cert = x509.parseCert('yourcert.crt'),
    date = new Date();

if (cert.notBefore > date) {
  // Certificate isn't active yet.
}
if (cert.notAfter < date) {
  // Certificate has expired.
}
```

## License
Copyright (c) 2013 Colton Baker

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
