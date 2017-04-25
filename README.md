Appcelerator Titanium Mobile
============================

[![Build Status](https://jenkins.appcelerator.org/buildStatus/icon?job=titanium-sdk/titanium_mobile/master)](https://jenkins.appcelerator.org/job/titanium-sdk/job/titanium_mobile/job/master/)

Welcome to the Titanium open source project.  Titanium provides
a platform for web developers to build cross-platform, native mobile applications
using JavaScript.

Currently, Titanium supports mobile smartphone operating systems such as Apple iPhone, Google's Android, and Mobile Web. Other platforms, such as Windows Phone, are currently in development.

Titanium is licensed under the OSI approved Apache Public License (version 2). Please
see the LICENSE file for specific details.

*[Download Pre-built Titanium](http://builds.appcelerator.com/#master)*


Features
--------------------

With Titanium, you use JavaScript to code your application.  Titanium's compiler will compile
your application code into an efficient native executable for each target mobile platform.
Titanium writes native code so you don't have to. :)

- Native apps built using JavaScript
- Apps are compiled and run locally with full offline support
- Support for native platform UI controls
- Third-party JavaScript support such as jQuery, Dojo, etc.
- Support for Web views incorporating HTML5, CSS etc.
- Support for in-application SQL database
- Support for Geolocation (compass, geolocation, forward/reverse lookup)
- Support for Camera (taking Photos, playing and recording Video)
- Support for Photo Album (reading and writing)
- Support for Contacts Database / Address Book
- Support for Streaming Audio and Recording Audio, Audio Input Levels, Mic etc
- Support for Vibration
- Support for Social APIs such as Facebook Connect, Twitter, etc
- Support for Yahoo YQL
- Support for Web Services via REST, SOAP
- Support for native Maps
- Support for Push Notifications
- Support for in-application Email
- Support for in-application SMS, Telephone
- Support for Filesystem (reading, writing, etc)
- Support for Gestures (such as Shake)
- Support for Platform and Device capabilities
- Support for complex native views such as Coverflow, Image viewers, Table views, Grouped Views, Composites, etc.
- Completely extensible via Module API for building your own controls or extending capabilities at compile-time

And much, much more.

Alloy
-----

[Alloy](http://docs.appcelerator.com/platform/latest/#!/guide/Alloy_Quick_Start) is the MVC application framework built on top of Titanium.  It is optional. It rocks. Check it out if you're considering using Titanium. It is also a separate [open source project](https://github.com/appcelerator/alloy) available under Apache Public License.



Getting Help
------------

There are a number of ways to get help with Titanium.

### Official Documentation, Tutorials and Videos

Please visit the official documentation site at [http://docs.appcelerator.com/](http://docs.appcelerator.com/) for the latest and historical documentation on Titanium, Alloy and the various products built by Appcelerator.

### Developer Community

[Appcelerator Developer](http://developer.appcelerator.com) is our developer community.

### Video Tutorials

[Appcelerator University](http://university.appcelerator.com/) is our main video channel
for video tutorials on Titanium.

### Slack

Community support and discussion about Titanium is available on Slack at [TiSlack](http://www.tislack.org).

### Twitter

Please consider following [@Appcelerator](http://www.twitter.com/appcelerator) and [@AppcDev](https://twitter.com/AppcDev) on Twitter for updates.

### Blog

The Appcelerator blog is located at (http://www.appcelerator.com/blog).

### Commercial Support, Licensing

We give our software away for FREE! In order to do that, we have programs for
companies that require additional level of assistance through training or commercial support,
need special licensing or want additional levels of capabilities. Please visit the
[Appcelerator Website](http://www.appcelerator.com) for more information about Appcelerator or
email [info@appcelerator.com](mailto:info@appcelerator.com).



Contributing
------------

Titanium is an open source project.  Titanium wouldn't be where it is now without contributions by the community. Please consider forking Titanium to improve, enhance or fix issues. If you feel like the community will benefit from your fork, please open a pull request.

To protect the interests of the Titanium contributors, Appcelerator, customers and end users we require contributors to sign a Contributors License Agreement (CLA) before we pull the changes into the main repository. Our CLA is simple and straightforward - it requires that the contributions you make to any Appcelerator open source project are properly licensed and that you have the legal authority to make those changes. This helps us significantly reduce future legal risk for everyone involved. It is easy, helps everyone, takes only a few minutes, and only needs to be completed once.

[You can digitally sign the CLA](http://cla.appcelerator.com) online. Please indicate your email address in your first pull request so that we can make sure that will locate your CLA.  Once you've submitted it, you no longer need to send one for subsequent submissions.


Building Locally
----------------

Previously Titanium used scons and python scripts to build the SDK.
If you'd like to build the SDK locally, we've replaced scons with some Node.JS scripts. Typical usage would be:

	npm install
	cd build
	node scons.js build --android-ndk /opt/android-ndk --android-sdk /opt/android-sdk
	node scons.js package
	node scons.js install

The build and package commands will default to all target platforms on your host OS unless explicitly specified. (i.e. Android, iOS, and Mobileweb on OS X; Windows, Android and MobileWeb on Windows)

The build command will look for Android NDK and SDK using $ANDROID_NDK and $ANDROID_SDK env variables if not explicitly passed using command line arguments.

You can use the `-h` flag to display the full list of comands and options.

	npm install
	cd build
	node scons.js build [platform1] [platform2] --android-ndk /opt/android-ndk --android-sdk /opt/android-sdk /Users/build/android-sdk-macosx
	node scons.js package [platform1] [platform2]
	node scons.js install


Legal Stuff
-----------

Appcelerator is a registered trademark of Appcelerator, Inc. Titanium is
a registered trademark of Appcelerator, Inc.  Please see the LEGAL information about using our trademarks,
privacy policy, terms of usage and other legal information at [http://www.appcelerator.com/legal](http://www.appcelerator.com/legal).
