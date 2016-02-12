
var assert = require('assert');
var build = require('../').build;
var multiline = require('multiline');

describe('plist', function () {

  describe('build()', function () {

    it('should create a plist XML string from a String', function () {
      var xml = build('test');
      assert.strictEqual(xml, multiline(function () {/*
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <string>test</string>
</plist>
*/}));
    });

    it('should create a plist XML integer from a whole Number', function () {
      var xml = build(3);
      assert.strictEqual(xml, multiline(function () {/*
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <integer>3</integer>
</plist>
*/}));
    });

    it('should create a plist XML real from a fractional Number', function () {
      var xml = build(Math.PI);
      assert.strictEqual(xml, multiline(function () {/*
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <real>3.141592653589793</real>
</plist>
*/}));
    });

    it('should create a plist XML date from a Date', function () {
      var xml = build(new Date('2010-02-08T21:41:23Z'));
      assert.strictEqual(xml, multiline(function () {/*
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <date>2010-02-08T21:41:23Z</date>
</plist>
*/}));
    });

    it('should create a plist XML date from a Buffer', function () {
      var xml = build(new Buffer('☃'));
      assert.strictEqual(xml, multiline(function () {/*
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <data>4piD</data>
</plist>
*/}));
    });

    it('should create a plist XML true from a `true` Boolean', function () {
      var xml = build(true);
      assert.strictEqual(xml, multiline(function () {/*
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <true/>
</plist>
*/}));
    });

    it('should create a plist XML false from a `false` Boolean', function () {
      var xml = build(false);
      assert.strictEqual(xml, multiline(function () {/*
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <false/>
</plist>
*/}));
    });

    it('should create a plist XML dict from an Object', function () {
      var xml = build({ foo: 'bar' });
      assert.strictEqual(xml, multiline(function () {/*
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>foo</key>
    <string>bar</string>
  </dict>
</plist>
*/}));
    });

    it('should create a plist XML array from an Array', function () {
      var xml = build([ 1, 'foo', false, new Date(1234) ]);
      assert.strictEqual(xml, multiline(function () {/*
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <array>
    <integer>1</integer>
    <string>foo</string>
    <false/>
    <date>1970-01-01T00:00:01Z</date>
  </array>
</plist>
*/}));
    });

    it('should properly encode an empty string', function () {
      var xml = build({ a: '' });
      assert.strictEqual(xml, multiline(function () {/*
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>a</key>
    <string></string>
  </dict>
</plist>
*/}));
    });

  });

});
