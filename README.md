<p align="center"><a href="https://appcelerator.com" target="_blank"><img width="120" src=".github/logo-titanium.png"></a></p>

<h1 align="center">Titanium <a href="https://jenkins.appcelerator.org/job/titanium-sdk/job/titanium_mobile/job/master/" target="_blank"><img src="https://jenkins.appcelerator.org/buildStatus/icon?job=titanium-sdk/titanium_mobile/master" /></a></h1>

Welcome to the Titanium open source project. Titanium provides a mature platform for developers to build
completely native cross-platform mobile applications using JavaScript.

Currently supported native platforms are iOS and Android.

Titanium is licensed under the OSI approved Apache Public License (version 2). Please
see the [LICENSE](LICENSE) file for specific details.

*[Download Pre-built Titanium](http://builds.appcelerator.com/#master)*

# Table of Contents

- [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Hyperloop](#hyperloop)
    - [Features](#features-1)
      - [Cross-Platform Reuse](#cross-platform-reuse)
      - [Direct API Access](#direct-api-access)
      - [JavaScript Everywhere](#javascript-everywhere)
      - [3rd-Party Libraries](#3rd-party-libraries)
      - [Custom Animations](#custom-animations)
      - [Run Native](#run-native)
    - [Example](#example)
    - [Getting Started](#getting-started)
  - [Alloy](#alloy)
    - [Example](#example-1)
  - [Getting Help](#getting-help)
    - [Official Documentation, Tutorials and Videos](#official-documentation-tutorials-and-videos)
    - [Developer Community](#developer-community)
    - [Video Tutorials](#video-tutorials)
    - [Slack](#slack)
    - [Twitter](#twitter)
    - [Blog](#blog)
    - [Commercial Support, Licensing](#commercial-support-licensing)
  - [Contributing](#contributing)
  - [Building Locally](#building-locally)
    - [Unit tests](#unit-tests)
      - [How it works](#how-it-works)
      - [How to modify the tests locally and in your PRs](#how-to-modify-the-tests-locally-and-in-your-prs)
  - [Legal Stuff](#legal-stuff)

## Features

With Titanium, you use JavaScript to code your application. Titanium's compiler will compile
your application code into an efficient native executable for each target mobile platform.

- [x] Native apps built using JavaScript (no hybrid, no embedded WebView)
- [x] Apps are compiled and run locally with full offline support
- [x] Support for native platform UI controls (TabGroup (iOS), ActionBar (Android), AppBar (Windows), ...)
- [x] Support for watchOS targets
- [x] Support for in-application SQL database
- [x] Support for Geolocation (compass, geolocation, forward/reverse lookup)
- [x] Support for Camera (taking Photos, playing and recording Video)
- [x] Support for Calendar (creating & fetching Events)
- [x] Support for 3D-Touch (Peek and Pop, Application Shortcuts, ...)
- [x] Support for Photo Album (reading and writing)
- [x] Support for Contacts Database / Address Book
- [x] Support for Streaming Audio and Recording Audio, Audio Input Levels, Mic etc
- [x] Support for Vibration
- [x] Support for Social APIs such as Facebook, Twitter, etc.
- [x] Support for Yahoo YQL
- [x] Support for Web Services via REST, SOAP
- [x] Support for native Maps
- [x] Support for Push Notifications
- [x] Support for In-Application Email
- [x] Support for In-Application SMS, Telephone
- [x] Support for Filesystem (create, read, write, etc.)
- [x] Support for Gestures (such as Shake and Pinch)
- [x] Support for Platform and Device capabilities
- [x] Support for complex native views such as Coverflow, Image Views, Table Views, Grouped Views, Composites, etc.
- [x] Support for Web Views incorporating HTML5, CSS etc.
- [x] Completely extensible via Module API and Hyperloop for building your own controls or extending capabilities

And much, much more (see our [Documentation](http://docs.appcelerator.com/platform/latest/#!/api/Titanium) for more infos).

## Hyperloop

Use Hyperloop, our latest addition to the Appcelerator Platform, to extend your Titanium apps by native API's using
JavaScript. Prior to Hyperloop, you would use [native modules](http://docs.appcelerator.com/platform/latest/#!/guide/Titanium_Module_Concepts) to extend the Titanium API. With
Hyperloop, you are now able to implement native classes, 3rd-Party libraries (Cocoapods, local frameworks, .aar files)
and more directly into your apps. Hyperloop is available for iOS, Android and Windows Phone (Tech Preview).

### Features

#### Cross-Platform Reuse

Build and maintain apps in a fraction of the time with up to 95% code reuse.

#### Direct API Access

Access 100% of platform APIs directly, with instant support for each new OS release.

#### JavaScript Everywhere

Create mobile apps using the world’s most popular programming language.

#### 3rd-Party Libraries

Incorporate 3rd-party native libraries using JavaScript, with no changes required.

#### Custom Animations

Easily create complex custom effects like dynamic animations using JavaScript.

#### Run Native

Mobile app development for every major mobile OS – with no hybrid compromises.

### Example

Create a native view in iOS and Android:

```js
// iOS
var view = new UIView();

// Android
var view = new View(activity);
```

### Getting Started

Check out our [Hyperloop Sample App](https://github.com/appcelerator/hyperloop-examples) and [Hyperloop Programming Guide](http://docs.appcelerator.com/platform/latest/#!/guide/Hyperloop) to get started with Hyperloop today!

## Alloy

[Alloy](http://docs.appcelerator.com/platform/latest/#!/guide/Alloy_Getting_Started) is the MVC application framework built
on top of Titanium. It is optional. It rocks. Check it out if you're considering using Titanium.
It is also a separate [open source project](https://github.com/appcelerator/alloy) available under Apache Public License.

### Example

Manage your application scope by separating your code into different models, views, controllers and more:

**index.xml** (View)

```xml
<Alloy>
  <Window title="Titanium and Alloy">
    <Button onClick="handleClick" id="myButton">Click me!</Button>
  </Window>
</Alloy>
```

**index.js** (Controller)

```js
function handleClick() {
  alert('Hello from the Controller!');
}
```

**index.tss** (Style)

```js
Window: {
  backgroundColor: 'white'
}

"#myButton": {
  width: 200,
  height: 30,
  backgroundColor: 'green'
}
```

## Getting Help

There are a number of ways to get help with Titanium.

### Official Documentation, Tutorials and Videos

Please visit the official documentation site at [http://docs.appcelerator.com/](http://docs.appcelerator.com/) for the latest and historical documentation on Titanium, Alloy and the various products built by Appcelerator.

### Developer Community

[Appcelerator Developer](https://developer.axway.com/) is our developer community.

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

## Contributing

Titanium is an open source project.  Titanium wouldn't be where it is now without contributions by the community. Please consider forking Titanium to improve, enhance or fix issues. If you feel like the community will benefit from your fork, please open a pull request.

To protect the interests of the Titanium contributors, Appcelerator, customers and end users we require contributors to sign a Contributors License Agreement (CLA) before we pull the changes into the main repository. Our CLA is simple and straightforward - it requires that the contributions you make to any Appcelerator open source project are properly licensed and that you have the legal authority to make those changes. This helps us significantly reduce future legal risk for everyone involved. It is easy, helps everyone, takes only a few minutes, and only needs to be completed once.

[You can digitally sign the CLA](http://cla.appcelerator.com) online. Please indicate your email address in your first pull request so that we can make sure that will locate your CLA.  Once you've submitted it, you no longer need to send one for subsequent submissions.

## Building Locally

Previously Titanium used scons and python scripts to build the SDK.
If you'd like to build the SDK locally, we've replaced scons with some Node.JS scripts. Typical usage would be:

```bash
npm ci
npm run cleanbuild
```

The build and package commands will default to all target platforms on your host OS unless explicitly specified. (i.e. Android, iOS on macOS; Windows and Android on Windows). It will compile, package and install the locally-built SDK for you
as well, so you can test it in your own applications without any further procedures.

The build command will look for the Android SDK directory path via the $ANDROID_SDK env variables if not explicitly passed using command line arguments.

You can use the `-h` flag to display the full list of comands and options.

```bash
npm ci
npm run cleanbuild -- [platform1] [platform2] --android-sdk /opt/android-sdk /Users/build/android-sdk-macosx
```

### Unit tests

We have a [unit test suite](tests/) intended to run across all supported platforms.

We have npm scripts set up to run a full clean, build, package, symlinked install, `ti sdk select` the built sdk, and then run the unit test suite:

```bash
npm run test:android
npm run test:iphone
npm run test:ipad
```

#### How it works

The test suite generates a single Titanium project targeting the specified platform(s), builds the project for emulator, launches the app on the emulator and then runs a series of tests defined via ti-mocha and should.js.

The tests spit out their results to the console log, and the test scripts listen to the logs to gather the results. We then generate an overview on the console as well as a junit report xml file (to be consume by CI build systems like Jenkins).

#### How to modify the tests locally and in your PRs

The `tests` folder contains the test suite. Any files living within that directory are copied on top of the test app's structure.

## Legal Stuff

Appcelerator is a registered trademark of Appcelerator, Inc. Titanium is
a registered trademark of Appcelerator, Inc.  Please see the LEGAL information about using our trademarks,
privacy policy, terms of usage and other legal information at [http://www.appcelerator.com/legal](http://www.appcelerator.com/legal).
