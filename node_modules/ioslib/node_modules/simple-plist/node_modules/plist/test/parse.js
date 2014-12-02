
var assert = require('assert');
var parse = require('../').parse;
var multiline = require('multiline');

describe('plist', function () {

  describe('parse()', function () {

    it('should parse a minimal <string> node into a String', function () {
      var parsed = parse('<plist><string>Hello World!</string></plist>');
      assert.strictEqual(parsed, 'Hello World!');
    });

    it('should parse a full XML <string> node into a String', function () {
      var xml = multiline(function () {/*
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<string>gray</string>
</plist>
*/});
      var parsed = parse(xml);
      assert.strictEqual(parsed, 'gray');
    });

    it('should parse an <integer> node into a Number', function () {
      var xml = multiline(function () {/*
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <integer>14</integer>
</plist>
*/});
      var parsed = parse(xml);
      assert.strictEqual(parsed, 14);
    });

    it('should parse a <real> node into a Number', function () {
      var xml = multiline(function () {/*
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <real>3.14</real>
</plist>
*/});
      var parsed = parse(xml);
      assert.strictEqual(parsed, 3.14);
    });

    it('should parse a <date> node into a Date', function () {
      var xml = multiline(function () {/*
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <date>2010-02-08T21:41:23Z</date>
</plist>
*/});
      var parsed = parse(xml);
      assert(parsed instanceof Date);
      assert.strictEqual(parsed.getTime(), 1265665283000);
    });

    it('should parse a <data> node into a Buffer', function () {
      var xml = multiline(function () {/*
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <data>4pyTIMOgIGxhIG1vZGU=</data>
</plist>
*/});
      var parsed = parse(xml);
      assert(Buffer.isBuffer(parsed));
      assert.strictEqual(parsed.toString('utf8'), '✓ à la mode');
    });

    it('should parse a <data> node with newlines into a Buffer', function () {
      var xml = multiline(function () {/*
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <data>4pyTIMOgIGxhIG
  
  
  1v
  
  ZG
  U=</data>
</plist>
*/});
      var parsed = parse(xml);
      assert(Buffer.isBuffer(parsed));
      assert.strictEqual(parsed.toString('utf8'), '✓ à la mode');
    });

    it('should parse a <true> node into a Boolean `true` value', function () {
      var xml = multiline(function () {/*
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <true/>
</plist>
*/});
      var parsed = parse(xml);
      assert.strictEqual(parsed, true);
    });

    it('should parse a <false> node into a Boolean `false` value', function () {
      var xml = multiline(function () {/*
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <false/>
</plist>
*/});
      var parsed = parse(xml);
      assert.strictEqual(parsed, false);
    });

    it('should parse an <array> node into an Array', function () {
      var xml = multiline(function () {/*
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <array>
    <dict>
      <key>duration</key>
      <real>5555.0495000000001</real>
      <key>start</key>
      <real>0.0</real>
    </dict>
  </array>
</plist>
*/});
      var parsed = parse(xml);
      assert.deepEqual(parsed, [
        {
          duration: 5555.0495,
          start: 0
        }
      ]);
    });

    it('should parse a plist file with XML comments', function () {
      var xml = multiline(function () {/*
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>CFBundleName</key>
    <string>Emacs</string>

    <key>CFBundlePackageType</key>
    <string>APPL</string>

    <!-- This should be the emacs version number. -->

    <key>CFBundleShortVersionString</key>
    <string>24.3</string>

    <key>CFBundleSignature</key>
    <string>EMAx</string>

    <!-- This SHOULD be a build number. -->

    <key>CFBundleVersion</key>
    <string>9.0</string>
  </dict>
</plist>
*/});
      var parsed = parse(xml);
      assert.deepEqual(parsed, {
        CFBundleName: 'Emacs',
        CFBundlePackageType: 'APPL',
        CFBundleShortVersionString: '24.3',
        CFBundleSignature: 'EMAx',
        CFBundleVersion: '9.0'
      });
    });

    it('should parse a plist file with CDATA content', function () {
      var xml = multiline(function () {/*
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>OptionsLabel</key>
	<string>Product</string>
	<key>PopupMenu</key>
	<array>
		<dict>
			<key>Key</key>
			<string>iPhone</string>
			<key>Title</key>
			<string>iPhone</string>
		</dict>
		<dict>
			<key>Key</key>
			<string>iPad</string>
			<key>Title</key>
			<string>iPad</string>
		</dict>
		<dict>
			<key>Key</key>
      <string>
        <![CDATA[
        #import &lt;Cocoa/Cocoa.h&gt;

#import &lt;MacRuby/MacRuby.h&gt;

int main(int argc, char *argv[])
{
  return macruby_main("rb_main.rb", argc, argv);
}
]]>
</string>
		</dict>
	</array>
	<key>TemplateSelection</key>
	<dict>
		<key>iPhone</key>
		<string>Tab Bar iPhone Application</string>
		<key>iPad</key>
		<string>Tab Bar iPad Application</string>
	</dict>
</dict>
</plist>
*/});
      var parsed = parse(xml);
      assert.deepEqual(parsed, { OptionsLabel: 'Product',
        PopupMenu:
         [ { Key: 'iPhone', Title: 'iPhone' },
           { Key: 'iPad', Title: 'iPad' },
           { Key: '\n        \n        #import &lt;Cocoa/Cocoa.h&gt;\n\n#import &lt;MacRuby/MacRuby.h&gt;\n\nint main(int argc, char *argv[])\n{\n  return macruby_main("rb_main.rb", argc, argv);\n}\n\n' } ],
        TemplateSelection:
         { iPhone: 'Tab Bar iPhone Application',
           iPad: 'Tab Bar iPad Application' }
      });
    });

    it('should parse an example "Cordova.plist" file', function () {
      var xml = multiline(function () {/*
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<!--
#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
# 
# http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#  KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#
-->
<plist version="1.0">
<dict>
  <key>UIWebViewBounce</key>
  <true/>
  <key>TopActivityIndicator</key>
  <string>gray</string>
  <key>EnableLocation</key>
  <false/>
  <key>EnableViewportScale</key>
  <false/>
  <key>AutoHideSplashScreen</key>
  <true/>
  <key>ShowSplashScreenSpinner</key>
  <true/>
  <key>MediaPlaybackRequiresUserAction</key>
  <false/>
  <key>AllowInlineMediaPlayback</key>
  <false/>
  <key>OpenAllWhitelistURLsInWebView</key>
  <false/>
  <key>BackupWebStorage</key>
  <true/>
  <key>ExternalHosts</key>
  <array>
      <string>*</string>
  </array>
  <key>Plugins</key>
  <dict>
    <key>Device</key>
    <string>CDVDevice</string>
    <key>Logger</key>
    <string>CDVLogger</string>
    <key>Compass</key>
    <string>CDVLocation</string>
    <key>Accelerometer</key>
    <string>CDVAccelerometer</string>
    <key>Camera</key>
    <string>CDVCamera</string>
    <key>NetworkStatus</key>
    <string>CDVConnection</string>
    <key>Contacts</key>
    <string>CDVContacts</string>
    <key>Debug Console</key>
    <string>CDVDebugConsole</string>
    <key>Echo</key>
    <string>CDVEcho</string>
    <key>File</key>
    <string>CDVFile</string>
    <key>FileTransfer</key>
    <string>CDVFileTransfer</string>
    <key>Geolocation</key>
    <string>CDVLocation</string>
    <key>Notification</key>
    <string>CDVNotification</string>
    <key>Media</key>
    <string>CDVSound</string>
    <key>Capture</key>
    <string>CDVCapture</string>
    <key>SplashScreen</key>
    <string>CDVSplashScreen</string>
    <key>Battery</key>
    <string>CDVBattery</string>
  </dict>
</dict>
</plist>
*/});
      var parsed = parse(xml);
      assert.deepEqual(parsed, {
        UIWebViewBounce: true,
        TopActivityIndicator: 'gray',
        EnableLocation: false,
        EnableViewportScale: false,
        AutoHideSplashScreen: true,
        ShowSplashScreenSpinner: true,
        MediaPlaybackRequiresUserAction: false,
        AllowInlineMediaPlayback: false,
        OpenAllWhitelistURLsInWebView: false,
        BackupWebStorage: true,
        ExternalHosts: [ '*' ],
        Plugins: {
          Device: 'CDVDevice',
          Logger: 'CDVLogger',
          Compass: 'CDVLocation',
          Accelerometer: 'CDVAccelerometer',
          Camera: 'CDVCamera',
          NetworkStatus: 'CDVConnection',
          Contacts: 'CDVContacts',
          'Debug Console': 'CDVDebugConsole',
          Echo: 'CDVEcho',
          File: 'CDVFile',
          FileTransfer: 'CDVFileTransfer',
          Geolocation: 'CDVLocation',
          Notification: 'CDVNotification',
          Media: 'CDVSound',
          Capture: 'CDVCapture',
          SplashScreen: 'CDVSplashScreen',
          Battery: 'CDVBattery'
        }
      });
    });

    it('should parse an example "Xcode-Info.plist" file', function () {
      var xml = multiline(function () {/*
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDevelopmentRegion</key>
	<string>en</string>
	<key>CFBundleDisplayName</key>
	<string>${PRODUCT_NAME}</string>
	<key>CFBundleExecutable</key>
	<string>${EXECUTABLE_NAME}</string>
	<key>CFBundleIconFiles</key>
	<array/>
	<key>CFBundleIdentifier</key>
	<string>com.joshfire.ads</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>${PRODUCT_NAME}</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>CFBundleShortVersionString</key>
	<string>1.0</string>
	<key>CFBundleSignature</key>
	<string>????</string>
	<key>CFBundleVersion</key>
	<string>1.0</string>
	<key>LSRequiresIPhoneOS</key>
	<true/>
	<key>UIRequiredDeviceCapabilities</key>
	<array>
		<string>armv7</string>
	</array>
	<key>UISupportedInterfaceOrientations</key>
	<array>
		<string>UIInterfaceOrientationPortrait</string>
		<string>UIInterfaceOrientationLandscapeLeft</string>
		<string>UIInterfaceOrientationLandscapeRight</string>
	</array>
	<key>UISupportedInterfaceOrientations~ipad</key>
	<array>
		<string>UIInterfaceOrientationPortrait</string>
		<string>UIInterfaceOrientationPortraitUpsideDown</string>
		<string>UIInterfaceOrientationLandscapeLeft</string>
		<string>UIInterfaceOrientationLandscapeRight</string>
	</array>
	<key>CFBundleAllowMixedLocalizations</key>
	<true/>
</dict>
</plist>
*/});
      var parsed = parse(xml);
      assert.deepEqual(parsed, {
        CFBundleDevelopmentRegion: 'en',
        CFBundleDisplayName: '${PRODUCT_NAME}',
        CFBundleExecutable: '${EXECUTABLE_NAME}',
        CFBundleIconFiles: [],
        CFBundleIdentifier: 'com.joshfire.ads',
        CFBundleInfoDictionaryVersion: '6.0',
        CFBundleName: '${PRODUCT_NAME}',
        CFBundlePackageType: 'APPL',
        CFBundleShortVersionString: '1.0',
        CFBundleSignature: '????',
        CFBundleVersion: '1.0',
        LSRequiresIPhoneOS: true,
        UIRequiredDeviceCapabilities: [ 'armv7' ],
        UISupportedInterfaceOrientations:
         [ 'UIInterfaceOrientationPortrait',
           'UIInterfaceOrientationLandscapeLeft',
           'UIInterfaceOrientationLandscapeRight' ],
        'UISupportedInterfaceOrientations~ipad':
         [ 'UIInterfaceOrientationPortrait',
           'UIInterfaceOrientationPortraitUpsideDown',
           'UIInterfaceOrientationLandscapeLeft',
           'UIInterfaceOrientationLandscapeRight' ],
        CFBundleAllowMixedLocalizations: true
      });
    });

  });

});
