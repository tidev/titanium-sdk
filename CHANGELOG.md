# [9.3.0](https://github.com/appcelerator/titanium_mobile/compare/9_2_X...9.3.0) (2020-11-23)

## About this release

Titanium SDK 9.3.0 is a minor release of the SDK, addressing high-priority issues from previous releases.

As of this release, Titanium SDK 9.2.x will not receive updates more than six months after the release of 9.3.0 (2021-05-23). Any needed fixes will be in 9.3.x or later supported releases within the 9.x branch.
See [Axway Appcelerator Deprecation Policy](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_deprecation_policy.html) and [Nominal Lifetimes](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_product_lifecycle.html#AxwayAppceleratorProductLifecycle-NominalLifetimes) documents for details.

:warning: With the release of Titanium SDK 9.0.0, we no longer support Node.js 8.X. Node 10.13.0 is the new minimum supported version.

## Overview

Titanium SDK 9.3.0 is primarily focused on providing support for Android 11.

## Community Credits

* Sergey Volkov
  * [TIMOB-25556](https://jira.appcelerator.org/browse/TIMOB-25556) - add separate lock mode for left and right drawers ([e51c84b](https://github.com/appcelerator/titanium_mobile/commit/e51c84be4482b0daa3c12b0da1e9a8f85a0e4d06))

* Michael Gangolf
  * [TIDOC-3186](https://jira.appcelerator.org/browse/TIDOC-3186)adding drawerlayout alloy example ([7d5b1f5](https://github.com/appcelerator/titanium_mobile/commit/7d5b1f58a6fe443db2b79c46310828ed481ce17c))
  * [TIMOB-27779](https://jira.appcelerator.org/browse/TIMOB-27779) - fix TabbedBar Click loop ([1c5327d](https://github.com/appcelerator/titanium_mobile/commit/1c5327df7f719267a6e9d3f1c6935b90440fbda1))
  * [TIMOB-27859](https://jira.appcelerator.org/browse/TIMOB-27859) - add Ti.UI.Tab.badge and badgeColor ([a19c36e](https://github.com/appcelerator/titanium_mobile/commit/a19c36ec07740d7eb8e139458322335d7e1cb24b)) ([6ca467a](https://github.com/appcelerator/titanium_mobile/commit/6ca467a888012f4e1ec6f2d5b0fd24e562420258))
  * fix Ti.UI.Window.extendSafeArea default value text ([ec2f867](https://github.com/appcelerator/titanium_mobile/commit/ec2f8675e5ba23247a9d1e5c54954b0554b14fe6))

* Hans Knöchel
  * [TIMOB-28104](https://jira.appcelerator.org/browse/TIMOB-28104) - support new date picker styles ([78bce40](https://github.com/appcelerator/titanium_mobile/commit/78bce40cd4dd9b90a06929729122dd9e17272450))

## Features

### Android platform

* [TIMOB-28045](https://jira.appcelerator.org/browse/TIMOB-28045) - Android 11 Support
* [TIMOB-18069](https://jira.appcelerator.org/browse/TIMOB-18069) - make ListSection.getItemCount() and/or getContentCount() public
* [TIMOB-24983](https://jira.appcelerator.org/browse/TIMOB-24983) - Add "HTTPClient.responseHeaders" support (feature parity with iOS)
* [TIMOB-25556](https://jira.appcelerator.org/browse/TIMOB-25556) - Extend drawerLockMode to set Gravity
* [TIMOB-25854](https://jira.appcelerator.org/browse/TIMOB-25854) - Grant WebView permissions for Audio/Video WebRTC streams
* [TIMOB-25991](https://jira.appcelerator.org/browse/TIMOB-25991) - RefreshControl in ListView only works when dragging content
* [TIMOB-27077](https://jira.appcelerator.org/browse/TIMOB-27077) - Rewrite Ti.UI.TableView to use RecyclerView
* [TIMOB-27138](https://jira.appcelerator.org/browse/TIMOB-27138) - Add photo/video capture support to WebView
* [TIMOB-27201](https://jira.appcelerator.org/browse/TIMOB-27201) - Update "Ti.Filesystem.File" to support unimplemented APIs when wrapping a "content://" URL
* [TIMOB-27714](https://jira.appcelerator.org/browse/TIMOB-27714) - Add "Material Components" theme support ([eb46ca0](https://github.com/appcelerator/titanium_mobile/commit/eb46ca07aab67895f010ccae68b9927a685fd538))
* [TIMOB-27743](https://jira.appcelerator.org/browse/TIMOB-27743) - Remove hidden API usage from SDK
* [TIMOB-27787](https://jira.appcelerator.org/browse/TIMOB-27787) - Add C/C++ debugging to SDK test app builds
* [TIMOB-27838](https://jira.appcelerator.org/browse/TIMOB-27838) - Style default tableViewSection headerTitle using XML
* [TIMOB-27859](https://jira.appcelerator.org/browse/TIMOB-27859) - Add "badge" support to TabGroup
* [TIMOB-27873](https://jira.appcelerator.org/browse/TIMOB-27873) - Remove "nineoldandroids" library from SDK
* [TIMOB-27887](https://jira.appcelerator.org/browse/TIMOB-27887) - Support WebAssembly in V8
* [TIMOB-27934](https://jira.appcelerator.org/browse/TIMOB-27934) - Update "ti.playservices" module to use 17.5.0
* [TIMOB-27948](https://jira.appcelerator.org/browse/TIMOB-27948) - Use of wrong string operator in string comparison in TiJSService
* [TIMOB-27970](https://jira.appcelerator.org/browse/TIMOB-27970) - Update V8 runtime to 8.4
* [TIMOB-28046](https://jira.appcelerator.org/browse/TIMOB-28046) - Compile with SDK version 30 (Android 11)
* [TIMOB-28047](https://jira.appcelerator.org/browse/TIMOB-28047) - Target API Level 30 (Android 11) by default ([4490c3e](https://github.com/appcelerator/titanium_mobile/commit/4490c3ea8554ad50c60d410208d401723525d771))
* [TIMOB-28049](https://jira.appcelerator.org/browse/TIMOB-28049) - Investigate "ACCESS_BACKGROUND_LOCATION" handling on Android 11
* [TIMOB-28050](https://jira.appcelerator.org/browse/TIMOB-28050) - Investigate "package visibility" handling on Android 11
* [TIMOB-28051](https://jira.appcelerator.org/browse/TIMOB-28051) - Add foreground service type constants for "camera" and "microphone" ([8fcbd4a](https://github.com/appcelerator/titanium_mobile/commit/8fcbd4a2fee97fb3c53a9f7a65f59ecf08311d68)) ([0e98584](https://github.com/appcelerator/titanium_mobile/commit/0e985849e0578ca48c3e2c67f3bb5cae179f1391))
* [TIMOB-28057](https://jira.appcelerator.org/browse/TIMOB-28057) - Modify WebView to use scoped storage for `<input/>` file selection
* [TIMOB-28058](https://jira.appcelerator.org/browse/TIMOB-28058) - Change Ti.Filesystem "temp" APIs to use app's cache folder
* [TIMOB-28059](https://jira.appcelerator.org/browse/TIMOB-28059) - Modify Ti.Media APIs to use scoped storage
* [TIMOB-28080](https://jira.appcelerator.org/browse/TIMOB-28080) - Add "tapjacking" prevention features ([34cbeea](https://github.com/appcelerator/titanium_mobile/commit/34cbeeae1b33de1aa056e92f98952786332a2c30)) ([413da3e](https://github.com/appcelerator/titanium_mobile/commit/413da3e821c5a4ed4f47acec439f6543331c2d9b))
* [TIMOB-28084](https://jira.appcelerator.org/browse/TIMOB-28084) - use material theme by default ([00e2816](https://github.com/appcelerator/titanium_mobile/commit/00e28160218593d5591971b97f1d202ed97d5111))
* [TIMOB-28087](https://jira.appcelerator.org/browse/TIMOB-28087) - Add "NoTitleBar" and "Fullscreen" themes which derive from custom app theme ([00e2816](https://github.com/appcelerator/titanium_mobile/commit/00e28160218593d5591971b97f1d202ed97d5111))
* [TIMOB-28088](https://jira.appcelerator.org/browse/TIMOB-28088) - Rewrite Ti.UI.ListView to use RecyclerView
* [TIMOB-28102](https://jira.appcelerator.org/browse/TIMOB-28102) - Update module Kotlin language support to 1.4.x ([5dc0872](https://github.com/appcelerator/titanium_mobile/commit/5dc08725eb313419b5749fea7789731ab534483f))
* [TIMOB-28140](https://jira.appcelerator.org/browse/TIMOB-28140) - WebView should request location permission when HTML uses geolocation API
* [TIMOB-28146](https://jira.appcelerator.org/browse/TIMOB-28146) - Ti.Filesystem.File rename() should support an absolute path in same directory
* [TIMOB-28173](https://jira.appcelerator.org/browse/TIMOB-28173) - Update gradle to 6.7
* [TIMOB-28182](https://jira.appcelerator.org/browse/TIMOB-28182) - Only add WRITE_EXTERNAL_STORAGE permission when needed
* [TIMOB-28183](https://jira.appcelerator.org/browse/TIMOB-28183) - Add Ti.Media.requestPhotoGalleryPermissions() support
* [TIMOB-28214](https://jira.appcelerator.org/browse/TIMOB-28214) - Remove dead "TiAuthenticator" Java code to avoid security warnings
* [TIMOB-28223](https://jira.appcelerator.org/browse/TIMOB-28223) - Use vector graphics for list/table icons
* [TIMOB-28230](https://jira.appcelerator.org/browse/TIMOB-28230) - Add Ti.Filesystem.externalCacheDirectory support
* [TIMOB-28231](https://jira.appcelerator.org/browse/TIMOB-28231) - Change Ti.Filesystem.externalStorageDirectory to use scoped storage
* [MOD-2588](https://jira.appcelerator.org/browse/MOD-2588) - add passcode fallback to ti.identity ([7e7934d](https://github.com/appcelerator/titanium_mobile/commit/7e7934d1c61d9099c02146519048b30046d68d25))

### iOS platform

* [TIMOB-27984](https://jira.appcelerator.org/browse/TIMOB-27984) - allow multiple photo selection ([8b53023](https://github.com/appcelerator/titanium_mobile/commit/8b530233dd21eadb162f35416a98c7ea6ea6df39))
* [TIMOB-28195](https://jira.appcelerator.org/browse/TIMOB-28195) - Add node-ios-device v1 support for Node 14
* add iphone 12 models to Node.js `os` shim ([69bf699](https://github.com/appcelerator/titanium_mobile/commit/69bf69928235551fd055b2fe44a099f2787147f1))
* add new constants for `Ti.Media.VIDEO_MEDIA_TYPE_` ([d85d6f8](https://github.com/appcelerator/titanium_mobile/commit/d85d6f82f4d38ec51011381bdd93a5ccfd35dcbb))

### Multiple platforms

* add `"build.post.install"` build hook ([372bf70](https://github.com/appcelerator/titanium_mobile/commit/372bf7040aabfcd497c4038fa9e7af5f0959e45f)) ([7186384](https://github.com/appcelerator/titanium_mobile/commit/7186384f49eea480b72fdafe1682ef4e28dd3bf2))
* emit `'create.module.app.finalize'` build hook during module build before launching test app ([8778f3f](https://github.com/appcelerator/titanium_mobile/commit/8778f3f033198e305c7325960a3e86a0a5ca18f0)) ([403d7e2](https://github.com/appcelerator/titanium_mobile/commit/403d7e2ab1f967f21c9d06206264f45c5d66ad33))

## Bug Fixes

### Android platform

* [TIMOB-15015](https://jira.appcelerator.org/browse/TIMOB-15015) - TableView.headerView cannot be set after setting data
* [TIMOB-16498](https://jira.appcelerator.org/browse/TIMOB-16498) - Undesired tableView separatorColor is appearing in footerView
* [TIMOB-24874](https://jira.appcelerator.org/browse/TIMOB-24874) - Selected row does not stay highlighted when using a TableView.
* [TIMOB-25333](https://jira.appcelerator.org/browse/TIMOB-25333) - SearchBar height should default to Ti.UI.SIZE like iOS instead of FILL
* [TIMOB-26602](https://jira.appcelerator.org/browse/TIMOB-26602) - Ti.Media.takePicture() will wrongly assign mp4 extension to image file if camera is configured for MEDIA_TYPE_VIDEO
* [TIMOB-26887](https://jira.appcelerator.org/browse/TIMOB-26887) - TableView "headerTitle" and "footerTitle" cannot be changed after creation
* [TIMOB-27481](https://jira.appcelerator.org/browse/TIMOB-27481) - Navigating back from camera overlay can wrongly close the app
* [TIMOB-27796](https://jira.appcelerator.org/browse/TIMOB-27796) - TableViewSection does not scroll after a certain point
* [TIMOB-27948](https://jira.appcelerator.org/browse/TIMOB-27948) - string reference equality in service ([5ba35d3](https://github.com/appcelerator/titanium_mobile/commit/5ba35d344c887191dc0c3f1b2247dc05dae78643))
* [TIMOB-28027](https://jira.appcelerator.org/browse/TIMOB-28027) - Build fails as duplicate string with "app_name" in i18n strings.xml file ([98ff0e7](https://github.com/appcelerator/titanium_mobile/commit/98ff0e7251cf86b9f67584c141fd0ae5fb8ce93e)) ([d8d442e](https://github.com/appcelerator/titanium_mobile/commit/d8d442ecf09c08010a29a0c79b872b6894343bf3))
* [TIMOB-28048](https://jira.appcelerator.org/browse/TIMOB-28048) - RefreshControl in TableView only works when dragging content
* [TIMOB-28079](https://jira.appcelerator.org/browse/TIMOB-28079) - ACA module no longer loaded first on startup as of 8.1.0
* [TIMOB-28081](https://jira.appcelerator.org/browse/TIMOB-28081) - App build fails if it includes an Apache "commons-logging" library
* [TIMOB-28084](https://jira.appcelerator.org/browse/TIMOB-28084) - Modal/Translucent window ignores `<navbar-hidden/>` setting in "tiapp.xml"
* [TIMOB-28105](https://jira.appcelerator.org/browse/TIMOB-28105) - AudioRecorder "recording" and "stopped" properties return the wrong state values ([340bc36](https://github.com/appcelerator/titanium_mobile/commit/340bc3620a00987cdbd3ad1b3ead9a12c0a2f024)) ([8e8d160](https://github.com/appcelerator/titanium_mobile/commit/8e8d160be4dfc3a35774b227052afd6614a223d1))
* [TIMOB-28149](https://jira.appcelerator.org/browse/TIMOB-28149) - App builds fail if it includes "Java-WebSocket" library
* [TIMOB-28161](https://jira.appcelerator.org/browse/TIMOB-28161) - Modules built with 9.1.0 and using deprecated getter/setter property methods will crash on 9.0.x apps ([6e025c5](https://github.com/appcelerator/titanium_mobile/commit/6e025c52f39fd33f07c85ca5a4d35da113ec6bc5))
* [TIMOB-28162](https://jira.appcelerator.org/browse/TIMOB-28162) - TableViewRow does not scale to height of parent
* [TIMOB-28163](https://jira.appcelerator.org/browse/TIMOB-28163) - TableViewRow ignores borderRadius
* [TIMOB-28164](https://jira.appcelerator.org/browse/TIMOB-28164) - TableViewRow displays incorrect background upon press
* [TIMOB-28165](https://jira.appcelerator.org/browse/TIMOB-28165) - TableViewRow does not activate ripple effect from child views
* [TIMOB-28166](https://jira.appcelerator.org/browse/TIMOB-28166) - TableViewRow does not apply opacity to child views
* [TIMOB-28167](https://jira.appcelerator.org/browse/TIMOB-28167) - ListViewItem does not activate ripple effect from child views
* [TIMOB-28176](https://jira.appcelerator.org/browse/TIMOB-28176) - createTempDirectory() does not create a directory
* [TIMOB-28177](https://jira.appcelerator.org/browse/TIMOB-28177) - createTempFile() should create file under Ti.Filesystem.tempDirectory
* [TIMOB-28178](https://jira.appcelerator.org/browse/TIMOB-28178) - Canceling out of Ti.Media.openPhotoGallery() causes a crash as of 9.1.0 ([0e284e5](https://github.com/appcelerator/titanium_mobile/commit/0e284e58b92179f1d17799418b1e7ab5bd4edd8c))
* [TIMOB-28189](https://jira.appcelerator.org/browse/TIMOB-28189) - Opening TabGroup crashes when using AppCompat theme as of 9.3.0 ([6403da2](https://github.com/appcelerator/titanium_mobile/commit/6403da2453bceed654e7bb5a8c9cb43af51427ae))
* [TIMOB-28193](https://jira.appcelerator.org/browse/TIMOB-28193) - Selecting multiple photos/videos via openPhotoGallery() can cause a crash as of 9.1.0 ([0b1116f](https://github.com/appcelerator/titanium_mobile/commit/0b1116f6eeed4be5c1ac205a53f9288fc8e948aa))
* [TIMOB-28212](https://jira.appcelerator.org/browse/TIMOB-28212) - Listview modifies other rows on scroll
* [TIMOB-28220](https://jira.appcelerator.org/browse/TIMOB-28220) - tintColor/activeTintColor or titleColor/activeTitleColor not respected for tabgroup with style TABS_STYLE_BOTTOM_NAVIGATION ([f640850](https://github.com/appcelerator/titanium_mobile/commit/f6408505023dd85a4b13857130e0ef31289cc870))
* [TIMOB-28222](https://jira.appcelerator.org/browse/TIMOB-28222) - Ti.Android.R.transition doesn't exist ([2773c51](https://github.com/appcelerator/titanium_mobile/commit/2773c51368786bb0b9698ece1e3ea0d3b4fe4a45))
* [TIMOB-28240](https://jira.appcelerator.org/browse/TIMOB-28240) - TableViewRow unable to change colour of row after a set time (Regression)
* [TIMOB-28246](https://jira.appcelerator.org/browse/TIMOB-28246) - Ti.Media.previewImage() fails to display in-memory blobs as of 9.1.0 ([984f811](https://github.com/appcelerator/titanium_mobile/commit/984f8118d6f39b68c2bdb576871291a0cbb680db))
* add accessor for Ti.Media.fullscreen property, default initialPlaybackTime to 0 ([204827d](https://github.com/appcelerator/titanium_mobile/commit/204827d863ee3c8f5b546f8e996ee59870127810))
* allow overriding of toString() ([f20ed51](https://github.com/appcelerator/titanium_mobile/commit/f20ed5123c9da72a581ad4ed5d9f67d99d79747b))
* amend chevron vector icon color and size ([8fde5bb](https://github.com/appcelerator/titanium_mobile/commit/8fde5bb6cf0851803c42a9bfabde019ee1f4ee7f))
* amend icon color and size ([8e63037](https://github.com/appcelerator/titanium_mobile/commit/8e63037a16e39d0164f20ba910cf1a930ab362a6))
* amend size of more icon ([ae23408](https://github.com/appcelerator/titanium_mobile/commit/ae234083e4005076b6b04e813edbe568ca28cbbd))
* amend Ti.UI.Shortcut implementation ([975af13](https://github.com/appcelerator/titanium_mobile/commit/975af137337ef6dbc6ef324ec548b7efdc04e156))
* debug snapshot generation ([dcfd0c7](https://github.com/appcelerator/titanium_mobile/commit/dcfd0c70bc1eef5061946ec44754f8a6c32c0857))
* default to newer scalingMode constant default value ([c151ff0](https://github.com/appcelerator/titanium_mobile/commit/c151ff0ab801d70ff5fe8a7e75145f883cc9ebc0))
* draw outer border path correctly ([e8c6d54](https://github.com/appcelerator/titanium_mobile/commit/e8c6d549dfb9cb78c11bed55039930d0b9a094fe))
* formatting ([db0cd77](https://github.com/appcelerator/titanium_mobile/commit/db0cd77859de5f31ad433b3ea0248c34959e51e0))
* formatToParts() on Android 4.4 ([2a2f0dc](https://github.com/appcelerator/titanium_mobile/commit/2a2f0dc23da360e2edbdd37f179b62bff2a256cf))
* match static value for Ti.Media.MEDIA_TYPE_VIDEO to iOS ([b0f6527](https://github.com/appcelerator/titanium_mobile/commit/b0f65279fcbd6980d4545ec2fcac2544b18b44c1))
* null out Ti.UI.Window's navigationWindow property before close event ([bdce8ae](https://github.com/appcelerator/titanium_mobile/commit/bdce8ae291151d2f01279ca29a6c95576015e546))
* remove Ti.Media.VideoPlayer.contentURL property ([5bf7826](https://github.com/appcelerator/titanium_mobile/commit/5bf7826b37c22425d924a047e6c360b0bafd7856))
* remove unnecessary v8 refs ([4122858](https://github.com/appcelerator/titanium_mobile/commit/4122858166119d724457e9fcc4a9c28ef872f38c))
* return empty array rather than null for Ti.Media.availableCameras if no cameras ([48006b6](https://github.com/appcelerator/titanium_mobile/commit/48006b69b6030f84204cb72848402f31428f9966))
* snapshot template ([3eab6b7](https://github.com/appcelerator/titanium_mobile/commit/3eab6b7241965317dca69912fefae585cde80a46))
* start zip read, close zipfile when done ([bdf7d36](https://github.com/appcelerator/titanium_mobile/commit/bdf7d365edc39d9d273570996494ddbc3f9a442e))
* update more icon into down chevron ([569dc77](https://github.com/appcelerator/titanium_mobile/commit/569dc77128df5e1b967bbe2236a1e14c09024eca))
* use manifest shortcuts for staticItems ([79102ee](https://github.com/appcelerator/titanium_mobile/commit/79102ee7ba7de0385c953f1719aee70687625dee))
* window toString() ([d1fd590](https://github.com/appcelerator/titanium_mobile/commit/d1fd59090c5e246a8e86bc588baa968b2938a7b2))

### Multiple platforms

* [TIMOB-28200](https://jira.appcelerator.org/browse/TIMOB-28200) - Angular: Project created from template fails build with type errors
* set prompt on project dir option ([f5a4391](https://github.com/appcelerator/titanium_mobile/commit/f5a43911f547dc9500e064b8b38eae26679a4b90))
* return back userInfo.gid not guid ([a70bbe3](https://github.com/appcelerator/titanium_mobile/commit/a70bbe3367b96e5a451f5be318bffb13ece26ab0))

### iOS platform

* [TIMOB-13903](https://jira.appcelerator.org/browse/TIMOB-13903) - Reading TableView's "sectionCount" property crashes app ([149eb4a](https://github.com/appcelerator/titanium_mobile/commit/149eb4a2bad451630651c46dc60504652394b8a3))
* [TIMOB-27935](https://jira.appcelerator.org/browse/TIMOB-27935) - TableViewRow does not return getRect methods
* [TIMOB-28111](https://jira.appcelerator.org/browse/TIMOB-28111) - TabGroup focus event firing unexpectedly ([5fa704d](https://github.com/appcelerator/titanium_mobile/commit/5fa704dfd656609a2698cb5035d12b9b4c20504b))
* [TIMOB-28148](https://jira.appcelerator.org/browse/TIMOB-28148) - app crashes when updating tableview
* [TIMOB-28160](https://jira.appcelerator.org/browse/TIMOB-28160) - "unrecognized selector sent to instance" logged for errors from native side
* [TIMOB-28207](https://jira.appcelerator.org/browse/TIMOB-28207) - Packaging fails when Xcode path contains a space
* [TIMOB-28211](https://jira.appcelerator.org/browse/TIMOB-28211)  - The color property of Ti.UI.Button does not work when used in navbar ([66e8d37](https://github.com/appcelerator/titanium_mobile/commit/66e8d3768a97a963c03c529f62bc05da90aa706a))
* [TIMOB-28218](https://jira.appcelerator.org/browse/TIMOB-28218) - Ti.UI.Clipboard example usage crashes on macOS
* [TIMOB-28219](https://jira.appcelerator.org/browse/TIMOB-28219) - Ti.UI.Clipboard#remove() doesn't exist, but is documented
* [TIMOB-28221](https://jira.appcelerator.org/browse/TIMOB-28221) - Default value of property Ti.Media.VideoPlayer.pictureInPictureEnabled should be true ([ba7e5aa](https://github.com/appcelerator/titanium_mobile/commit/ba7e5aab70925e9b1ad8cb197e0c1c39056081c2))
* [TIMOB-28227](https://jira.appcelerator.org/browse/TIMOB-28227) - Ti.UI.dateTimeColor is crashing on mac
* fix Ti.Filesystem.getAsset and getFile on devices ([3b2865d](https://github.com/appcelerator/titanium_mobile/commit/3b2865daf131eaabdfeaac2c5b6b6772e514e3dc))
* fix typo on Ti.Media.MUSIC_PLAYER_STATE_SEEK_FORWARD ([de780ec](https://github.com/appcelerator/titanium_mobile/commit/de780ec99b714056b2e5ebae782f428111d2b766))
* gaurd code for MediaModule on xcode 11 to avoid compile issues ([4144c96](https://github.com/appcelerator/titanium_mobile/commit/4144c96ea19145e2e1fbb23687bfcad3b875f11d))
* get rid of removed constants/properties ([8a9a05e](https://github.com/appcelerator/titanium_mobile/commit/8a9a05eba7b158248bc69a1fd5388e05a89481a6))
* handle adding Ti.UI.Shortcut when existing array is nil ([f967cf9](https://github.com/appcelerator/titanium_mobile/commit/f967cf90c6cf2dea959dc2980a59e5359103418b))
* modify BOOL to bool for return types to fix JS representation ([43042cc](https://github.com/appcelerator/titanium_mobile/commit/43042cce456c3491e526da2ab2e005acb8339cf3))
* set Ti.Codec.CHARSET_ISO_LATIN_1 to 'latin1' ([4123b9b](https://github.com/appcelerator/titanium_mobile/commit/4123b9ba88425d647cf29e31708a048409074162))
* shortcut guard in Ti.UI module ([7f44d8d](https://github.com/appcelerator/titanium_mobile/commit/7f44d8d02fbcb6be8ecfff52debd0e9af7830dad))

## SDK Module Versions

| Module      | Android version | iOS Version |
| ----------- | --------------- | ----------- |
| facebook | 10.0.0 | 9.0.0 |
| ti.cloudpush | 7.1.0 | n/a |
| ti.map | 5.0.1 | 4.0.1 |
| ti.webdialog | 2.0.0 | 2.0.0 |
| ti.playservices | 17.5.0 | n/a |
| ti.identity | 3.0.2 | 2.0.0 |
| urlSession | n/a | 3.0.0 |
| ti.coremotion | n/a | 3.0.0 |
| ti.applesignin | n/a | 2.0.0 |
| ti.cloud | 3.2.11 | 3.2.11 |
| hyperloop | 6.0.2 | 6.0.2 |

## [9.2.2](https://github.com/appcelerator/titanium_mobile/compare/9_2_1_GA...9.2.2) (2020-10-29)

## About this release

Titanium SDK 9.2.2 is a patch release of the SDK, addressing high-priority issues from previous releases.

As of this GA release, the previous Titanium SDK patch release (9.2.1) is no longer supported. End of support for this version will be 2021-04-29 or until the next patch release. Note: major and minor releases continue to be supported according to their nominal lifetime.
See [Axway Appcelerator Deprecation Policy](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_deprecation_policy.html) and [Nominal Lifetimes](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_product_lifecycle.html#AxwayAppceleratorProductLifecycle-NominalLifetimes) documents for details.

:warning: With the release of Titanium SDK 9.0.0, we no longer support Node.js 8.X. Node 10.13.0 is the new minimum supported version.

## Community Credits

* Hans Knöchel
  * [TIMOB-28181](https://jira.appcelerator.org/browse/TIMOB-28181) - fix 'dateTimeColor' for iOS 14+ ([88005a3](https://github.com/appcelerator/titanium_mobile/commit/88005a3ae86b2f1904b528eaa3e16eb7e4fdaa3c))
  * [TIMOB-28203](https://jira.appcelerator.org/browse/TIMOB-28203) - Remove deprecated frameworks (AddressBook, AddressBookUI, OpenGLES)

## Bug Fixes

### Multiple platforms

* [TIMOB-28210](https://jira.appcelerator.org/browse/TIMOB-28210) - silence aca load failure ([f9e00fd](https://github.com/appcelerator/titanium_mobile/commit/f9e00fdfb58779adafaf2a3042029010ab9f39ff))
* [TIMOB-28200](https://jira.appcelerator.org/browse/TIMOB-28200) - declare missing nodejs namespace for zone.js ([35f59c4](https://github.com/appcelerator/titanium_mobile/commit/35f59c433108c201a4a633d34d25af45a1fd4248))
* [TIMOB-28079](https://jira.appcelerator.org/browse/TIMOB-28079) - always load aca module first on startup ([f911623](https://github.com/appcelerator/titanium_mobile/commit/f911623670c39028c039891c1217be1a675319a7))
* [TIMOB-28185](https://jira.appcelerator.org/browse/TIMOB-28185) - generate missing macOS asset catalog icons ([b242902](https://github.com/appcelerator/titanium_mobile/commit/b242902a9009f77a1ec227bd5c609a945ef6cc00))
* [TIMOB-28200](https://jira.appcelerator.org/browse/TIMOB-28200) - update dependencies of angular template ([701bcec](https://github.com/appcelerator/titanium_mobile/commit/701bcec93f73a1de843ae4518659e2b30cdef933))
* [TIMOB-28174](https://jira.appcelerator.org/browse/TIMOB-28174) - Analytics: Exception can occur when constructing payload

### Android platform

* [TIMOB-28193](https://jira.appcelerator.org/browse/TIMOB-28193) - openPhotoGallery() crash selecting multiple files ([29b4116](https://github.com/appcelerator/titanium_mobile/commit/29b41167184ce7a7f9b6bfc102e203a9d0cf000b))

### iOS platform

* [TIMOB-28202](https://jira.appcelerator.org/browse/TIMOB-28202) - fix MediaModule compile error ([b8d2cd1](https://github.com/appcelerator/titanium_mobile/commit/b8d2cd1d414abb27f0a29c913e476f7d2f028029))
* [TIMOB-28207](https://jira.appcelerator.org/browse/TIMOB-28207) - handle spaces in xcode path ([f8c8172](https://github.com/appcelerator/titanium_mobile/commit/f8c8172f372948aed3397bc1d7ca31b5cf0b49e0))
* make Ti.UI.PickerColumn.rowCount NSNumber*, not NSInteger ([026fe12](https://github.com/appcelerator/titanium_mobile/commit/026fe120fb6829059fadbb6447964cfb81af76f1))
* make Ti.UI.TableViewSection.rowCount NSNumber*, not NSInteger ([c25a9dd](https://github.com/appcelerator/titanium_mobile/commit/c25a9dd951dbf277dfeb73889e1300edbcc7cd05))
* [TIMOB-13903](https://jira.appcelerator.org/browse/TIMOB-13903) - tableview "sectionCount" property crash ([3b0d8a4](https://github.com/appcelerator/titanium_mobile/commit/3b0d8a4f27bbfe01cfc042e14e83781f30f92c35))

## SDK Module Versions

| Module      | Android version | iOS Version |
| ----------- | --------------- | ----------- |
| facebook | 10.0.0 | 9.0.0 |
| ti.cloudpush | 7.1.0 | n/a |
| ti.map | 5.0.1 | 4.0.1 |
| ti.webdialog | 2.0.0 | 2.0.0 |
| ti.playservices | 17.1.1 | n/a |
| ti.identity | 3.0.2 | 2.0.0 |
| urlSession | n/a | 3.0.0 |
| ti.coremotion | n/a | 3.0.0 |
| ti.applesignin | n/a | 2.0.0 |
| ti.cloud | 3.2.11 | 3.2.11 |
| hyperloop | 6.0.2 | 6.0.2 |

## [9.2.1](https://github.com/appcelerator/titanium_mobile/compare/9_2_0_GA...9.2.1) (2020-10-05)

## About this release

Titanium SDK 9.2.1 is a patch release of the SDK, addressing high-priority issues from previous releases.

As of this GA release, the previous Titanium SDK patch release (9.2.0) is no longer supported. End of support for this version will be 2021-04-05 or until the next patch release. Note: major and minor releases continue to be supported according to their nominal lifetime.
See [Axway Appcelerator Deprecation Policy](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_deprecation_policy.html) and [Nominal Lifetimes](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_product_lifecycle.html#AxwayAppceleratorProductLifecycle-NominalLifetimes) documents for details.

:warning: With the release of Titanium SDK 9.0.0, we no longer support Node.js 8.X. Node 10.13.0 is the new minimum supported version.

## Bug Fixes

### iOS platform

* [TIMOB-28127](https://jira.appcelerator.org/browse/TIMOB-28127) - TiUIListItemProxy overreleased causing intermittent crashing w/ macOS ([6d22e29](https://github.com/appcelerator/titanium_mobile/commit/6d22e297bb686afa974c0701c578265557acc2e0))
* [TIMOB-28156](https://jira.appcelerator.org/browse/TIMOB-28156) - Module build failing for modules not having platform directory ([c4d90fe](https://github.com/appcelerator/titanium_mobile/commit/c4d90fe0e1cc65f7481c5e715182f0f73f28048f))
* [TIMOB-28150](https://jira.appcelerator.org/browse/TIMOB-28150) - Updating backgroundImage displays irrelavant image inbetween change ([de88803](https://github.com/appcelerator/titanium_mobile/commit/de88803637c7956aba8160fff7e6e1489830bf1b))
* [TIMOB-28152](https://jira.appcelerator.org/browse/TIMOB-28152) - Compile error when SDK forces a rebuild ([9b516e4](https://github.com/appcelerator/titanium_mobile/commit/9b516e4e0163f89187b3ab1ddd2b0f750fad0893))
* [TIMOB-27812](https://jira.appcelerator.org/browse/TIMOB-27812) - format js errors in cli output ([bc32947](https://github.com/appcelerator/titanium_mobile/commit/bc32947554f94acd51561e0bba4585c5a74c56b5))
* [TIMOB-28151](https://jira.appcelerator.org/browse/TIMOB-28151) - Compile error if using Ti.Media APIs without openPhotoGallery ([c5d6d8d](https://github.com/appcelerator/titanium_mobile/commit/c5d6d8d2083db0cc18d03a7c67158101bafcae35))
* [TIMOB-28158](https://jira.appcelerator.org/browse/TIMOB-28158) - Duplicate framework search paths ([35e4058](https://github.com/appcelerator/titanium_mobile/commit/35e4058784e5ad6c104cf6ea2b16f3887e8f58b9))
* [TIMOB-28148](https://jira.appcelerator.org/browse/TIMOB-28148) - app crashes when updating tableview ([23c01db](https://github.com/appcelerator/titanium_mobile/commit/23c01db715a486898f401f68c2aa032550528176))
* [TIMOB-28154](https://jira.appcelerator.org/browse/TIMOB-28154) - Build failing on 9.2.0 with Hyperloop
* [TIMOB-28159](https://jira.appcelerator.org/browse/TIMOB-28159) - Building Swift module created with sdk < 9.2.0.GA fails
* [TIMOB-27812](https://jira.appcelerator.org/browse/TIMOB-27812) - Improve display of uncaught errors

## SDK Module Versions

| Module      | Android version | iOS Version |
| ----------- | --------------- | ----------- |
| facebook | 10.0.0 | 9.0.0 |
| ti.cloudpush | 7.1.0 | n/a |
| ti.map | 5.0.1 | 4.0.1 |
| ti.webdialog | 2.0.0 | 2.0.0 |
| ti.playservices | 17.1.1 | n/a |
| ti.identity | 3.0.2 | 2.0.0 |
| urlSession | n/a | 3.0.0 |
| ti.coremotion | n/a | 3.0.0 |
| ti.applesignin | n/a | 2.0.0 |
| ti.cloud | 3.2.11 | 3.2.11 |
| hyperloop | 6.0.1 | 6.0.1 |

# [9.2.0](https://github.com/appcelerator/titanium_mobile/compare/9_1_X...9.2.0) (2020-09-15)

## About this release

Titanium SDK 9.2.0 is a minor release of the SDK, addressing high-priority issues from previous releases.

As of this release, Titanium SDK 9.1.x will not receive updates more than six months after the release of 9.2.0 (2021-03-15). Any needed fixes will be in 9.2.x or later supported releases within the 9.x branch.
See [Axway Appcelerator Deprecation Policy](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_deprecation_policy.html) and [Nominal Lifetimes](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_product_lifecycle.html#AxwayAppceleratorProductLifecycle-NominalLifetimes) documents for details.

:warning: With the release of Titanium SDK 9.0.0, we no longer support Node.js 8.X. Node 10.13.0 is the new minimum supported version.

## Community Credits

* Hans Knöchel
  * [TIMOB-28147](https://jira.appcelerator.org/browse/TIMOB-28147) - support app clips ([56b8da4](https://github.com/appcelerator/titanium_mobile/commit/56b8da4407e44a64da69d6e32e6eb4a1b696772f))
  * add since version for Ti.UI.Picker.datePickerStyle ([ab250c3](https://github.com/appcelerator/titanium_mobile/commit/ab250c32cb52d8a6a0c2aa301a1fcd719ca84868))
  * [TIMOB-28104](https://jira.appcelerator.org/browse/TIMOB-28104) - support new date picker styles ([d3cdfc5](https://github.com/appcelerator/titanium_mobile/commit/d3cdfc59bd7707ca2d5a1c27420e91f85019cf3f))

* Michael Gangolf
  * add missing line in scrollableview example ([dbdb869](https://github.com/appcelerator/titanium_mobile/commit/dbdb869e6fd9003d6801fc2516239f2547b8af90))
  * fix Ti.UI.Window.extendSafeArea default value text ([136620c](https://github.com/appcelerator/titanium_mobile/commit/136620c668e4a2eb4501331d97cd228c5bca4aed))

## Bug Fixes

### Android platform

* [TIMOB-28090](https://jira.appcelerator.org/browse/TIMOB-28090) - allow node to clear event loop ([d6d9a5b](https://github.com/appcelerator/titanium_mobile/commit/d6d9a5b8333425366fef96333c51942b0f28d799))

### iOS platform

* [TIMOB-27132](https://jira.appcelerator.org/browse/TIMOB-27132) - fix location of Ti.Filesystem.applicationDataDirectory on macos ([9caf847](https://github.com/appcelerator/titanium_mobile/commit/9caf8475b5c55ffac256c181896809d01a5b62e3))
* [TIMOB-28138](https://jira.appcelerator.org/browse/TIMOB-28138) - optionally build macos and/or ios arm64 sim ([ed7d149](https://github.com/appcelerator/titanium_mobile/commit/ed7d149314e7c0efaa5a3150f87d81c104f6c591))
* [TIMOB-28130](https://jira.appcelerator.org/browse/TIMOB-28130) - remove Frameworks directory prior to copying ([405e179](https://github.com/appcelerator/titanium_mobile/commit/405e1799ac15b2a3983d5af55df11543b241a447))
* [TIMOB-28099](https://jira.appcelerator.org/browse/TIMOB-28099) - remove old tiverify.xcframework references from project ([cd7c270](https://github.com/appcelerator/titanium_mobile/commit/cd7c270d538c71deb02c1df8c0be42391b806033))
* tweak titanium.xcconfig template to use variables in sdk path ([7da6dbd](https://github.com/appcelerator/titanium_mobile/commit/7da6dbd54696a004940a0ce4146f7598624eaade)) 
* [TIMOB-28130](https://jira.appcelerator.org/browse/TIMOB-28130) - unmark product directory to prevent removing required files ([635d08c](https://github.com/appcelerator/titanium_mobile/commit/635d08cc843e098b95e181f792af3ec6993a5df5))
* [TIMOB-28143](https://jira.appcelerator.org/browse/TIMOB-28143) - use TITANIUM_SDK variable to point at xcframework path in xcode project ([559b5bc](https://github.com/appcelerator/titanium_mobile/commit/559b5bca4a2d2f3d58a41018fb61074d157e08dd))
* use xcodeTargetOS of 'iphoneos' for mac catalyst ([60220c7](https://github.com/appcelerator/titanium_mobile/commit/60220c72a5d35f6ef231d833d911cc2b7408062e))
* [TIMOB-28142](https://jira.appcelerator.org/browse/TIMOB-28142) - when building module test project, unzip via spawn to avoid max buffer error ([345eee1](https://github.com/appcelerator/titanium_mobile/commit/345eee1a3a902f812e461ca9aa9906cd84409993))
* added missing left (“) ([ff27c9b](https://github.com/appcelerator/titanium_mobile/commit/ff27c9b01f44fee1517ef566af2166f450f07bcd))
* [TIMOB-28108](https://jira.appcelerator.org/browse/TIMOB-28108) - allow Ti.UI.RefreshControl.tintColor to accept a semantic color ([815a0fc](https://github.com/appcelerator/titanium_mobile/commit/815a0fcceeda984578b3451e5688e7dcac429376))
* [TIMOB-28113](https://jira.appcelerator.org/browse/TIMOB-28113) - do not update properties if transition animation ([4a835fd](https://github.com/appcelerator/titanium_mobile/commit/4a835fd1581c7f949a0e05a2ff23b22112b6b7e3))
* [TIMOB-28062](https://jira.appcelerator.org/browse/TIMOB-28062) - enable swift development in Titanium ([2b4aa7b](https://github.com/appcelerator/titanium_mobile/commit/2b4aa7b3a0b7a7ef18c0824a2900db5945206871))
* [TIMOB-28116](https://jira.appcelerator.org/browse/TIMOB-28116) - exclude arm64 arch for sim target if native modules aren't xcframeworks ([faba6e1](https://github.com/appcelerator/titanium_mobile/commit/faba6e1c06c8d468b43189c7422ef326617d0585))
* [TIMOB-28042](https://jira.appcelerator.org/browse/TIMOB-28042) - exclude arm64 architecture from simulator build ([178bf92](https://github.com/appcelerator/titanium_mobile/commit/178bf926f2ba4955a4e4b0939e47e48d7a64e238))
* fix Ti.Filesystem.getAsset and getFile on devices ([f57e938](https://github.com/appcelerator/titanium_mobile/commit/f57e9381402f87347447231fd140cf7277fedaf3))
* [TIMOB-27985](https://jira.appcelerator.org/browse/TIMOB-27985) - fix to add resources and sources file in widget extension ([4b97cec](https://github.com/appcelerator/titanium_mobile/commit/4b97cec8ec74d7760c3eff0031ef9b75c2fcaa95))
* gaurd code for MediaModule on xcode 11 to avoid compile issues ([a9dae74](https://github.com/appcelerator/titanium_mobile/commit/a9dae74ca9a993803bdfef52e261fcae2f0c967d))
* [TIMOB-28112](https://jira.appcelerator.org/browse/TIMOB-28112) - guard new picker types ([fa8f547](https://github.com/appcelerator/titanium_mobile/commit/fa8f5475e9588e91eebfd3c0a10c0f663c74e8d2))
* handle adding Ti.UI.Shortcut when existing array is nil ([82e011a](https://github.com/appcelerator/titanium_mobile/commit/82e011aa1bfff059415ff181e5e4f607ca9fa9b5))
* modify BOOL to bool for return types to fix JS representation ([0b251e2](https://github.com/appcelerator/titanium_mobile/commit/0b251e28075eba2685efd30a18f8d1df915f5647))
* [TIMOB-28100](https://jira.appcelerator.org/browse/TIMOB-28100) - only include presentationControllerDidDismiss when photogallery is used ([14a5e5b](https://github.com/appcelerator/titanium_mobile/commit/14a5e5ba65de2c5b2d656d0aae4b30c4b6b57ef9))
* [TIMOB-28126](https://jira.appcelerator.org/browse/TIMOB-28126) - rely on flush interval ([0c83fab](https://github.com/appcelerator/titanium_mobile/commit/0c83fabf6bd8abff5370dfb5208ec35b32cc890b))
* [TIMOB-28091](https://jira.appcelerator.org/browse/TIMOB-28091) - update liveview for ios 14 compatibility ([e89065b](https://github.com/appcelerator/titanium_mobile/commit/e89065bad920d25df94f144390912a3bc65190d8))
* [TIMOB-28101](https://jira.appcelerator.org/browse/TIMOB-28101) - use arc to create corner radius instead of qudratic curve ([b5ed723](https://github.com/appcelerator/titanium_mobile/commit/b5ed72357f697293a3d2e2a3ff957ff47bb13fa1))
* [TIMOB-28103](https://jira.appcelerator.org/browse/TIMOB-28103) [TIMOB-28110](https://jira.appcelerator.org/browse/TIMOB-28110) - view shadow missing with multiple borderRadius values ([2a38bf3](https://github.com/appcelerator/titanium_mobile/commit/2a38bf33e06831c0c58d489686153acdbf057225))
* fix location of Ti.Filesystem.applicationDataDirectory on macos ([9caf847](https://github.com/appcelerator/titanium_mobile/commit/9caf8475b5c55ffac256c181896809d01a5b62e3))


### Multiple platforms

* [TIMOB-28094](https://jira.appcelerator.org/browse/TIMOB-28094) - process.toString() ([a15f7f6](https://github.com/appcelerator/titanium_mobile/commit/a15f7f65a6c738ab444570c7236435245e72d6b2))

## Features

### iOS platform

* [TIMOB-27986](https://jira.appcelerator.org/browse/TIMOB-27986) - support xcframeworks in modules/platform folders ([b2ccfbf](https://github.com/appcelerator/titanium_mobile/commit/b2ccfbf7fb44d5ffa03dd358ad8d5930258be838))
* [TIMOB-28077](https://jira.appcelerator.org/browse/TIMOB-28077) - added new error constant and updated doc for local network privacy ([f8de8c0](https://github.com/appcelerator/titanium_mobile/commit/f8de8c08c68398b5b5b871e655455f6d8c529d6e))
* add Ti.Blob.toArrayBuffer() ([e42bbcb](https://github.com/appcelerator/titanium_mobile/commit/e42bbcbf1295123c3a0f7d8fb94179df89358a28))
* [TIMOB-28098](https://jira.appcelerator.org/browse/TIMOB-28098) - add Ti.Platform.versionPatch ([a78e9cc](https://github.com/appcelerator/titanium_mobile/commit/a78e9ccf9b937fd9066ba13bbc855f3a37557482))
* [TIMOB-27984](https://jira.appcelerator.org/browse/TIMOB-27984) - allow multiple photo selection ([04b4292](https://github.com/appcelerator/titanium_mobile/commit/04b42929d71cef4abc9c6f891caf78da2f714b81))
* build modules as xcframeworks (w/ macos support) ([5b766ae](https://github.com/appcelerator/titanium_mobile/commit/5b766ae9207255dcc60ee4c04b154cc4b0de04e9))
* [TIMOB-28012](https://jira.appcelerator.org/browse/TIMOB-28012) - expose new APIs to customize paging control ([6acad54](https://github.com/appcelerator/titanium_mobile/commit/6acad54cd44535a5efcb1556a8cce9e73032fb65))
* [TIMOB-27976](https://jira.appcelerator.org/browse/TIMOB-27976) - expose new APIs to use location AccuracyAuthorization ([a55f9a3](https://github.com/appcelerator/titanium_mobile/commit/a55f9a3fc21bd21c4e610e909d9039748b8b05e1))
* [TIMOB-27987](https://jira.appcelerator.org/browse/TIMOB-27987) - expose new iOS 14 APIs in Ti.UI.WebView ([840b0d2](https://github.com/appcelerator/titanium_mobile/commit/840b0d279f79248d1511fc518fa28fda9573be73))
* [TIMOB-27132](https://jira.appcelerator.org/browse/TIMOB-27132) - support macos/dist-macappstore targets ([cfac6e4](https://github.com/appcelerator/titanium_mobile/commit/cfac6e4bf1c6926c3727dcbff5c79221bfb651a2))
* [TIMOB-28078](https://jira.appcelerator.org/browse/TIMOB-28078) - support new APIs timeoutForResource and waitsForConnectivity ([09f20d2](https://github.com/appcelerator/titanium_mobile/commit/09f20d28bcfe8b610291f73dad7bb716cd3ac7d3))
* [TIMOB-28116](https://jira.appcelerator.org/browse/TIMOB-28116) - use/support/build xcframeworks ([133527e](https://github.com/appcelerator/titanium_mobile/commit/133527ed517518b13a64cd50a8dd65d61c8b76b7))

### Multiple platforms

* [TIMOB-28061](https://jira.appcelerator.org/browse/TIMOB-28061) - add os version major/minor int constants ([3fd8535](https://github.com/appcelerator/titanium_mobile/commit/3fd8535013797129fbe6ca381692fce5b7ae55da))
* [TIMOB-28061](https://jira.appcelerator.org/browse/TIMOB-28061) - add OS_ANDROID/OS_IOS for non-transpiled builds ([b21c5d7](https://github.com/appcelerator/titanium_mobile/commit/b21c5d79d00e6efad06fcea441712f57c3bbaa01))
* [TIMOB-28098](https://jira.appcelerator.org/browse/TIMOB-28098) - add OS_VERSION_PATCH global ([86d33df](https://github.com/appcelerator/titanium_mobile/commit/86d33df7d7ce85ff596f392e702095c04b3ca296))
* [TIMOB-28093](https://jira.appcelerator.org/browse/TIMOB-28093) - add uprightWidth/uprightHeight props to Ti.Blob ([09b4591](https://github.com/appcelerator/titanium_mobile/commit/09b4591804f3c15a1854c2d5a48a6c55645af26d))
* [TIMOB-28070](https://jira.appcelerator.org/browse/TIMOB-28070) - add vscode config files to app templates ([f8ef53a](https://github.com/appcelerator/titanium_mobile/commit/f8ef53ac276dace006cd40e65f7ffb798c38eb6e))
* [TIMOB-28030](https://jira.appcelerator.org/browse/TIMOB-28030) - add WebView blockedURLs property ([9006c00](https://github.com/appcelerator/titanium_mobile/commit/9006c0044c6657976951ebb5fb1ede4dde0e2d35))

### Android platform

* add Ti.Blob.toArrayBuffer() ([36e7244](https://github.com/appcelerator/titanium_mobile/commit/36e7244f5333f40b108eb7847403e629f98ff57f))
* [TIMOB-28098](https://jira.appcelerator.org/browse/TIMOB-28098) - add Ti.Platform.versionPatch ([587ddea](https://github.com/appcelerator/titanium_mobile/commit/587ddea90acf9a5660f6f5499186a09366aaf26c))
* support converting byte[] to ArrayBuffer ([9e77600](https://github.com/appcelerator/titanium_mobile/commit/9e77600acbaed9dd7d2d301c9fec3687bcf6a77b))

## Performance Improvements

### Multiple platforms

* make buffer shim more efficient ([9efe874](https://github.com/appcelerator/titanium_mobile/commit/9efe8742508abc1ce40f35d8add9100e675cbab3))

## SDK Module Versions

| Module      | Android version | iOS Version |
| ----------- | --------------- | ----------- |
| facebook | 10.0.0 | 9.0.0 |
| ti.cloudpush | 7.1.0 | n/a |
| ti.map | 5.0.1 | 4.0.0 |
| ti.webdialog | 2.0.0 | 2.0.0 |
| ti.playservices | 17.1.1 | n/a |
| ti.identity | 3.0.2 | 2.0.0 |
| urlSession | n/a | 3.0.0 |
| ti.coremotion | n/a | 3.0.0 |
| ti.applesignin | n/a | 2.0.0 |
| ti.cloud | 3.2.11 | 3.2.11 |
| hyperloop | 6.0.0 | 6.0.0 |

# [9.1.0](https://github.com/appcelerator/titanium_mobile/compare/9_0_X...9.1.0) (2020-08-06)

## About this release

Titanium SDK 9.1.0 is a minor release of the SDK, addressing high-priority issues from previous releases, as well as the addition of new features/functionality/APIs.

As of this release, Titanium SDK 9.0.x will not receive updates more than six months after the release of 9.1.0 (2021-02-03). Any needed fixes will be in 9.1.x or later supported releases within the 9.x branch.
See [Axway Appcelerator Deprecation Policy](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_deprecation_policy.html) and [Nominal Lifetimes](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_product_lifecycle.html#AxwayAppceleratorProductLifecycle-NominalLifetimes) documents for details.

:warning: With the release of Titanium SDK 9.0.0, we no longer support Node.js 8.X. Node 10.13.0 is the new minimum supported version.

## Overview

Titanium SDK 9.1.0's Notable new features include: [Webpack project support](https://jira.appcelerator.org/browse/TIMOB-27428), `Intl` JS APIs on both major platforms, Cross-platform Dark/Light mode theming, Named/Semantic Colors, new `focused`/`closed` query methods on some UI components, cross-platform parity for `Ti.UI.Shortcut`, and `Ti.UI.View.borderRadius` extended to support 2 or 4 values (in addition to single value existing support) to allow for custom border radii (rounded corners).

## Community Credits

* Michael Gangolf
  * [TIMOB-27879](https://jira.appcelerator.org/browse/TIMOB-27879) - add getScaledTouchSlop() to ListView ([901f991](https://github.com/appcelerator/titanium_mobile/commit/901f991c242e6d81b999f88ea2dfa2b69f03e57c))
  * [TIMOB-27977](https://jira.appcelerator.org/browse/TIMOB-27977) - add "isTrusted" property to Slider "change" event ([8e96445](https://github.com/appcelerator/titanium_mobile/commit/8e964456613c956661f6769b9af18e2c1bfe393a))
  * [TIMOB-25633](https://jira.appcelerator.org/browse/TIMOB-25633) - adding androidback property to showCamera ([b890f7c](https://github.com/appcelerator/titanium_mobile/commit/b890f7c7743b8e38292c5d669ed502996b665a20))
  * [TIMOB-27855](https://jira.appcelerator.org/browse/TIMOB-27855) - animate color ([4fa4e19](https://github.com/appcelerator/titanium_mobile/commit/4fa4e191f1ec369554b39f596890b5e64629d421)) and elevation ([38a82ed](https://github.com/appcelerator/titanium_mobile/commit/38a82ed829e57b2c155d07d8856ed92a0a6d9c78))
  * fix OptionDialog example ([c0b13a1](https://github.com/appcelerator/titanium_mobile/commit/c0b13a1de7999608d79e5a753ab512e964bfa263) and [6b99cf9](https://github.com/appcelerator/titanium_mobile/commit/6b99cf9fb026658edafd452da355a7b65c76c9bc))
  * [TIMOB-27834](https://jira.appcelerator.org/browse/TIMOB-27834) - navigationWindow open/close event ([ec1976a](https://github.com/appcelerator/titanium_mobile/commit/ec1976a66127b6de024bb4fe6d20207e46fdcb4c))

* Andrea Vitale
  * [TIMOB-27958](https://jira.appcelerator.org/browse/TIMOB-27958) - add fallback for countryCode in reverseGeocoder method ([9823b0d](https://github.com/appcelerator/titanium_mobile/commit/9823b0dba8482fadd809fc6612ad70674fd51a10))

* Hans Knöchel
  * [TIMOB-27895](https://jira.appcelerator.org/browse/TIMOB-27895) - support using named colors for color properties directly ([5135b59](https://github.com/appcelerator/titanium_mobile/commit/5135b595fc4f24f827ec7e63b7273b8a797de5b7))
  * [TIMOB-27757](https://jira.appcelerator.org/browse/TIMOB-27757) - fix watchOS targets that include frameworks ([bd59e19](https://github.com/appcelerator/titanium_mobile/commit/bd59e19fb5036745dbfba857f117899380b88f63))
  * [TIMOB-27745](https://jira.appcelerator.org/browse/TIMOB-27745) - add "google-services.json" support ([d04d9e9](https://github.com/appcelerator/titanium_mobile/commit/d04d9e9782cd34e613781d48f8473151f788b1e0))
  * [TIMOB-27773](https://jira.appcelerator.org/browse/TIMOB-27773) - add search bar token API ([0680dcd](https://github.com/appcelerator/titanium_mobile/commit/0680dcd03b5c65685b35b75187ff45e3d1d16787))

* Sergey Volkov
  * [TIMOB-27519](https://jira.appcelerator.org/browse/TIMOB-27519) - semantic colors with alpha value ([3c9aa10](https://github.com/appcelerator/titanium_mobile/commit/3c9aa102811889793dbdc24eeb03c5a44c1ec449))
  * fix keyboardToolbar property type ([7fbf2c7](https://github.com/appcelerator/titanium_mobile/commit/7fbf2c70b1c7c9a39805e9d999cf638e5e2f08c4))
  * fix Ti.UI.iOS.MenuPopup.items type ([e886d64](https://github.com/appcelerator/titanium_mobile/commit/e886d64ee7e81db77fb65b93c3591ae4c6c00c37))

* Skoften
  * [TIMOB-27697](https://jira.appcelerator.org/browse/TIMOB-27697) - Add "progress" event to Ti.UI.WebView for Android (parity) ([2caa8e7](https://github.com/appcelerator/titanium_mobile/commit/2caa8e75a3b40a99d236a5b9b07fe26f5423cbf6))

## Bug Fixes

### Android platform

* [TIMOB-27513](https://jira.appcelerator.org/browse/TIMOB-27513) - TabGroup bottom navigation style fires redundant event
* [TIMOB-27519](https://jira.appcelerator.org/browse/TIMOB-27519) - Semantic Colors with alpha value
* [TIMOB-27616](https://jira.appcelerator.org/browse/TIMOB-27616) - TextField with decimal keyboard type does not allow comma for decimal separator
* [TIMOB-27731](https://jira.appcelerator.org/browse/TIMOB-27731) - Camera fails to open when using saveToPhotoGallery: true ([56986c3](https://github.com/appcelerator/titanium_mobile/commit/56986c33e303081223fd17fa9a13c04d743e517f))
* [TIMOB-27779](https://jira.appcelerator.org/browse/TIMOB-27779) - Setting "labels" via TabbedBar "click" event hangs app ([749ff1d](https://github.com/appcelerator/titanium_mobile/commit/749ff1d67eb812c149f08fc705c87fa440e415a2))
* [TIMOB-27797](https://jira.appcelerator.org/browse/TIMOB-27797) - Unable to see "error" event in remote images ([68d11f7](https://github.com/appcelerator/titanium_mobile/commit/68d11f73cbf317af9a81bd7272fc02d1c39cdac1))
* [TIMOB-27825](https://jira.appcelerator.org/browse/TIMOB-27825) - High CPU usage in Android Studio ([11dff9d](https://github.com/appcelerator/titanium_mobile/commit/11dff9d3ccc61bd04048a11e95016fe8fb409917))
* [TIMOB-27834](https://jira.appcelerator.org/browse/TIMOB-27834) - NavigationWindow doesnt trigger open and close events
* [TIMOB-27872](https://jira.appcelerator.org/browse/TIMOB-27872) - Blob imageAsX() methods ignore EXIF orientation if not wrapping a file ([7ce3ae1](https://github.com/appcelerator/titanium_mobile/commit/7ce3ae11f2c886864ed7713b1e88324b60fdf8f6))
* [TIMOB-27882](https://jira.appcelerator.org/browse/TIMOB-27882) - Unable to do a production build after switching SDK on Windows
* [TIMOB-27916](https://jira.appcelerator.org/browse/TIMOB-27916) - App logs Titanium version as `__VERSION__` on startup as of 9.1.0 ([08227a9](https://github.com/appcelerator/titanium_mobile/commit/08227a90c0939748b1a93a6764f5949ffa6e0deb))
* [TIMOB-27927](https://jira.appcelerator.org/browse/TIMOB-27927) - Changing currently selected row's color in picker does not update shown color
* [TIMOB-27950](https://jira.appcelerator.org/browse/TIMOB-27950) - "tiapp.xml" setting `<navbar-hidden>` is ignored if `<fullscreen>` or `<statusbar-hidden>` is also not set as of 9.0.0 ([54e42b1](https://github.com/appcelerator/titanium_mobile/commit/54e42b1324897f148840a2a0dae431d3b6645ed7))
* [TIMOB-27963](https://jira.appcelerator.org/browse/TIMOB-27963) - Always specify default Tab.tintColor ([9a6d417](https://github.com/appcelerator/titanium_mobile/commit/9a6d417030c1920b5e409bf3de766b22d077f9ee))
* [TIMOB-27972](https://jira.appcelerator.org/browse/TIMOB-27972) - ACS push notifications received multiple times on same device after re-installing app
* [TIMOB-27990](https://jira.appcelerator.org/browse/TIMOB-27990) - Ti.UI.ShortcutItem has lot of issues
* [TIMOB-28020](https://jira.appcelerator.org/browse/TIMOB-28020) - Parity with iOS Shortcut click event payload ([dc102e3](https://github.com/appcelerator/titanium_mobile/commit/dc102e3ac6c78c35ce294b46a653de710c4958cd))
* changing picker row color should update selected text ([7aa5290](https://github.com/appcelerator/titanium_mobile/commit/7aa5290036b054bee75240488ae22f8228218906))
* clean/rebuild should release gradle file locks ([be923f1](https://github.com/appcelerator/titanium_mobile/commit/be923f1d1904912db50218e1addc9acd7147974f))

### iOS platform

* [TIMOB-18256](https://jira.appcelerator.org/browse/TIMOB-18256) - setting TextField.value to wrong type triggers change event ([e06f9b5](https://github.com/appcelerator/titanium_mobile/commit/e06f9b52cdbe494e6c4d19d02373d07fc4a991ff))
* [TIMOB-27649](https://jira.appcelerator.org/browse/TIMOB-27649) - deprecate statusbar constant ([3c83fd8](https://github.com/appcelerator/titanium_mobile/commit/3c83fd80890e7fb44a97702de9600c8b3ef1dc3b))
* [TIMOB-27757](https://jira.appcelerator.org/browse/TIMOB-27757) - watchOS: Frameworks are referenced incorrectly
* [TIMOB-27767](https://jira.appcelerator.org/browse/TIMOB-27767) - Parity: httpClient should trigger error callback when url is invalid ([7630868](https://github.com/appcelerator/titanium_mobile/commit/7630868993bac92e2c9d8f005c6a5104683b983c))
* [TIMOB-27821](https://jira.appcelerator.org/browse/TIMOB-27821) - ti.urlsession - Event sessioncompleted does not get all specified values ([ebae7bd](https://github.com/appcelerator/titanium_mobile/commit/ebae7bdc4399d6b0e871db1c60de47d2f0642b89))
* [TIMOB-27832](https://jira.appcelerator.org/browse/TIMOB-27832) - Liveview disconnect triggers infinate error loop
* [TIMOB-27846](https://jira.appcelerator.org/browse/TIMOB-27846) - Calling Ti.Platform.openURL without all parameters causes the app to crash (regression) ([b5bb437](https://github.com/appcelerator/titanium_mobile/commit/b5bb4377a384127ccd0702596e396d02f3c9abdf))
* [TIMOB-27874](https://jira.appcelerator.org/browse/TIMOB-27874) - parseDecimal() whitespace thousands sep handling ([ed7bbe6](https://github.com/appcelerator/titanium_mobile/commit/ed7bbe6e1924996f8d173bd757b564f291c24c66))
* [TIMOB-27897](https://jira.appcelerator.org/browse/TIMOB-27897) - master branch is not building on Xcode < 11
* [TIMOB-27930](https://jira.appcelerator.org/browse/TIMOB-27930) - iPad crashing intermittently during unit test suite ([c2e5fb5](https://github.com/appcelerator/titanium_mobile/commit/c2e5fb5de565119ce7859298b217abe319f3bb8e))
* [TIMOB-27935](https://jira.appcelerator.org/browse/TIMOB-27935) - TableViewRow does not return getRect methods
* [TIMOB-27958](https://jira.appcelerator.org/browse/TIMOB-27958) - Ti.Geolocation.reverseGeocoder() crashes the app on iOS
* [TIMOB-27969](https://jira.appcelerator.org/browse/TIMOB-27969) - View in a tab window goes under tabs in a tabgroup on Ipad ([e9330a9](https://github.com/appcelerator/titanium_mobile/commit/e9330a927909f64bd6e7efc05eb3f48de6347476))
* [TIMOB-27994](https://jira.appcelerator.org/browse/TIMOB-27994) - itemclick event its firing instead of a move event when ordering items in a list (iOS 13+) ([40cc28d](https://github.com/appcelerator/titanium_mobile/commit/40cc28da53ed5cebb31c555fe8727db830eee3bb))
* [TIMOB-27997](https://jira.appcelerator.org/browse/TIMOB-27997) - Ti.Blob images from device (via Ti.UI.View#toImage()) would report dimensions in points, not pixels ([51b6237](https://github.com/appcelerator/titanium_mobile/commit/51b6237049a9bec60c1ab31cb268d40c2ecf2093))
* [TIMOB-28001](https://jira.appcelerator.org/browse/TIMOB-28001) - setting TableView row layout to "horizontal" or "vertical" crashes ([fd53a51](https://github.com/appcelerator/titanium_mobile/commit/fd53a51e8e7040f1995c497092fdc782508dfa7e))
* [TIMOB-28031](https://jira.appcelerator.org/browse/TIMOB-28031) - CLI: Unable to find an iOS Simulator running iOS 14.0.
* allow custom property getters to work in bindings ([a53f8c6](https://github.com/appcelerator/titanium_mobile/commit/a53f8c6e05ab34ce7735af617e62f4c308d4f83f))
* call callback with success no byte event on writeFromBuffer with no length ([8a639d8](https://github.com/appcelerator/titanium_mobile/commit/8a639d8bb50f66468b4ac6cefbe3501c9027110f))
* define dark/light theme constants/properties for ios < 13 ([a16e698](https://github.com/appcelerator/titanium_mobile/commit/a16e6983ac14955bcf14307a2634cf9b49e63a0d))
* don't ignore close call immediately after open on Window ([07502db](https://github.com/appcelerator/titanium_mobile/commit/07502db839ef9a4631e28aefbb1c7727ef5fb515))
* handle Ti.Stream.write with length 0 or empty buffer as success no-op ([b58349d](https://github.com/appcelerator/titanium_mobile/commit/b58349d06b04203c041e1c1d26566260a924db7a))
* have Ti.Color hex be AARRGGBB format (not RRGGBBAA) ([9c3321b](https://github.com/appcelerator/titanium_mobile/commit/9c3321b1f788c6b18541e4766007ccaeeadb409c))
* make Ti.UI.Window close/open run more async ala Android ([6a6fda4](https://github.com/appcelerator/titanium_mobile/commit/6a6fda4bc9ca83e44e1c41b9a6d998f2c1e89f64))
* properly report partial results on thrown error for Ti.DB.executeAll ([f1372ba](https://github.com/appcelerator/titanium_mobile/commit/f1372bab5510eb3abe71b95907b9b6ca0ecbde58))
* remainingComplicationUserInfoTransfers is number on ipad ([0fcd6d2](https://github.com/appcelerator/titanium_mobile/commit/0fcd6d2c22d3823fe838f1cec2080ee014a9db65))
* TableViewRow does not return getRect methods ([b15d184](https://github.com/appcelerator/titanium_mobile/commit/b15d1840c9be3cbf7cc74b10381e3656846f87b8))

### Multiple platforms

* [TIMOB-27785](https://jira.appcelerator.org/browse/TIMOB-27785) - buffer: Proxy object's 'set' trap returned falsy value for property '0' ([a45a8d0](https://github.com/appcelerator/titanium_mobile/commit/a45a8d0cd4833a136537a8da27fee976bd617fab))
* [TIMOB-27808](https://jira.appcelerator.org/browse/TIMOB-27808) - add missing console.trace ([83a64a1](https://github.com/appcelerator/titanium_mobile/commit/83a64a1c276b666a2e24e2524fcb10e0a7a25e00))
* [TIMOB-27525](https://jira.appcelerator.org/browse/TIMOB-27525) - Liveview: Commented out line with Ti.include in it causes LiveView failure
* [TIMOB-27416](https://jira.appcelerator.org/browse/TIMOB-27416) - LiveView: Changes made to a theme's style are not reflected in app when using LiveView
* [TIMOB-26267](https://jira.appcelerator.org/browse/TIMOB-26267) - LiveView: Calling "liveview server stop" causes exception, but stops connections
* [TIMOB-26649](https://jira.appcelerator.org/browse/TIMOB-26649) - LiveView: Unable to use LiveView with KitchenSink-v2
* [TIMOB-26798](https://jira.appcelerator.org/browse/TIMOB-26798) - Angular: Project template is outdated
* do not remove log file when cleaning ([a699bf5](https://github.com/appcelerator/titanium_mobile/commit/a699bf594d0e41167d4c441de9d958bdc46a9fb4))
* add .buffer and #set to Buffer ([264b175](https://github.com/appcelerator/titanium_mobile/commit/264b1752d2548a391e4ee4d53832a27d784d5cf6))
* add no-op stubs for fs.chown methods ([1dd99ef](https://github.com/appcelerator/titanium_mobile/commit/1dd99efecfa6529ac443293e71ee4fbef9ce6f85))
* assume hex is ARGB ([daf8056](https://github.com/appcelerator/titanium_mobile/commit/daf8056047a0cbdfac0b76862bec8c4d45196075))
* copy sliced buffer doesn't extend beyond view now ([035c579](https://github.com/appcelerator/titanium_mobile/commit/035c57922d7345985c44e67913c2b9aa9d36feb4))
* expose Buffer.hexSlice to fix console.log of ArrayBuffer ([d7f863b](https://github.com/appcelerator/titanium_mobile/commit/d7f863b7f618a7b9b617f68936623d224268b614))
* expose constructor off global console instance ([2568c6f](https://github.com/appcelerator/titanium_mobile/commit/2568c6f15af34a8a7b5a3a6bea9936367623670d))
* correct type sniffing of some ES6 types ([bac4bb3](https://github.com/appcelerator/titanium_mobile/commit/bac4bb3c4732431b174ed3fd15536932bd0f1f22))

## Features

### Android platform

* [TIMOB-25633](https://jira.appcelerator.org/browse/TIMOB-25633) - Add "androidback" callback property to camera overlay ([b890f7c](https://github.com/appcelerator/titanium_mobile/commit/b890f7c7743b8e38292c5d669ed502996b665a20))
* [TIMOB-26315](https://jira.appcelerator.org/browse/TIMOB-26315) - Support touch feedback on backgroundImage, backgroundGradient, and transparent backgrounds ([2a0b1be](https://github.com/appcelerator/titanium_mobile/commit/2a0b1bea925c9cc1eefb29535e7a33ef724adc09))
* [TIMOB-27240](https://jira.appcelerator.org/browse/TIMOB-27240) - Add Intl.NumberFormat support ([269de3f](https://github.com/appcelerator/titanium_mobile/commit/269de3f91975b758d58608491b44ac6e3dd86323))
* [TIMOB-27242](https://jira.appcelerator.org/browse/TIMOB-27242) - Improve getter and setter warnings ([3507dd0](https://github.com/appcelerator/titanium_mobile/commit/3507dd0d920c027d7a5d1df251ad914b5b7cdfb9))
* [TIMOB-27473](https://jira.appcelerator.org/browse/TIMOB-27473) - Replace clang Java formatter with gradle "checkstyle" tool ([3cbc754](https://github.com/appcelerator/titanium_mobile/commit/3cbc75485d2b6d8a423ef76653b7d2389309bd61))
* [TIMOB-27501](https://jira.appcelerator.org/browse/TIMOB-27501) - Be able to determine dark / light theme, as well as changes on it
  * add Ti.UI.Android.getColorResource(), Ti.UI.Color ([d852331](https://github.com/appcelerator/titanium_mobile/commit/d852331b71a53dbcdae89dd73055210fb04beb37))
* [TIMOB-27697](https://jira.appcelerator.org/browse/TIMOB-27697) - Add "progress" event to Ti.UI.WebView for Android (parity) ([82a3579](https://github.com/appcelerator/titanium_mobile/commit/82a3579c3239a0ed84c83a28c74767effccfa9fe))
* [TIMOB-27719](https://jira.appcelerator.org/browse/TIMOB-27719) - Remove python dependency from SDK build
* [TIMOB-27855](https://jira.appcelerator.org/browse/TIMOB-27855) - Animate elevation value
* [TIMOB-27862](https://jira.appcelerator.org/browse/TIMOB-27862) - Add callback support to Ti.Platform.openURL() ([43d287e](https://github.com/appcelerator/titanium_mobile/commit/43d287e685fe9da5efedbda9ed0921bf32fff573))
* [TIMOB-27869](https://jira.appcelerator.org/browse/TIMOB-27869) - KEYBOARD_TYPE_ASCII should not allow emoji like iOS
* [TIMOB-27870](https://jira.appcelerator.org/browse/TIMOB-27870) - KEYBOARD_TYPE_NUMBERS_PUNCTUATION should allow all chars except emoji like iOS
* [TIMOB-27871](https://jira.appcelerator.org/browse/TIMOB-27871) - Setting TextField/TextArea "editable" to false should allow user to copy text to clipboard
* [TIMOB-27879](https://jira.appcelerator.org/browse/TIMOB-27879) - ListView should only fire "scrolling" event when moving a min distance
* [TIMOB-27889](https://jira.appcelerator.org/browse/TIMOB-27889) - Implement Ti.UI.Shortcut ([5432efc](https://github.com/appcelerator/titanium_mobile/commit/5432efce7a3e6a09b32c1ed6f4bed95fe915b214))
* [TIMOB-27890](https://jira.appcelerator.org/browse/TIMOB-27890) - Add Intl.DateTimeFormat support ([269de3f](https://github.com/appcelerator/titanium_mobile/commit/269de3f91975b758d58608491b44ac6e3dd86323))
* [TIMOB-27891](https://jira.appcelerator.org/browse/TIMOB-27891) - Add Intl.Collator support ([269de3f](https://github.com/appcelerator/titanium_mobile/commit/269de3f91975b758d58608491b44ac6e3dd86323))
* [TIMOB-27892](https://jira.appcelerator.org/browse/TIMOB-27892) - Update toLocale*String() methods to support locale/options ([683adaf](https://github.com/appcelerator/titanium_mobile/commit/683adafc7f32de97656670f570ac696beb5fce6d))
* [TIMOB-27906](https://jira.appcelerator.org/browse/TIMOB-27906) - Add Kotlin based template for native modules ([23c3aea](https://github.com/appcelerator/titanium_mobile/commit/23c3aeafe8fd7c8a64c037fa584201cc8842b243))
* [TIMOB-27938](https://jira.appcelerator.org/browse/TIMOB-27938) - Update gradle build tools to 4.0.x
* [TIMOB-27946](https://jira.appcelerator.org/browse/TIMOB-27946) - Implement Ti.View.borderRadius multiple values for custom edge radii ([545f8d5](https://github.com/appcelerator/titanium_mobile/commit/545f8d5d6d641a14289f486a310ca34f08dada6f))
* add NDK side-by-side support ([71f25e8](https://github.com/appcelerator/titanium_mobile/commit/71f25e8a6d3cf906f59c8c515effa61211f24802))
* [MOD-2588](https://jira.appcelerator.org/browse/MOD-2588) - add passcode fallback to ti.identity ([1f84b35](https://github.com/appcelerator/titanium_mobile/commit/1f84b3551c57ca4a5cf4c91a07d5867f0948ff15))
* added "codeStyleConfig.xml" to SDK ([a9f6895](https://github.com/appcelerator/titanium_mobile/commit/a9f68957da9304295199096fbbbbc15061cc4bf4))
* [MOD-2634](https://jira.appcelerator.org/browse/MOD-2634) [TIMOB-27972](https://jira.appcelerator.org/browse/TIMOB-27972) - migrate CloudPush to Firebase ([d61e66e](https://github.com/appcelerator/titanium_mobile/commit/d61e66e1e33005a9a4bf2204b536b9421fa6c0df))
* module builds should fail with aar in lib folder ([0c72020](https://github.com/appcelerator/titanium_mobile/commit/0c720208bab8344e08c1ba29a123b78e9ec55d76))

### iOS platform

* [TIMOB-27773](https://jira.appcelerator.org/browse/TIMOB-27773) - Support search bar tokens
* [TIMOB-26959](https://jira.appcelerator.org/browse/TIMOB-26959) - Add TLS 1.3 support
* [TIMOB-27853](https://jira.appcelerator.org/browse/TIMOB-27853) - Add ability to detect that screenshot was taken on iOS ([b9df339](https://github.com/appcelerator/titanium_mobile/commit/b9df3399d9aa41b34a8d38f1dad96bca20ff9de2))
* [TIMOB-26818](https://jira.appcelerator.org/browse/TIMOB-26818) - Move application shortcut under Ti.UI.Shortcut to have parity ([8446d39](https://github.com/appcelerator/titanium_mobile/commit/8446d3967cd3c1eda8c364af08a99998e9aa1b20))
* [TIMOB-27305](https://jira.appcelerator.org/browse/TIMOB-27305) - Implement Ti.View.borderRadius multiple values for custom edge radii ([34b3a93](https://github.com/appcelerator/titanium_mobile/commit/34b3a930762a5ea47f781644b87a47f78b86657b))
* [TIMOB-27649](https://jira.appcelerator.org/browse/TIMOB-27649) - Deprecate Status Bar style constants
* [TIMOB-27767](https://jira.appcelerator.org/browse/TIMOB-27767) - Parity: httpClient should trigger error callback when url is invalid
* [TIMOB-27792](https://jira.appcelerator.org/browse/TIMOB-27792) - Remove python dependency from SDK build
* [TIMOB-27974](https://jira.appcelerator.org/browse/TIMOB-27974) - Make iOS development-project compatible with Xcode 12
* add list of new iPhone/iPad models for `os` module ([8839c2c](https://github.com/appcelerator/titanium_mobile/commit/8839c2c8c85914ade3f20c55f825da8896aa378f))

### Multiple platforms

* [TIMOB-13764](https://jira.appcelerator.org/browse/TIMOB-13764) - TiAPI: After animating properties on a view, update in the view properties ([3fef676](https://github.com/appcelerator/titanium_mobile/commit/3fef6762cba17f614ca18492883a700a6a6d4665))
* [TIMOB-25968](https://jira.appcelerator.org/browse/TIMOB-25968) - Liveview: Write more information to pidfile, such as port and ip data
* [TIMOB-26572](https://jira.appcelerator.org/browse/TIMOB-26572) - TiAPI: Extend global console API to be more Node-compatible ([e398a10](https://github.com/appcelerator/titanium_mobile/commit/e398a10d6eb51a37f13df6500983ff8132353efe))
* [TIMOB-27429](https://jira.appcelerator.org/browse/TIMOB-27429) - Webpack: Integration into the CLI build command
* [TIMOB-27501](https://jira.appcelerator.org/browse/TIMOB-27501) - cross-platform light/dark mode API ([28eba34](https://github.com/appcelerator/titanium_mobile/commit/28eba34349ce26dfd1aafca9c16615ce8255ab20))
* [TIMOB-27511](https://jira.appcelerator.org/browse/TIMOB-27511) - Webpack: Alloy loader
* [TIMOB-27716](https://jira.appcelerator.org/browse/TIMOB-27716) - Webpack: Classic and Alloy project templates
* [TIMOB-27711](https://jira.appcelerator.org/browse/TIMOB-27711) - TiAPI: Add state querying methods to UI components
  * add Ti.UI.Window.closed property ([1c66a80](https://github.com/appcelerator/titanium_mobile/commit/1c66a80bf671309d63cb70d336482de053ed5efb)) ([574fec6](https://github.com/appcelerator/titanium_mobile/commit/574fec6c3d40762259dcece0512986dec6d85194))
  * add Ti.UI.Window.focused property ([26f8dcd](https://github.com/appcelerator/titanium_mobile/commit/26f8dcd0be512d4ae09dd70ab4a80bfae9770321)) ([c5de6e2](https://github.com/appcelerator/titanium_mobile/commit/c5de6e26d253b42483cb270fb8c54de1d9b65d52))
  * add Ti.UI.SearchBar focused property ([64c334d](https://github.com/appcelerator/titanium_mobile/commit/64c334dd6509dea2884092c0c9e85a1e276afdec)) ([e0161ed](https://github.com/appcelerator/titanium_mobile/commit/e0161edc73f8c0d32397ec29744d9f40154dce70))
  * add Ti.UI.TextField/Area focused property ([5e822f5](https://github.com/appcelerator/titanium_mobile/commit/5e822f590219922cf20f1b84edd8609923675788)) ([19ab4dc](https://github.com/appcelerator/titanium_mobile/commit/19ab4dc1f6bd08537069222a47d428ffbe6edb94)) ([78357ec](https://github.com/appcelerator/titanium_mobile/commit/78357ecfebb41d24fa3c53029f7f6ae3739e1ace)) ([7b53d67](https://github.com/appcelerator/titanium_mobile/commit/7b53d675fe4240c6c4673ae90e557dca84fde0d2))
* [TIMOB-27800](https://jira.appcelerator.org/browse/TIMOB-27800) - Webpack: Angular plugin
* [TIMOB-27856](https://jira.appcelerator.org/browse/TIMOB-27856) - Webpack: Angular project template
* [TIMOB-27857](https://jira.appcelerator.org/browse/TIMOB-27857) - Webpack: Add support for plugins from NPM
* [TIMOB-27860](https://jira.appcelerator.org/browse/TIMOB-27860) - Webpack: Tap into hooks before/after other plugins
* [TIMOB-27874](https://jira.appcelerator.org/browse/TIMOB-27874) - TiAPI: Add Ti.Locale.parseDecimal() method ([6253813](https://github.com/appcelerator/titanium_mobile/commit/62538137329bcc9fa0c4c5e3d9798d2f5487e421))
* [TIMOB-27895](https://jira.appcelerator.org/browse/TIMOB-27895) - TiAPI: Handle semantic colors (dark mode) without helper function
* [TIMOB-27907](https://jira.appcelerator.org/browse/TIMOB-27907) - Liveview: Compatibility with Webpack builds
* [TIMOB-27977](https://jira.appcelerator.org/browse/TIMOB-27977) - TiAPI: Add "isTrusted" property to Ti.UI.Slider "change" event
* add basic stream shim ([1720456](https://github.com/appcelerator/titanium_mobile/commit/17204561b22ab39a731a9ed51281d6a34e3dac11))
* [MOD-2621](https://jira.appcelerator.org/browse/MOD-2621) - use ASWebAuthenticationSession when possible ([5e1dfa1](https://github.com/appcelerator/titanium_mobile/commit/5e1dfa1d36c267e8eaed484203366a9fd72ef7b6))

## SDK Module Versions

| Module      | Android version | iOS Version |
| ----------- | --------------- | ----------- |
| facebook | 9.0.0 | 8.0.0 |
| ti.cloudpush | 7.1.0 | n/a |
| ti.map | 5.0.1 | 3.3.0 |
| ti.webdialog | 2.0.0 | 1.2.0 |
| ti.playservices | 17.1.1 | n/a |
| ti.identity | 3.0.2 | 1.1.0 |
| urlSession | n/a | 2.2.0 |
| ti.coremotion | n/a | 2.1.0 |
| ti.applesignin | n/a | 1.1.1 |
| ti.cloud | 3.2.11 | 3.2.11 |
| hyperloop | 5.0.3 | 5.0.3 |

## [9.0.3](https://github.com/appcelerator/titanium_mobile/compare/9_0_2_GA...9.0.3) (2020-06-10)

## About this release

Titanium SDK 9.0.3 is a patch release of the SDK, addressing high-priority issues from previous releases.

As of this GA release, the previous Titanium SDK patch release (9.0.2) is no longer supported. End of support for this version will be 2020-12-10 or until the next patch release. Note: major and minor releases continue to be supported according to their nominal lifetime.
See [Axway Appcelerator Deprecation Policy](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_deprecation_policy.html) and [Nominal Lifetimes](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_product_lifecycle.html#AxwayAppceleratorProductLifecycle-NominalLifetimes) documents for details.

:warning: With the release of Titanium SDK 9.0.0, we no longer support Node.js 8.X. Node 10.13.0 is the new minimum supported version.

## Bug Fixes

### Android platform

* [TIMOB-27573](https://jira.appcelerator.org/browse/TIMOB-27573) - Hiding/Showing progress indicator back-to-back puts it in a bad state as of 8.1.1 ([4e4b509](https://github.com/appcelerator/titanium_mobile/commit/4e4b5094a2d3bc2cabdf46798543fb4b291fa5ed))
* [TIMOB-27776](https://jira.appcelerator.org/browse/TIMOB-27776) - NDK version 21 outputs "Bad file descriptor"
* [TIMOB-27795](https://jira.appcelerator.org/browse/TIMOB-27795) - WebView crashes when given local HTML URL with parameters as of 8.1.0 ([5038295](https://github.com/appcelerator/titanium_mobile/commit/50382954eacaf5f7a30f2915a3cd1f7f549cef55))
* [TIMOB-27830](https://jira.appcelerator.org/browse/TIMOB-27830) - TabGroup.titleColor has no effect ([#11741](https://github.com/appcelerator/titanium_mobile/pull/11741))
* [TIMOB-27831](https://jira.appcelerator.org/browse/TIMOB-27831) - Implement TabGroup.tintColor ([#11741](https://github.com/appcelerator/titanium_mobile/pull/11741))
* [TIMOB-27904](https://jira.appcelerator.org/browse/TIMOB-27904) - Incremental build duplicates "bootstrap.json" entries as of 8.1.0 ([5ab9a5a](https://github.com/appcelerator/titanium_mobile/commit/5ab9a5a54f88922fc233c221ccafb1389d7e3854))
* [TIMOB-27911](https://jira.appcelerator.org/browse/TIMOB-27911) - ActiveTab not highlighted ([#11741](https://github.com/appcelerator/titanium_mobile/pull/11741))
* [TIMOB-27912](https://jira.appcelerator.org/browse/TIMOB-27912) - chrome devtools URL is no longer valid ([edcb376](https://github.com/appcelerator/titanium_mobile/commit/edcb37672b058678819b3a3e6efdf03205e770f0))
* [TIMOB-27939](https://jira.appcelerator.org/browse/TIMOB-27939) - Module builds should auto-download NDK r21c by default if needed
* allow Tab barColor to be set ([98718ac](https://github.com/appcelerator/titanium_mobile/commit/98718acd44f71c074e6dbd83ee9d27a4ef6ac95f))

### iOS platform

* [TIMOB-27847](https://jira.appcelerator.org/browse/TIMOB-27847) - Implement Tab tintColor and activeTintColor ([#11741](https://github.com/appcelerator/titanium_mobile/pull/11741))
* [TIMOB-27898](https://jira.appcelerator.org/browse/TIMOB-27898) - Race condition in setTimeout/clearTimeout (regression) ([bbba4cd](https://github.com/appcelerator/titanium_mobile/commit/bbba4cd46aa0a4d5b3ca94c939db176efe27652c))
* [TIMOB-27903](https://jira.appcelerator.org/browse/TIMOB-27903) - APSHTTPRequest dealloc logged when using http calls ([14c98df](https://github.com/appcelerator/titanium_mobile/commit/14c98dfb1b316d33aa9daeb1cbacdcde348dd4a8))

## SDK Module Versions

| Module      | Android version | iOS Version |
| ----------- | --------------- | ----------- |
| facebook | 9.0.0 | 7.0.1 |
| ti.cloudpush | 7.0.0 | n/a |
| ti.map | 5.0.1 | 3.3.0 |
| ti.webdialog | 2.0.0 | 1.2.0 |
| ti.playservices | 17.1.1 | n/a |
| ti.identity | 3.0.1 | 1.1.0 |
| urlSession | n/a | 2.2.0 |
| ti.coremotion | n/a | 2.1.0 |
| ti.applesignin | n/a | 1.1.1 |
| ti.cloud | 3.2.11 | 3.2.11 |
| hyperloop | 5.0.3 | 5.0.3 |

## [9.0.2](https://github.com/appcelerator/titanium_mobile/compare/9_0_1_GA...9.0.2) (2020-05-19)

## About this release

Titanium SDK 9.0.2 is a patch release of the SDK, addressing high-priority issues from previous releases.

As of this GA release, the previous Titanium SDK patch release (9.0.1) is no longer supported. End of support for this version will be 2020-11-19 or until the next patch release. Note: major and minor releases continue to be supported according to their nominal lifetime.
See [Axway Appcelerator Deprecation Policy](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_deprecation_policy.html) and [Nominal Lifetimes](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_product_lifecycle.html#AxwayAppceleratorProductLifecycle-NominalLifetimes) documents for details.

:warning: With the release of Titanium SDK 9.0.0, we no longer support Node.js 8.X. Node 10.13.0 is the new minimum supported version.

## Community Credits

* Hans Knöchel
  * [TIMOB-27721](https://jira.appcelerator.org/browse/TIMOB-27721) - properly set ImageView tintColor ([f3e9507](https://github.com/appcelerator/titanium_mobile/commit/f3e9507b1357d7981c509872f3d524c7cbea2cf4))

* Sergey Volkov
  * [TIMOB-27505](https://jira.appcelerator.org/browse/TIMOB-27505) - configuration change not saved in current context ([ddeafd7](https://github.com/appcelerator/titanium_mobile/commit/ddeafd740949a343e3863b89b77a6dc505632244))

## Bug Fixes

### Android platform

* [TIMOB-27505](https://jira.appcelerator.org/browse/TIMOB-27505) - Configuration change not saved in context for API < 26
* [TIMOB-27513](https://jira.appcelerator.org/browse/TIMOB-27513) - TabGroup bottom navigation style fires redundant event ([5cd74a5](https://github.com/appcelerator/titanium_mobile/commit/5cd74a5f47915cd52571a067aace298e265ab6c3))
* [TIMOB-27625](https://jira.appcelerator.org/browse/TIMOB-27625) - Setting picker's minDate/maxDate after opening window not correctly applied ([8e8bcc6](https://github.com/appcelerator/titanium_mobile/commit/8e8bcc64263e787d264b3e8dfb62ea4dcb1561b6))
* [TIMOB-27721](https://jira.appcelerator.org/browse/TIMOB-27721) - Ti.UI.ImageView#tintColor is multiplied, not replaced (like iOS)
* [TIMOB-27774](https://jira.appcelerator.org/browse/TIMOB-27774) - Ti.Blob.imageAsResized() not working for JPEG with exif rotation as of 8.1.0 ([cf4cc22](https://github.com/appcelerator/titanium_mobile/commit/cf4cc22ce0342584a735dc101858bd9cd4964a3c))
* [TIMOB-27769](https://jira.appcelerator.org/browse/TIMOB-27769) - Textfield inputs not setting in focused textfield and Keyboard not showing (sometimes) on a textfields which is focused ([2afd818](https://github.com/appcelerator/titanium_mobile/commit/2afd8186e8561056a7ec08b65d3d338edf2a44d6))
* [TIMOB-27798](https://jira.appcelerator.org/browse/TIMOB-27798) - module build to download ndk with gradle tool 3.5.0+ ([7545627](https://github.com/appcelerator/titanium_mobile/commit/75456275f1765db5ef13ecf730e3c878cb6acfbc))
* [TIMOB-27849](https://jira.appcelerator.org/browse/TIMOB-27849) - Ti.version returns long version format when transpiled, short when not
* [TIMOB-27850](https://jira.appcelerator.org/browse/TIMOB-27850) - App/Module builds fail with JDK 14 as of 9.0.0 ([ba456bf](https://github.com/appcelerator/titanium_mobile/commit/ba456bf0c0e2098d35f4ce37f74c09785ae6c7a2))
* [TIMOB-27852](https://jira.appcelerator.org/browse/TIMOB-27852) - Production builds no longer copy AAB to distribution folder as of 9.0.1 ([1ca5f70](https://github.com/appcelerator/titanium_mobile/commit/1ca5f70029729e1c378671886fea22a836dd176e))
* [TIMOB-27881](https://jira.appcelerator.org/browse/TIMOB-27881) - ImageView tintColor has no effect ([e025e3b](https://github.com/appcelerator/titanium_mobile/commit/e025e3b3dbe670eedcaff3682ee741f0c66de81c))

### iOS platform

* [TIMOB-27851](https://jira.appcelerator.org/browse/TIMOB-27851) - Ti.Network.createHTTPClient memory leak
* [TIMOB-27861](https://jira.appcelerator.org/browse/TIMOB-27861) - Ti.Platform.openURL() callback not invoked if missing options dictionary as of 8.1.0 ([19fc45d](https://github.com/appcelerator/titanium_mobile/commit/19fc45d85b3084ffc4e9a33b33b3fc9142eaf12f))
* [TIMOB-27868](https://jira.appcelerator.org/browse/TIMOB-27868) - Ti.UI.Window.barColor cannot be changed after it was appeared ([707259b](https://github.com/appcelerator/titanium_mobile/commit/707259b14bbd301ebfffe88c8fa5d2d504cdf797))
* [TIMOB-27894](https://jira.appcelerator.org/browse/TIMOB-27894) - Navigation bar flickers on open (SDK 9.0.2 regression, iOS 13+) ([71eabb2](https://github.com/appcelerator/titanium_mobile/commit/71eabb20d3b20017daf491cc287430a9889e2347))
* [TIMOB-27839](https://jira.appcelerator.org/browse/TIMOB-27839) - Orientationchange Stops Firing on iPadOS ([bc67f73](https://github.com/appcelerator/titanium_mobile/commit/bc67f733e443ce2b40606c37e5d84398207d679b))

## Features

### iOS platform

* add list of new iPhone/iPad models for os module ([29795a7](https://github.com/appcelerator/titanium_mobile/commit/29795a7213fe8a35437e17d8b1572bc0acc0cfb9))

## SDK Module Versions

| Module      | Android version | iOS Version |
| ----------- | --------------- | ----------- |
| facebook | 9.0.0 | 7.0.1 |
| ti.cloudpush | 7.0.0 | n/a |
| ti.map | 5.0.1 | 3.3.0 |
| ti.webdialog | 2.0.0 | 1.1.0 |
| ti.playservices | 17.1.1 | n/a |
| ti.identity | 3.0.1 | 1.1.0 |
| urlSession | n/a | 2.2.0 |
| ti.coremotion | n/a | 2.1.0 |
| ti.applesignin | n/a | 1.1.1 |
| ti.cloud | 3.2.11 | 3.2.11 |
| hyperloop | 5.0.3 | 5.0.3 |

## [9.0.1](https://github.com/appcelerator/titanium_mobile/compare/9_0_0_GA...9.0.1) (2020-04-15)

## About this release

Titanium SDK 9.0.1 is a patch release of the SDK, addressing high-priority issues from previous releases.

As of this GA release, the previous Titanium SDK patch release (9.0.0) is no longer supported. End of support for this version will be 2020-10-15 or until the next patch release. Note: major and minor releases continue to be supported according to their nominal lifetime.
See [Axway Appcelerator Deprecation Policy](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_deprecation_policy.html) and [Nominal Lifetimes](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_product_lifecycle.html#AxwayAppceleratorProductLifecycle-NominalLifetimes) documents for details.

:warning: With the release of Titanium SDK 9.0.0, we no longer support Node.js 8.X. Node 10.13.0 is the new minimum supported version.

## Bug Fixes

### Android platform

* [TIMOB-17203](https://jira.appcelerator.org/browse/TIMOB-17203) - TextField keyboardType: parity issues between iOS and Android
* [TIMOB-26678](https://jira.appcelerator.org/browse/TIMOB-26678) - Unnecessary default notification channel created when using a custom one ([1652d08](https://github.com/appcelerator/titanium_mobile/commit/1652d0878f5735db2a1673d46af1254e91147937))
* [TIMOB-27493](https://jira.appcelerator.org/browse/TIMOB-27493) - Videos do not play correctly on Android 5.1 (API 22) ([960d208](https://github.com/appcelerator/titanium_mobile/commit/960d208898939f37c9a11621e3e6a2ce267e50a8)) ([5a5c0f5](https://github.com/appcelerator/titanium_mobile/commit/5a5c0f5201d1d2209273196348968e3d94088f2c))
* [TIMOB-27530](https://jira.appcelerator.org/browse/TIMOB-27530) - UI glitches out when using 'applyProperties' with Scroll View Touch Listeners
* [TIMOB-27695](https://jira.appcelerator.org/browse/TIMOB-27695) - Heavy image processing methods do not trigger GC ([26982f3](https://github.com/appcelerator/titanium_mobile/commit/26982f304121cd235cc6b04b9dc3a3c87614a8bd))
* [TIMOB-27741](https://jira.appcelerator.org/browse/TIMOB-27741) - fall through request permissions ([7bede6f](https://github.com/appcelerator/titanium_mobile/commit/7bede6f7cf52ca78bec65d514ec3e930cc9428c3))
* [TIMOB-27742](https://jira.appcelerator.org/browse/TIMOB-27742) - Minor camera focus issues ([ab3d8c6](https://github.com/appcelerator/titanium_mobile/commit/ab3d8c6083d549d42a1b48ca401086fa074e0374))
* [TIMOB-27777](https://jira.appcelerator.org/browse/TIMOB-27777) - Obtain holder for module references ([764f024](https://github.com/appcelerator/titanium_mobile/commit/764f024daf5b95a288104d5e374c2eb35b80d641))
* [TIMOB-27780](https://jira.appcelerator.org/browse/TIMOB-27780) - Hyperloop builds fail if JDK 12 or higher is installed  ([#11510](https://github.com/appcelerator/titanium_mobile/pull/11510))
* [TIMOB-27781](https://jira.appcelerator.org/browse/TIMOB-27781) - App/Module builds fail with JDK 13 as of 9.0.0 ([caaaa04](https://github.com/appcelerator/titanium_mobile/commit/caaaa0480d3d2ad52e637b34b92e36f0d2195c3e))
* [TIMOB-27784](https://jira.appcelerator.org/browse/TIMOB-27784) - Running "clean" on a module will error if "libs" folder does not exist ([e90b8af](https://github.com/appcelerator/titanium_mobile/commit/e90b8af9304a4911edc50fed3b325f7d2504bdc7))
* [TIMOB-27823](https://jira.appcelerator.org/browse/TIMOB-27823) - javascript files/content assumed to be binary for Ti.Blob on apilevel 29+ ([efa3c64](https://github.com/appcelerator/titanium_mobile/commit/efa3c64e75752ea3b1ea082a41e78584df838462))
* [TIMOB-27837](https://jira.appcelerator.org/browse/TIMOB-27837) - Custom theme ignored by modal/translucent windows as of 9.0.0 ([8e3ce4d](https://github.com/appcelerator/titanium_mobile/commit/8e3ce4da0d1f83ac7f258cb9e1c9092250191951))

### iOS platform

* [TIMOB-27751](https://jira.appcelerator.org/browse/TIMOB-27751) - WKWebView cookies issue ([aab53e7](https://github.com/appcelerator/titanium_mobile/commit/aab53e701ad1f4d50698283ffdb3e2f161624585))
* [TIMOB-27754](https://jira.appcelerator.org/browse/TIMOB-27754) - SearchBar text color and hinTextColor does not work properly. ([f881591](https://github.com/appcelerator/titanium_mobile/commit/f88159142a52a8acf6b6b933fd7e5bd8789d40ab))
* [TIMOB-27768](https://jira.appcelerator.org/browse/TIMOB-27768) - TypeError: Cannot read property 'logger' of undefined ([1c0d85f](https://github.com/appcelerator/titanium_mobile/commit/1c0d85f865a11b935ed86e49e963da54274be823))
* [TIMOB-27799](https://jira.appcelerator.org/browse/TIMOB-27799) - App crashes when setting video player url to null ([01e5798](https://github.com/appcelerator/titanium_mobile/commit/01e57985826b7552e1e23c63f4a31c61b622156e))
* [TIMOB-27820](https://jira.appcelerator.org/browse/TIMOB-27820) - iOS 10: SearchBar color property does not work with showCancel property ([e013135](https://github.com/appcelerator/titanium_mobile/commit/e013135988dc00436c5da9cfc690bd965240306e))
* [TIMOB-27822](https://jira.appcelerator.org/browse/TIMOB-27822) - Ti.UI.iPad.Popover including arrow in content view on iOS 13 ([9b349fb](https://github.com/appcelerator/titanium_mobile/commit/9b349fbe312774a5f25d6f11aac85db36d41bf15))
* [TIMOB-27824](https://jira.appcelerator.org/browse/TIMOB-27824) - Hyperloop: iOS - build fails after updating XCode to 11.4 ([14f7bb5](https://github.com/appcelerator/titanium_mobile/commit/14f7bb5b666534342aa5c8afefab53e61d7b5729))
* [TIMOB-27827](https://jira.appcelerator.org/browse/TIMOB-27827) - Error reporting is broken after updating to Xcode 11.4 / iOS 13.4 ([3e06680](https://github.com/appcelerator/titanium_mobile/commit/3e0668000ef1baac5dff3570cf2a36c61ee91d8e))

## Improvements

### Android platform

* [TIMOB-27574](https://jira.appcelerator.org/browse/TIMOB-27574) - Replace SDK "build.properties" with gradle generated "BuildConfig" class
* [TIMOB-27745](https://jira.appcelerator.org/browse/TIMOB-27745) - Add "google-services.json" support for Firebase ([5422e25](https://github.com/appcelerator/titanium_mobile/commit/5422e25d415f77e62486d1fde839ebdffb6de523))
* [TIMOB-27755](https://jira.appcelerator.org/browse/TIMOB-27755) - Add NDK side-by-side support ([0935163](https://github.com/appcelerator/titanium_mobile/commit/0935163c97cd247e35b6a6546c49aa4084f9e3ed))
* [TIMOB-27778](https://jira.appcelerator.org/browse/TIMOB-27778) - Update gradle build tools to 3.6.x
* improve sdk kroll-apt incremental build times ([558b6ed](https://github.com/appcelerator/titanium_mobile/commit/558b6ed670dc376811ecda6d26d1aaeffaccadfd))
* build should auto-download NDK if not installed ([6c1a206](https://github.com/appcelerator/titanium_mobile/commit/6c1a206c6b66de3bf53578be3f0547e2956944c7))

## SDK Module Versions

| Module      | Android version | iOS Version |
| ----------- | --------------- | ----------- |
| facebook | 9.0.0 | 7.0.1 |
| ti.cloudpush | 7.0.0 | n/a |
| ti.map | 5.0.1 | 3.3.0 |
| ti.webdialog | 2.0.0 | 1.1.0 |
| ti.playservices | 17.1.1 | n/a |
| ti.identity | 3.0.1 | 1.1.0 |
| urlSession | n/a | 2.2.0 |
| ti.coremotion | n/a | 2.1.0 |
| ti.applesignin | n/a | 1.1.1 |
| ti.cloud | 3.2.11 | 3.2.11 |
| hyperloop | 5.0.3 | 5.0.3 |


# [9.0.0](https://github.com/appcelerator/titanium_mobile/compare/8_3_X...9.0.0) (2020-02-07)

## About this release

Titanium SDK 9.0.0 is a major release of the SDK, addressing high-priority issues from previous releases; introducing some breaking changes; and removing a number of long-deprecated APIs.

As of this release, Titanium SDK 8.x will not be supported one calendar year (2021-02-07) from 9.0.0's release date.
See [Axway Appcelerator Deprecation Policy](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_deprecation_policy.html) and [Nominal Lifetimes](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_product_lifecycle.html#AxwayAppceleratorProductLifecycle-NominalLifetimes) documents for details.

:warning: With the release of Titanium SDK 9.0.0, we will no longer support Node.js 8.X. Node 10.2.0 will be the new minimum supported version with SDK 9.0.0.

## Community Credits

* Sergey Volkov
    * fix optional parameters on "timers" methods ([8a00014](https://github.com/appcelerator/titanium_mobile/commit/8a0001478a94c9714f8b9b68e96c96ad1b5db50b))
    * split interface and property definition for console and JSON ([958a6a3](https://github.com/appcelerator/titanium_mobile/commit/958a6a3dcc086b835ed2c887512bd65c1c9e3ea5))
    * fix Ti.UI.TableView.setData argument ([70c16f7](https://github.com/appcelerator/titanium_mobile/commit/70c16f7ca213f39791330758489be4f951dfa1ab))
    * fix PickerColumn parent class ([0a55a4b](https://github.com/appcelerator/titanium_mobile/commit/0a55a4bf37c78fbbac90029acb2941f0a65f74a2))
    * remove duplicate events from Ti.UI.Tab ([f618aeb](https://github.com/appcelerator/titanium_mobile/commit/f618aeba79bcaae680ccc9adcfcc07c23f8e2f92))
    * fix Ti.UI.iOS.ApplicationShortcuts.getDynamicShortcut ([a841846](https://github.com/appcelerator/titanium_mobile/commit/a8418468355e9e12393426dfba51c7062625aec4))
    * fix Ti.Platform.openURL parameters ([17f258d](https://github.com/appcelerator/titanium_mobile/commit/17f258d651b7d0ead72c195f0a35a4a1d67703b5))
    * fix Ti.UI.Slider.value type ([2663d7d](https://github.com/appcelerator/titanium_mobile/commit/2663d7d052891bf0a72978e2d476e187e3c2c7ba))
    * fix Ti.Media.audioSessionCategory type ([21bca1d](https://github.com/appcelerator/titanium_mobile/commit/21bca1db38af27deb0199e56322e185b872cefb2))
    * fix type of "services" property ([410aee2](https://github.com/appcelerator/titanium_mobile/commit/410aee28f9cd33f68f36d19f545f3bb161edfd1f))
    * add missing types for events properties ([5b7732f](https://github.com/appcelerator/titanium_mobile/commit/5b7732f71a7b50c0572c07abf1df08a74cba0f5a))
    * remove "optional" key from event property ([b1c0967](https://github.com/appcelerator/titanium_mobile/commit/b1c09673123bd08c2248dba05735623a13f7e060))
    * add missing types for events properties ([76cd92a](https://github.com/appcelerator/titanium_mobile/commit/76cd92aaa2676ea7568f63e717b56d675fa06b9d))
    * add Ti.UI.View.id property ([b295e63](https://github.com/appcelerator/titanium_mobile/commit/b295e6321ba38e29612b51d93c1518e87e6fffee))
    * mark as optional property "animated" of AnimationOption ([aee1bdd](https://github.com/appcelerator/titanium_mobile/commit/aee1bdda2de633df07013e0102aacfbb3c77d6cb))
    * remove duplicate prop "category" from "localnotificationaction" ([163065a](https://github.com/appcelerator/titanium_mobile/commit/163065a7496702b9e705f7a9f74b84b5e981220b))

* Hans Knöchel
  *  add generated .cxx directory to .gitignore ([37b446c](https://github.com/appcelerator/titanium_mobile/commit/37b446cbdb439d0d911f403a8514ca6aa562c748))
    * [TIMOB-27441](https://jira.appcelerator.org/browse/TIMOB-27441) - do not log Ti.App events ([2c84e30](https://github.com/appcelerator/titanium_mobile/commit/2c84e3070a8870edb9b1bc1645468d4f82174fe1))

* Giorgio Mandolini
    * webview onlink is now called only on link activated ([aedd2aa](https://github.com/appcelerator/titanium_mobile/commit/aedd2aa87d4fa2800bb3ed79fa2aeed9cbbd3568))
  
* Michael Gangolf
    * optimize all pngs (#11321) ([e563e28](https://github.com/appcelerator/titanium_mobile/commit/e563e28d1d2cc558dbfe924c38f5df764fb3fea8))
    * [TIMOB-13286](https://jira.appcelerator.org/browse/TIMOB-13286) - add single/doubletap to scrollview ([0326b7e](https://github.com/appcelerator/titanium_mobile/commit/0326b7eaf2a7c9f003f955cdad10b2b156dff75c))

* David Bankier
    * [TIMOB-23281](https://jira.appcelerator.org/browse/TIMOB-23281) - search bar color ignored on ios 13+ ([0aa9b36](https://github.com/appcelerator/titanium_mobile/commit/0aa9b36065fe63585208412f8f1818253df65778))

* Mathias Lykkegaard Lorenzen
    * make event argument in fireEvent optional ([0250df0](https://github.com/appcelerator/titanium_mobile/commit/0250df08784e6e9a86a375882de1bf4d675a3bef))



## Bug Fixes

### Android platform

* add extension to encrypted assets ([bf8a6bf](https://github.com/appcelerator/titanium_mobile/commit/bf8a6bfd3ca17d3389cb6c8fc775886638226093))
* [TIMOB-27606](https://jira.appcelerator.org/browse/TIMOB-27606) - amend load app info order ([38ea44b](https://github.com/appcelerator/titanium_mobile/commit/38ea44b6d577d8836e0a463032598651a6232a01))
* avoid infinite recursion in tab/tabgroup toJSON() ([7280fcc](https://github.com/appcelerator/titanium_mobile/commit/7280fcc4f187a10ee41a8fa67d9933c9a8217248))
* avoid recursion, properties beginning with _ in toJSON() ([f5b6561](https://github.com/appcelerator/titanium_mobile/commit/f5b65613add7357ec4b8fccc663ba24cb84dbfb1))
* [TIMOB-27706](https://jira.appcelerator.org/browse/TIMOB-27706) - build with uppercase module JAR on case-sensitive system ([8a906c7](https://github.com/appcelerator/titanium_mobile/commit/8a906c74d46025247e69179699384c983c09020f))
* can't set versionCode in manifest as of 9.0.0 ([a69f6b6](https://github.com/appcelerator/titanium_mobile/commit/a69f6b6df5bd433306be51b3d86f283573918a32))
* [TIMOB-27633](https://jira.appcelerator.org/browse/TIMOB-27633) - clean up module/require code ([612afd7](https://github.com/appcelerator/titanium_mobile/commit/612afd7e40dc2469d6e35d5fcea65b44d583b0e0))
* [TIMOB-27747](https://jira.appcelerator.org/browse/TIMOB-27747) - crash with old "ti.playservices" in 9.0.0 ([c194ecf](https://github.com/appcelerator/titanium_mobile/commit/c194ecfe06b5fd42b66131d5809f4bee45aaa9f9))
* [TIMOB-27694](https://jira.appcelerator.org/browse/TIMOB-27694) - default Ti.Ui.TextField.editable is true in #focus() ([99d08f6](https://github.com/appcelerator/titanium_mobile/commit/99d08f6ad81b6caa07a43ecbbbfeca45df4a3ed9))
* [TIMOB-27496](https://jira.appcelerator.org/browse/TIMOB-27496) - do not modify original ListView proxy ([e75b514](https://github.com/appcelerator/titanium_mobile/commit/e75b514c1ea0f14a8f1e2e6e91a33502b921e164))
* [TIMOB-25945](https://jira.appcelerator.org/browse/TIMOB-25945) - fix losing elevation effect after dimensions change ([f46784b](https://github.com/appcelerator/titanium_mobile/commit/f46784bb83bf630de23a89e3c53fea4b5940729e))
* fix scroll view's layout resizing with children ([5723b11](https://github.com/appcelerator/titanium_mobile/commit/5723b11146548fb759092b0db5567b12a151efe4))
* fix support for Java 8 in Kotlin ([2287e83](https://github.com/appcelerator/titanium_mobile/commit/2287e8379091bc4c492d33245f0e48e4bfc61b8a))
* getCurrentPosition() compatibility with some Samsung devices ([fa5866a](https://github.com/appcelerator/titanium_mobile/commit/fa5866aa371e7b34e02e4463abf309946eeb2105))
* improve reliability of fused location lib detection ([b8cc24a](https://github.com/appcelerator/titanium_mobile/commit/b8cc24a7c4974e886d3dc088edf8a8a88d65a6fd))
* location permission not auto-added as of 9.0.0 ([db56070](https://github.com/appcelerator/titanium_mobile/commit/db56070cd4366142205b9b0b5d9b783fedb313c0))
* [TIMOB-27684](https://jira.appcelerator.org/browse/TIMOB-27684) - prevent duplicate launch animation ([135e3dc](https://github.com/appcelerator/titanium_mobile/commit/135e3dc35e99b0c1f5ced6c91b1fb3b453a25815))
* prevent snapshots from failing build ([40bd1d9](https://github.com/appcelerator/titanium_mobile/commit/40bd1d92749857a37ebea2fa87c2f064d1775a51))
* remove deprecated contacts methods ([7e0a46a](https://github.com/appcelerator/titanium_mobile/commit/7e0a46af3bb795193152f2421e5ea924871365f7))
* remove deprecated contacts methods ([7caecb8](https://github.com/appcelerator/titanium_mobile/commit/7caecb878cf76e89377c55517a7504c72e732925))
* [TIMOB-27602](https://jira.appcelerator.org/browse/TIMOB-27602) - softRestart() must account for snapshots ([62a603d](https://github.com/appcelerator/titanium_mobile/commit/62a603d4edc74109234306ef00b48dfcacdc3c5e))
* specify default inspector context ([c29960d](https://github.com/appcelerator/titanium_mobile/commit/c29960d41b18923a497ac0468ff0c9e5a216bcc1))
* [TIMOB-27746](https://jira.appcelerator.org/browse/TIMOB-27746) [TIMOB-27746](https://jira.appcelerator.org/browse/TIMOB-27746) - strip xmlns definitions from child elements in AndroidManifest.xml ([476ac79](https://github.com/appcelerator/titanium_mobile/commit/476ac79f4d1d090f6b3399ce35adb0cdb2f1c868))
* [TIMOB-27406](https://jira.appcelerator.org/browse/TIMOB-27406) - support raw document identifiers ([c2d89d4](https://github.com/appcelerator/titanium_mobile/commit/c2d89d48cb652b2426e93176d037661487015f4e))
* use correct blob for toImage() ([f07e012](https://github.com/appcelerator/titanium_mobile/commit/f07e012dd25a626415fe56c339fed803af0ff281))

### iOS platform

* [TIMOB-27623](https://jira.appcelerator.org/browse/TIMOB-27623) -  server is receiving two consecutive calls for the same url ([8cdac18](https://github.com/appcelerator/titanium_mobile/commit/8cdac1898091dd7020d458c4ef66a8d36cb41e7e))
* [TIMOB-27158](https://jira.appcelerator.org/browse/TIMOB-27158) -  ui glitch in lazyloading fixed ([c00da08](https://github.com/appcelerator/titanium_mobile/commit/c00da0812ba07ed6265f999dc397506687d9698f))
* added proper condtion to import MediaPlayer ([3943012](https://github.com/appcelerator/titanium_mobile/commit/3943012eca4abf9515c6290548203f68f6754fc6))
* [TIMOB-27159](https://jira.appcelerator.org/browse/TIMOB-27159) - allow changing WebView read access when loading local file ([dd7b319](https://github.com/appcelerator/titanium_mobile/commit/dd7b319207277494fb87731a0d0b0232845d7312))
* behaviour of toString function of TiBlob fixed ([e63b30e](https://github.com/appcelerator/titanium_mobile/commit/e63b30e41d89f23556a48c6a50d5a6635ff5ef89))
* cookies updated while reloading webview ([fc11337](https://github.com/appcelerator/titanium_mobile/commit/fc1133732d1d33405e0cf693a74e61d5ef7783a3))
* expose TiApp singleton accessor to swift ([495d76c](https://github.com/appcelerator/titanium_mobile/commit/495d76ce367551e52f0b2779ed856ec0955e3f52))
* [TIMOB-27350](https://jira.appcelerator.org/browse/TIMOB-27350) - fix toString() for binary blobs ([c95ddb3](https://github.com/appcelerator/titanium_mobile/commit/c95ddb3b45b536f193d60065f7c1cef1ebd44491))
* handle when new proxies are created with dictionary arguments ([2c8e2ac](https://github.com/appcelerator/titanium_mobile/commit/2c8e2ac07e07a49434bded23324d8e7f9492ae8a))
* handle when throwing new obj-c proxy error without subreason ([3e2934b](https://github.com/appcelerator/titanium_mobile/commit/3e2934bbe5bd74626e0b6e12fd28583373f6bcb4))
* navBar properties not working properly with extendEdges set to Ti.UI.EXTEND_EDGE_TOP ([d673c36](https://github.com/appcelerator/titanium_mobile/commit/d673c362888de7d0ceda6509ab2a222231d399c8))
* proper macro used for wrapping code ([5bb63c5](https://github.com/appcelerator/titanium_mobile/commit/5bb63c55229ba1088a3e9d5c5e2e5819ddc70e24))
* remove deprecated contacts methods ([207b4ab](https://github.com/appcelerator/titanium_mobile/commit/207b4ab2f59c2852c5e0ba1a5068031fe62fb076))
* remove deprecated contacts methods ([e8c4b43](https://github.com/appcelerator/titanium_mobile/commit/e8c4b436098883767747acf7cb08add04af5d0cc))
* remove deprecated tab blur/focus events ([f5d0bbe](https://github.com/appcelerator/titanium_mobile/commit/f5d0bbe4b681a26259ee206ce420ece9dcda0730))
* remove deprecated tabgroup unselected/selected events ([74f1134](https://github.com/appcelerator/titanium_mobile/commit/74f1134424d825204b9f445499c783711ceb07a7))
* remove deprecated TextField padding properties ([337ee8f](https://github.com/appcelerator/titanium_mobile/commit/337ee8fb67110a06ce56e37b0617a196dc9377a5))
* remove deprecated Ti.Media methods ([e8fff19](https://github.com/appcelerator/titanium_mobile/commit/e8fff19fd1cd4b07498e8cdd39b481e70f3a1662))
* remove deprecated Ti.Media methods ([b3bd05e](https://github.com/appcelerator/titanium_mobile/commit/b3bd05ea6fb2d60ce2591f0bbf7714442384344d))
* remove deprecated UI appearance properties ([b8c1f84](https://github.com/appcelerator/titanium_mobile/commit/b8c1f845e964a03b3fbb0c6236bc6411efba616a))
* remove references to Ti.Contacts methods that are removed ([440e9cc](https://github.com/appcelerator/titanium_mobile/commit/440e9ccb720be9ac5096749ad13d44a09107e5cf))
* [TIMOB-27480](https://jira.appcelerator.org/browse/TIMOB-27480) - setting last index of tabbedBar after initialization not work ([5fbe782](https://github.com/appcelerator/titanium_mobile/commit/5fbe78276e04049874e13bcc0a3874593f27254e))
* status bar background color crash fix ios13 ([b999f27](https://github.com/appcelerator/titanium_mobile/commit/b999f2716088d221bc9e146233cbb559776ad4df))
* statusbar ui issue fixed ([6a5664b](https://github.com/appcelerator/titanium_mobile/commit/6a5664bf92657ee31d478529ab42df67471abc7c))
* tintColor not working for TabbedBar in  iOS 13 ([ec6fbf6](https://github.com/appcelerator/titanium_mobile/commit/ec6fbf624e27ac4f7c798bf7d93966ff74a930d7))
* [TIMOB-27484](https://jira.appcelerator.org/browse/TIMOB-27484) - update to core-js 3 ([ffa4cef](https://github.com/appcelerator/titanium_mobile/commit/ffa4cefa7c6f3ec1b33963cbee3eecd3e6b07ab0))
* [TIMOB-27630](https://jira.appcelerator.org/browse/TIMOB-27630) - use correct target for transpiling on ios ([c4a998a](https://github.com/appcelerator/titanium_mobile/commit/c4a998ad8442737afa957deee4e1cc2e938fca57))
* when firing events to new proxies, fill in type/source ([e56abfc](https://github.com/appcelerator/titanium_mobile/commit/e56abfca2705c71e88acbd2ff946a176a4df4e38))


## Features

### Multiple platforms

* use babel-plugin-transform-titanium when transpiling ([c21f77c](https://github.com/appcelerator/titanium_mobile/commit/c21f77cec7773b8d925fd801235ce87531c7af9b))

### Android platform

* [TIMOB-26434](https://jira.appcelerator.org/browse/TIMOB-26434) - added app-bundle support ([5d93fea](https://github.com/appcelerator/titanium_mobile/commit/5d93fea7d73b59c510e730167508f789932f3fa2))
* [TIMOB-27686](https://jira.appcelerator.org/browse/TIMOB-27686) - allow gradle to automatically download missing dependencies ([57a6b49](https://github.com/appcelerator/titanium_mobile/commit/57a6b4952a192b6b52f4f8bddef43c126c52a5e3))
* [TIMOB-27718](https://jira.appcelerator.org/browse/TIMOB-27718) - log build warnings if res files have invalid names ([e7df669](https://github.com/appcelerator/titanium_mobile/commit/e7df669db667e1aaf22b57d84b0a2bad8750783b))
* [TIMOB-27696](https://jira.appcelerator.org/browse/TIMOB-27696) - replace Support libraries with AndroidX ([0558c28](https://github.com/appcelerator/titanium_mobile/commit/0558c28b54dfb195d7a5c22851060e416e9811f8))
* target Java8 and Kotlin support for native modules ([5ce5e72](https://github.com/appcelerator/titanium_mobile/commit/5ce5e72b3a90803fc4b54555cd0e8b900c756d9e))
* [TIMOB-27685](https://jira.appcelerator.org/browse/TIMOB-27685) [TIMOB-27298](https://jira.appcelerator.org/browse/TIMOB-27298) [TIMOB-27297](https://jira.appcelerator.org/browse/TIMOB-27297) - update hyperloop for gradle ([13f78c4](https://github.com/appcelerator/titanium_mobile/commit/13f78c4a3023ba997e55267b70c039e1331af682))
* Update V8 to 7.8.279.23 ([9006b4d](https://github.com/appcelerator/titanium_mobile/commit/9006b4d58b8fc827545e7fcbc5ff740bf49fe939))

### iOS platform

* [TIMOB-25847](https://jira.appcelerator.org/browse/TIMOB-25847) - support font scaling for custom fonts ([8045620](https://github.com/appcelerator/titanium_mobile/commit/8045620c933c007d77079e87beeeadddcc0f93f6))


## BREAKING CHANGES

### Multiple platforms

* [TIMOB-27605](https://jira.appcelerator.org/browse/TIMOB-27605) - Removal of Node 8 support, move to Node 10.13+ ([f35cf0e](https://github.com/appcelerator/titanium_mobile/commit/f35cf0ebfc880d0161f65ca075fdd275a2ecb824))
* [TIMOB-27650](https://jira.appcelerator.org/browse/TIMOB-27650) - Remove ti.touchid and ti.safaridialog from the SDK distribution
* [TIMOB-25578](https://jira.appcelerator.org/browse/TIMOB-25578) - Ti.Geoclocation.reverseGeocoder now uses consistent properties postalCode (in place of zipcode) and countryCode (in place of country_code) ([3d32e33](https://github.com/appcelerator/titanium_mobile/commit/3d32e334987e67967c9ef0b513fe88b220ac9e19))


### Android platform

* Removed Ti.Contacts requestAuthorization method (in favor of requestContactsPermissions)
* Removed Ti.Contacts getPersonByID method (in favor of getPersonByIdentifier)
* Removed the create, destroy, pause, restart, resume, start, and stop events on Ti.Android.Activity (use callback properties) ([0221467](https://github.com/appcelerator/titanium_mobile/commit/02214671f1897371b12894e6e8e5654b67697e6d))
* Removed the Ti.UI.Webview onStopBlacklistedUrl event. Please use blacklisturl event instead ([85b32d8](https://github.com/appcelerator/titanium_mobile/commit/85b32d8b110b56e1d6d8b14276a9f254a8d5f00d))
* Removed deprecated Ti.UI.Window.android:* events ([f01055c](https://github.com/appcelerator/titanium_mobile/commit/f01055c5038b2da748e3aaecc5819ebcc09abb98))
* Removed deprecated webview error event properties: errorCode and message ([5144ac9](https://github.com/appcelerator/titanium_mobile/commit/5144ac9646fd9b4ce4e9685238cbcd8de793943f))
* Removed deprecated tcp error callback errorCode property ([7e405aa](https://github.com/appcelerator/titanium_mobile/commit/7e405aa9449554c81d1014666c57d8497541161a))
* Removed deprecated stream callback properties ([4b48db8](https://github.com/appcelerator/titanium_mobile/commit/4b48db872f7389218072a07c8734781cc41e7bcb))
* Removed the LINKIFY_* constants living in Android namespace ([7c88912](https://github.com/appcelerator/titanium_mobile/commit/7c88912487fbc9aa84b73e324f8eda25540aa148))


### iOS platform

* [TIMOB-27497](https://jira.appcelerator.org/browse/TIMOB-27497) -  Drops support for Xcode 8. Please use Xcode 9+ ([d5ede39](https://github.com/appcelerator/titanium_mobile/commit/d5ede39dfb7023c86bd24932166cb390c8e97b69))
* Removed Ti.UI.TextField paddingLeft and paddingRight properties (in favor of padding.left and padding.right)
* Removed Ti.Media requestAudioPermissions method (in favor of requestAudioRecorderPermissions)
* Removed Ti.Media requestAuthorization and requestCameraAccess methods (in favor of requestAudioRecorderPermissions and requestCameraPermissions)
* Removed Ti.Contacts requestAuthorization method (in favor of requestContactsPermissions)
* Removed Ti.Contacts getGroupByID and getPersonByID methods (in favor of getGroupByIdentifier and getPersonByIdentifier)
* Removed Ti.UI.Tab blur/focus events in favor of selected/unselected
* Removed Ti.UI.TabGroup selected/unselected events in favor of focus/blur
* Removed the BLEND_MODE_* constants on Ti.UI.iOS namespace (use constants on Ti.UI namespace) ([3c2a0ec](https://github.com/appcelerator/titanium_mobile/commit/3c2a0ec5c9b45c30b918c3a116b252ee3077b9bd))
* Removed Ti.UI.TextArea, Ti.UI.TextField appearance property (in favor of keyboardAppearance)
* Removed deprecated Ti.Media.cameraAuthorizationStatus property ([cbf994e](https://github.com/appcelerator/titanium_mobile/commit/cbf994e09f30a18afebd5607695d157e88d9caf0))
* Removed deprecated ipad popover properties: height, width, leftNavButton and rightNavButton ([14cd341](https://github.com/appcelerator/titanium_mobile/commit/14cd341a3922a26d8279e66d8e41aa0ac2686dd4))
* Removed deprecated tcp error callback errorCode property ([6f4814d](https://github.com/appcelerator/titanium_mobile/commit/6f4814d563b4aa2c854ef5938746b7792e5c01ad))
* Removed deprecated stream callback properties ([f4de7a9](https://github.com/appcelerator/titanium_mobile/commit/f4de7a9017dab69c0ec92e3b1bd7a675085c7c4a))
* Ti.Network.TCPSocket has been removed, use Ti.Network.Socket.TCP in it's place. ([9647181](https://github.com/appcelerator/titanium_mobile/commit/9647181250f984db9a70b833486191b9fa52c2ca))
* [TIMOB-27619](https://jira.appcelerator.org/browse/TIMOB-27619), [TIMOB-27076](https://jira.appcelerator.org/browse/TIMOB-27076) -  Ti.Network.BonjourService methods have become asynchronous. Use optional callback arguments or event listeners to react to results.
* Removed the updateLayout(), startLayout() and finishLayout() methods on Ti.UI.View ([54e2eeb](https://github.com/appcelerator/titanium_mobile/commit/54e2eeb3ce8a309312efcd9cecd2190493b7704c))


## SDK Module Versions

| Module      | Android version | iOS Version |
| ----------- | --------------- | ----------- |
| facebook | 9.0.0 | 7.0.1 |
| ti.cloudpush | 6.0.1 | n/a |
| ti.map | 5.0.0 | 3.3.0 |
| ti.webdialog | 2.0.0 | 1.1.0 |
| ti.playservices | 17.1.0 | n/a |
| ti.identity | 3.0.1 | 1.1.0 |
| urlSession | n/a | 2.2.0 |
| ti.coremotion | n/a | 2.0.1 |
| ti.applesignin | n/a | 1.1.1 |
| ti.cloud | 3.2.11 | 3.2.11 |
| hyperloop | 5.0.0 | 5.0.0 |


## [8.3.1](https://github.com/appcelerator/titanium_mobile/compare/8_3_0_GA...8.3.1) (2020-01-16)

## About this release

Titanium SDK 8.3.1 is a patch release of the SDK, addressing high-priority issues from previous releases.

As of this GA release, the previous Titanium SDK patch release (8.3.0) is no longer supported. End of support for this version will be 2020-07-16 or until the next patch release. Note: major and minor releases continue to be supported according to their nominal lifetime.
See [Axway Appcelerator Deprecation Policy](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_deprecation_policy.html) and [Nominal Lifetimes](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_product_lifecycle.html#AxwayAppceleratorProductLifecycle-NominalLifetimes) documents for details.

:warning: With the release of Titanium SDK 9.0.0, we will no longer support Node.js 8.X. Node 10.2.0 will be the new minimum supported version with SDK 9.0.0.



## Bug Fixes

### Android platform

* [TIMOB-27694](https://jira.appcelerator.org/browse/TIMOB-27694) - default Ti.Ui.TextField.editable is true in #focus() ([243afd0](https://github.com/appcelerator/titanium_mobile/commit/243afd00e0760f2060e797312942ee65d47b9f5f))
* [TIMOB-25945](https://jira.appcelerator.org/browse/TIMOB-25945) - fix losing elevation effect after dimensions change ([4b8b22a](https://github.com/appcelerator/titanium_mobile/commit/4b8b22a296cab1174917a0a672150f75bcecdcf0))
* [TIMOB-27572](https://jira.appcelerator.org/browse/TIMOB-27572) - getCurrentPosition() compatibility with some Samsung devices ([1e832a6](https://github.com/appcelerator/titanium_mobile/commit/1e832a6720aeddbfeec4442efaf02267bf8e1ca7))

### iOS platform

* [TIMOB-27158](https://jira.appcelerator.org/browse/TIMOB-27158) -  ui glitch in lazyloading fixed ([a32f713](https://github.com/appcelerator/titanium_mobile/commit/a32f71313139e6a75fcc7ad99c284a3b6839c65e))
* [TIMOB-27622](https://jira.appcelerator.org/browse/TIMOB-27622) - expose TiApp singleton accessor to swift ([981869a](https://github.com/appcelerator/titanium_mobile/commit/981869a4d40fa5e1aa8c4e34db2f1a096fc11407))
* [TIMOB-27623](https://jira.appcelerator.org/browse/TIMOB-27623) - server is receiving two consecutive calls for the same url and cookies updated while reloading webview ([8646a46](https://github.com/appcelerator/titanium_mobile/commit/8646a4606dac6ff8d554593708d2b29bb17d4d62))
* [TIMOB-27609](https://jira.appcelerator.org/browse/TIMOB-27609) - status bar background color crash fix ios13 ([0e0220c](https://github.com/appcelerator/titanium_mobile/commit/0e0220c6f349e55763acd28053b7f4ce9e4d01a6))
* [TIMOB-27350](https://jira.appcelerator.org/browse/TIMOB-27350) - updated Ti.Blob.toString() behaviour to original ([cbb82a6](https://github.com/appcelerator/titanium_mobile/commit/cbb82a6a97062b47c7a482f50d221027576215e7))


# [8.3.0](https://github.com/appcelerator/titanium_mobile/compare/8_2_X...8.3.0) (2019-11-14)

## About this release

Titanium SDK 8.3.0 is a minor release of the SDK, addressing high-priority issues from previous releases.

As of this release, Titanium SDK 8.2.x will not receive updates more than six months after the release of 8.3.0 (2020-05-21). Any needed fixes will be in 8.3.x or later supported releases within the 8.x branch.
See [Axway Appcelerator Deprecation Policy](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_deprecation_policy.html) and [Nominal Lifetimes](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_product_lifecycle.html#AxwayAppceleratorProductLifecycle-NominalLifetimes) documents for details.

:warning: With the release of Titanium SDK 9.0.0, we will no longer support Node.js 8.X. Node 10.2.0 will be the new minimum supported version with SDK 9.0.0.

## Community Credits

* Michael Gangolf
    * fix permission example for Android 8 ([be984a1](https://github.com/appcelerator/titanium_mobile/commit/be984a177c3c279eaf79f6206dff2aa04ed6b56b))
    * [TIMOB-7786](https://jira.appcelerator.org/browse/TIMOB-7786)update log strings ([1fc77a1](https://github.com/appcelerator/titanium_mobile/commit/1fc77a1a1b2355b3b8bf93dfb332edeceb40e054))
    * reset before doing a release (#10800) ([50c645e](https://github.com/appcelerator/titanium_mobile/commit/50c645e57f563e8499ff318e23e5dd18f920ecd8))
    * [TIMOB-27283](https://jira.appcelerator.org/browse/TIMOB-27283) - add contentSize to Ti.UI.ScrollView scroll event ([6ffd9d4](https://github.com/appcelerator/titanium_mobile/commit/6ffd9d4ce217839017ef66ccf7bc10e9f494e399))

* Hans Knöchel
    * [TIMOB-27272](https://jira.appcelerator.org/browse/TIMOB-27272) - expose Ti.UI.Slider „tintColor“ and „trackTintColor“ ([7238427](https://github.com/appcelerator/titanium_mobile/commit/723842717199b1244162a7b14a9874ed46103d42))
    * properly set tint-color on image-view ([7d96b81](https://github.com/appcelerator/titanium_mobile/commit/7d96b8132a8569818c78d656fd13463deceab354))

* Sergey Volkov
    * [TIMOB-26463](https://jira.appcelerator.org/browse/TIMOB-26463) - accessibility properties SDK version ([72a57ef](https://github.com/appcelerator/titanium_mobile/commit/72a57ef247abb0bedb0288260ac300385cb3d518))
    * [TIMOB-26463](https://jira.appcelerator.org/browse/TIMOB-26463) - add accessibility properties to MenuItem ([9f3c6b7](https://github.com/appcelerator/titanium_mobile/commit/9f3c6b75c3d71dd65ca7cd33383bc90d3e565d6f))

## Bug Fixes

### Android platform

* allow requestLegacyExternalStorage attribute ([097c5af](https://github.com/appcelerator/titanium_mobile/commit/097c5af442fdd278db87246fbd8640460f23e6ca))
* call WebView.stopLoading() from main thread ([438a43a](https://github.com/appcelerator/titanium_mobile/commit/438a43a9ec8d244f358af347b44bb7bb0d28fc5b))
* exclude JS in HTML files from processing ([bc45db4](https://github.com/appcelerator/titanium_mobile/commit/bc45db4d43dc763282b5bf6a6710be362c205b82))
* fix dialog without selectedIndex reusage ([a2a048f](https://github.com/appcelerator/titanium_mobile/commit/a2a048fda702bfaee61e2e0f6f9dc85aed9983f5))
* [TIMOB-27238](https://jira.appcelerator.org/browse/TIMOB-27238) - fix onlink callback being creation only ([3a46b79](https://github.com/appcelerator/titanium_mobile/commit/3a46b793111f054cf78babad6c9e2c5fcdaca4e7))
* fix reusing a dialog with a new "parent" window ([a8d06c3](https://github.com/appcelerator/titanium_mobile/commit/a8d06c35a02d77698ac6fca71e7f118e19108906))
* fix views with border and transparency ([95fed44](https://github.com/appcelerator/titanium_mobile/commit/95fed440df6051018c73d17e01a0649af820b317))
* fixes background color animation with borders ([86b3699](https://github.com/appcelerator/titanium_mobile/commit/86b3699667d89077e38f7ebf60aaef867ff95b7e))
* focus on TextInputEditText view ([8192ea2](https://github.com/appcelerator/titanium_mobile/commit/8192ea2ef626a427d9599324d9c00d8eec785793))
* [TIMOB-27302](https://jira.appcelerator.org/browse/TIMOB-27302) - guard for tab counts limit for bottom style ([6a2aa4d](https://github.com/appcelerator/titanium_mobile/commit/6a2aa4d7d5101824741fe79a77ffa2e0e48fe904))
* [TIMOB-27191](https://jira.appcelerator.org/browse/TIMOB-27191) - handle file: URIs without // after scheme ([f4cf7c6](https://github.com/appcelerator/titanium_mobile/commit/f4cf7c6e97fd19f6c7e7141114a78cafb3e1c7e1))
* [TIMOB-27108](https://jira.appcelerator.org/browse/TIMOB-27108) - HTTPClient "responseData" blob returns 0 width/height for images over 512kb ([722d6bc](https://github.com/appcelerator/titanium_mobile/commit/722d6bc04c79b7831f4fa1ae239d7fb54398e75c))
* performance issue with deeply nested views as of 7.5.0 ([057dad3](https://github.com/appcelerator/titanium_mobile/commit/057dad3a09c6b041d6ce3ca38a76bca2f6254fb3))
* prevent conflict with TextField.isSingleLine() ([20ae5fd](https://github.com/appcelerator/titanium_mobile/commit/20ae5fde99a0d8d29b7721d15fccd2b3faf88fcf))
* [TIMOB-27118](https://jira.appcelerator.org/browse/TIMOB-27118) - prevents TabGroup duplicate close event firing ([34714b8](https://github.com/appcelerator/titanium_mobile/commit/34714b854c6faf47d85730ca15e02edcdd5b1eb0))
* [TIMOB-27177](https://jira.appcelerator.org/browse/TIMOB-27177) - regression where closing root window from child window causes app exit issues as of 8.0.1 ([be7b776](https://github.com/appcelerator/titanium_mobile/commit/be7b77663bd5312a38b025ef70d6870312060d2d))
* release string ([0e21a4f](https://github.com/appcelerator/titanium_mobile/commit/0e21a4f634008eaffd0b0263d5740fcfdc84fcf0))
* [TIMOB-27271](https://jira.appcelerator.org/browse/TIMOB-27271) - resuming with intent "FLAG_ACTIVITY_MULTIPLE_TASK" can hang the app ([632c439](https://github.com/appcelerator/titanium_mobile/commit/632c4398bc71c56be81ffff47422b5686fbb14d1))
* support Geolocation altitudeAccuracy ([ac32e75](https://github.com/appcelerator/titanium_mobile/commit/ac32e75de7cd7d7c2ab23e539ca223800129d13f))
* ui module dependency path ([3b9bac8](https://github.com/appcelerator/titanium_mobile/commit/3b9bac8db0f802825c6ff32848cc4289a3551168))
* [TIMOB-27190](https://jira.appcelerator.org/browse/TIMOB-27190) - up button flickering when clicked in NavigationWindow ([69dfda5](https://github.com/appcelerator/titanium_mobile/commit/69dfda5ef5eba65df20cbe979d0bfa912bd4aaa6))
* [TIMOB-27314](https://jira.appcelerator.org/browse/TIMOB-27314) - update titanium_prep windows binaries ([978d625](https://github.com/appcelerator/titanium_mobile/commit/978d625b7b1fb730b53ba8c15929f64b868e91d8))
* [TIMOB-27193](https://jira.appcelerator.org/browse/TIMOB-27193) - use specified Ti.Filesystem.File path to createFile() ([37aace6](https://github.com/appcelerator/titanium_mobile/commit/37aace6017ec9a4b4ca49aff192c27a64c01e7bd))

### Multiple platforms

* Change from ifdef to if due to variable always being defined ([da45e5f](https://github.com/appcelerator/titanium_mobile/commit/da45e5f84f348cfb0dde1911dc7b14a0455a133e))
* disable bigint type checks ([cbb8165](https://github.com/appcelerator/titanium_mobile/commit/cbb81651ffd9c0f54a1d487888523c446d3f69c3))
* fix typo and add tests for weak map/set ([bc9faba](https://github.com/appcelerator/titanium_mobile/commit/bc9faba2f5a8ee7ba1a5470399f66a17a7846346))
* rename isRegexp usage to isRegExp ([8c1e265](https://github.com/appcelerator/titanium_mobile/commit/8c1e265c88270436476668074d3b0ab7c7d8c7d7))
* update Hyperloop to v4.0.4 for iOS 13 compatibility ([d1cc406](https://github.com/appcelerator/titanium_mobile/commit/d1cc406abd29662e4e6e1b674caa95a73e8dc95f))
* use correct should assertion syntax ([00b9845](https://github.com/appcelerator/titanium_mobile/commit/00b98453cf948338fba3986def6cfc057e105508))

### iOS platform

* added xcworkspacedata file generation ([75f3881](https://github.com/appcelerator/titanium_mobile/commit/75f388128a5f6b9035e1c205ff57cd025995eae2))
* [TIMOB-27403](https://jira.appcelerator.org/browse/TIMOB-27403) - also lookup semnantic colors in correct location for classic ([8ecfb1e](https://github.com/appcelerator/titanium_mobile/commit/8ecfb1e95397c7257c5f2ec71446b2ecb2a3e7fe))
* app crashes when error happens in fetching location ([6100379](https://github.com/appcelerator/titanium_mobile/commit/610037935b92cb26760b2cafdd5e7711b5bfc51d))
* [TIMOB-26453](https://jira.appcelerator.org/browse/TIMOB-26453) - can not show fullscreen modal windows anymore ([1e3d161](https://github.com/appcelerator/titanium_mobile/commit/1e3d161928136583d8d997b6bb629a495d1c8feb))
* close window handling from presentationController’s delegate method ([40154d7](https://github.com/appcelerator/titanium_mobile/commit/40154d7b68053f68593c804eacd5221a92b43edd))
* console.log does not log properly if it has multiple arguments ([a57701d](https://github.com/appcelerator/titanium_mobile/commit/a57701dafdc34e65470cb3921cc9302c5273dcd4))
* [TIMOB-27386](https://jira.appcelerator.org/browse/TIMOB-27386) - correctly decode device token for ios 13 compatability ([715ef61](https://github.com/appcelerator/titanium_mobile/commit/715ef612ac3bfe6ece73bdfd8dc80b4fe4867765))
* fix TiBase header to order macros properly, re-use macros ([ef26648](https://github.com/appcelerator/titanium_mobile/commit/ef266481f9588bf74dac4fd9e770eb1940f368a9))
* [TIMOB-27354](https://jira.appcelerator.org/browse/TIMOB-27354) - guard source property and removed NSNull if it is nil ([80cb018](https://github.com/appcelerator/titanium_mobile/commit/80cb01890f32a94df07b702ce133a21db551455d))
* hide dimming view ([3d492b7](https://github.com/appcelerator/titanium_mobile/commit/3d492b727d37548732d13afb8d43da527611fcfd))
* hideShadow handling for iOS 13 ([3b925d3](https://github.com/appcelerator/titanium_mobile/commit/3b925d3b89e0d59bf89b846bfa127e9656746dbf))
* [TIMOB-27395](https://jira.appcelerator.org/browse/TIMOB-27395) - include new iphone models into os extension ([b3a720a](https://github.com/appcelerator/titanium_mobile/commit/b3a720a415e577d1a93f5d49b3ad4498bdd67a53))
* non large title navigation bars show default navigation bar ([11aef9c](https://github.com/appcelerator/titanium_mobile/commit/11aef9cc1069c395e8f9a45570633e40dd80f76e))
* remove additional gc protection once proxy is remembered ([2ac7d80](https://github.com/appcelerator/titanium_mobile/commit/2ac7d80fba4418ddd0187b1b22c9f49b1ede2930))
* select a valid ios sim xcodebuild destination ([65527be](https://github.com/appcelerator/titanium_mobile/commit/65527be0e66071b53a35f5eee80bbc64caad1928))
* sf symbol handling for application shortcut ([28907e0](https://github.com/appcelerator/titanium_mobile/commit/28907e0c3808ca019ee02cdc167d6ef4314f0b0b))
* [MOD-2542](https://jira.appcelerator.org/browse/MOD-2542) - update ti.applesigning module to 1.1.1 ([1571e40](https://github.com/appcelerator/titanium_mobile/commit/1571e400817a89101360ffcc5e97868708e3da1c))
* verify module class type ([3b12015](https://github.com/appcelerator/titanium_mobile/commit/3b120151ade168e4ffacc58534fd09d5e8881ef2))
* volume event handling ([c697822](https://github.com/appcelerator/titanium_mobile/commit/c6978221163cb9a628859b39042fa697b6065471))


## Features

### Android platform

* add new constants for video scaling ([16f04c5](https://github.com/appcelerator/titanium_mobile/commit/16f04c5a2437a948b6cbd3895421035a4c180983))
* [TIMOB-26542](https://jira.appcelerator.org/browse/TIMOB-26542) - Added Ti.App "close" event support ([44a5968](https://github.com/appcelerator/titanium_mobile/commit/44a596834c3be1f2c4725461901584a195e861ba))
* [TIMOB-26953](https://jira.appcelerator.org/browse/TIMOB-26953) - implement foregroundServiceType parameter ([9ca5864](https://github.com/appcelerator/titanium_mobile/commit/9ca5864439e2b1c2e4e3ff71db983938adb313b7))
* target api level 29 by default ([4d73a63](https://github.com/appcelerator/titanium_mobile/commit/4d73a63e9562b25a26c1015278d4bd13b798a80e))

### Multiple platforms

* add method to convert Buffer to Ti.Buffer ([32da366](https://github.com/appcelerator/titanium_mobile/commit/32da366fd1b2bc1b62de6ffdab77305ffd9ed590))
* [TIMOB-18583](https://jira.appcelerator.org/browse/TIMOB-18583) - node compatible fs module ([74d07c1](https://github.com/appcelerator/titanium_mobile/commit/74d07c1d26eda73397a2c1805425ee0b376ea541))
* [TIMOB-27286](https://jira.appcelerator.org/browse/TIMOB-27286) - add string_decoder module ([4c5ac3d](https://github.com/appcelerator/titanium_mobile/commit/4c5ac3df760c2cfe9b244374582ab329b8f90fd3))
* node 12 compatible util module and improved console ([7f19662](https://github.com/appcelerator/titanium_mobile/commit/7f19662607d0aae7a43a3e4de79d591889c9b659))
* [MOD-2545](https://jira.appcelerator.org/browse/MOD-2545) - update to 3.3.0-ios, 4.5.0-android module releases ([d0f0cb9](https://github.com/appcelerator/titanium_mobile/commit/d0f0cb98eb768aee5b90753971246f6070ab5b71))
* add custom inspect behavior for buffers ([1feaf6d](https://github.com/appcelerator/titanium_mobile/commit/1feaf6d272f7d4b0ee69be123c43ab3cd94bd119))
* enable color mode for inspect ([78a15ec](https://github.com/appcelerator/titanium_mobile/commit/78a15ecbdb881de1a7d5ceb68c2d7ba616546aa8))

### iOS platform

* [MOD-2534](https://jira.appcelerator.org/browse/MOD-2534) - update facebook module to 7.0.0 ([16f4d19](https://github.com/appcelerator/titanium_mobile/commit/16f4d190c1c5bbf02d07f8e528ab6c019addb15e))


## [8.2.1](https://github.com/appcelerator/titanium_mobile/compare/8_2_0_GA...8.2.1) (2019-10-23)

## About this release

Titanium SDK 8.2.1 is a patch release of the SDK, addressing high-priority issues from previous releases.

As of this GA release, the previous Titanium SDK patch release (8.2.0) is no longer supported. End of support for this version will be 2020-04-23 or until the next patch release. Note: major and minor releases continue to be supported according to their nominal lifetime.
See [Axway Appcelerator Deprecation Policy](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_deprecation_policy.html) and [Nominal Lifetimes](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_product_lifecycle.html#AxwayAppceleratorProductLifecycle-NominalLifetimes) documents for details.

:warning: With the release of Titanium SDK 9.0.0, we will no longer support Node.js 8.X. Node 10.2.0 will be the new minimum supported version with SDK 9.0.0.

## Community Credits

* teunklijn
    * [TIMOB-27165](https://jira.appcelerator.org/browse/TIMOB-27165) - localnotificationaction event contains notification id instead of the action id ([3a42ee4](https://github.com/appcelerator/titanium_mobile/commit/3a42ee478fd387db28e23c761527720d23c3ffea))


## Bug Fixes

### Android platform

* [TIMOB-27434](https://jira.appcelerator.org/browse/TIMOB-27434) - performance issue with deeply nested views as of 7.5.0 ([38dc352](https://github.com/appcelerator/titanium_mobile/commit/38dc3523699fe3e1e81162aa564658365fd23126))

### Multiple platforms

* focus on TextInputEditText view ([433762a](https://github.com/appcelerator/titanium_mobile/commit/433762ae6d8ee0bf6ded8b057aac9faf296f940d))
* sf symbol handling for application shortcut ([b1d6ce0](https://github.com/appcelerator/titanium_mobile/commit/b1d6ce01a164e8a7d23edae8ba22d0f788a87716))

### iOS platform

* added xcworkspacedata file generation ([c32f363](https://github.com/appcelerator/titanium_mobile/commit/c32f3637bcc18efa83245b2b692caee3a9e47bdf))
* [TIMOB-27403](https://jira.appcelerator.org/browse/TIMOB-27403) - also lookup semnantic colors in correct location for classic ([df39a91](https://github.com/appcelerator/titanium_mobile/commit/df39a91fd4586f9e3dbcb12a70e607944b1128df))
* [TIMOB-27453](https://jira.appcelerator.org/browse/TIMOB-27453) - can not show fullscreen modal windows anymore ([a341c1b](https://github.com/appcelerator/titanium_mobile/commit/a341c1b2c317b34aab17875d4145cc86321c6d51))
* close window handling from presentationController’s delegate method ([5fbec83](https://github.com/appcelerator/titanium_mobile/commit/5fbec83408a7753f0a95119197d5f7d80e218b37))
* fix TiBase header to order macros properly, re-use macros ([94d29f2](https://github.com/appcelerator/titanium_mobile/commit/94d29f21e87053e90f54102db8d92b5ef2ae170e))
* [TIMOB-27354](https://jira.appcelerator.org/browse/TIMOB-27354) - guard source property and removed NSNull if it is nil ([44074a8](https://github.com/appcelerator/titanium_mobile/commit/44074a80683cb91ca3e7433fd066ad4f6a0f8f69))
* hide dimming view ([4c07280](https://github.com/appcelerator/titanium_mobile/commit/4c07280a094c25c7b622d9ad0a9cdf9005b60ea2))
* [TIMOB-27413](https://jira.appcelerator.org/browse/TIMOB-27413) - hideShadow handling for iOS 13 ([c6a4ba7](https://github.com/appcelerator/titanium_mobile/commit/c6a4ba78c83aea52877c77becc583ad4e47ba7de))
* properly set tint-color on image-view ([1a47522](https://github.com/appcelerator/titanium_mobile/commit/1a4752270427cf0be5a40ecde564e21b2bdd18d2))
* remove additional gc protection once proxy is remembered ([dfd5a02](https://github.com/appcelerator/titanium_mobile/commit/dfd5a02103a0519f6bcc842c4f729e918959a438))
* select a valid ios sim xcodebuild destination [backport] ([65cd2e5](https://github.com/appcelerator/titanium_mobile/commit/65cd2e57ed605917016c71a018ad7cb203a1c247))
* [TIMOB-27419](https://jira.appcelerator.org/browse/TIMOB-27419) - support new property to remove note ([8f1b2a6](https://github.com/appcelerator/titanium_mobile/commit/8f1b2a6385b4839ae99b38897426c3a12ef76db9))
* [MOD-2542](https://jira.appcelerator.org/browse/MOD-2542) - update ti.applesigning module to 1.1.1 ([51ea381](https://github.com/appcelerator/titanium_mobile/commit/51ea3817cef54b24b1e8cae1d0118195e4cb406d))
* volume event handling ([6d4e417](https://github.com/appcelerator/titanium_mobile/commit/6d4e41741329d73b9bcd145b82924843b2a4b48d))


## Features

### Multiple platforms

* [MOD-2545](https://jira.appcelerator.org/browse/MOD-2545) - update to 3.3.0-ios, 4.5.0-android module releases ([e1156a0](https://github.com/appcelerator/titanium_mobile/commit/e1156a09c06a902826c03a5b3ffc2ef31e3c0811))


