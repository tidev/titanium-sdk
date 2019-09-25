# [8.3.0](https://github.com/appcelerator/titanium_mobile/compare/8_2_X...8.3.0) (2019-09-20)


## Bug Fixes

### Android platform

* allow requestLegacyExternalStorage attribute ([097c5af](https://github.com/appcelerator/titanium_mobile/commit/097c5af442fdd278db87246fbd8640460f23e6ca))
* call WebView.stopLoading() from main thread ([438a43a](https://github.com/appcelerator/titanium_mobile/commit/438a43a9ec8d244f358af347b44bb7bb0d28fc5b))
* exclude JS in HTML files from processing ([bc45db4](https://github.com/appcelerator/titanium_mobile/commit/bc45db4d43dc763282b5bf6a6710be362c205b82))
* fix dialog without selectedIndex reusage ([a2a048f](https://github.com/appcelerator/titanium_mobile/commit/a2a048fda702bfaee61e2e0f6f9dc85aed9983f5))
* fix reusing a dialog with a new "parent" window ([a8d06c3](https://github.com/appcelerator/titanium_mobile/commit/a8d06c35a02d77698ac6fca71e7f118e19108906))
* fixes background color animation with borders ([86b3699](https://github.com/appcelerator/titanium_mobile/commit/86b3699667d89077e38f7ebf60aaef867ff95b7e))
* [TIMOB-27302](https://jira.appcelerator.org/browse/TIMOB-27302) - guard for tab counts limit for bottom style ([6a2aa4d](https://github.com/appcelerator/titanium_mobile/commit/6a2aa4d7d5101824741fe79a77ffa2e0e48fe904))
* [TIMOB-27108](https://jira.appcelerator.org/browse/TIMOB-27108) - HTTPClient "responseData" blob returns 0 width/height for images over 512kb ([722d6bc](https://github.com/appcelerator/titanium_mobile/commit/722d6bc04c79b7831f4fa1ae239d7fb54398e75c))
* prevent conflict with TextField.isSingleLine() ([20ae5fd](https://github.com/appcelerator/titanium_mobile/commit/20ae5fde99a0d8d29b7721d15fccd2b3faf88fcf))
* [TIMOB-27118](https://jira.appcelerator.org/browse/TIMOB-27118) - prevents TabGroup duplicate close event firing ([34714b8](https://github.com/appcelerator/titanium_mobile/commit/34714b854c6faf47d85730ca15e02edcdd5b1eb0))
* [TIMOB-27177](https://jira.appcelerator.org/browse/TIMOB-27177) - regression where closing root window from child window causes app exit issues as of 8.0.1 ([be7b776](https://github.com/appcelerator/titanium_mobile/commit/be7b77663bd5312a38b025ef70d6870312060d2d))
* release string ([0e21a4f](https://github.com/appcelerator/titanium_mobile/commit/0e21a4f634008eaffd0b0263d5740fcfdc84fcf0))
* [TIMOB-27271](https://jira.appcelerator.org/browse/TIMOB-27271) - resuming with intent "FLAG_ACTIVITY_MULTIPLE_TASK" can hang the app ([632c439](https://github.com/appcelerator/titanium_mobile/commit/632c4398bc71c56be81ffff47422b5686fbb14d1))
* ui module dependency path ([3b9bac8](https://github.com/appcelerator/titanium_mobile/commit/3b9bac8db0f802825c6ff32848cc4289a3551168))
* [TIMOB-27190](https://jira.appcelerator.org/browse/TIMOB-27190) - up button flickering when clicked in NavigationWindow ([69dfda5](https://github.com/appcelerator/titanium_mobile/commit/69dfda5ef5eba65df20cbe979d0bfa912bd4aaa6))
* [TIMOB-27314](https://jira.appcelerator.org/browse/TIMOB-27314) - update titanium_prep windows binaries ([978d625](https://github.com/appcelerator/titanium_mobile/commit/978d625b7b1fb730b53ba8c15929f64b868e91d8))

### Multiple platforms

* update Hyperloop to v4.0.4 for iOS 13 compatibility ([d1cc406](https://github.com/appcelerator/titanium_mobile/commit/d1cc406abd29662e4e6e1b674caa95a73e8dc95f))

### iOS platform

* [TIMOB-27403](https://jira.appcelerator.org/browse/TIMOB-27403) - also lookup semnantic colors in correct location for classic ([8ecfb1e](https://github.com/appcelerator/titanium_mobile/commit/8ecfb1e95397c7257c5f2ec71446b2ecb2a3e7fe))
* console.log does not log properly if it has multiple arguments ([a57701d](https://github.com/appcelerator/titanium_mobile/commit/a57701dafdc34e65470cb3921cc9302c5273dcd4))
* [TIMOB-27386](https://jira.appcelerator.org/browse/TIMOB-27386) - correctly decode device token for ios 13 compatability ([715ef61](https://github.com/appcelerator/titanium_mobile/commit/715ef612ac3bfe6ece73bdfd8dc80b4fe4867765))
* [TIMOB-27395](https://jira.appcelerator.org/browse/TIMOB-27395) - include new iphone models into os extension ([b3a720a](https://github.com/appcelerator/titanium_mobile/commit/b3a720a415e577d1a93f5d49b3ad4498bdd67a53))
* [TIMOB-27165](https://jira.appcelerator.org/browse/TIMOB-27165) - localnotificationaction event contains notification id instead of the action id ([11956d2](https://github.com/appcelerator/titanium_mobile/commit/11956d2a7364f5900f43f68736b333bc1e40dc04))
* non large title navigation bars show default navigation bar ([11aef9c](https://github.com/appcelerator/titanium_mobile/commit/11aef9cc1069c395e8f9a45570633e40dd80f76e))


## Features

### Android platform

* [TIMOB-26463](https://jira.appcelerator.org/browse/TIMOB-26463) - add accessibility properties to MenuItem ([9f3c6b7](https://github.com/appcelerator/titanium_mobile/commit/9f3c6b75c3d71dd65ca7cd33383bc90d3e565d6f))
* [TIMOB-27283](https://jira.appcelerator.org/browse/TIMOB-27283) - add contentSize to Ti.UI.ScrollView scroll event ([6ffd9d4](https://github.com/appcelerator/titanium_mobile/commit/6ffd9d4ce217839017ef66ccf7bc10e9f494e399))
* add new constants for video scaling ([16f04c5](https://github.com/appcelerator/titanium_mobile/commit/16f04c5a2437a948b6cbd3895421035a4c180983))
* [TIMOB-26542](https://jira.appcelerator.org/browse/TIMOB-26542) - Added Ti.App "close" event support ([44a5968](https://github.com/appcelerator/titanium_mobile/commit/44a596834c3be1f2c4725461901584a195e861ba))

### iOS platform

* [MOD-2534](https://jira.appcelerator.org/browse/MOD-2534) - update facebook module to 7.0.0 ([16f4d19](https://github.com/appcelerator/titanium_mobile/commit/16f4d190c1c5bbf02d07f8e528ab6c019addb15e))

### Multiple platforms

* [TIMOB-27286](https://jira.appcelerator.org/browse/TIMOB-27286) - add string_decoder module ([4c5ac3d](https://github.com/appcelerator/titanium_mobile/commit/4c5ac3df760c2cfe9b244374582ab329b8f90fd3))


