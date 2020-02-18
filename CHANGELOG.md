# [9.0.0](https://github.com/appcelerator/titanium_mobile/compare/8_3_X...9.0.0) (2020-02-07)

## About this release

Titanium SDK 9.0.0 is a major release of the SDK, addressing high-priority issues from previous releases; introducing some breaking changes; and removing a number of long-deprecated APIs.

As of this release, Titanium SDK 8.x will not be supported one calendar year (2021-02-07) from 9.0.0's release date.
See [Axway Appcelerator Deprecation Policy](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_deprecation_policy.html) and [Nominal Lifetimes](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_product_lifecycle.html#AxwayAppceleratorProductLifecycle-NominalLifetimes) documents for details.

:warning: With the release of Titanium SDK 9.0.0, we will no longer support Node.js 8.X. Node 10.2.0 will be the new minimum supported version with SDK 9.0.0.

## Community Credits

* Sergey Volkov
    * [TIMOB-26662] Android: TableViewRow bugs (#10542) ([19f532b](https://github.com/appcelerator/titanium_mobile/commit/19f532b334c75afdb9340e343a1fa0caf7b93bcb))
    * add "repeatable" property on methods parameters ([ea0da79](https://github.com/appcelerator/titanium_mobile/commit/ea0da79e2fef897c8757303f368990472f4ef7f1))
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
* [TIMOB-27746](https://jira.appcelerator.org/browse/TIMOB-27746) - firebase upload with ti.map and ti.playservices ([f63e597](https://github.com/appcelerator/titanium_mobile/commit/f63e597adfc21c4aac6894234b2c92bee4c5a593))
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
* [TIMOB-27528](https://jira.appcelerator.org/browse/TIMOB-27528) - handle uncaught exceptions in proxy fireEvent callbacks ([5dbc89f](https://github.com/appcelerator/titanium_mobile/commit/5dbc89f0ba347d9d4f8aac7164bf0e87f44a19c6))
* [TIMOB-27528](https://jira.appcelerator.org/browse/TIMOB-27528) - handle uncaught exceptions in timer callbacks ([29944dc](https://github.com/appcelerator/titanium_mobile/commit/29944dc73a3b55f266002cabc34bea889891d685))
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
* [TIMOB-27763](https://jira.appcelerator.org/browse/TIMOB-27763) - usernotificationsettings event has no success property ([e835456](https://github.com/appcelerator/titanium_mobile/commit/e835456155f265fd24752c0b9bea89ed1d84c356))
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
* [TIMOB-27752](https://jira.appcelerator.org/browse/TIMOB-27752) - exclude x86/x86_64 in production builds by default ([c8f358d](https://github.com/appcelerator/titanium_mobile/commit/c8f358dcdd50763fb509576ee635f626bc9ba069))

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
* [TIMOB-27758](https://jira.appcelerator.org/browse/TIMOB-27758) module builds should fail with aar in lib folder in 9.0.0 ([c8bbeab](https://github.com/appcelerator/titanium_mobile/commit/c8bbeab4f117e6f9a16988338a50a48f20402911))


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
| ti.cloudpush | 7.0.0 | n/a |
| ti.map | 5.0.1 | 3.3.0 |
| ti.webdialog | 2.0.0 | 1.1.0 |
| ti.playservices | 17.1.1 | n/a |
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


