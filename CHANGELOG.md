## [12.1.1](https://github.com/tidev/titanium-sdk/compare/12_1_0_GA...12.1.1) (2023-04-28)

## About this release

Titanium SDK 12.1.1 is a patch release of the SDK, addressing high-priority issues from previous releases.

As of this GA release, the previous Titanium SDK patch release (12.1.0) is no longer supported.

## Bug Fixes

### iOS platform

* Hans Knöchel
  * fix: restore support for Xcode < 14.3 ([a08e0ec](https://github.com/tidev/titanium-sdk/commit/a08e0ec95ab6803b1ffbc63fd498e265f6888c2a))

## SDK Module Versions

| Module      | Android version | iOS Version |
| ----------- | --------------- | ----------- |
| facebook | 12.0.0 | 13.0.0 |
| ti.map | 5.5.1 | 7.0.0 |
| ti.webdialog | 2.2.0 | 3.0.2 |
| ti.playservices | 18.2.0 | n/a |
| ti.identity | 3.1.0 | 5.0.0 |
| urlSession | n/a | 4.0.1 |
| ti.coremotion | n/a | 4.0.1 |
| ti.applesignin | n/a | 3.1.2 |
| hyperloop | 7.0.4 | 7.0.4 |

# [12.1.0](https://github.com/tidev/titanium-sdk/compare/12_0_X...12.1.0) (2023-04-24)

## About this release

Titanium SDK 12.1.0 is a minor release of the SDK, addressing high-priority issues from previous releases. Highlights of this release are:

- Support for Node.js 19
- Enhanced support for Android 13
- Improved macOS support
- More parity APIs between iOS and Android

## Community Credits

* Hans Knöchel
  * move invocation ([4bcdca9](https://github.com/tidev/titanium-sdk/commit/4bcdca9a64371dfe7bce98e26d800365b8a6b418))
  * only show popover presentation style if popover view exists ([74f9296](https://github.com/tidev/titanium-sdk/commit/74f92967fb4b627ebaedb1b2bcc76fe552d499e9))
  * only attempt to create path if not exists ([48a6342](https://github.com/tidev/titanium-sdk/commit/48a6342a61d8a7756272c30c59e8e386edceebaa))
  * fix production build error in Xcode 14.3 ([f4263be](https://github.com/tidev/titanium-sdk/commit/f4263beedabf17c76490ae063e14ff90593e958e))
  * add changelog ([f944119](https://github.com/tidev/titanium-sdk/commit/f944119f6eed477600ea529f4298c18ab37fbf1e))
  * fix target relation ([34da923](https://github.com/tidev/titanium-sdk/commit/34da92318a1ca5f775f185b43c1b9c7e29fa4c6e))
  * fix bottom resizing ([2d5d7f8](https://github.com/tidev/titanium-sdk/commit/2d5d7f8bc3a4f9ad22828c7bf56a2bf81dafa392))
  * add “Optimize for Mac” option for macOS catalyst builds, add tooltip API ([56d7661](https://github.com/tidev/titanium-sdk/commit/56d76614c77e7343e3c5b73b8bc56436f98f616e))
  * be able to get a list of available system font families ([a3c4f26](https://github.com/tidev/titanium-sdk/commit/a3c4f267076838292089080e0027375e86b10ca3))
  * add tabBarVisible API ([9ee0d42](https://github.com/tidev/titanium-sdk/commit/9ee0d42044cf1858dd72521a374dc336eb046246))
  * update some build steps to use Xcode 14.x ([6d24f0a](https://github.com/tidev/titanium-sdk/commit/6d24f0ac90f36339094c274a3e3f3f5d6bec1de8))
  * fix macOS build ([cf4b370](https://github.com/tidev/titanium-sdk/commit/cf4b370dec4986dea677d255ddfbbfa9445cb75f))
  * use core.js 3.27.4 ([86180ae](https://github.com/tidev/titanium-sdk/commit/86180aee825349927acf4d68f7e019bd2ac4c96e))
  * only apply custom String.format for non-64 Bit Simulators ([512c034](https://github.com/tidev/titanium-sdk/commit/512c0344189d791c502c09c7d7dd73db1345df61))
  * read status bar height programmatically ([22d26f8](https://github.com/tidev/titanium-sdk/commit/22d26f83573439994cb172518c14f50e23302ef6))
  * fix border refresh issue ([931ce38](https://github.com/tidev/titanium-sdk/commit/931ce386cab755b330cd4b1c83b648dba1415206))
  * fix crash on soft-restart ([1128407](https://github.com/tidev/titanium-sdk/commit/11284074a378149309375b1b880eaadb9ec7b9e1))
  * fix error handling ([057a2f0](https://github.com/tidev/titanium-sdk/commit/057a2f048600f5959046b6075206caf378226dd5))
  * bump master to 12.1.0 ([70f1d97](https://github.com/tidev/titanium-sdk/commit/70f1d9727fd8209c006a55f78a7dd702ffe030b7))

* Michael Gangolf
  * hide error for empty http decode charset ([b45b6d4](https://github.com/tidev/titanium-sdk/commit/b45b6d44b36df9a0e16711dc2b092bba332b62a3))
  * ioslib update ([2df423c](https://github.com/tidev/titanium-sdk/commit/2df423c8a1e1d39d03dc2ed815aee3af00536b64))
  * fix Android level in gallery permission ([0932b05](https://github.com/tidev/titanium-sdk/commit/0932b05ca5473c816917755f7b7433a987011c6f))
  * remove obsolete Android tools folder ([344850d](https://github.com/tidev/titanium-sdk/commit/344850d91200d3f9aff47c60e3053a0910876d00))
  * animated parameter for disableTabNavigation ([fbc8c7e](https://github.com/tidev/titanium-sdk/commit/fbc8c7e17b844796c85b43ef29d1fe08d2b04fae))
  * fix packages ([bf0d3f2](https://github.com/tidev/titanium-sdk/commit/bf0d3f2b706d69b45e94b68076bd8714890e26bb))
  * get notificationChannels ([9be6c33](https://github.com/tidev/titanium-sdk/commit/9be6c33d0047cb9d2b0b86c07071d1c4b86d37de))
  * add links to selectionStyle constants ([ee64cd2](https://github.com/tidev/titanium-sdk/commit/ee64cd2d50add46b16c5de9e20607719cd35fa39))
  * revert borderWrapperView code ([2a23d82](https://github.com/tidev/titanium-sdk/commit/2a23d82800108840c1672c3c62d5e50be8c8832a))
  * use example platform folder for module builds ([b95abde](https://github.com/tidev/titanium-sdk/commit/b95abded468a2ec25a5b7d71780150cea77aa0e2))
  * add stopAnimation() to View ([0d4829b](https://github.com/tidev/titanium-sdk/commit/0d4829b98dd58b86b51f3369d108c9c4f8bd7980))
  * collapseToolbar Alloy fix ([3c964a0](https://github.com/tidev/titanium-sdk/commit/3c964a0fd6a64f9d8c9e5072d1e6317554d36e5e))
  * null check for registerPush callbacks ([72a03e4](https://github.com/tidev/titanium-sdk/commit/72a03e4569bd04515aeeaf682e1eb5fb507a994d))
  * code optimizations ([64ac40c](https://github.com/tidev/titanium-sdk/commit/64ac40cd613ccea5ccc6d50ed55dd982fe4bfa30))
  * tableView optimizations ([57bcbf9](https://github.com/tidev/titanium-sdk/commit/57bcbf95a5a8bc6f24ea5fd02252ccfefab9d247))
  * module update ([8a36570](https://github.com/tidev/titanium-sdk/commit/8a36570af01960804eb7d6c616f0b6ff300fd59a))
  * initial gesture orientation value ([1dac79d](https://github.com/tidev/titanium-sdk/commit/1dac79d74dfce6fcd4884df790797dea9c358cf7))
  * fullscreen mode ([e6e043f](https://github.com/tidev/titanium-sdk/commit/e6e043f7d505667772990a56ef7a196277eb06c6))
  * adjust Android 13 requestPhotoGalleryPermissions ([3b7ec5c](https://github.com/tidev/titanium-sdk/commit/3b7ec5c437e8f6604e7a31a3cbe28eb59bce2779))
  * extend addScriptMessageHandler example ([be75843](https://github.com/tidev/titanium-sdk/commit/be7584385295503ded62aed96ea817aa48c26eba))
  * link to AppleWWDRCA ([5dcb217](https://github.com/tidev/titanium-sdk/commit/5dcb21756a25bafb01e75b25763c5e944f0ca451))
  * imageAsResized to squared images ([c2fa9f7](https://github.com/tidev/titanium-sdk/commit/c2fa9f729a4f217448e50f3f47f8c68b764ea8a3))
  * parity for WebView.createPDF() ([c23e88f](https://github.com/tidev/titanium-sdk/commit/c23e88f9430d4be8a949838d4943ec18de6cd279))
  * add FloatingActionButton ([a24399c](https://github.com/tidev/titanium-sdk/commit/a24399ca04ff0ab2c0bb540534fe152f2f405c3f))
  * videoPlayer autoHide ([8b37384](https://github.com/tidev/titanium-sdk/commit/8b37384c7a2ed3901d3aef5b81b0f4a6bbf33615))
  * collapseToolbar layout ([e144d61](https://github.com/tidev/titanium-sdk/commit/e144d61676fcd95b5954fc62fcc8082f2ff39ca5))
  * correction for the cutout properties ([8825cd4](https://github.com/tidev/titanium-sdk/commit/8825cd4cd9a14757b73d72ed02b7e92652503eb4))
  * statusBarHeight parity and cutoutSize ([82e07f7](https://github.com/tidev/titanium-sdk/commit/82e07f79b90bc5eca04887effcb3aee725e3bcad))
  * change deprecated view.setBackgroundDrawable ([05cbfd4](https://github.com/tidev/titanium-sdk/commit/05cbfd4c18bd831483c5e7738d8bd17761a8050b))
  * add SOFT_INPUT_ADJUST_NOTHING ([fc1e2e1](https://github.com/tidev/titanium-sdk/commit/fc1e2e108cc66ef38268492e1c065aea80483f2d))
  * info about appBadge ([d8e3f78](https://github.com/tidev/titanium-sdk/commit/d8e3f78535d515d09389918599fa829a7cf10cce))
  * fix image link in docs ([74b55e6](https://github.com/tidev/titanium-sdk/commit/74b55e6284d0994cfe0e9dd2e8fb44998320b23f))
  * fix duplicate lifecycle issue ([881552f](https://github.com/tidev/titanium-sdk/commit/881552f15e7e01b490e2641d66d8f0adbfbee679))
  * readme ([258966d](https://github.com/tidev/titanium-sdk/commit/258966de4c667037028ce479926b6633eea28217))
  * toolbar tintColor ([c7474f7](https://github.com/tidev/titanium-sdk/commit/c7474f7789a47ad56310eb097b4c69f95a0d6dee))
  * code optimizations ([a16d76c](https://github.com/tidev/titanium-sdk/commit/a16d76c767025a67a7375edd9da70a4d99edb597))
  * optimize deprecation warning ([aa43de9](https://github.com/tidev/titanium-sdk/commit/aa43de97163e8b2edf773b540fc28a39025c1319))
  * ioslib package update ([40db379](https://github.com/tidev/titanium-sdk/commit/40db379f7bccd7a6b3769126bb751ba1f96c6883))
  * gitignore ([41fbc08](https://github.com/tidev/titanium-sdk/commit/41fbc0812b4d3b24706f0aeafdbb9fd55591c80c))
  * npm modules ([463038c](https://github.com/tidev/titanium-sdk/commit/463038c1f9e1e777e8817a2dcb74988550f351a8))
  * update logo ([ed5c8c7](https://github.com/tidev/titanium-sdk/commit/ed5c8c7fba497dc915abcee723ad5ed1c7a833fb))
  * use SVG logo ([33a7fbd](https://github.com/tidev/titanium-sdk/commit/33a7fbd7038e350bf42faeab638f40c2100e8e71))
  * gradle warning log ([a48c173](https://github.com/tidev/titanium-sdk/commit/a48c173833f37d1dcce5a8432660986788250244))
  * liveview, titanium package update ([848028b](https://github.com/tidev/titanium-sdk/commit/848028b2814876ad618f2afcbe6f3b510b88a556))
  * fix material version ([60fe1a4](https://github.com/tidev/titanium-sdk/commit/60fe1a4b6f03ecd53b0132fee959e7be46743acd))
  * update node-appc ([9776ed8](https://github.com/tidev/titanium-sdk/commit/9776ed8a7dfb633c4852a8d67ddbf123a698245c))
  * update libraries ([2f4cd82](https://github.com/tidev/titanium-sdk/commit/2f4cd82ae6a895cc711e2856ed4af3c8c4601ce0))
  * gitignore update for Android Studio ([9aabe8c](https://github.com/tidev/titanium-sdk/commit/9aabe8c5639040a610ce02388c602522d8567d0a))

* Marc Bender
  * build module platform/xcframwork symbolic links ([9972afc](https://github.com/tidev/titanium-sdk/commit/9972afcbcc4f75db3ad206ac6ce5d628ae4c89ec))

* markive
  * android Ti.UI.WebView support allowFileAccess ([29ed703](https://github.com/tidev/titanium-sdk/commit/29ed703b1e6be15c654c53335479696ac9488f65))

* Rohid JETHA
  * Update AudioRecorder.yml (#13713) ([bfb8fb7](https://github.com/tidev/titanium-sdk/commit/bfb8fb71c1a11bb20b52dbc8db967b160727e2c1))

* Matt Delmarter
  * allow images in ListItem editActions ([68aa61f](https://github.com/tidev/titanium-sdk/commit/68aa61fbfccbb4ef05ec8423898117479a7c605b))

* Jan Vennemann
  * remember proxies from section data items ([e6948e0](https://github.com/tidev/titanium-sdk/commit/e6948e04ed0782487749b6aec33b5e608531f9a9))

## Bug Fixes

### Android platform

* change deprecated view.setBackgroundDrawable ([05cbfd4](https://github.com/tidev/titanium-sdk/commit/05cbfd4c18bd831483c5e7738d8bd17761a8050b))
* code optimizations ([64ac40c](https://github.com/tidev/titanium-sdk/commit/64ac40cd613ccea5ccc6d50ed55dd982fe4bfa30))
* code optimizations ([a16d76c](https://github.com/tidev/titanium-sdk/commit/a16d76c767025a67a7375edd9da70a4d99edb597))
* collapseToolbar Alloy fix ([3c964a0](https://github.com/tidev/titanium-sdk/commit/3c964a0fd6a64f9d8c9e5072d1e6317554d36e5e))
* fix Android level in gallery permission ([0932b05](https://github.com/tidev/titanium-sdk/commit/0932b05ca5473c816917755f7b7433a987011c6f))
* fix bottom resizing ([2d5d7f8](https://github.com/tidev/titanium-sdk/commit/2d5d7f8bc3a4f9ad22828c7bf56a2bf81dafa392))
* fix duplicate lifecycle issue ([881552f](https://github.com/tidev/titanium-sdk/commit/881552f15e7e01b490e2641d66d8f0adbfbee679))
* fullscreen mode ([e6e043f](https://github.com/tidev/titanium-sdk/commit/e6e043f7d505667772990a56ef7a196277eb06c6))
* gradle warning log ([baecb61](https://github.com/tidev/titanium-sdk/commit/baecb6155de7b340d972f6e674a1f48c4bddb891))
* gradle warning log ([a48c173](https://github.com/tidev/titanium-sdk/commit/a48c173833f37d1dcce5a8432660986788250244))
* hide error for empty http decode charset ([b45b6d4](https://github.com/tidev/titanium-sdk/commit/b45b6d44b36df9a0e16711dc2b092bba332b62a3))
* imageAsResized to squared images ([c2fa9f7](https://github.com/tidev/titanium-sdk/commit/c2fa9f729a4f217448e50f3f47f8c68b764ea8a3))
* initial gesture orientation value ([1dac79d](https://github.com/tidev/titanium-sdk/commit/1dac79d74dfce6fcd4884df790797dea9c358cf7))
* null check for registerPush callbacks ([72a03e4](https://github.com/tidev/titanium-sdk/commit/72a03e4569bd04515aeeaf682e1eb5fb507a994d))
* revert borderWrapperView code ([2a23d82](https://github.com/tidev/titanium-sdk/commit/2a23d82800108840c1672c3c62d5e50be8c8832a))
* tableView optimizations ([57bcbf9](https://github.com/tidev/titanium-sdk/commit/57bcbf95a5a8bc6f24ea5fd02252ccfefab9d247))

### Multiple platforms

* correction for the cutout properties ([8825cd4](https://github.com/tidev/titanium-sdk/commit/8825cd4cd9a14757b73d72ed02b7e92652503eb4))
* fix target relation ([34da923](https://github.com/tidev/titanium-sdk/commit/34da92318a1ca5f775f185b43c1b9c7e29fa4c6e))
* support passing target and device id to the module build ([3838f7a](https://github.com/tidev/titanium-sdk/commit/3838f7a49c814c96d0832aac15ca16aca87f821e))
* only apply custom String.format for non-64 Bit Simulators ([512c034](https://github.com/tidev/titanium-sdk/commit/512c0344189d791c502c09c7d7dd73db1345df61))
* only attempt to create path if not exists ([48a6342](https://github.com/tidev/titanium-sdk/commit/48a6342a61d8a7756272c30c59e8e386edceebaa))
* remember proxies from section data items ([e6948e0](https://github.com/tidev/titanium-sdk/commit/e6948e04ed0782487749b6aec33b5e608531f9a9))

### iOS platform

* build module platform/xcframwork symbolic links ([9972afc](https://github.com/tidev/titanium-sdk/commit/9972afcbcc4f75db3ad206ac6ce5d628ae4c89ec))
* enable JSContext to be inspectable ([9a6f99a](https://github.com/tidev/titanium-sdk/commit/9a6f99a67fa4a7c2c69244434f621c806a31a80d))
* fix border refresh issue ([931ce38](https://github.com/tidev/titanium-sdk/commit/931ce386cab755b330cd4b1c83b648dba1415206))
* fix crash on soft-restart ([1128407](https://github.com/tidev/titanium-sdk/commit/11284074a378149309375b1b880eaadb9ec7b9e1))
* fix error handling ([057a2f0](https://github.com/tidev/titanium-sdk/commit/057a2f048600f5959046b6075206caf378226dd5))
* fix macOS build ([cf4b370](https://github.com/tidev/titanium-sdk/commit/cf4b370dec4986dea677d255ddfbbfa9445cb75f))
* fix production build error in Xcode 14.3 ([f4263be](https://github.com/tidev/titanium-sdk/commit/f4263beedabf17c76490ae063e14ff90593e958e))
* link to AppleWWDRCA ([5dcb217](https://github.com/tidev/titanium-sdk/commit/5dcb21756a25bafb01e75b25763c5e944f0ca451))
* only show popover presentation style if popover view exists ([74f9296](https://github.com/tidev/titanium-sdk/commit/74f92967fb4b627ebaedb1b2bcc76fe552d499e9))
* optimize deprecation warning ([aa43de9](https://github.com/tidev/titanium-sdk/commit/aa43de97163e8b2edf773b540fc28a39025c1319))

## Features

### Multiple platforms

* android Ti.UI.WebView support allowFileAccess ([29ed703](https://github.com/tidev/titanium-sdk/commit/29ed703b1e6be15c654c53335479696ac9488f65))
* add tabBarVisible API ([9ee0d42](https://github.com/tidev/titanium-sdk/commit/9ee0d42044cf1858dd72521a374dc336eb046246))

### Android platform

* add FloatingActionButton ([a24399c](https://github.com/tidev/titanium-sdk/commit/a24399ca04ff0ab2c0bb540534fe152f2f405c3f))
* add SOFT_INPUT_ADJUST_NOTHING ([fc1e2e1](https://github.com/tidev/titanium-sdk/commit/fc1e2e108cc66ef38268492e1c065aea80483f2d))
* add stopAnimation() to View ([0d4829b](https://github.com/tidev/titanium-sdk/commit/0d4829b98dd58b86b51f3369d108c9c4f8bd7980))
* adjust Android 13 requestPhotoGalleryPermissions ([3b7ec5c](https://github.com/tidev/titanium-sdk/commit/3b7ec5c437e8f6604e7a31a3cbe28eb59bce2779))
* animated parameter for disableTabNavigation ([fbc8c7e](https://github.com/tidev/titanium-sdk/commit/fbc8c7e17b844796c85b43ef29d1fe08d2b04fae))
* collapseToolbar layout ([e144d61](https://github.com/tidev/titanium-sdk/commit/e144d61676fcd95b5954fc62fcc8082f2ff39ca5))
* get notificationChannels ([9be6c33](https://github.com/tidev/titanium-sdk/commit/9be6c33d0047cb9d2b0b86c07071d1c4b86d37de))
* parity for WebView.createPDF() ([c23e88f](https://github.com/tidev/titanium-sdk/commit/c23e88f9430d4be8a949838d4943ec18de6cd279))
* statusBarHeight parity and cutoutSize ([82e07f7](https://github.com/tidev/titanium-sdk/commit/82e07f79b90bc5eca04887effcb3aee725e3bcad))
* toolbar tintColor ([c7474f7](https://github.com/tidev/titanium-sdk/commit/c7474f7789a47ad56310eb097b4c69f95a0d6dee))
* update libraries ([2f4cd82](https://github.com/tidev/titanium-sdk/commit/2f4cd82ae6a895cc711e2856ed4af3c8c4601ce0))
* use example platform folder for module builds ([b95abde](https://github.com/tidev/titanium-sdk/commit/b95abded468a2ec25a5b7d71780150cea77aa0e2))
* videoPlayer autoHide ([8b37384](https://github.com/tidev/titanium-sdk/commit/8b37384c7a2ed3901d3aef5b81b0f4a6bbf33615))

### iOS platform

* allow images in ListItem editActions ([68aa61f](https://github.com/tidev/titanium-sdk/commit/68aa61fbfccbb4ef05ec8423898117479a7c605b))
* be able to get a list of available system font families ([a3c4f26](https://github.com/tidev/titanium-sdk/commit/a3c4f267076838292089080e0027375e86b10ca3))
* read status bar height programmatically ([22d26f8](https://github.com/tidev/titanium-sdk/commit/22d26f83573439994cb172518c14f50e23302ef6))

## SDK Module Versions

| Module      | Android version | iOS Version |
| ----------- | --------------- | ----------- |
| facebook | 12.0.0 | 13.0.0 |
| ti.map | 5.5.1 | 7.0.0 |
| ti.webdialog | 2.2.0 | 3.0.2 |
| ti.playservices | 18.2.0 | n/a |
| ti.identity | 3.1.0 | 5.0.0 |
| urlSession | n/a | 4.0.1 |
| ti.coremotion | n/a | 4.0.1 |
| ti.applesignin | n/a | 3.1.2 |
| hyperloop | 7.0.4 | 7.0.4 |

# [12.0.0](https://github.com/tidev/titanium-sdk/compare/11_1_X...12.0.0) (2022-12-12)

## About this release

Titanium SDK 12.0.0 is a major release of the SDK, addressing high-priority issues from previous releases.


## Community Credits

* Hans Knöchel
  * include list state reference in “movestart” event ([ffee75d](https://github.com/tidev/titanium-sdk/commit/ffee75de20efba2c2d0b00b9ab12c14f81b86035))
  * add Dynamic Island support ([f000f3b](https://github.com/tidev/titanium-sdk/commit/f000f3ba9b228aadbcab88ff734438a202ae9c8c))
  * remove unused podspec templace, migrate module template to fix warnings ([e6ac1b3](https://github.com/tidev/titanium-sdk/commit/e6ac1b308cf5477aafc5ae79e561df63670f9a65))
  * redesigned error view ([4232487](https://github.com/tidev/titanium-sdk/commit/4232487aa54c9b8eed038ede29eb7edf92dfa0a5))
  * add null-guard for activity in listview ([34c8b9d](https://github.com/tidev/titanium-sdk/commit/34c8b9da7ec956c76a5f511eb6a9f9214cd38168))
  * be able to detect an emulated iOS app on Apple Silicon ([c225669](https://github.com/tidev/titanium-sdk/commit/c225669ea4eb12951313c277bf5b61abcad73283))
  * clean up default app template ([7cbabb4](https://github.com/tidev/titanium-sdk/commit/7cbabb4871a69ef4191c0805f4b2535380cb8691))
  * fix unbalanced view controller transitions causing issues on iOS 16+ ([50814d7](https://github.com/tidev/titanium-sdk/commit/50814d717910f5b42b6f61972b30f8d10f85a268))
  * guard “example” directory and LICENSE during module build ([95deb4e](https://github.com/tidev/titanium-sdk/commit/95deb4ed843c2d59f6a36880a5cd9c644e1c2600))
  * add Xcode 14 guards, bump minimum iOS version to 13.0 ([0ab0163](https://github.com/tidev/titanium-sdk/commit/0ab01636c3f2a4ddc20d0b84e8fc0e532365b2d1))
  * fix rare crash in Ti.UI.TableView ([10f084f](https://github.com/tidev/titanium-sdk/commit/10f084f9ce60a64ee52f038b19fea5940bc230c7))
  * bump master to 12.0.0 ([3af83a5](https://github.com/tidev/titanium-sdk/commit/3af83a5f2adde0d1cab19febe4edc87f32dbb2e3))

* Michael Gangolf
  * fixing filenames for titanium-docs ([84eed15](https://github.com/tidev/titanium-sdk/commit/84eed159fb65b39752288f423c8e09bdf2a0d392))
  * remove windows images ([7e500b1](https://github.com/tidev/titanium-sdk/commit/7e500b13d22aa30e252be9bd2a02673b3dbd9771))
  * remove ACA in builder ([9d3617d](https://github.com/tidev/titanium-sdk/commit/9d3617d313342cadd25f5b4e34109c52b4586a1e))
  * update default tidev modules ([4ae258d](https://github.com/tidev/titanium-sdk/commit/4ae258da01e3fa328c83914f826dbab57607bf44))
  * adding missing platform to Progressbar.tintColor ([ede3af5](https://github.com/tidev/titanium-sdk/commit/ede3af51ee92eaeba3a03ee79f5c69499dda9b3c))
  * fix textfield autocorrect:false ([29f5807](https://github.com/tidev/titanium-sdk/commit/29f580773ddeace21c78be06f6286701b9851c2c))
  * update libraries ([4dd041c](https://github.com/tidev/titanium-sdk/commit/4dd041ce51763c469f6e8bada972c1a224f90f31))
  * Update TiUITableView.m (#13652) ([580743e](https://github.com/tidev/titanium-sdk/commit/580743edd05b1202a2a8d484ef6db2156cee4367))
  * try/catch in ti.blob loadBitmapInfo ([569a3e0](https://github.com/tidev/titanium-sdk/commit/569a3e061e67d2c90678471eb23aaed2676390bb))
  * update example and readme ([cbfd4c3](https://github.com/tidev/titanium-sdk/commit/cbfd4c3858e141d02580ac4a22a8aef5c3cd52cb))
  * add more images and examples ([3b66561](https://github.com/tidev/titanium-sdk/commit/3b66561d3cd2f6f09289a4b5297f094bf4956810))
  * create Alloy project optimization ([e18c213](https://github.com/tidev/titanium-sdk/commit/e18c21320e2fe588571c9586db87df9c80f67c88))
  * searchBar iconColor ([7fc1c5c](https://github.com/tidev/titanium-sdk/commit/7fc1c5c27679189f650eab7dd8cd4ee554aa2dd9))
  * fixed some TiConvert.toColor warnings ([12b2a71](https://github.com/tidev/titanium-sdk/commit/12b2a7144cddf21a8dcfc1276b5aa4cb0fee678b))
  * fix broken tests ([6c91a4c](https://github.com/tidev/titanium-sdk/commit/6c91a4cbf57b4891ef711d22a781c1d1951aaead))
  * drawer events for rightView ([b837cc2](https://github.com/tidev/titanium-sdk/commit/b837cc29abef976360593fc7bf2804af5ed82cad))
  * material you themes ([3ef9b66](https://github.com/tidev/titanium-sdk/commit/3ef9b664bd9c7abc5c41a43c2081307c3b8dc56b))
  * improve Android Calendar docs ([73c4af4](https://github.com/tidev/titanium-sdk/commit/73c4af45b36560e3303c572e741f782c3a9dd473))
  * add getLastLocation to FusedLocationProvider ([0155e42](https://github.com/tidev/titanium-sdk/commit/0155e421ecf3c4fc4c53094f70819fac1c472878))
  * clean up Andorid min osver ([9202366](https://github.com/tidev/titanium-sdk/commit/9202366cec8e81d772d6acfd06db993b1e823963))
  * github build action ([96a0abc](https://github.com/tidev/titanium-sdk/commit/96a0abc06079d4beacce13bed842ed9ffb1e39be))
  * use maxMemory as property ([f6e6586](https://github.com/tidev/titanium-sdk/commit/f6e658601ffa18d1b620a52610850c71bb8417ea))
  * delete notification channel ([e8e06cd](https://github.com/tidev/titanium-sdk/commit/e8e06cda9512e8384fe00fc78af31631b672bfa6))
  * ignoreLog config ([4c042ee](https://github.com/tidev/titanium-sdk/commit/4c042ee9ee6e588a0d08f6fd315df05837345702))
  * update Android transition example ([a6b6987](https://github.com/tidev/titanium-sdk/commit/a6b69874e62b72641cd5a141b413431499008864))
  * expose Picker text color ([e37bef9](https://github.com/tidev/titanium-sdk/commit/e37bef9d671585ff93de4fda72c9d01f97443826))
  * optimize module build ([4840523](https://github.com/tidev/titanium-sdk/commit/4840523ed315ce563fdd8cf429a56b15d315970f))
  * delete old removed items ([fc3d508](https://github.com/tidev/titanium-sdk/commit/fc3d5080ad1b0152a8e14bae6a53630f2d2b9631))
  * lower build gradle ([b737e76](https://github.com/tidev/titanium-sdk/commit/b737e7675a358ede3d0360f4a393836f63b0ae5d))
  * Android 13 updates ([fa604fa](https://github.com/tidev/titanium-sdk/commit/fa604fac971579225c156a51f749011a416b2c74))
  * optimize ListView continuousUpdate ([ca73559](https://github.com/tidev/titanium-sdk/commit/ca7355975f2f1e3724fd8359f69bc9c2fb9f464f))
  * tabbedbar color properties ([2453af6](https://github.com/tidev/titanium-sdk/commit/2453af6f27fc9a15520c4a2b3d8ca73ad58bb395))

* Jan Vennemann
  * correct method name for isTranslatedBinaryOnAppleSilicon ([bb89d44](https://github.com/tidev/titanium-sdk/commit/bb89d449ce9d17da0cbbd2587bd3a3529b9e3ca7))


## Bug Fixes

### Multiple platforms

* fix broken tests ([6c91a4c](https://github.com/tidev/titanium-sdk/commit/6c91a4cbf57b4891ef711d22a781c1d1951aaead))
* adding missing platform to Progressbar.tintColor ([ede3af5](https://github.com/tidev/titanium-sdk/commit/ede3af51ee92eaeba3a03ee79f5c69499dda9b3c))
* fixing filenames for titanium-docs ([84eed15](https://github.com/tidev/titanium-sdk/commit/84eed159fb65b39752288f423c8e09bdf2a0d392))
* guard “example” directory and LICENSE during module build ([95deb4e](https://github.com/tidev/titanium-sdk/commit/95deb4ed843c2d59f6a36880a5cd9c644e1c2600))

### Android platform

* add null-guard for activity in listview ([34c8b9d](https://github.com/tidev/titanium-sdk/commit/34c8b9da7ec956c76a5f511eb6a9f9214cd38168))
* drawer events for rightView ([b837cc2](https://github.com/tidev/titanium-sdk/commit/b837cc29abef976360593fc7bf2804af5ed82cad))
* fixed some TiConvert.toColor warnings ([12b2a71](https://github.com/tidev/titanium-sdk/commit/12b2a7144cddf21a8dcfc1276b5aa4cb0fee678b))
* github build action ([96a0abc](https://github.com/tidev/titanium-sdk/commit/96a0abc06079d4beacce13bed842ed9ffb1e39be))
* lower build gradle ([b737e76](https://github.com/tidev/titanium-sdk/commit/b737e7675a358ede3d0360f4a393836f63b0ae5d))
* try/catch in ti.blob loadBitmapInfo ([569a3e0](https://github.com/tidev/titanium-sdk/commit/569a3e061e67d2c90678471eb23aaed2676390bb))
* use maxMemory as property ([f6e6586](https://github.com/tidev/titanium-sdk/commit/f6e658601ffa18d1b620a52610850c71bb8417ea))

### iOS platform

* fix rare crash in Ti.UI.TableView ([10f084f](https://github.com/tidev/titanium-sdk/commit/10f084f9ce60a64ee52f038b19fea5940bc230c7))
* fix textfield autocorrect:false ([29f5807](https://github.com/tidev/titanium-sdk/commit/29f580773ddeace21c78be06f6286701b9851c2c))
* fix unbalanced view controller transitions causing issues on iOS 16+ ([50814d7](https://github.com/tidev/titanium-sdk/commit/50814d717910f5b42b6f61972b30f8d10f85a268))
* optimize ListView continuousUpdate ([ca73559](https://github.com/tidev/titanium-sdk/commit/ca7355975f2f1e3724fd8359f69bc9c2fb9f464f))

## Features

### Multiple platforms

* create Alloy project optimization ([e18c213](https://github.com/tidev/titanium-sdk/commit/e18c21320e2fe588571c9586db87df9c80f67c88))
* remove ACA in builder ([9d3617d](https://github.com/tidev/titanium-sdk/commit/9d3617d313342cadd25f5b4e34109c52b4586a1e))
* update default tidev modules ([4ae258d](https://github.com/tidev/titanium-sdk/commit/4ae258da01e3fa328c83914f826dbab57607bf44))
* delete old removed items ([fc3d508](https://github.com/tidev/titanium-sdk/commit/fc3d5080ad1b0152a8e14bae6a53630f2d2b9631))
* improve Android Calendar docs ([73c4af4](https://github.com/tidev/titanium-sdk/commit/73c4af45b36560e3303c572e741f782c3a9dd473))
* remove windows images ([7e500b1](https://github.com/tidev/titanium-sdk/commit/7e500b13d22aa30e252be9bd2a02673b3dbd9771))
* update example and readme ([cbfd4c3](https://github.com/tidev/titanium-sdk/commit/cbfd4c3858e141d02580ac4a22a8aef5c3cd52cb))
* add Xcode 14 guards, bump minimum iOS version to 13.0 ([0ab0163](https://github.com/tidev/titanium-sdk/commit/0ab01636c3f2a4ddc20d0b84e8fc0e532365b2d1))
* bump master to 12.0.0 ([3af83a5](https://github.com/tidev/titanium-sdk/commit/3af83a5f2adde0d1cab19febe4edc87f32dbb2e3))

### Android platform

* add getLastLocation to FusedLocationProvider ([0155e42](https://github.com/tidev/titanium-sdk/commit/0155e421ecf3c4fc4c53094f70819fac1c472878))
* Android 13 updates ([fa604fa](https://github.com/tidev/titanium-sdk/commit/fa604fac971579225c156a51f749011a416b2c74))
* clean up Andorid min osver ([9202366](https://github.com/tidev/titanium-sdk/commit/9202366cec8e81d772d6acfd06db993b1e823963))
* delete notification channel ([e8e06cd](https://github.com/tidev/titanium-sdk/commit/e8e06cda9512e8384fe00fc78af31631b672bfa6))
* expose Picker text color ([e37bef9](https://github.com/tidev/titanium-sdk/commit/e37bef9d671585ff93de4fda72c9d01f97443826))
* ignoreLog config ([4c042ee](https://github.com/tidev/titanium-sdk/commit/4c042ee9ee6e588a0d08f6fd315df05837345702))
* material you themes ([3ef9b66](https://github.com/tidev/titanium-sdk/commit/3ef9b664bd9c7abc5c41a43c2081307c3b8dc56b))
* optimize module build ([4840523](https://github.com/tidev/titanium-sdk/commit/4840523ed315ce563fdd8cf429a56b15d315970f))
* searchBar iconColor ([7fc1c5c](https://github.com/tidev/titanium-sdk/commit/7fc1c5c27679189f650eab7dd8cd4ee554aa2dd9))
* tabbedbar color properties ([2453af6](https://github.com/tidev/titanium-sdk/commit/2453af6f27fc9a15520c4a2b3d8ca73ad58bb395))
* update libraries ([4dd041c](https://github.com/tidev/titanium-sdk/commit/4dd041ce51763c469f6e8bada972c1a224f90f31))

### iOS platform

* add Dynamic Island support ([f000f3b](https://github.com/tidev/titanium-sdk/commit/f000f3ba9b228aadbcab88ff734438a202ae9c8c))
* be able to detect an emulated iOS app on Apple Silicon ([c225669](https://github.com/tidev/titanium-sdk/commit/c225669ea4eb12951313c277bf5b61abcad73283))
* redesigned error view ([4232487](https://github.com/tidev/titanium-sdk/commit/4232487aa54c9b8eed038ede29eb7edf92dfa0a5))

## BREAKING CHANGES


## SDK Module Versions

| Module      | Android version | iOS Version |
| ----------- | --------------- | ----------- |
| facebook | 12.0.0 | 13.0.0 |
| ti.map | 5.5.0 | 7.0.0 |
| ti.webdialog | 2.2.0 | 3.0.2 |
| ti.playservices | 18.1.0 | n/a |
| ti.identity | 3.1.0 | 5.0.0 |
| urlSession | n/a | 4.0.1 |
| ti.coremotion | n/a | 4.0.1 |
| ti.applesignin | n/a | 3.1.2 |
| hyperloop | 7.0.4 | 7.0.4 |

# [11.1.0](https://github.com/tidev/titanium-sdk/compare/11_0_X...11.1.0) (2022-08-29)

## About this release

Titanium SDK 11.1.0 is a minor release of the SDK, addressing high-priority issues from previous releases.


## Community Credits

* Michael Gangolf
  * add autoSize to label ([703c760](https://github.com/tidev/titanium-sdk/commit/703c760aa64799cfed49926af2af46cea1e4261a))
  * snackbar ([59fd9fe](https://github.com/tidev/titanium-sdk/commit/59fd9fe764a0299f781ce0b6d30c8cb824bd983b))
  * continuous update for ListView scrolling event ([74b00ce](https://github.com/tidev/titanium-sdk/commit/74b00ce2b37f3fab45d5fe0c53b0033a2b999b53))
  * add headingTime, fix headingFilter ([6170a1e](https://github.com/tidev/titanium-sdk/commit/6170a1e007ca76cf017e8459afa16c5567234ef1))
  * add position to TableView scrollToIndex ([bed6382](https://github.com/tidev/titanium-sdk/commit/bed638257360ae8f4ef0079930f3717f6e3b01b6))
  * add Slider style example ([9aeff5d](https://github.com/tidev/titanium-sdk/commit/9aeff5d8abece7d4258af66912b9c66166aeb62a))
  * textfield padding ([dcdfce5](https://github.com/tidev/titanium-sdk/commit/dcdfce50f823b90dd7fff4dc92a74e798acf86e7))
  * null check in DisplayCapsProxy ([d60baec](https://github.com/tidev/titanium-sdk/commit/d60baeca1cd105b74c2ca225c370458ba4dcfe7c))
  * add install failed error message ([e5c8391](https://github.com/tidev/titanium-sdk/commit/e5c83912ffe83ef4e67a12954869957d15b771cf))
  * Parity for Ti.UI.ListViewScrollPosition.* / Ti.UI.TableViewScrollPosition.* on iOS/Android ([8cea843](https://github.com/tidev/titanium-sdk/commit/8cea843e92c439e28e165d22fea51e874d0b3cf0))
  * fix some tests ([8dac17b](https://github.com/tidev/titanium-sdk/commit/8dac17bd087a50988b577cda2e1df5a360c9242d))
  * update support libraries ([2958575](https://github.com/tidev/titanium-sdk/commit/29585759c29e524a531c3af2f7b4a23462d5ea28))
  * viewShadowColor parity ([63b70fd](https://github.com/tidev/titanium-sdk/commit/63b70fdde57c7453653f8e10ae2b9955632fe5ee))
  * update node-appc ([10c2332](https://github.com/tidev/titanium-sdk/commit/10c2332060a884b813aa38e605a519053a28d4d1))

* Hans Knöchel
  * require “canMove” property to be true ([f202a6e](https://github.com/tidev/titanium-sdk/commit/f202a6edba1292bcfcead562274f3319ec868edc))
  * move “movestart” event call to a better place ([be725e2](https://github.com/tidev/titanium-sdk/commit/be725e204b7f0141d45ccc09e3149c8830307c79))
  * fix navigation items in tab group layout ([d02580b](https://github.com/tidev/titanium-sdk/commit/d02580b2cf3b57e436840b09b4a6e09c4e6cd4c9))
  * fix tabgroup layout on iOS 16+ ([5afeee0](https://github.com/tidev/titanium-sdk/commit/5afeee071c1e95de03290fa25c28e48a6a2a1d59))
  * add more context to list view cell warning ([43faca2](https://github.com/tidev/titanium-sdk/commit/43faca25468de87664996998db91ce3b78368d37))
  * Revert "fix(android): textfield padding (#13279)" (#13512) ([918388a](https://github.com/tidev/titanium-sdk/commit/918388a75a98c3f5458d27f6ed035f11883b303e))
  * add „movestart“ and "moveend" events to drag and drop ([31d8194](https://github.com/tidev/titanium-sdk/commit/31d819496b5d8ec95d4e5df250de487697786df1))
  * fix asset catalog regression ([48208e3](https://github.com/tidev/titanium-sdk/commit/48208e3647ab6ac7b33fefa6e3a692ddc589d548))
  * be able to drag and drop without explicit editing mode ([a742403](https://github.com/tidev/titanium-sdk/commit/a7424036b8316ba4c8cb1cce37eafee7a444262a))
  * fix nil-check for remote cache ([2e2cff4](https://github.com/tidev/titanium-sdk/commit/2e2cff4a5f7e1cec0b4eefcc0e841e6cc49c4fe8))
  * fix Ti.UI.ListView scroll state restoration ([6f96424](https://github.com/tidev/titanium-sdk/commit/6f964247458bbb86528ca037d9582a6bde3004b9))
  * update facebook SDK’s ([879be32](https://github.com/tidev/titanium-sdk/commit/879be32dbad2962d8bd1d3be5bbaa21a6314f108))
  * update ioslib to 1.7.29 ([293152e](https://github.com/tidev/titanium-sdk/commit/293152ed85784317363a92686f1f1df0a1f817e4))
  * bump master to 11.1.0 ([e6a8f43](https://github.com/tidev/titanium-sdk/commit/e6a8f438a4e7e1ba2ef1d38c91de65951a1cd608))

* Marc Bender
  * add option to exclude dir(s) from compiling to assests catalog … ([d0ab654](https://github.com/tidev/titanium-sdk/commit/d0ab6546c69533e4be4bf988c437f0d77cddcff5))

## Bug Fixes

### iOS platform

* require “canMove” property to be true ([f202a6e](https://github.com/tidev/titanium-sdk/commit/f202a6edba1292bcfcead562274f3319ec868edc))
* fix asset catalog regression ([48208e3](https://github.com/tidev/titanium-sdk/commit/48208e3647ab6ac7b33fefa6e3a692ddc589d548))
* fix tabgroup layout on iOS 16+ ([5afeee0](https://github.com/tidev/titanium-sdk/commit/5afeee071c1e95de03290fa25c28e48a6a2a1d59))

### Multiple platforms

* move “movestart” event call to a better place ([be725e2](https://github.com/tidev/titanium-sdk/commit/be725e204b7f0141d45ccc09e3149c8830307c79))
* fix navigation items in tab group layout ([d02580b](https://github.com/tidev/titanium-sdk/commit/d02580b2cf3b57e436840b09b4a6e09c4e6cd4c9))
* fix nil-check for remote cache ([2e2cff4](https://github.com/tidev/titanium-sdk/commit/2e2cff4a5f7e1cec0b4eefcc0e841e6cc49c4fe8))
* fix some tests ([8dac17b](https://github.com/tidev/titanium-sdk/commit/8dac17bd087a50988b577cda2e1df5a360c9242d))

### Android platform

* fix Ti.UI.ListView scroll state restoration ([6f96424](https://github.com/tidev/titanium-sdk/commit/6f964247458bbb86528ca037d9582a6bde3004b9))
* null check in DisplayCapsProxy ([d60baec](https://github.com/tidev/titanium-sdk/commit/d60baeca1cd105b74c2ca225c370458ba4dcfe7c))
* textfield padding ([dcdfce5](https://github.com/tidev/titanium-sdk/commit/dcdfce50f823b90dd7fff4dc92a74e798acf86e7))

## Features

### Multiple platforms

* update node-appc ([10c2332](https://github.com/tidev/titanium-sdk/commit/10c2332060a884b813aa38e605a519053a28d4d1))
* continuous update for ListView scrolling event ([74b00ce](https://github.com/tidev/titanium-sdk/commit/74b00ce2b37f3fab45d5fe0c53b0033a2b999b53))
* be able to drag and drop without explicit editing mode ([a742403](https://github.com/tidev/titanium-sdk/commit/a7424036b8316ba4c8cb1cce37eafee7a444262a))
* add option to exclude dir(s) from compiling to assests catalog … ([d0ab654](https://github.com/tidev/titanium-sdk/commit/d0ab6546c69533e4be4bf988c437f0d77cddcff5))
* Parity for Ti.UI.ListViewScrollPosition.* / Ti.UI.TableViewScrollPosition.* on iOS/Android ([8cea843](https://github.com/tidev/titanium-sdk/commit/8cea843e92c439e28e165d22fea51e874d0b3cf0))
* update facebook SDK’s ([879be32](https://github.com/tidev/titanium-sdk/commit/879be32dbad2962d8bd1d3be5bbaa21a6314f108))

### Android platform

* add autoSize to label ([703c760](https://github.com/tidev/titanium-sdk/commit/703c760aa64799cfed49926af2af46cea1e4261a))
* add headingTime, fix headingFilter ([6170a1e](https://github.com/tidev/titanium-sdk/commit/6170a1e007ca76cf017e8459afa16c5567234ef1))
* add position to TableView scrollToIndex ([bed6382](https://github.com/tidev/titanium-sdk/commit/bed638257360ae8f4ef0079930f3717f6e3b01b6))
* snackbar ([59fd9fe](https://github.com/tidev/titanium-sdk/commit/59fd9fe764a0299f781ce0b6d30c8cb824bd983b))
* update support libraries ([2958575](https://github.com/tidev/titanium-sdk/commit/29585759c29e524a531c3af2f7b4a23462d5ea28))
* viewShadowColor parity ([63b70fd](https://github.com/tidev/titanium-sdk/commit/63b70fdde57c7453653f8e10ae2b9955632fe5ee))

### iOS platform

* add install failed error message ([e5c8391](https://github.com/tidev/titanium-sdk/commit/e5c83912ffe83ef4e67a12954869957d15b771cf))
* redesigned error view ([b8a14b3](https://github.com/tidev/titanium-sdk/commit/b8a14b3d6af920694a2bf0837d2e741a6ae13d19))

## BREAKING CHANGES


## SDK Module Versions

| Module      | Android version | iOS Version |
| ----------- | --------------- | ----------- |
| facebook | 11.2.0 | 12.1.0 |
| ti.map | 5.3.4 | 6.0.1 |
| ti.webdialog | 2.2.0 | 3.0.2 |
| ti.playservices | 17.5.0 | n/a |
| ti.identity | 3.1.0 | 4.0.1 |
| urlSession | n/a | 4.0.1 |
| ti.coremotion | n/a | 4.0.1 |
| ti.applesignin | n/a | 3.1.1 |
| hyperloop | 7.0.4 | 7.0.4 |

# [11.0.0](https://github.com/tidev/titanium-sdk/compare/10_1_X...11.0.0) (2022-05-21)

## About this release

Titanium SDK 11.0.0 is a major release of the SDK, addressing high-priority issues from previous releases.


## Community Credits

* Sebastian Klaus
  * more copyrights changed in java files ([4e806df](https://github.com/tidev/titanium-sdk/commit/4e806df95de7f1c26045fbaf9b37b2b1b1fce9ad))
  * copyright in java files ([e4b50ad](https://github.com/tidev/titanium-sdk/commit/e4b50ad971b0b4741eb79eefb33bc284d670deb7))
  * fixed legal link (#13441) ([11af5ff](https://github.com/tidev/titanium-sdk/commit/11af5ff02a9fd6d71eb3dc05fb1bba34bd73fcbf))
  * replace tislack.org with slack.tidev.io ([81d3f4a](https://github.com/tidev/titanium-sdk/commit/81d3f4a1bfa69a5367b8cf05af40b608b62ebe3b))
  * Fix legal information and copyrights (#13436) ([27cbe93](https://github.com/tidev/titanium-sdk/commit/27cbe93e5ab596f0864bdc390f2297f2cb492aaf))
  * Create FUNDING.yml ([d296e02](https://github.com/tidev/titanium-sdk/commit/d296e02477900f56f722bcd4418727534606de86))
  * removed semicolon as it breaks the app if the example is used ([2800aee](https://github.com/tidev/titanium-sdk/commit/2800aee07ad3f0a2f14a3edbec8321d6a3deae6b))
  * Replace appcelerator relations (#13347) ([1132743](https://github.com/tidev/titanium-sdk/commit/11327431ab8ffe9c6693b0ee4ef40e00130e1608))
  * removed appcelerator from templates and extended templates (#13315) ([cc50eff](https://github.com/tidev/titanium-sdk/commit/cc50eff370ead285c601a0abe131ba1389af2260))

* Bruno Augier
  * for module build enable target & device-id command line parameters for the example app ([e915ef6](https://github.com/tidev/titanium-sdk/commit/e915ef6352782096d3c75c294a54a68720ae4c1f))
  * fix windows build of Titanium SDK - titanium_mobile ([6566453](https://github.com/tidev/titanium-sdk/commit/656645388d6d7d3601751a5cf11ea6bdd3939285))

* Michael Gangolf
  * update gradle to 7.4.2 ([122fa59](https://github.com/tidev/titanium-sdk/commit/122fa59b761fc19ed8513b208394d2b1f1c39f95))
  * update included module versions ([49657d9](https://github.com/tidev/titanium-sdk/commit/49657d9e3f11fba23c4730a707bcb0c98b3615c4))
  * revert to V8 8 ([1e14156](https://github.com/tidev/titanium-sdk/commit/1e14156cc67aa6e132afca3f85380ae50ab3c848))
  * remove deprecated parameter from example ([6d84ca9](https://github.com/tidev/titanium-sdk/commit/6d84ca9fe8674102174870d6862b1cf45975b448))
  * change xmlns ([32c628e](https://github.com/tidev/titanium-sdk/commit/32c628e3d3c742aaddd9d8812ffc4dda056bc624))
  * change version number ([b98c67e](https://github.com/tidev/titanium-sdk/commit/b98c67e7f0a735ba1d21be24fc1ed2ec7258a6a3))
  * fix restart activity ([0205aa7](https://github.com/tidev/titanium-sdk/commit/0205aa7ba321d8fe27cc5b0dcbfcdd759714a0f4))
  * expose base context ([5618220](https://github.com/tidev/titanium-sdk/commit/5618220a521886a76149c38f6d74b8c15fe7ac17))
  * add other skip-zip npm scripts ([fbbc258](https://github.com/tidev/titanium-sdk/commit/fbbc258894ee643164bf2933403d430da652fb56))
  * add fixedSize to RecyclerViews ([d057eed](https://github.com/tidev/titanium-sdk/commit/d057eed0d88458a60b6557478e51ea38a3dd4bd3))
  * add defaultCalendar to Ti.Calendar ([0d20ec0](https://github.com/tidev/titanium-sdk/commit/0d20ec02995f09b00e0e1cf86fd9fd51fb78473b))
  * fix clipboard test ([6289860](https://github.com/tidev/titanium-sdk/commit/62898605bb5b0319eb2ed3997dedead8cbeac56a))
  * update internal libraries ([1325f1a](https://github.com/tidev/titanium-sdk/commit/1325f1ab4732993899380897b220e747dbeff21c))
  * add default semantic.colors.json ([498b596](https://github.com/tidev/titanium-sdk/commit/498b59625a75b6336b2a4ee411b2d3a45d6129f3))
  * issue templates ([226f87d](https://github.com/tidev/titanium-sdk/commit/226f87dee02f86935adf925588243bf85d5eb50b))
  * move to getter/setter ([734c41b](https://github.com/tidev/titanium-sdk/commit/734c41b56cd63010b269ef6b6e6247da2f9d656c))
  * parity for optionbar index ([af7371b](https://github.com/tidev/titanium-sdk/commit/af7371b8671e30bd449c311ea3e101c57575f1f9))
  * remote webview, fix two errors ([0372c45](https://github.com/tidev/titanium-sdk/commit/0372c459fca3605011a08990f76db1a2995dff8e))
  * color regex for rgba() ([07b108a](https://github.com/tidev/titanium-sdk/commit/07b108a5f38695bef850ce4cc77094a142dc3ac5))
  * roundBorder fix for Android 12+ ([7628a5c](https://github.com/tidev/titanium-sdk/commit/7628a5c42d3e5b82320d518e7c029c09a42f7c3c))
  * sync tab and actionbar title ([6972587](https://github.com/tidev/titanium-sdk/commit/6972587807632d95e3c40debda31173154cead04))
  * Update documentation TabGroup/VideoPlayer/TableViewRow ([5068dc1](https://github.com/tidev/titanium-sdk/commit/5068dc1d89cff65af009490e6665ab84dc4acec9))
  * remove Ti.Analytics (iOS / Android) ([3e54924](https://github.com/tidev/titanium-sdk/commit/3e549242e8421601dc5f98bf68cb16e723bf7d27))
  * fix static links ([ae68972](https://github.com/tidev/titanium-sdk/commit/ae6897296355bcd56bfb7586975e368212137902))
  * tabgroup/scrollview null pointer ([c706bea](https://github.com/tidev/titanium-sdk/commit/c706bea567d683d318fe179c97ba33cb20809ab4))
  * update documentation links in readme ([79a94f7](https://github.com/tidev/titanium-sdk/commit/79a94f746b4971af4b10416761b779c8a431ed04))

* Hans Knöchel
  * fix adaptive background gradients ([6435c02](https://github.com/tidev/titanium-sdk/commit/6435c0241a43de74d63e5b48943653cd20b378e4))
  * document iPadOS behavior ([08450e3](https://github.com/tidev/titanium-sdk/commit/08450e3ecf9cdf9f15db3a05f50a30b57c8a3a9f))
  * properly expose precompile flags for Ti.Media.queryMusicLibrary API ([74a6e3c](https://github.com/tidev/titanium-sdk/commit/74a6e3c5ffdc689ca3d9451ecf4aa27ed5b82654))
  * fix top padding of dim-view in Ti.UI.TableView's search-bar  ([c0c2dcc](https://github.com/tidev/titanium-sdk/commit/c0c2dccf8f74e11464876c189c15431c7e4cb238))
  * fix drag and drop issues ([cffee52](https://github.com/tidev/titanium-sdk/commit/cffee52517ffc77f1362927c11f352666edc124c))
  * remove falsy error log ([d9ef416](https://github.com/tidev/titanium-sdk/commit/d9ef41613f896926eec931b3d00f8a4feca72111))
  * apply “overrideUserInterfaceStyle” to main app window ([07c7422](https://github.com/tidev/titanium-sdk/commit/07c7422be3b0cc6cc97c650ab62af0c286293578))
  * Revert "Revert "fix(webview): authenticationMethod NSURLAuthenticationMethodClientCertificate not handled correctly (#13352)" (#13354)" (#13367) ([2e8fa00](https://github.com/tidev/titanium-sdk/commit/2e8fa00f24f4c18e766f10eaee3d9506b3ac57a3))
  * Revert "fix(webview): authenticationMethod NSURLAuthenticationMethodClientCertificate not handled correctly (#13352)" (#13354) ([827752f](https://github.com/tidev/titanium-sdk/commit/827752f46a25209c58e167e69a37947040ec0c6b))
  * support flexible border radius in card view ([a1c8edf](https://github.com/tidev/titanium-sdk/commit/a1c8edf55938186c8b9e500e72e264533a1e0974))
  * fix build deps ([dbb7177](https://github.com/tidev/titanium-sdk/commit/dbb7177498d434983eee0d720cac8a31238f6632))
  * redraw CGColor when changing trait collection ([1ac97a4](https://github.com/tidev/titanium-sdk/commit/1ac97a45283e2ecdd87d680a70b9d5e153e38c0b))

* Marc Bender
  * fixes crashing macos app because of permissions ([c36867e](https://github.com/tidev/titanium-sdk/commit/c36867e6422246119a7f3a76566771fe52bfa6db))
  * textarea contentHeight fix with new return property textareaHeight in "change" event ([94820d1](https://github.com/tidev/titanium-sdk/commit/94820d1952d5e301b6ea2741576b3046b5b382b5))
  * backgroundcolor Ti.UI.backgroundcolor fixed on modal windows ([a1c83d8](https://github.com/tidev/titanium-sdk/commit/a1c83d8e0a5b071b71ede22d494447949656f639))

* Christian Hauf
  * authenticationMethod NSURLAuthenticationMethodClientCertificate not handled correctly ([edfd037](https://github.com/tidev/titanium-sdk/commit/edfd037c4e6f50aa03cd382247d5128bb9292731))

* Sergey Volkov
  * update link to a build status badge ([b66c287](https://github.com/tidev/titanium-sdk/commit/b66c287161788e00d05adbe5bc2b61322d827688))
  * problems with "userinterfacestyle" event ([bdfd640](https://github.com/tidev/titanium-sdk/commit/bdfd64029484abd2f3b61b1239c6cd3835e82722))
  * [TIMOB-28563](https://jira-archive.titaniumsdk.com/TIMOB-28563) - use Activity for colors resolution ([e290733](https://github.com/tidev/titanium-sdk/commit/e2907331ef681ca2aaf6d96d1e1718dbeb427acc))
  * reuse address for debugger ([c404163](https://github.com/tidev/titanium-sdk/commit/c4041636297034167bc581474c7057acf5ebae7f))
  * [TIMOB-28583](https://jira-archive.titaniumsdk.com/TIMOB-28583) - commit fragments transaction only once after wrapping view being attached to a window ([0838db2](https://github.com/tidev/titanium-sdk/commit/0838db24a64d0eec534d02b9b43efea8d98d7d05))
  * crash in ListView on API 21 ([b30de10](https://github.com/tidev/titanium-sdk/commit/b30de101032fc668bcf8284559aec3f0a4eacb52))
  * Titanium.UI.iOS.Toolbar was removed in 10.0.0 ([23986a3](https://github.com/tidev/titanium-sdk/commit/23986a36be11b52a8485ce8971e6e3869c7bc738))

* Monili Nicolò
  * [TIMOB-28543](https://jira-archive.titaniumsdk.com/TIMOB-28543) - selectedBackgroundGradient deprecation shown when not using it ([93f5689](https://github.com/tidev/titanium-sdk/commit/93f5689444c57534c5a2defb336ce6802c97e5a6))


## Bug Fixes

### Multiple platforms

* copyright in java files ([e4b50ad](https://github.com/tidev/titanium-sdk/commit/e4b50ad971b0b4741eb79eefb33bc284d670deb7))
* document iPadOS behavior ([08450e3](https://github.com/tidev/titanium-sdk/commit/08450e3ecf9cdf9f15db3a05f50a30b57c8a3a9f))
* fix adaptive background gradients ([6435c02](https://github.com/tidev/titanium-sdk/commit/6435c0241a43de74d63e5b48943653cd20b378e4))
* for module build enable target & device-id command line parameters for the example app ([e915ef6](https://github.com/tidev/titanium-sdk/commit/e915ef6352782096d3c75c294a54a68720ae4c1f))
* morey copyrights changed in java files ([4e806df](https://github.com/tidev/titanium-sdk/commit/4e806df95de7f1c26045fbaf9b37b2b1b1fce9ad))
* removed semicolon as it breaks the app if the example is used ([2800aee](https://github.com/tidev/titanium-sdk/commit/2800aee07ad3f0a2f14a3edbec8321d6a3deae6b))
* rollback dateformat version to 4.6.3 ([cbb2746](https://github.com/tidev/titanium-sdk/commit/cbb27466c3f181bd139a8879a44b54fb6ba0eedb))
* fix windows build of Titanium SDK - titanium_mobile ([6566453](https://github.com/tidev/titanium-sdk/commit/656645388d6d7d3601751a5cf11ea6bdd3939285))
* replace tislack.org with slack.tidev.io ([81d3f4a](https://github.com/tidev/titanium-sdk/commit/81d3f4a1bfa69a5367b8cf05af40b608b62ebe3b))
* change xmlns ([32c628e](https://github.com/tidev/titanium-sdk/commit/32c628e3d3c742aaddd9d8812ffc4dda056bc624))
* fixes crashing macos app because of permissions ([c36867e](https://github.com/tidev/titanium-sdk/commit/c36867e6422246119a7f3a76566771fe52bfa6db))
* remove deprecated parameter from example ([6d84ca9](https://github.com/tidev/titanium-sdk/commit/6d84ca9fe8674102174870d6862b1cf45975b448))
* properly expose precompile flags for Ti.Media.queryMusicLibrary API ([74a6e3c](https://github.com/tidev/titanium-sdk/commit/74a6e3c5ffdc689ca3d9451ecf4aa27ed5b82654))
* Update documentation TabGroup/VideoPlayer/TableViewRow ([5068dc1](https://github.com/tidev/titanium-sdk/commit/5068dc1d89cff65af009490e6665ab84dc4acec9))
* move to getter/setter ([734c41b](https://github.com/tidev/titanium-sdk/commit/734c41b56cd63010b269ef6b6e6247da2f9d656c))
* authenticationMethod NSURLAuthenticationMethodClientCertificate not handled correctly ([edfd037](https://github.com/tidev/titanium-sdk/commit/edfd037c4e6f50aa03cd382247d5128bb9292731))
* issue templates ([226f87d](https://github.com/tidev/titanium-sdk/commit/226f87dee02f86935adf925588243bf85d5eb50b))
* update link to a build status badge ([b66c287](https://github.com/tidev/titanium-sdk/commit/b66c287161788e00d05adbe5bc2b61322d827688))

### Android platform

* [TIMOB-28535](https://jira-archive.titaniumsdk.com/TIMOB-28535) - blob fails to read WebP image info ([acc561a](https://github.com/tidev/titanium-sdk/commit/acc561af3c246c0ac98b95c4a9f0ed60688022b8))
* color regex for rgba() ([07b108a](https://github.com/tidev/titanium-sdk/commit/07b108a5f38695bef850ce4cc77094a142dc3ac5))
* [TIMOB-28583](https://jira-archive.titaniumsdk.com/TIMOB-28583) - commit fragments transaction only once after wrapping view being attached to a window ([0838db2](https://github.com/tidev/titanium-sdk/commit/0838db24a64d0eec534d02b9b43efea8d98d7d05))
* crash in ListView on API 21 ([b30de10](https://github.com/tidev/titanium-sdk/commit/b30de101032fc668bcf8284559aec3f0a4eacb52))
* [TIMOB-28552](https://jira-archive.titaniumsdk.com/TIMOB-28552) [TIMOB-28553](https://jira-archive.titaniumsdk.com/TIMOB-28553) [TIMOB-28554](https://jira-archive.titaniumsdk.com/TIMOB-28554) [TIMOB-28555](https://jira-archive.titaniumsdk.com/TIMOB-28555) - edit move issues with ListView/TableView ([e525889](https://github.com/tidev/titanium-sdk/commit/e5258890f3cd14fee369ff6b538d472f2ed17122))
* fix build deps ([dbb7177](https://github.com/tidev/titanium-sdk/commit/dbb7177498d434983eee0d720cac8a31238f6632))
* fix drag and drop issues ([cffee52](https://github.com/tidev/titanium-sdk/commit/cffee52517ffc77f1362927c11f352666edc124c))
* fix restart activity ([0205aa7](https://github.com/tidev/titanium-sdk/commit/0205aa7ba321d8fe27cc5b0dcbfcdd759714a0f4))
* menu and toolbar icons to use ActionBar style colors ([2052f78](https://github.com/tidev/titanium-sdk/commit/2052f783867fc6c032f9c3f9c1086d1b02e9b17b))
* [TIMOB-28547](https://jira-archive.titaniumsdk.com/TIMOB-28547) - menu item icon wrongly ignores theme ([f3c4057](https://github.com/tidev/titanium-sdk/commit/f3c40577e3b65ebd583a442788266d7caf4276a2))
* prevent multiple RippleDrawable backgrounds ([87553fa](https://github.com/tidev/titanium-sdk/commit/87553fa1b9f704bc525cbc7f1a701eb56a1cb905))
* [TIMOB-28558](https://jira-archive.titaniumsdk.com/TIMOB-28558) - restore res/drawable support for Ti.UI.Button ([11dc187](https://github.com/tidev/titanium-sdk/commit/11dc187fa042285eb071895af4b6bdfb354c15ca))
* reuse address for debugger ([c404163](https://github.com/tidev/titanium-sdk/commit/c4041636297034167bc581474c7057acf5ebae7f))
* [TIMOB-28577](https://jira-archive.titaniumsdk.com/TIMOB-28577) - themes to not use dark status/nav icons on dark background ([08219c2](https://github.com/tidev/titanium-sdk/commit/08219c238da536a376cedada486ab7a60164786d))
* problems with "userinterfacestyle" event ([bdfd640](https://github.com/tidev/titanium-sdk/commit/bdfd64029484abd2f3b61b1239c6cd3835e82722))
* revert to V8 8 ([1e14156](https://github.com/tidev/titanium-sdk/commit/1e14156cc67aa6e132afca3f85380ae50ab3c848))
* drop-down picker to never accept keyboard input ([2dad43e](https://github.com/tidev/titanium-sdk/commit/2dad43e47e6db455ce6d9f852082ab766bfd81d8))
* fix clipboard test ([6289860](https://github.com/tidev/titanium-sdk/commit/62898605bb5b0319eb2ed3997dedead8cbeac56a))
* re-create list upon visibility change ([18b4eaf](https://github.com/tidev/titanium-sdk/commit/18b4eaffaf3e0b73d74f628cb5e262c2b951b9ef))
* refactor clipboard to remove deprecated apis ([09e3e0d](https://github.com/tidev/titanium-sdk/commit/09e3e0dd243fd5423364371534f29de8d7dec757))
* roundBorder fix for Android 12+ ([7628a5c](https://github.com/tidev/titanium-sdk/commit/7628a5c42d3e5b82320d518e7c029c09a42f7c3c))
* tabgroup/scrollview null pointer ([c706bea](https://github.com/tidev/titanium-sdk/commit/c706bea567d683d318fe179c97ba33cb20809ab4))
* [TIMOB-28576](https://jira-archive.titaniumsdk.com/TIMOB-28576) - Ti.UI.Android.ProgressIndicator dialog not using theme's "colorPrimary" ([71ce0e9](https://github.com/tidev/titanium-sdk/commit/71ce0e9ec7d43d4999dde998eb060fb4afb770e3))
* [TIMOB-28563](https://jira-archive.titaniumsdk.com/TIMOB-28563) - use Activity for colors resolution ([e290733](https://github.com/tidev/titanium-sdk/commit/e2907331ef681ca2aaf6d96d1e1718dbeb427acc))

### iOS platform

* apply “overrideUserInterfaceStyle” to main app window ([07c7422](https://github.com/tidev/titanium-sdk/commit/07c7422be3b0cc6cc97c650ab62af0c286293578))
* backgroundcolor Ti.UI.backgroundcolor fixed on modal windows ([a1c83d8](https://github.com/tidev/titanium-sdk/commit/a1c83d8e0a5b071b71ede22d494447949656f639))
* [TIMOB-28544](https://jira-archive.titaniumsdk.com/TIMOB-28544) - dont run simulator detection for macos builds ([ead1713](https://github.com/tidev/titanium-sdk/commit/ead1713e5e36b4632b692ce6fcc9a9785b91ad26))
* fix top padding of dim-view in Ti.UI.TableView's search-bar  ([c0c2dcc](https://github.com/tidev/titanium-sdk/commit/c0c2dccf8f74e11464876c189c15431c7e4cb238))
* [TIMOB-28548](https://jira-archive.titaniumsdk.com/TIMOB-28548) - ListView/TableView multiselection events only fired when tapping checkboxes ([09e9044](https://github.com/tidev/titanium-sdk/commit/09e90441869b1330902ad97ebea8ec59e4a6b82c))
* redraw CGColor when changing trait collection ([1ac97a4](https://github.com/tidev/titanium-sdk/commit/1ac97a45283e2ecdd87d680a70b9d5e153e38c0b))
* remove falsy error log ([d9ef416](https://github.com/tidev/titanium-sdk/commit/d9ef41613f896926eec931b3d00f8a4feca72111))
* [TIMOB-28543](https://jira-archive.titaniumsdk.com/TIMOB-28543) - selectedBackgroundGradient deprecation shown when not using it ([93f5689](https://github.com/tidev/titanium-sdk/commit/93f5689444c57534c5a2defb336ce6802c97e5a6))

## Features

### Multiple platforms

* update included module versions ([49657d9](https://github.com/tidev/titanium-sdk/commit/49657d9e3f11fba23c4730a707bcb0c98b3615c4))
* [TIMOB-28558](https://jira-archive.titaniumsdk.com/TIMOB-28558) [TIMOB-28559](https://jira-archive.titaniumsdk.com/TIMOB-28559) - add "imageIsMask" property to Ti.UI.Button ([0b82834](https://github.com/tidev/titanium-sdk/commit/0b828344c7a6c5cec45d82dac1829771657aac5d))
* add default semantic.colors.json ([498b596](https://github.com/tidev/titanium-sdk/commit/498b59625a75b6336b2a4ee411b2d3a45d6129f3))
* [TIMOB-28562](https://jira-archive.titaniumsdk.com/TIMOB-28562) - declare node 16 support ([8465675](https://github.com/tidev/titanium-sdk/commit/8465675286aad65859961a27d2a0d9eac16d3522))
* remove Ti.Analytics (iOS / Android) ([3e54924](https://github.com/tidev/titanium-sdk/commit/3e549242e8421601dc5f98bf68cb16e723bf7d27))

### Android platform

* add defaultCalendar to Ti.Calendar ([0d20ec0](https://github.com/tidev/titanium-sdk/commit/0d20ec02995f09b00e0e1cf86fd9fd51fb78473b))
* add fixedSize to RecyclerViews ([d057eed](https://github.com/tidev/titanium-sdk/commit/d057eed0d88458a60b6557478e51ea38a3dd4bd3))
* add other skip-zip npm scripts ([fbbc258](https://github.com/tidev/titanium-sdk/commit/fbbc258894ee643164bf2933403d430da652fb56))
* [TIMOB-4350](https://jira-archive.titaniumsdk.com/TIMOB-4350) - add pinch zoom and double-tap zoom support to ImageView ([2f90677](https://github.com/tidev/titanium-sdk/commit/2f90677094a8142a37f97507e2df007dcd7b2fc3))
* expose base context ([5618220](https://github.com/tidev/titanium-sdk/commit/5618220a521886a76149c38f6d74b8c15fe7ac17))
* menu text should not be all-caps by default ([da00331](https://github.com/tidev/titanium-sdk/commit/da003310d92bff28675d919b04b9d7aaa75f14cc))
* parity for optionbar index ([af7371b](https://github.com/tidev/titanium-sdk/commit/af7371b8671e30bd449c311ea3e101c57575f1f9))
* support flexible border radius in card view ([a1c8edf](https://github.com/tidev/titanium-sdk/commit/a1c8edf55938186c8b9e500e72e264533a1e0974))
* sync tab and actionbar title ([6972587](https://github.com/tidev/titanium-sdk/commit/6972587807632d95e3c40debda31173154cead04))
* update gradle to 7.4.2 ([122fa59](https://github.com/tidev/titanium-sdk/commit/122fa59b761fc19ed8513b208394d2b1f1c39f95))
* update internal libraries ([1325f1a](https://github.com/tidev/titanium-sdk/commit/1325f1ab4732993899380897b220e747dbeff21c))

### iOS platform

* textarea contentHeight fix with new return property textareaHeight in "change" event ([94820d1](https://github.com/tidev/titanium-sdk/commit/94820d1952d5e301b6ea2741576b3046b5b382b5))

## BREAKING CHANGES


## SDK Module Versions

| Module      | Android version | iOS Version |
| ----------- | --------------- | ----------- |
| facebook | 11.1.0 | 12.0.0 |
| ti.map | 5.3.4 | 6.0.1 |
| ti.webdialog | 2.2.0 | 3.0.2 |
| ti.playservices | 17.5.0 | n/a |
| ti.identity | 3.1.0 | 4.0.1 |
| urlSession | n/a | 4.0.1 |
| ti.coremotion | n/a | 4.0.1 |
| ti.applesignin | n/a | 3.1.1 |
| hyperloop | 7.0.4 | 7.0.4 |

## [10.1.1](https://github.com/tidev/titanium-sdk/compare/10_1_0_GA...10.1.1) (2021-11-19)

## About this release

Titanium SDK 10.1.1 is a patch release of the SDK, addressing high-priority issues from previous releases.

As of this GA release, the previous Titanium SDK patch release (10.1.0) is no longer supported.


## Community Credits

* Michael Gangolf
  * [TIMOB-28532](https://jira-archive.titaniumsdk.com/TIMOB-28532) - photogallery cancel event ([a54f632](https://github.com/tidev/titanium-sdk/commit/a54f63281787e675cb52656c8a610b7b4116d799))


## Bug Fixes

### Android platform

* [TIMOB-28572](https://jira-archive.titaniumsdk.com/TIMOB-28572) - TableView fails to render drawable on API 25 ([58037db](https://github.com/tidev/titanium-sdk/commit/58037db8fbfe47d5847cbe39fee1ff4694ec9bb4))
* [TIMOB-28573](https://jira-archive.titaniumsdk.com/TIMOB-28573) - Complex items added to ListView after window open can cause scroll performance issues as of 9.3.0 ([3a5153c](https://github.com/tidev/titanium-sdk/commit/3a5153c230f43c34f78d03d572bdd179fe00ee11))
* [TIMOB-28561](https://jira-archive.titaniumsdk.com/TIMOB-28561) - ListView fails to apply i18n "textid" and "titleid" properties on off-screen list items ([29502ac](https://github.com/tidev/titanium-sdk/commit/29502acb3dafcb1ac93bc974b5b8bf0e0c93d9c7))

### iOS platform

* [TIMOB-28556](https://jira-archive.titaniumsdk.com/TIMOB-28556) - Drag-and-dropped text into TextArea will crash on iOS 15 if it exceeds maxLength ([5ebb9d2](https://github.com/tidev/titanium-sdk/commit/5ebb9d2fcd77a92edf392cb53146a5e5fe85e8c9))
* [TIMOB-28532](https://jira-archive.titaniumsdk.com/TIMOB-28532) - openPhotoGallery() does not invoke cancel callback if swiped down ([a54f632](https://github.com/tidev/titanium-sdk/commit/a54f63281787e675cb52656c8a610b7b4116d799))
* [TIMOB-28551](https://jira-archive.titaniumsdk.com/TIMOB-28551) - TabGroup icons are tinted wrong on iOS 12 and older ([248763a](https://github.com/tidev/titanium-sdk/commit/248763a26b5c0afcb4994f620f6a45ab2cdab0ac)) ([8d29f63](https://github.com/tidev/titanium-sdk/commit/8d29f6306a2fdfa82b7b2ada9c4ec46726fd4889))
* [TIMOB-28550](https://jira-archive.titaniumsdk.com/TIMOB-28550) - TabGroup property "titleColor" is mishandled on iOS 15 ([6fae767](https://github.com/tidev/titanium-sdk/commit/6fae767bfbbb7d3ad5bec19590008c1d874aebff))
* [TIMOB-28542](https://jira-archive.titaniumsdk.com/TIMOB-28542) [TIMOB-28531](https://jira-archive.titaniumsdk.com/TIMOB-28531) - Logging an object on simulator does not show full object ([e855063](https://github.com/tidev/titanium-sdk/commit/e855063c5657ca02f8c7f5ba4e315d43a4a1d13e))
* [TIMOB-28549](https://jira-archive.titaniumsdk.com/TIMOB-28549) - Simulator build does not error correctly if EULA is not accepted ([592a76d](https://github.com/tidev/titanium-sdk/commit/592a76dabbf4616152c8a72bd42fb2d92897ad0e))
* [TIMOB-28545](https://jira-archive.titaniumsdk.com/TIMOB-28545) - device or dist-adhoc builds on an M1 mac errors out ([e8e4e00](https://github.com/tidev/titanium-sdk/commit/e8e4e00add312671d90f506e7607815554845b5b))
* [TIMOB-28574](https://jira-archive.titaniumsdk.com/TIMOB-28574) - indow.setToolbar() wrongly uses a transparent background on iOS 15 ([1677d48](https://github.com/tidev/titanium-sdk/commit/1677d48201d07baf39024ff51be86bc30dc85b5b))

## SDK Module Versions

| Module      | Android version | iOS Version |
| ----------- | --------------- | ----------- |
| facebook | 11.0.2 | 11.0.1 |
| ti.cloudpush | 8.0.0 | n/a |
| ti.map | 5.3.3 | 6.0.1 |
| ti.webdialog | 2.0.0 | 3.0.1 |
| ti.playservices | 17.5.0 | n/a |
| ti.identity | 3.0.3 | 4.0.1 |
| urlSession | n/a | 4.0.1 |
| ti.coremotion | n/a | 4.0.1 |
| ti.applesignin | n/a | 3.1.1 |
| ti.cloud | 3.2.11 | 3.2.11 |
| hyperloop | 7.0.4 | 7.0.4 |

# [10.1.0](https://github.com/tidev/titanium-sdk/compare/10_0_X...10.1.0) (2021-09-28)

## About this release

Titanium SDK 10.1.0 is a minor release of the SDK, addressing high-priority issues from previous releases.


## Community Credits

* Hans Knöchel
  * [TIMOB-28525](https://jira-archive.titaniumsdk.com/TIMOB-28525) - Allow apps with non-arm64 modules to be built on Apple Silicon ([3559744](https://github.com/tidev/titanium-sdk/commit/3559744b03505c2734e1dc7dbab00ae8b224fa10))
  * [TIMOB-28524](https://jira-archive.titaniumsdk.com/TIMOB-28524) - Expose "sectionHeaderTopPadding" for layout backwards compatibility ([934c440](https://github.com/tidev/titanium-sdk/commit/934c440da87e3b59fa24cec809bc2b1493bb6aed))
  * [TIMOB-28391](https://jira-archive.titaniumsdk.com/TIMOB-28391) - Allow string-based "verticalAlign" in Ti.UI.Label ([9363c42](https://github.com/tidev/titanium-sdk/commit/9363c4257e231bae838a7e859f16d597ac3f6145))
  * [TIMOB-28405](https://jira-archive.titaniumsdk.com/TIMOB-28405) - Specify additional parameters to SFSymbol system image ([4d44a18](https://github.com/tidev/titanium-sdk/commit/4d44a181e93c0fc26f10586c025aac4958068910))
  * [TIMOB-28530](https://jira-archive.titaniumsdk.com/TIMOB-28530) - Add heat-map support to "ti.map" module ([4a4c0a3](https://github.com/tidev/titanium-sdk/commit/4a4c0a3726611622e3746d2c5c9a1db22b54ca4a))
  * [TIMOB-28488](https://jira-archive.titaniumsdk.com/TIMOB-28488) - Modal navigation window jumps navigation bar ([d334ac9](https://github.com/tidev/titanium-sdk/commit/d334ac970f3d81d6628d068ef9e26d648f56c98f))
  * Remove some setters in example code blocks ([6c7db5f](https://github.com/tidev/titanium-sdk/commit/6c7db5f9c8e68d27cc39bfb4e7a520d3f9d5ca11))

* Michael Gangolf
  * [TIMOB-28515](https://jira-archive.titaniumsdk.com/TIMOB-28515) - Floating bottom navigtion ([af619dc](https://github.com/tidev/titanium-sdk/commit/af619dc4c7cbf1732bfa3e2ba3e5ecca12a3e466))
  * [TIMOB-28529](https://jira-archive.titaniumsdk.com/TIMOB-28529) - Update "ti.map" module to support "camera" property and animateCamera() ([4a4c0a3](https://github.com/tidev/titanium-sdk/commit/4a4c0a3726611622e3746d2c5c9a1db22b54ca4a))

## Bug Fixes

### Android platform

* [TIMOB-28517](https://jira-archive.titaniumsdk.com/TIMOB-28517) - Card view "touchFeedbackColor" property is ignored ([03ada5d](https://github.com/tidev/titanium-sdk/commit/03ada5dd0d60d900aa7e5236a161c0f298574737))
* [TIMOB-26706](https://jira-archive.titaniumsdk.com/TIMOB-26706) - Correct TextField and ImageView content description component ([db1a83a](https://github.com/tidev/titanium-sdk/commit/db1a83a45529993e2d694e55181a881091cfa849))
* [TIMOB-28474](https://jira-archive.titaniumsdk.com/TIMOB-28474) - Request ACCESS_COARSE_LOCATION permission ([30f66e9](https://github.com/tidev/titanium-sdk/commit/30f66e9a4cf59440f9741944193bd6d2dd0aaefe))
* [TIMOB-28199](https://jira-archive.titaniumsdk.com/TIMOB-28199) - Support detail property in row click event ([a615c42](https://github.com/tidev/titanium-sdk/commit/a615c4269d3b753be52f14691e2976ab0ba7b67c))
* [MOD-2739](https://jira-archive.titaniumsdk.com/MOD-2739) - ti.identity module error when authenticating 2nd time ([ec53cf4](https://github.com/tidev/titanium-sdk/commit/ec53cf42a150b01c8dc1fcf4bc7ba1de747aa67c))
* [TIMOB-28533](https://jira-archive.titaniumsdk.com/TIMOB-28533) - ListView scrollToItem always uses first section ([5c3b9d5](https://github.com/tidev/titanium-sdk/commit/5c3b9d5fa6749b368a7ef1918187635d2c12b8fd))
* [TIMOB-28437](https://jira-archive.titaniumsdk.com/TIMOB-28437) - Optimize proxy constructor lookup ([54132d2](https://github.com/tidev/titanium-sdk/commit/54132d29ca27531c8ea29f2c326994eebf8317bb))
* [TIMOB-28537](https://jira-archive.titaniumsdk.com/TIMOB-28537) - auto-scaling mode must stretch ImageView if both width/height set ([ea0d99c](https://github.com/tidev/titanium-sdk/commit/ea0d99cc34f7299d01922036558540f40dfaebe9))
* [TIMOB-28538](https://jira-archive.titaniumsdk.com/TIMOB-28538) - ImageView image download performance slow if HTTP response error occurs ([bdf7e68](https://github.com/tidev/titanium-sdk/commit/bdf7e68f3f35b92fd7c422c4fa8293d4433a50ef))
* [TIMOB-18786](https://jira-archive.titaniumsdk.com/TIMOB-18786) - ImageView sometimes loads wrong image due to hash code collision ([bdf7e68](https://github.com/tidev/titanium-sdk/commit/bdf7e68f3f35b92fd7c422c4fa8293d4433a50ef))
* Remove HTTPClient addKeyManager() and addTrustManager() methods ([50225e1](https://github.com/tidev/titanium-sdk/commit/50225e12c27cb0bfb440105c6204a7c69dcb0f15))

### iOS platform

* [TIMOB-28525](https://jira-archive.titaniumsdk.com/TIMOB-28525) - Allow apps with non-arm64 modules to be built on Apple Silicon ([3559744](https://github.com/tidev/titanium-sdk/commit/3559744b03505c2734e1dc7dbab00ae8b224fa10))
* [TIMOB-28391](https://jira-archive.titaniumsdk.com/TIMOB-28391) - Allow string-based "verticalAlign" in Ti.UI.Label ([9363c42](https://github.com/tidev/titanium-sdk/commit/9363c4257e231bae838a7e859f16d597ac3f6145))
* [TIMOB-28518](https://jira-archive.titaniumsdk.com/TIMOB-28518) - Amend TiMediaVideoPlayer parent controller ([eb319ef](https://github.com/tidev/titanium-sdk/commit/eb319efc1909dfd7261414837bde69c4f7545add))
* [TIMOB-28511](https://jira-archive.titaniumsdk.com/TIMOB-28511) - Create headers directory if it doesn't exist, write a keep file to ensure it persists ([c1a6410](https://github.com/tidev/titanium-sdk/commit/c1a64103c146864c28f3efb7ad0fac6ab5db8012))
* [TIMOB-28524](https://jira-archive.titaniumsdk.com/TIMOB-28524) - Expose "sectionHeaderTopPadding" for layout backwards compatibility ([934c440](https://github.com/tidev/titanium-sdk/commit/934c440da87e3b59fa24cec809bc2b1493bb6aed))
* [TIMOB-27875](https://jira-archive.titaniumsdk.com/TIMOB-27875) - Rare random crashes on 64-bit devices ([ec35a17](https://github.com/tidev/titanium-sdk/commit/ec35a17530cc8ff9b83d9705cbf4c3b522d07637))
* [TIMOB-28505](https://jira-archive.titaniumsdk.com/TIMOB-28505) [TIMOB-28523](https://jira-archive.titaniumsdk.com/TIMOB-28523) - TabGroup bar is wrongly transparent on iOS 15 ([15e292e](https://github.com/tidev/titanium-sdk/commit/15e292eda2187612b1cdf75d1d61e60796ee9c62))
* [TIMOB-28498](https://jira-archive.titaniumsdk.com/TIMOB-28498) - Hang between sim selection and launch or app install when building to iOS 15 simulator ([7ba85d5](https://github.com/tidev/titanium-sdk/commit/7ba85d50d6e481567d46dc9299588c01fd1672d4#diff-7ae45ad102eab3b6d7e7896acd08c427a9b25b346470d7bc6507b6481575d519))
* [TIMOB-28527](https://jira-archive.titaniumsdk.com/TIMOB-28527) - "ti.map" polyline click events not working if it only has 2 points ([4a4c0a3](https://github.com/tidev/titanium-sdk/commit/4a4c0a3726611622e3746d2c5c9a1db22b54ca4a))
* [TIMOB-28488](https://jira-archive.titaniumsdk.com/TIMOB-28488) - Modal navigation window jumps navigation bar ([d334ac9](https://github.com/tidev/titanium-sdk/commit/d334ac970f3d81d6628d068ef9e26d648f56c98f))
* [TIMOB-28536](https://jira-archive.titaniumsdk.com/TIMOB-28536) - TableView maintains search view focus after close ([7041f6f](https://github.com/tidev/titanium-sdk/commit/7041f6f6caab54827c980b339afaac02836c4a3d))

## Features

### Multiple platforms

* update "ti.map" module ([4a4c0a3](https://github.com/tidev/titanium-sdk/commit/4a4c0a3726611622e3746d2c5c9a1db22b54ca4a))
* [TIMOB-24313](https://jira-archive.titaniumsdk.com/TIMOB-24313) [TIMOB-28432](https://jira-archive.titaniumsdk.com/TIMOB-28432) - Add "scalingMode" property to Ti.UI.ImageView ([cce763a](https://github.com/tidev/titanium-sdk/commit/cce763aefd80c555728c118840d512032ffaa361))

### Android platform

* [TIMOB-28494](https://jira-archive.titaniumsdk.com/TIMOB-28494) - Update to Gradle 7.1 ([898dcc0](https://github.com/tidev/titanium-sdk/pull/12914/commits/898dcc0fdab47ec28813506f942c82b5204d4e85))
* [TIMOB-28447](https://jira-archive.titaniumsdk.com/TIMOB-28447) - Add "imageTouchFeedback" to ImageView ([b2e84bd](https://github.com/tidev/titanium-sdk/commit/b2e84bde9635e348595feeab8ef42b79c6d40866))
* [TIMOB-28526](https://jira-archive.titaniumsdk.com/TIMOB-28526) - Add "solid" titanium app theme ([ab3329e](https://github.com/tidev/titanium-sdk/commit/ab3329e013f0d6a1aa18e6fa1031662f76299118))
* [TIMOB-28445](https://jira-archive.titaniumsdk.com/TIMOB-28445) - Add constant Ti.UI.Android.FLAG_LAYOUT_NO_LIMITS ([386c5cf](https://github.com/tidev/titanium-sdk/commit/386c5cfde12462864b3538920071c5bfa722d73e))
* [TIMOB-28515](https://jira-archive.titaniumsdk.com/TIMOB-28515) - Floating bottom navigtion ([af619dc](https://github.com/tidev/titanium-sdk/commit/af619dc4c7cbf1732bfa3e2ba3e5ecca12a3e466))
* [TIMOB-28473](https://jira-archive.titaniumsdk.com/TIMOB-28473) - Icon splash screen support ([2baef1e](https://github.com/tidev/titanium-sdk/commit/2baef1e9eedbaac3ab86d37bf29d5deacdff4375))
* [TIMOB-28472](https://jira-archive.titaniumsdk.com/TIMOB-28472) - Target API Level 31 by default ([571038c](https://github.com/tidev/titanium-sdk/commit/571038c43564323517b7ad71b515a655e5a46937))
* [TIMOB-28431](https://jira-archive.titaniumsdk.com/TIMOB-28431) - Implement scrollToIndex animation support ([2c542b8](https://github.com/tidev/titanium-sdk/commit/2c542b80cb90ee0c38fa89d62499cbe5a80f5633))
* [TIMOB-28530](https://jira-archive.titaniumsdk.com/TIMOB-28530) - Add heat-map support to "ti.map" module ([4a4c0a3](https://github.com/tidev/titanium-sdk/commit/4a4c0a3726611622e3746d2c5c9a1db22b54ca4a))
* [TIMOB-28476](https://jira-archive.titaniumsdk.com/TIMOB-28476) - Add PendingIntent constants FLAG_IMMUTABLE and FLAG_MUTABLE ([75ce8e4](https://github.com/tidev/titanium-sdk/commit/75ce8e4a2783d93df32d35386d336f1596ea7de7))
* [TIMOB-28529](https://jira-archive.titaniumsdk.com/TIMOB-28529) - Update "ti.map" module to support "camera" property and animateCamera() ([4a4c0a3](https://github.com/tidev/titanium-sdk/commit/4a4c0a3726611622e3746d2c5c9a1db22b54ca4a))
* [TIMOB-28435](https://jira-archive.titaniumsdk.com/TIMOB-28435) - Implement native selection for TableView ([2aee71c](https://github.com/tidev/titanium-sdk/commit/2aee71cfda9e7d0f5f150f198d0b6c51233761ca))
* [TIMOB-28436](https://jira-archive.titaniumsdk.com/TIMOB-28436) - Implement native selection for ListView ([2aee71c](https://github.com/tidev/titanium-sdk/commit/2aee71cfda9e7d0f5f150f198d0b6c51233761ca))
 
### iOS platform

* [TIMOB-28467](https://jira-archive.titaniumsdk.com/TIMOB-28467) [TIMOB-28466](https://jira-archive.titaniumsdk.com/TIMOB-28466) - Declare support for ios 15 and xcode 13 ([d0dcb39](https://github.com/tidev/titanium-sdk/commit/d0dcb39d38f9adde87ef603bd41eaac1b7a46d12))
* [TIMOB-28405](https://jira-archive.titaniumsdk.com/TIMOB-28405) - Specify additional parameters to SFSymbol system image ([4d44a18](https://github.com/tidev/titanium-sdk/commit/4d44a181e93c0fc26f10586c025aac4958068910))
* [TIMOB-28500](https://jira-archive.titaniumsdk.com/TIMOB-28500) - iOS: Update "ti.map" module for iOS 15 ([4a4c0a3](https://github.com/tidev/titanium-sdk/commit/4a4c0a3726611622e3746d2c5c9a1db22b54ca4a))


## SDK Module Versions

| Module      | Android version | iOS Version |
| ----------- | --------------- | ----------- |
| facebook | 11.0.2 | 11.0.1 |
| ti.cloudpush | 8.0.0 | n/a |
| ti.map | 5.3.3 | 6.0.1 |
| ti.webdialog | 2.0.0 | 3.0.1 |
| ti.playservices | 17.5.0 | n/a |
| ti.identity | 3.0.3 | 4.0.1 |
| urlSession | n/a | 4.0.1 |
| ti.coremotion | n/a | 4.0.1 |
| ti.applesignin | n/a | 3.1.1 |
| ti.cloud | 3.2.11 | 3.2.11 |
| hyperloop | 7.0.4 | 7.0.4 |

## [10.0.2](https://github.com/tidev/titanium-sdk/compare/10_0_1_GA...10.0.2) (2021-08-10)

## About this release

Titanium SDK 10.0.2 is a patch release of the SDK, addressing high-priority issues from previous releases.

As of this GA release, the previous Titanium SDK patch release (10.0.1) is no longer supported.


## Community Credits

* Hans Knöchel
  * [TIMOB-28514](https://jira-archive.titaniumsdk.com/TIMOB-28514)/[TIMOB-28513](https://jira-archive.titaniumsdk.com/TIMOB-28513) - Properly map user activity for cold starts ([f0ee118](https://github.com/tidev/titanium-sdk/commit/f0ee1185174d19b2b95268e2c12e7a0f164b2020))


## Bug fixes

### Android platform

* [TIMOB-28503](https://jira-archive.titaniumsdk.com/TIMOB-28503) - Views added to ScrollableView can be lost upon window open ([2dabc8d](https://github.com/tidev/titanium-sdk/commit/2dabc8d627ec8b4743fa1d37ee6636f34c7ec4f8))
* [TIMOB-28496](https://jira-archive.titaniumsdk.com/TIMOB-28496) - Build fails on 64-bit Linux if 32-bit libraries not available ([38dd6a3](https://github.com/tidev/titanium-sdk/commit/38dd6a395d46c8a21cdd8e0cee8352606acef7f6))
* [TIMOB-28516](https://jira-archive.titaniumsdk.com/TIMOB-28516) - Optimize ScrollableView "views" property assignment ([459679a](https://github.com/tidev/titanium-sdk/commit/459679af1d180a759e23cea0ac17ad5e9a2a389f))
* [TIMOB-28517](https://jira-archive.titaniumsdk.com/TIMOB-28517) - Support CardView touchFeedbackColor property ([7b9c488](https://github.com/tidev/titanium-sdk/commit/7b9c4889b7e957a6862393ee9c78d5ddeb5a5c3c))

### iOS Platform

* [TIMOB-28510](https://jira-archive.titaniumsdk.com/TIMOB-28510) - Do not create invalid swift compiler flags from symbol usage ([14985f1](https://github.com/tidev/titanium-sdk/commit/14985f1c6213e9d6609189d0b10b9c6f2a44114d))
* [TIMOB-28514](https://jira-archive.titaniumsdk.com/TIMOB-28514)/[TIMOB-28513](https://jira-archive.titaniumsdk.com/TIMOB-28513) - Properly map user activity for cold starts ([f0ee118](https://github.com/tidev/titanium-sdk/commit/f0ee1185174d19b2b95268e2c12e7a0f164b2020))
* [TIMOB-28506](https://jira-archive.titaniumsdk.com/TIMOB-28506) - Xcode project change detection causing unnecessary rebuilds ([89773aa](https://github.com/tidev/titanium-sdk/commit/89773aa46eb2017d5c80b9aab0595d4397940bd4))


## SDK Module versions

| Module      | Android version | iOS Version |
| ----------- | --------------- | ----------- |
| facebook | 11.0.2 | 11.0.1 |
| ti.cloudpush | 7.1.0 | n/a |
| ti.map | 5.3.2 | 5.1.1 |
| ti.webdialog | 2.0.0 | 3.0.1 |
| ti.playservices | 17.5.0 | n/a |
| ti.identity | 3.0.2 | 4.0.1 |
| urlSession | n/a | 4.0.1 |
| ti.coremotion | n/a | 4.0.1 |
| ti.applesignin | n/a | 3.1.1 |
| ti.cloud | 3.2.11 | 3.2.11 |
| hyperloop | 7.0.4 | 7.0.4 |

## [10.0.1](https://github.com/tidev/titanium-sdk/compare/10_0_0_GA...10.0.1) (2021-07-28)

## About this release

Titanium SDK 10.0.1 is a patch release of the SDK, addressing high-priority issues from previous releases.

As of this GA release, the previous Titanium SDK patch release (10.0.0) is no longer supported.

## Bug Fixes

### Multiple platforms

* [TIMOB-28398](https://jira-archive.titaniumsdk.com/TIMOB-28398) - convertPointToView() to apply ScrollView contentOffset ([a9d6c7d](https://github.com/tidev/titanium-sdk/commit/a9d6c7de2c31db12a39ed01bb57d617d9092f458))

### Android platform

* [TIMOB-28464](https://jira-archive.titaniumsdk.com/TIMOB-28464) - ECONNREFUSED error when starting emulator with Node.js 14 ([3bd1b4e](https://github.com/tidev/titanium-sdk/commit/3bd1b4e8af543cb1bd77a45171e3d1f5f8834951))
* [TIMOB-28397](https://jira-archive.titaniumsdk.com/TIMOB-28397) - ScrollView contentOffset ignores unitsits ([906b6aa](https://github.com/tidev/titanium-sdk/commit/906b6aa4e1bbe21fca9599314e1d61dc4d9c95a9))
* [TIMOB-28463](https://jira-archive.titaniumsdk.com/TIMOB-28463) - Incorrect handling of paths on Windows when generating bootstrap.jsons ([a54296e](https://github.com/tidev/titanium-sdk/commit/a54296e31f74cc7905c42f9d0f1769222bc387f4))
* [TIMOB-28448](https://jira-archive.titaniumsdk.com/TIMOB-28448) - Ti.UI.Notifications logs errors because of alignment, margins and gravity ([765a1ec](https://github.com/tidev/titanium-sdk/commit/765a1ec2a5a4d38a9741b3046ccde25a065a4672))
* [TIMOB-28439](https://jira-archive.titaniumsdk.com/TIMOB-28439) - Improve ListView initial load performance ([35d2b16](https://github.com/tidev/titanium-sdk/commit/35d2b160aa95074154d363f14c6d14ae4c46ea40))
* [TIMOB-28454](https://jira-archive.titaniumsdk.com/TIMOB-28454) - longpress event wrongly fires on a tapped view with touch disabled ([5ac477c](https://github.com/tidev/titanium-sdk/commit/5ac477c9d427bdda1b11ae6b72e57aa7cdfefb09))
* [TIMOB-28460](https://jira-archive.titaniumsdk.com/TIMOB-28460) - Picker "change" event's "selectedValue" property does not provide row titles ([d527d0f](https://github.com/tidev/titanium-sdk/commit/d527d0f8b820a0957a6a5a6ea688ffd1977a151b))
* [TIMOB-28485](https://jira-archive.titaniumsdk.com/TIMOB-28485) - ProgressBar "tintColor" and "trackTintColor" are ignored ([5d362b7](https://github.com/tidev/titanium-sdk/commit/5d362b768fc4ee758aded9e99ac32a805853cfdb))
* [TIMOB-28434](https://jira-archive.titaniumsdk.com/TIMOB-28434) - Toolbar "items" do not update when changing dark/light theme ([babc993](https://github.com/tidev/titanium-sdk/commit/babc993cc731b830546e25fbc08af9e30a3479cc))
* [TIMOB-28358](https://jira-archive.titaniumsdk.com/TIMOB-28358) - "ti.map" module logs theme errors ([87211bc](https://github.com/tidev/titanium-sdk/commit/87211bc659b0a0989a99031b4a4bc131d58b0bc8))
* [TIMOB-28459](https://jira-archive.titaniumsdk.com/TIMOB-28459) - ScrollableView with databinding in Footer/HeaderView not showing up ([ea41474](https://github.com/tidev/titanium-sdk/commit/ea414748e4b9ccbab6c7f103d9ee1deb7c2234d6))
* [TIMOB-28462](https://jira-archive.titaniumsdk.com/TIMOB-28462) - ListView marked items may not be detected correctly ([7ee3fd1](https://github.com/tidev/titanium-sdk/commit/7ee3fd1d9133753b2b9f2e624052fe1cc083d774))
* [TIMOB-28501](https://jira-archive.titaniumsdk.com/TIMOB-28501) - Crash with MapView in TabGroup ([6fe46e3](https://github.com/tidev/titanium-sdk/commit/6fe46e33b68b333fdb0b1b26253a07a9cd407bf8))
* [TIMOB-28504](https://jira-archive.titaniumsdk.com/TIMOB-28504) - ScrollableView "views" property is wrongly empty before window open ([743475a](https://github.com/tidev/titanium-sdk/commit/743475a903c588421e7e1240907f03f5d48d763a))

### iOS platform

* [TIMOB-27236](https://jira-archive.titaniumsdk.com/TIMOB-27236) - Animating view width/height from 0 doesn't work ([9624472](https://github.com/tidev/titanium-sdk/commit/962447258a22bbaa20abd5ec07acffba47d7a7b6))
* [TIMOB-28483](https://jira-archive.titaniumsdk.com/TIMOB-28483) - Crash on startup when launching app on iOS 15 ([8daea84](https://github.com/tidev/titanium-sdk/commit/8daea8454fed2cbd24c55a639002e4b93e1a36bd))
* [TIMOB-28160](https://jira-archive.titaniumsdk.com/TIMOB-28160) - "unrecognized selector sent to instance" logged for errors from native side ([b5d97f2](https://github.com/tidev/titanium-sdk/commit/b5d97f21eede776d461f5356e5d5558c80ce7b17))
* [TIMOB-28145](https://jira-archive.titaniumsdk.com/TIMOB-28145) - Support string values with units for property values ([8c9b3eb](https://github.com/tidev/titanium-sdk/commit/8c9b3eb367800fe78e731ace7296aaeefad653f8))
* [TIMOB-28491](https://jira-archive.titaniumsdk.com/TIMOB-28491) - Setter not called properly anymore ([cf4073a](https://github.com/tidev/titanium-sdk/commit/cf4073ae6dfc78d163c4be479485536a26aba829))
* [TIMOB-28428](https://jira-archive.titaniumsdk.com/TIMOB-28428) - LargeTitle (animation) is not rendered correctly ([2624c81](https://github.com/tidev/titanium-sdk/commit/2624c8142b59570908182a78e7da997987774b73))
* [TIMOB-28458](https://jira-archive.titaniumsdk.com/TIMOB-28458) - hyperloop defineClass() crash ([90aec65](https://github.com/tidev/titanium-sdk/commit/90aec6570c25e5335f4ce85db9cdb6634bf3ab5d))
* [TIMOB-28109](https://jira-archive.titaniumsdk.com/TIMOB-28109) - top section in grouped ListView disappears when tapping SearchBar or on orientation change([4101958](https://github.com/tidev/titanium-sdk/commit/410195878a9c14968b6e6b686afc6fbeb8b38427))
* [TIMOB-28420](https://jira-archive.titaniumsdk.com/TIMOB-28420) - unhandled native exceptions should show error dialog ([965705c](https://github.com/tidev/titanium-sdk/commit/965705caa0e55520962071415604a42ae7085f18))
* [TIMOB-28492](https://jira-archive.titaniumsdk.com/TIMOB-28492) - properly dismiss search controller after editing ([52248c1](https://github.com/tidev/titanium-sdk/commit/52248c104d2e6627e146841adad8cb370328e7bd))
* [TIMOB-28497](https://jira-archive.titaniumsdk.com/TIMOB-28497) - Hierarchy error when using SplitWindow and NavigationWindow ([8e5b149](https://github.com/tidev/titanium-sdk/commit/8e5b149942d1de58be9c6362305c9e388c67feb4))
* [TIMOB-28507](https://jira-archive.titaniumsdk.com/TIMOB-28507) - Ti.App "arguments" property and getArguments() method are not defined ([034afee](https://github.com/tidev/titanium-sdk/commit/034afeeecea399caf10d15006a369d10104d17a6))
* [TIMOB-28509](https://jira-archive.titaniumsdk.com/TIMOB-28509) - Revert modules targeting iOS 11 ([4a0153f](https://github.com/tidev/titanium-sdk/commit/4a0153f9017a11401662cdff63f8f2eb966c97e6))

## Features

### Android platform

* [TIMOB-28370](https://jira-archive.titaniumsdk.com/TIMOB-28370) - add title support to Ti.UI.Switch slider style ([1c41606](https://github.com/tidev/titanium-sdk/commit/1c41606a1ffe024e67fc6a507d5daab1bb8f4ebf))
* [TIMOB-27801](https://jira-archive.titaniumsdk.com/TIMOB-27801) - Building the SDK should auto-download NDK if not installed ([8c44bb4](https://github.com/tidev/titanium-sdk/commit/8c44bb4792162d2aed34a1bbdbf018bcc9223c09))
* [TIMOB-28241](https://jira-archive.titaniumsdk.com/TIMOB-28241) - Remove "WebViewClient.jar" from SDK ([502f17e](https://github.com/tidev/titanium-sdk/commit/502f17e647996cfe33c76fbcf586009e7bd443ae))
* [TIMOB-28377](https://jira-archive.titaniumsdk.com/TIMOB-28377) - Remove deprecated usage of "ndk.dir" in "local.properties" file ([8c44bb4](https://github.com/tidev/titanium-sdk/commit/8c44bb4792162d2aed34a1bbdbf018bcc9223c09))
* [TIMOB-28425](https://jira-archive.titaniumsdk.com/TIMOB-28425) - Change "plain" Ti.UI.Picker to use native spinners ([007f333](https://github.com/tidev/titanium-sdk/commit/007f3334361688bac583164765ab93c9abcd7794))
* [TIMOB-28426](https://jira-archive.titaniumsdk.com/TIMOB-28426) - Add "datePickerStyle" support to Ti.UI.Picker ([007f333](https://github.com/tidev/titanium-sdk/commit/007f3334361688bac583164765ab93c9abcd7794))
* [TIMOB-28427](https://jira-archive.titaniumsdk.com/TIMOB-28427) - Add "borderStyle" and "hintText" properties to Ti.UI.Picker ([007f333](https://github.com/tidev/titanium-sdk/commit/007f3334361688bac583164765ab93c9abcd7794))
* [TIMOB-28441](https://jira-archive.titaniumsdk.com/TIMOB-28441) - Remove unneeded 10.0.0 deprecation warnings ([76f9993](https://github.com/tidev/titanium-sdk/commit/76f9993c3211016caa3d57e20bdf9e0b676ab39e), [0792f50](https://github.com/tidev/titanium-sdk/commit/0792f50cb12a1820ed0efcc6f1e031f7143f2413))
* [TIMOB-28455](https://jira-archive.titaniumsdk.com/TIMOB-28455) - Update gradle build tools to 4.2.x ([8afbb23](https://github.com/tidev/titanium-sdk/commit/8afbb232044f04472232957474e232f3114451c5))
* [TIMOB-28456](https://jira-archive.titaniumsdk.com/TIMOB-28456) - Remove deprecated usage of jcenter() repo from gradle ([805722e](https://github.com/tidev/titanium-sdk/commit/805722e84c2b7ac605bd1a2e39d6986f9dc25284))
* [TIMOB-28457](https://jira-archive.titaniumsdk.com/TIMOB-28457) - Update module Kotlin language support to 1.5.x ([d360bd8](https://github.com/tidev/titanium-sdk/commit/d360bd8a14c06d3566ad4d3555d5e968f8adb34c))

### iOS

* [TIMOB-28412](https://jira-archive.titaniumsdk.com/TIMOB-28412) - Optimize JS Promise creation on iOS 12 ([a07c56c](https://github.com/tidev/titanium-sdk/commit/a07c56c8fd293aa7ca68a00e36c3983237ed1996))
* [TIMOB-28461](https://jira-archive.titaniumsdk.com/TIMOB-28461) - Support running LiveView with Hyperloop ([98847ff](https://github.com/tidev/titanium-sdk/commit/98847ff103dea01c56b274e3e857c6ac8a956331))

### Multiple platforms

* [TIMOB-28367](https://jira-archive.titaniumsdk.com/TIMOB-28367) - add animation support to Ti.UI.ProgressBar ([387d6be](https://github.com/tidev/titanium-sdk/commit/387d6be1db0b2e047e20ab200048325de4a969e6))
* [TIMOB-25705](https://jira-archive.titaniumsdk.com/TIMOB-25705) - Add "enableCopy" property to TextField/TextArea ([f8610c9](https://github.com/tidev/titanium-sdk/commit/f8610c99c043acd03df095214f9dac623c1769b5))
* [TIMOB-28369](https://jira-archive.titaniumsdk.com/TIMOB-28369) - Add Ti.UI.overrideUserInterfaceStyle property ([2a32030](https://github.com/tidev/titanium-sdk/commit/2a32030fcb89232599bc2f7975703f3d3d6d2895))

## SDK Module Versions

| Module      | Android version | iOS Version |
| ----------- | --------------- | ----------- |
| facebook | 11.0.2 | 11.0.1 |
| ti.cloudpush | 7.1.0 | n/a |
| ti.map | 5.3.2 | 5.1.1 |
| ti.webdialog | 2.0.0 | 3.0.1 |
| ti.playservices | 17.5.0 | n/a |
| ti.identity | 3.0.2 | 4.0.1 |
| urlSession | n/a | 4.0.1 |
| ti.coremotion | n/a | 4.0.1 |
| ti.applesignin | n/a | 3.1.1 |
| ti.cloud | 3.2.11 | 3.2.11 |
| hyperloop | 7.0.4 | 7.0.4 |

# [10.0.0](https://github.com/tidev/titanium-sdk/compare/9_3_X...10.0.0) (2021-04-12)

## About this release

Titanium SDK 10.0.0 is a major release of the SDK, addressing high-priority issues from previous releases; introducing some breaking changes; and removing a number of long-deprecated APIs.

:warning: Titanium SDK 10.0.0 will be the last major release of the produce. Titanium SDK will no longer be supported beyond March 2022.

## Community Credits

* Hans Knöchel
  * [TIMOB-28376](https://jira-archive.titaniumsdk.com/TIMOB-28376) - fragments in children of list view and tableview header/footerview ([ef5c95d](https://github.com/tidev/titanium-sdk/commit/ef5c95dcbd2d911291309cbe9d632f360ded6ce7))
  * remove unused event ([56ddf95](https://github.com/tidev/titanium-sdk/commit/56ddf95eb7581d41c1fbb74b9b9e03eee55c3214))
  * Revert "perf(ios): use new API for rendering view to image" ([91c00ba](https://github.com/tidev/titanium-sdk/commit/91c00bad3f615516b39e9abd74282bbb7b303560))

* Michael Gangolf
  * [TIMOB-28348](https://jira-archive.titaniumsdk.com/TIMOB-28348) - text alignment justify ([851b4f6](https://github.com/tidev/titanium-sdk/commit/851b4f6849d3c73f57b760850a86cfa2abb09dc5))
  * [TIMOB-28333](https://jira-archive.titaniumsdk.com/TIMOB-28333) - rgba(int,int,int) parity ([d36c5c7](https://github.com/tidev/titanium-sdk/commit/d36c5c7d543de43b8bd6952e8ca917ab4032b5a8))
  * add missing parameter in NotificationChannel ([fa17daf](https://github.com/tidev/titanium-sdk/commit/fa17daf2de5981e1f00a3b78a5109b3e470f202d))

* Sergey Volkov
  * "requestPermissions" and Geolocation APIs return Promise ([971e71e](https://github.com/tidev/titanium-sdk/commit/971e71e876284d0828617a74607b8bb4107a2faf))
  * [TIMOB-24549](https://jira-archive.titaniumsdk.com/TIMOB-24549) - native Promise API ([ea75a0f](https://github.com/tidev/titanium-sdk/commit/ea75a0fc9a5291fcc6efbd3c47a50367a85ced11))

## BREAKING CHANGES

* [TIMOB-28346](https://jira-archive.titaniumsdk.com/TIMOB-28346) - TiAPI: Remove getter/setter methods for properties
* [TIMOB-28011](https://jira-archive.titaniumsdk.com/TIMOB-28011) - iOS: Drop iOS 10 support in Titanium SDK 10
* [TIMOB-28343](https://jira-archive.titaniumsdk.com/TIMOB-28343) - CLI: Update minimum Node.js version to 12.13.0
* [TIMOB-28263](https://jira-archive.titaniumsdk.com/TIMOB-28263) - Android: Change min supported version to Android 5.0 (API Level 21) ([8440ad7](https://github.com/tidev/titanium-sdk/commit/8440ad792a35bc11f9f518ab1584e0ac674a108b))
* [TIMOB-28395](https://jira-archive.titaniumsdk.com/TIMOB-28395) - Android: Use native APIs for forward/reverseGeocoder()
* [TIMOB-28396](https://jira-archive.titaniumsdk.com/TIMOB-28396) - iOS: Use native APIs for forward/reverseGeocoder()
* [TIMOB-28403](https://jira-archive.titaniumsdk.com/TIMOB-28403) - Analytics: Limit number of cached events
* [TIMOB-28198](https://jira-archive.titaniumsdk.com/TIMOB-28198) - Deprecate TableViewRow header footer properties

## Bug Fixes

### Multiple platforms

* [TIMOB-26304](https://jira-archive.titaniumsdk.com/TIMOB-26304) - TiAPI: Ti.UI.TableViewRow.* selectedBackgroundColor partially deprecated
* [TIMOB-27807](https://jira-archive.titaniumsdk.com/TIMOB-27807) - convertPointToView() to use "ti.ui.defaultunit" ([b4f6c3e](https://github.com/tidev/titanium-sdk/commit/b4f6c3ed76707ae96b244499acd0636559220412))
* [TIMOB-28205](https://jira-archive.titaniumsdk.com/TIMOB-28205) - Angular: packaging an angular app fails
* [TIMOB-28264](https://jira-archive.titaniumsdk.com/TIMOB-28264) - Improve Ti.UI documentation to reflect current state
* [TIMOB-28367](https://jira-archive.titaniumsdk.com/TIMOB-28367) - Ti.UI.ProgressBar should smoothly animate value changes
* [TIMOB-28401](https://jira-archive.titaniumsdk.com/TIMOB-28401) - declare all variables before their usage ([062c06d](https://github.com/tidev/titanium-sdk/commit/062c06d7e1b5c961b693ddc8e154be5d6bf9d6db))
* replace shortened appcelerator.com URLs with long URLs ([d0caea0](https://github.com/tidev/titanium-sdk/commit/d0caea05e8d21e4aae74818dd6af3a6a30f67bea))
* filepath compatibility with windows ([824488f](https://github.com/tidev/titanium-sdk/commit/824488f419df6917f5fa3ee90cdbc34a927b50da))
* handle when project has no root package.json ([7b9a747](https://github.com/tidev/titanium-sdk/commit/7b9a747d02552b763c562822b9028ab633f0c847))
* record output files for process js task ([e7951bd](https://github.com/tidev/titanium-sdk/commit/e7951bdd689666986564fc31d49c680169b1b4bf))
* remove unused event ([56ddf95](https://github.com/tidev/titanium-sdk/commit/56ddf95eb7581d41c1fbb74b9b9e03eee55c3214))
* support cjs files in apps equivalent to js files ([4b2c8fc](https://github.com/tidev/titanium-sdk/commit/4b2c8fccc067bb89ec2d054fed4fc45defdb81d5))

### Android platform

* [TIMOB-24365](https://jira-archive.titaniumsdk.com/TIMOB-24365) - Ti.UI.ActivityIndicator "indicatorColor" not working
* [TIMOB-24735](https://jira-archive.titaniumsdk.com/TIMOB-24735) - AttributedString link underline color
* [TIMOB-26663](https://jira-archive.titaniumsdk.com/TIMOB-26663) - touchFeedbackColor doesn't work if view has a transparent backgroundColor and a border ([5b5ac48](https://github.com/tidev/titanium-sdk/commit/5b5ac486e9c409e760541db5f8ca29a647f7b171))
* [TIMOB-27504](https://jira-archive.titaniumsdk.com/TIMOB-27504) - touchFeedback / ripple does not work when tapped from child view ([5e77724](https://github.com/tidev/titanium-sdk/commit/5e777247be7b69257b446a97d9cd3b23f2e4c644))
* [TIMOB-27807](https://jira-archive.titaniumsdk.com/TIMOB-27807) - convertPointToView() returns pixels instead of default units
* [TIMOB-28208](https://jira-archive.titaniumsdk.com/TIMOB-28208) - Several memory leaks in Titanium
* [TIMOB-28270](https://jira-archive.titaniumsdk.com/TIMOB-28270) - App builds fail if it includes the "jaxen" library
* [TIMOB-28272](https://jira-archive.titaniumsdk.com/TIMOB-28272) - Accelerometer spams warning messages when exiting app ([e10b6e6](https://github.com/tidev/titanium-sdk/commit/e10b6e676c6ecf76866a74c4cd4359a3a6c269da))
* [TIMOB-28329](https://jira-archive.titaniumsdk.com/TIMOB-28329) - touchFeedback property on ListView is ignored and true by default ([5e77724](https://github.com/tidev/titanium-sdk/commit/5e777247be7b69257b446a97d9cd3b23f2e4c644))
* [TIMOB-28330](https://jira-archive.titaniumsdk.com/TIMOB-28330) - Application crashes when scrolling a listview with zero items in the first section:
* [TIMOB-28333](https://jira-archive.titaniumsdk.com/TIMOB-28333) - rgba(int,int,int) parity with iOS ([d36c5c7](https://github.com/tidev/titanium-sdk/commit/d36c5c7d543de43b8bd6952e8ca917ab4032b5a8))
* [TIMOB-28345](https://jira-archive.titaniumsdk.com/TIMOB-28345) - CLI: -b shorthand does not work for Android and perform a full build
* [TIMOB-28352](https://jira-archive.titaniumsdk.com/TIMOB-28352) - Application crashes when scrolling to listview marker
* [TIMOB-28375](https://jira-archive.titaniumsdk.com/TIMOB-28375) - Hyperloop fails to access enum types with JDK 12
* [TIMOB-28376](https://jira-archive.titaniumsdk.com/TIMOB-28376) - Update header and footer view activity ([ef5c95d](https://github.com/tidev/titanium-sdk/commit/ef5c95dcbd2d911291309cbe9d632f360ded6ce7))
* [TIMOB-28383](https://jira-archive.titaniumsdk.com/TIMOB-28383) - minRowHeight of tableview does not work
* [TIMOB-28384](https://jira-archive.titaniumsdk.com/TIMOB-28384) - rightImage property for tableviewrow does not work for res images in "/images/" folder
* [TIMOB-28385](https://jira-archive.titaniumsdk.com/TIMOB-28385) - ListView crash error on SDK 9.3.X
* [TIMOB-28387](https://jira-archive.titaniumsdk.com/TIMOB-28387) - index in TableView click event is no longer unique
* [TIMOB-28388](https://jira-archive.titaniumsdk.com/TIMOB-28388) - Calling updateRow does not update rows other than the first row
* [TIMOB-28389](https://jira-archive.titaniumsdk.com/TIMOB-28389) - Calling TableViewRow.remove does not remove child view that is a Label
* [TIMOB-28399](https://jira-archive.titaniumsdk.com/TIMOB-28399) - TableView setData does not preserve TableViewRow child views ([cee557b](https://github.com/tidev/titanium-sdk/commit/cee557b5f7fb345d26a89d40cdfdedf671e80742))
* [TIMOB-28404](https://jira-archive.titaniumsdk.com/TIMOB-28404) - amend TabGroup selected tab ([c08379b](https://github.com/tidev/titanium-sdk/commit/c08379b8b935749ba620b5b793235af145116d34)) ([d13c884](https://github.com/tidev/titanium-sdk/commit/d13c884760db30c283f1709158d4d463d601c119))
* [TIMOB-28406](https://jira-archive.titaniumsdk.com/TIMOB-28406) - ListView on a modal with a * transparent background is invisible ([55910d8](https://github.com/tidev/titanium-sdk/commit/55910d86ce2e7115d778fd360ee37cd0e0648213))
* [TIMOB-28410](https://jira-archive.titaniumsdk.com/TIMOB-28410) - ListView causes ArrayIndexOutOfBoundsException in production ([aa7a8c2](https://github.com/tidev/titanium-sdk/commit/aa7a8c20cdd0a8d8a3ec9464d6f8a37801780ac1))
* add back Ti.Media.Sound.setLooping for now ([1c14926](https://github.com/tidev/titanium-sdk/commit/1c14926d922d3908d952d6fddc53c8825e0a92c9))
* add V8Promise constructor with existing pointer value ([b1d88f9](https://github.com/tidev/titanium-sdk/commit/b1d88f938ee09fa7eddf93cfe879e003cdd43cff))
* avoid calling toString on empty clipboard text ([d0b632f](https://github.com/tidev/titanium-sdk/commit/d0b632f01153b56faaed2d95339d362c7ecc0c50))
* explicitly define Ti.Android.currentService to be null when not a service ([7ce713c](https://github.com/tidev/titanium-sdk/commit/7ce713c6fb0a6d8e2b6b4de29b131095ca80f16b))
* expose builder property for hyperloop to mark js files not to process ([a6ad3ed](https://github.com/tidev/titanium-sdk/commit/a6ad3ed4383d159302e45b667b21083a724e0e97))
* expose properties for get/set pairs on QuickSettingsService ([b21ece2](https://github.com/tidev/titanium-sdk/commit/b21ece2fa8e68d8fff7030515e694e1452df39a7))
* expose Ti.UI.Tab activeTintColor/tintColor properties ([63844f1](https://github.com/tidev/titanium-sdk/commit/63844f13992d72d6d3e010aebc1d1b924f3ff22f))
* fix Ti.Blob.arrayBuffer definition ([2d9bfce](https://github.com/tidev/titanium-sdk/commit/2d9bfce4c9741bade20d4453c57b306288f81b57))
* guard copying processed js to not do so when encrypting ([9c23b99](https://github.com/tidev/titanium-sdk/commit/9c23b990503e377d9c54cfd41ff728caae676854))
* handle resource images/drawables and splash screens ([3cd22eb](https://github.com/tidev/titanium-sdk/commit/3cd22eb8c34138c43d8bca617ecfcfa7e9a8c0dc))
* override global.L behavior for non-string default values ([6f6cea2](https://github.com/tidev/titanium-sdk/commit/6f6cea24770b416dd3f6d2b1b4ce8c1b11bbea67))
* reject promise with Error in MediaModule ([1de2eb3](https://github.com/tidev/titanium-sdk/commit/1de2eb3f1627caa7d2052a3a2ded7664e937c5b4))
* remote policy encryption error dialog handling ([222cba1](https://github.com/tidev/titanium-sdk/commit/222cba1bfed28402bd419ef52b796307462d7c1e))
* remove getters for documented properties on RecurrenceRule ([a413a9e](https://github.com/tidev/titanium-sdk/commit/a413a9e4f0fc17b04093d2a96e458de5ddfa17ac))
* remove set methods for width/height/center for Views ([70bd7a7](https://github.com/tidev/titanium-sdk/commit/70bd7a72da4932348b0d74d150ec74329c0e406c))
* restore MenuItem is* boolean query methods ([49a6f7f](https://github.com/tidev/titanium-sdk/commit/49a6f7f197016dfa8de224ad484d4c2a8538f221))
* restore Sound is* boolean query methods ([c35cc4a](https://github.com/tidev/titanium-sdk/commit/c35cc4a70960e8cee1713b8eaae9517acdd69568))
* set minSdkVersion to 19 ([8440ad7](https://github.com/tidev/titanium-sdk/commit/8440ad792a35bc11f9f518ab1584e0ac674a108b))
* TableView regressions ([65ed909](https://github.com/tidev/titanium-sdk/commit/65ed90966d596c05c669c329822859a520f2954f))
* the Ti.UI.Clipboard#hasData() arg is optional ([51b6428](https://github.com/tidev/titanium-sdk/commit/51b642864020e007c75a07db221a09fb6adb8277))
* use C++14 when building native modules ([2df13a9](https://github.com/tidev/titanium-sdk/commit/2df13a96ed08a5644a76aa56ddc71516d8962f3e))
* warning logged by widgets when needlessly removing background ([f89fecf](https://github.com/tidev/titanium-sdk/commit/f89fecff7d14114dca4c34a3671ff133a13bbe17))

### iOS platform

* [TIMOB-26913](https://jira-archive.titaniumsdk.com/TIMOB-26913) - New SearchBar property "showSearchBarInNavBar" does not work with custom item templates
* [TIMOB-27888](https://jira-archive.titaniumsdk.com/TIMOB-27888) - circular references in require don't work
* [TIMOB-28037](https://jira-archive.titaniumsdk.com/TIMOB-28037) - Relative path require not working with node_modules
* [TIMOB-28209](https://jira-archive.titaniumsdk.com/TIMOB-28209) - App orientations stopped when using the search bar in the listview ([10c1a25](https://github.com/tidev/titanium-sdk/commit/10c1a25f7a2bc48194aad00a52b50be3155dee67))
* [TIMOB-28217](https://jira-archive.titaniumsdk.com/TIMOB-28217) - Ti.Media.VideoPlayer is crashing when setting showsControls earlier than url property ([e84ce9d](https://github.com/tidev/titanium-sdk/commit/e84ce9d4ba12407b67633b029e4b6d464f5181e4))
* [TIMOB-28267](https://jira-archive.titaniumsdk.com/TIMOB-28267) - removing eventlistener multiple times ourCallbackCount should not be in negative value ([798bd54](https://github.com/tidev/titanium-sdk/commit/798bd544e577092beee35dacd9f1eb106c9e8141))
* [TIMOB-28275](https://jira-archive.titaniumsdk.com/TIMOB-28275) - RemovingEventListener in Location event will freeze App ([0749a30](https://github.com/tidev/titanium-sdk/commit/0749a30ea0979b01c9f38cd71faf9541a907bfa1))
* [TIMOB-28281](https://jira-archive.titaniumsdk.com/TIMOB-28281) - Support Big Sur / Apple Silicon
* [TIMOB-28297](https://jira-archive.titaniumsdk.com/TIMOB-28297) - support ti symbols via xcconfig file to work with swift ([c61d943](https://github.com/tidev/titanium-sdk/commit/c61d943e409660ba73c8be69f6c8efae1e0b0e97))
* [TIMOB-28324](https://jira-archive.titaniumsdk.com/TIMOB-28324) - image from filereader function not being called ([a18fb68](https://github.com/tidev/titanium-sdk/commit/a18fb688ab36ff6d4dbea12043edc2d4cd3873e3))
* [TIMOB-28325](https://jira-archive.titaniumsdk.com/TIMOB-28325) - ListView row is incorrectly sized when using INSET_GROUPED and Ti.UI.SIZE ([4488fe2](https://github.com/tidev/titanium-sdk/commit/4488fe26331c0b8aca1dcbd41ac9cd65572721a3))
* [TIMOB-28331](https://jira-archive.titaniumsdk.com/TIMOB-28331) - Updating the "labels" property in the "Ti.UI.TabbedBar" sometimes does not work ([6ffe8f9](https://github.com/tidev/titanium-sdk/commit/6ffe8f9430a77cc2a411bf8cd197091056255d37))
* [TIMOB-28360](https://jira-archive.titaniumsdk.com/TIMOB-28360) - DocumentViewer setAnnotation method causing a crash ([bba9eef](https://github.com/tidev/titanium-sdk/commit/bba9eefd06c5ba22cffbabb6ad273dbadd35b510))
* [TIMOB-28361](https://jira-archive.titaniumsdk.com/TIMOB-28361) - largeTitleDisplayMode always is not respected on load when using a ListView in a Window ([26b5bfe](https://github.com/tidev/titanium-sdk/commit/26b5bfe301ebb49b800afcfce9d9723bfed154da))
* [TIMOB-28382](https://jira-archive.titaniumsdk.com/TIMOB-28382) - Requiring a native module errors when building with liveview
* [TIMOB-28394](https://jira-archive.titaniumsdk.com/TIMOB-28394) - openWindow transition broken / frame dropping (10.x regression)
* [TIMOB-28401](https://jira-archive.titaniumsdk.com/TIMOB-28401) - Building an app with a DefaultIcon that contains alpha errors
* [TIMOB-28404](https://jira-archive.titaniumsdk.com/TIMOB-28404) - tabGroup.setActiveTab() and text.setSelection() shows an error ([fff45b2](https://github.com/tidev/titanium-sdk/commit/fff45b2c29ada27c2878eb8e18ec2b1edfa37538))
* [TIMOB-28408](https://jira-archive.titaniumsdk.com/TIMOB-28408) - App with remote policy encryption crashes when offline ([5c9d3f9](https://github.com/tidev/titanium-sdk/commit/5c9d3f95f880ca50aceb07e16d137719647f1f39))
* autorelease Ti.Blob#arrayBuffer() Promise ([9afe176](https://github.com/tidev/titanium-sdk/commit/9afe176c18bc9ece20fe188f483b1d7a5a346c7c))
* call callback on Geolocation#requestTemporaryFullAccuracyAuthorization if missing purpose ([2155d0a](https://github.com/tidev/titanium-sdk/commit/2155d0ad03644b6a6b916457f84545d761391a5a))
* convert JSValue* to JSValueRef directly ([33508b6](https://github.com/tidev/titanium-sdk/commit/33508b622a0408cd74dce18a2a57d28fb7905a06))
* convert KrollPromise to JSValueRef for return types of old proxies ([62ee5c5](https://github.com/tidev/titanium-sdk/commit/62ee5c57dc1370c47ad04e11feafbb4b62a72067))
* deprecate selectedBackgroundColor and selectedBackgroundImage ([dc07aeb](https://github.com/tidev/titanium-sdk/commit/dc07aeb0c3e9d64158815e51505da942d56f79bb))
* deprecate selectedBackgroundGradient ([9cf10cd](https://github.com/tidev/titanium-sdk/commit/9cf10cd83cbe9b702122756d04f711c721e38989))
* detect when ios has service ([7fe9cf4](https://github.com/tidev/titanium-sdk/commit/7fe9cf478348810cb1889e7cebb79d078eaf86bf))
* error code/object for Ti.Geolocation permissions/position ([974a7f6](https://github.com/tidev/titanium-sdk/commit/974a7f67052a9e656d592d7e717a5bebfe46372b))
* explicitly flush KrollPromises created internally and not exposed to JS ([682e64a](https://github.com/tidev/titanium-sdk/commit/682e64a54fa58a8267ea5d1c8176a3fd36295f3c))
* expose KrollPromise as part of TitaniumKit ([a6d2c5b](https://github.com/tidev/titanium-sdk/commit/a6d2c5bda5805435be5a34f808880c944a697704))
* expose Ti.Network.HTTPClient#getAllResponseHeaders() ([e520aa2](https://github.com/tidev/titanium-sdk/commit/e520aa29dfa84eee6c999a6da489734d28431edf))
* fire authorization changes even when no callback ([25a1873](https://github.com/tidev/titanium-sdk/commit/25a1873fcce0adeda37c7c627d4155ffe0bc5b0d))
* fix list-view crash ([7c1aa59](https://github.com/tidev/titanium-sdk/commit/7c1aa5911c01b89da1d4d4b75abcbe227915e80d))
* fix sytax error ([0d662e1](https://github.com/tidev/titanium-sdk/commit/0d662e1242e044cbe585c762c623604c4240270a))
* fixed sdk build issue ([b0c41aa](https://github.com/tidev/titanium-sdk/commit/b0c41aaf7bd0a05b50b1cffccd49687097b1ad5c))
* formatting ([d325bac](https://github.com/tidev/titanium-sdk/commit/d325bac6bb1cefd343f04e24144bf5a729f89b67))
* guard launch image code to ios only, match to only root images ([7ce99e8](https://github.com/tidev/titanium-sdk/commit/7ce99e8e0aa193b045f306dd71262787a3c1ab0f))
* guard simulator check for Ti.Platform.model with define ([1bcf4d6](https://github.com/tidev/titanium-sdk/commit/1bcf4d677ced6e0cd308e85eb8ebfc8b9a207aad))
* have KrollPromise static methods return instancetype, not JSValue* ([de50c8c](https://github.com/tidev/titanium-sdk/commit/de50c8ca24318a1f6d77a2fd23713274bafa3501))
* if user supplies no specific auth constant for hasLocationPermissions, assume WHEN_IN_USE ([5db8321](https://github.com/tidev/titanium-sdk/commit/5db83213f2fb094c15253d9589c12ffc48858271))
* implement Ti.Blob binary toString natively ([ce900a7](https://github.com/tidev/titanium-sdk/commit/ce900a7e0701751c5e688052661e054f0f9af158))
* implement Ti.Blob.arrayBuffer natively ([46842aa](https://github.com/tidev/titanium-sdk/commit/46842aa768c1b4d379c661c18c38369658a7457f))
* implement Ti.UI.Tab.setWindow() in JS to avoid error ([2185a8f](https://github.com/tidev/titanium-sdk/commit/2185a8fb22026d008f1ac7da981a6837fd4d11e0))
* make JSValue nonatomic property, retain it under the hood, handle exception in creation ([10c4acd](https://github.com/tidev/titanium-sdk/commit/10c4acd4c6d06de927a3bc91d582004638c1920b))
* make KrollPromise no-op under covers when KrollFinalizer is running to avoid crash ([b3aaaa3](https://github.com/tidev/titanium-sdk/commit/b3aaaa3409941447db679f09312ed4bdc2b754c4))
* merged switch statment ([97d157a](https://github.com/tidev/titanium-sdk/commit/97d157a582fa649b10ffc58f123a401f0f0d0718))
* minor fixes for Ti.Geolocation#requestLocationPermissions() ([82ff625](https://github.com/tidev/titanium-sdk/commit/82ff625ba0e04b7abce21acec174fd319cc6db3d))
* modify gathering of npm packages ([82f7a33](https://github.com/tidev/titanium-sdk/commit/82f7a337eb300d5add557def74f285525cb438e4))
* prevent deprecation warning ([d36b81b](https://github.com/tidev/titanium-sdk/commit/d36b81b31ce13071b042c27628a91963bd5458b9))
* properly handle Ti.UI.Clipboard.setData with Files ([485f5cf](https://github.com/tidev/titanium-sdk/commit/485f5cf9423cccb5f0247e32cc216405b569742f))
* report Ti.Media.VideoPlayer.error event with all typical error properties ([2f1a84b](https://github.com/tidev/titanium-sdk/commit/2f1a84bff0efb75d148024420c56286538b03212))
* tweak to get correct platform values on macos ([e9a6587](https://github.com/tidev/titanium-sdk/commit/e9a6587c9c9c67cbb6e3343372e914c341309157))
* use compile guard for determining if macos ([df14d0a](https://github.com/tidev/titanium-sdk/commit/df14d0aa3663ba66b2499522bc909795db2c69db))
* remove unsupported architectures ([a4e61bf](https://github.com/tidev/titanium-sdk/commit/a4e61bff968ac621998bfe53f1e20f33df386ad5))

## Features

### Multiple platforms

* [TIMOB-24549](https://jira-archive.titaniumsdk.com/TIMOB-24549) - TiAPI: Add support for Promises ([ea75a0f](https://github.com/tidev/titanium-sdk/commit/ea75a0fc9a5291fcc6efbd3c47a50367a85ced11)) ([23541b3](https://github.com/tidev/titanium-sdk/commit/23541b36b51708b4e3a2dddb34b2d454b6a2f835)) ([bbb48f8](https://github.com/tidev/titanium-sdk/commit/bbb48f84fde98b3676a90fb929082bc43564d216))
* [TIMOB-26352](https://jira-archive.titaniumsdk.com/TIMOB-26352) - CLI: node_modules in project root should be handled properly
* [TIMOB-28302](https://jira-archive.titaniumsdk.com/TIMOB-28302) - add checkbox style to Ti.UI.Switch ([446d215](https://github.com/tidev/titanium-sdk/commit/446d21532e967619f870cf4e0372546eb9244078))
* [TIMOB-28317](https://jira-archive.titaniumsdk.com/TIMOB-28317) - add Ti.UI.OptionBar ([260f65b](https://github.com/tidev/titanium-sdk/commit/260f65bb7bac31b21629cbcd731b644f2b9bd3ec))
* [TIMOB-28328](https://jira-archive.titaniumsdk.com/TIMOB-28328) - Update to recommend installing @appcd/plugin-webpack via appcd pm rather than from npm
* [TIMOB-28340](https://jira-archive.titaniumsdk.com/TIMOB-28340) - Return Promise for Ti.UI.Window open() and close()
* [TIMOB-28364](https://jira-archive.titaniumsdk.com/TIMOB-28364) - TiAPI: Return Promises for async Ti.* Geolocation APIs
* [TIMOB-28372](https://jira-archive.titaniumsdk.com/TIMOB-28372) - Remove native module verification

### Android platform

* [TIMOB-24735](https://jira-archive.titaniumsdk.com/TIMOB-24735) - implement ATTRIBUTE_UNDERLINE_COLOR functionality ([645c91e](https://github.com/tidev/titanium-sdk/commit/645c91ea1b9d237790d73349f51d059a79aaf2dd))
* [TIMOB-25954](https://jira-archive.titaniumsdk.com/TIMOB-25954) - Add "Ti.UI.ButtonBar" support ([5a6be04](https://github.com/tidev/titanium-sdk/commit/5a6be04f8d7144da0181b7500920a6bb1c789ace))
* [TIMOB-26263](https://jira-archive.titaniumsdk.com/TIMOB-26263) - Add "MaterialButton" support to "Ti.UI.Button" ([f835bba](https://github.com/tidev/titanium-sdk/commit/f835bba2e29e4ba2516e30457a5b88fd0218ad5f))
* [TIMOB-28082](https://jira-archive.titaniumsdk.com/TIMOB-28082) - Update "CardView" to support material theme ([a828779](https://github.com/tidev/titanium-sdk/commit/a828779fc722e78eff30a9798118e6ab8c7732a5))
* [TIMOB-28083](https://jira-archive.titaniumsdk.com/TIMOB-28083) - Update dialogs to support material theme
* [TIMOB-28086](https://jira-archive.titaniumsdk.com/TIMOB-28086) - Update "Toolbar" to support material theme ([1c1431d](https://github.com/tidev/titanium-sdk/commit/1c1431dde9f2c64032b84d66b23dd1ee78813629))
* [TIMOB-28286](https://jira-archive.titaniumsdk.com/TIMOB-28286) - Touch events should fire synchronously
* [TIMOB-28298](https://jira-archive.titaniumsdk.com/TIMOB-28298) - Material widget support
* [TIMOB-28299](https://jira-archive.titaniumsdk.com/TIMOB-28299) - Add new material theme styles to "TextField" and "TextArea" ([4d81389](https://github.com/tidev/titanium-sdk/commit/4d813894527c0268679a3ac1f4b117e8128a6ad9)) ([ed22a7d](https://github.com/tidev/titanium-sdk/commit/ed22a7d14c19e938a5be1a4989c6f25b1aa02888))
* [TIMOB-28300](https://jira-archive.titaniumsdk.com/TIMOB-28300) - Add material "chip" style to Ti.UI.Switch ([4295acc](https://github.com/tidev/titanium-sdk/commit/4295acc6a9249da420f514af883e9bc23e44664c))
* [TIMOB-28301](https://jira-archive.titaniumsdk.com/TIMOB-28301) - Use the material DayNight theme by default ([86a704f](https://github.com/tidev/titanium-sdk/commit/86a704f3b682e79a197313d89df84040a1c94eb0))
* [TIMOB-28326](https://jira-archive.titaniumsdk.com/TIMOB-28326) - Number-based "itemId" is transformed into string in ListView
* [TIMOB-28336](https://jira-archive.titaniumsdk.com/TIMOB-28336) - Update V8 runtime to 8.8 ([738b2c2](https://github.com/tidev/titanium-sdk/commit/738b2c2ccbc76cc0082db41767ddeb7add77877a)) ([be490ba](https://github.com/tidev/titanium-sdk/commit/be490bae867f42a4f5f13a3d69d0e21c02f82454))
* [TIMOB-28348](https://jira-archive.titaniumsdk.com/TIMOB-28348) - Add TEXT_ALIGNMENT_JUSTIFY support ([851b4f6](https://github.com/tidev/titanium-sdk/commit/851b4f6849d3c73f57b760850a86cfa2abb09dc5))
* [TIMOB-28351](https://jira-archive.titaniumsdk.com/TIMOB-28351) - Update ProgressBars/ActivityIndicators to use material theme ([b1c5d0a](https://github.com/tidev/titanium-sdk/commit/b1c5d0aa2e0339a477bd11ff712eada9e3f70ac5))
* [TIMOB-28353](https://jira-archive.titaniumsdk.com/TIMOB-28353) - Update Date/Time picker dialogs to use material theme ([6fbe014](https://github.com/tidev/titanium-sdk/commit/6fbe0141da2d4101e26bb121da30d3d8d544b22d))
* [TIMOB-28369](https://jira-archive.titaniumsdk.com/TIMOB-28369) - Add Ti.UI.overrideUserInterfaceStyle property
* [TIMOB-28370](https://jira-archive.titaniumsdk.com/TIMOB-28370) - Add "title" support to Ti.UI.Switch slider style
* [TIMOB-28390](https://jira-archive.titaniumsdk.com/TIMOB-28390) - Change Ti.UI.SearchBar to use native SearchView ([9637ac1](https://github.com/tidev/titanium-sdk/commit/9637ac1cae29b3bdf1e9bf8ed9081193bdd6fc0d))
* [TIMOB-28402](https://jira-archive.titaniumsdk.com/TIMOB-28402) - Implement delete event for ListView and TableView ([6b60f5f](https://github.com/tidev/titanium-sdk/commit/6b60f5f5ae84c108b6448211d27ec3121411981d))
* "requestPermissions" and Geolocation APIs return Promise ([971e71e](https://github.com/tidev/titanium-sdk/commit/971e71e876284d0828617a74607b8bb4107a2faf))
* add "?attr/color" string support ([4dde745](https://github.com/tidev/titanium-sdk/commit/4dde74525b114c0c472a537d2484059007fdbbfe))
* add npm packages to android apps ([7ea9d0e](https://github.com/tidev/titanium-sdk/commit/7ea9d0e72a92a063708578c654b7dece7ca59cad))
* add outlined CardView support ([dc3b279](https://github.com/tidev/titanium-sdk/commit/dc3b279573ece7f9d137f6b98d52fefd67b07b92))
* change button theme to not all-caps ([a664bc8](https://github.com/tidev/titanium-sdk/commit/a664bc82d8181e1a649b65f438e04b11712eca1a))
* expose Ti.Media.AudioPlayer.audioSessionId as read-only property ([d8c64af](https://github.com/tidev/titanium-sdk/commit/d8c64af65345691e2258929d6848d022c11477b0))
* fetchSemanticColor() support dynamic light/dark change ([0b07d89](https://github.com/tidev/titanium-sdk/commit/0b07d89d8f0ace3d4655b7df46af3de12b5a0bdf))
* have Ti.Database.DB.executeAllAsync return a Promise ([41e83be](https://github.com/tidev/titanium-sdk/commit/41e83bef336e3427543d063f73c02f306eaf79fa))
* scale top tab style to fit icon ([8d2831d](https://github.com/tidev/titanium-sdk/commit/8d2831def020195fa9a436a66c9e08724c0f4e0d))
* have Ti.Database.DB.executeAsync return a Promise ([4b03ac6](https://github.com/tidev/titanium-sdk/commit/4b03ac6916de5ba81f8fd583b6bc6e4e81377e7c))
* make Geolocation getCurrentHeading/Position return Promises ([fcf6d0a](https://github.com/tidev/titanium-sdk/commit/fcf6d0a5418cf6e284f55e99a01a50b26e0f0126))
* return Promise from Ti.UI.Window.close() ([d67537f](https://github.com/tidev/titanium-sdk/commit/d67537f5cfe607264dd1f2a276cb35de81fec60c))
* return Promise from Ti.UI.Window.open() ([2fda671](https://github.com/tidev/titanium-sdk/commit/2fda6717ff32c8702a047c2c6f22201c58049432))

### iOS platform

* [TIMOB-20473](https://jira-archive.titaniumsdk.com/TIMOB-20473) - Support storyboard in iOS-modules ([7292d1b](https://github.com/tidev/titanium-sdk/commit/7292d1bf3b26f2577ae2468ab5fcfb2e2b2570f8))
* [TIMOB-27355](https://jira-archive.titaniumsdk.com/TIMOB-27355) - Support native iOS 13+ JavaScriptCore promises
* [TIMOB-27865](https://jira-archive.titaniumsdk.com/TIMOB-27865) - Titanium should add view controllers as children
* [TIMOB-28259](https://jira-archive.titaniumsdk.com/TIMOB-28259) - Replace OSSpinLock usage with os_unfair_lock
* [TIMOB-28282](https://jira-archive.titaniumsdk.com/TIMOB-28282) - Use supportedInterfaceOrientations of UINavigationController.topViewController instead of UINavigationController
* [TIMOB-28297](https://jira-archive.titaniumsdk.com/TIMOB-28297) - swift files doesn't recognize macros defined in defines.h
* [TIMOB-28302](https://jira-archive.titaniumsdk.com/TIMOB-28302) - macOS: Add checkbox style to Ti.UI.Switch
* [TIMOB-28304](https://jira-archive.titaniumsdk.com/TIMOB-28304) - Enabling swift in Objc based module is failing while building
* [TIMOB-28334](https://jira-archive.titaniumsdk.com/TIMOB-28334) - Update modules to set minimum target iOS 11
* [TIMOB-28342](https://jira-archive.titaniumsdk.com/TIMOB-28342) - Drop iOS 11 support in titanium SDK 10
* have Ti.Database.DB.executeAllAsync return a Promise ([6c4253f](https://github.com/tidev/titanium-sdk/commit/6c4253f0a32be191e02717c897864e63b61ac952))
* have Ti.Database.DB.executeAsync return a Promise ([fbbbe98](https://github.com/tidev/titanium-sdk/commit/fbbbe982c9a63c03be2c21d5003f0277ac697f7c))
* include project root node_modules folder in app ([84d5641](https://github.com/tidev/titanium-sdk/commit/84d564165cb93a7d77d6d5dcbbc2c32b80516c81))
* move to JS based require implementation ([1e66008](https://github.com/tidev/titanium-sdk/commit/1e660087eb34049c00399671454df50a273efc41))
* return Promise from Ti.UI.Window.open()/close() ([5fa6258](https://github.com/tidev/titanium-sdk/commit/5fa6258f9ec45eefc6a83b95c61b625d62386fd9))
* return Promises from Ti.Geolocation.getCurrentHeading/Position methods ([a4015cd](https://github.com/tidev/titanium-sdk/commit/a4015cd5c161af17ab8da73dd58cdf3d9d69be6f))
* support Ti.UI.NavigationWindow#open()/close() returning Promise ([ca09400](https://github.com/tidev/titanium-sdk/commit/ca094007ae0a99db1df156db742aa53cf6ccfa8b))
* support Ti.UI.TabGroup#open()/close() returning Promise ([cafd270](https://github.com/tidev/titanium-sdk/commit/cafd27028c5a67cea6ea4ff7081ffc92794a0745))

## SDK Module Versions

| Module      | Android version | iOS Version |
| ----------- | --------------- | ----------- |
| facebook | 11.0.2 | 11.0.0 |
| ti.cloudpush | 7.1.0 | n/a |
| ti.map | 5.0.1 | 5.0.0 |
| ti.webdialog | 2.0.0 | 3.0.0 |
| ti.playservices | 17.5.0 | n/a |
| ti.identity | 3.0.2 | 4.0.0 |
| urlSession | n/a | 4.0.0 |
| ti.coremotion | n/a | 4.0.0 |
| ti.applesignin | n/a | 3.0.0 |
| ti.cloud | 3.2.11 | 3.2.11 |
| hyperloop | 7.0.1 | 7.0.1 |

## [9.3.2](https://github.com/tidev/titanium-sdk/compare/9_3_1_GA...9.3.2) (2021-02-11)

## About this release

Titanium SDK 9.3.2 is a patch release of the SDK, addressing high-priority issues from previous releases.

As of this GA release, the previous Titanium SDK patch release (9.3.1) is no longer supported. End of support for this version will be 2021-08-11 or until the next patch release. Note: major and minor releases continue to be supported according to their nominal lifetime.
See [Axway Appcelerator Deprecation Policy](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_deprecation_policy.html) and [Nominal Lifetimes](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_product_lifecycle.html#AxwayAppceleratorProductLifecycle-NominalLifetimes) documents for details.

:warning: With the release of Titanium SDK 9.0.0, we no longer support Node.js 8.X. Node 10.13.0 is the new minimum supported version.

## Community Credits

* Michael Gangolf
  * [TIMOB-28333](https://jira-archive.titaniumsdk.com/TIMOB-28333) - rgba(int,int,int) parity with iOS ([925f6f2](https://github.com/tidev/titanium-sdk/commit/925f6f26ab2eabbff43eaffef8622f4e305d6360))


## Bug Fixes

### Android platform

* [TIMOB-28337](https://jira-archive.titaniumsdk.com/TIMOB-28337) - ListView properties missing in "longpress" event in Alloy as of 9.3.0 ([0935358](https://github.com/tidev/titanium-sdk/commit/093535877cadf38e48efa840c7902bfa7a12f902))
* [TIMOB-28330](https://jira-archive.titaniumsdk.com/TIMOB-28330) - Application crashes when scrolling a listview with zero items in the first section ([a92bea2](https://github.com/tidev/titanium-sdk/commit/a92bea2353c31001b27313f366c255403a719f57))
* [TIMOB-28341](https://jira-archive.titaniumsdk.com/TIMOB-28341) - webview url sends repeated sections of encrypted url ([f5f8f67](https://github.com/tidev/titanium-sdk/commit/f5f8f6786715b7877dd29189a14f5893fd2ea256))

### iOS platform

* [TIMOB-28325](https://jira-archive.titaniumsdk.com/TIMOB-28325) - Calculate proper row width for UITableViewStyleInsetGrouped ([a34e964](https://github.com/tidev/titanium-sdk/commit/a34e9643c6a9c9686e76e3893ce501a3f9073413))
* [TIMOB-28297](https://jira-archive.titaniumsdk.com/TIMOB-28297) - Swift files doesn't recognize macros defined in defines.h ([d135466](https://github.com/tidev/titanium-sdk/commit/d1354664a768a122caa7c7e06bbe8b2eab27e5f8))
* [TIMOB-28304](https://jira-archive.titaniumsdk.com/TIMOB-28304) - Swift enabling in Objc module should build ([1d1f174](https://github.com/tidev/titanium-sdk/commit/1d1f174cfd0f73ed267e0659b76d9da67edcebfa))
* [TIMOB-28282](https://jira-archive.titaniumsdk.com/TIMOB-28282) - Use supportedInterfaceOrientations of UINavigationController.topViewController instead of UINavigationController ([1f1127a](https://github.com/tidev/titanium-sdk/commit/1f1127abc35288a296e9b68c206a622a4cbcf8bd))
* expose Ti.Media.AudioPlayer.externalPlaybackActive as boolean properly ([2712dc6](https://github.com/tidev/titanium-sdk/commit/2712dc6be533b9752b9b62dccc7e022596a03558))

### Multiple platforms

* declare i18n function before its usage ([e4bc8a9](https://github.com/tidev/titanium-sdk/commit/e4bc8a9265f6e6ba2cb801612c65dbe49a953b05))

## SDK Module Versions

| Module      | Android version | iOS Version |
| ----------- | --------------- | ----------- |
| facebook | 11.0.2 | 10.0.0 |
| ti.cloudpush | 7.1.0 | n/a |
| ti.map | 5.0.1 | 4.0.1 |
| ti.webdialog | 2.0.0 | 2.0.0 |
| ti.playservices | 17.5.0 | n/a |
| ti.identity | 3.0.2 | 3.0.0 |
| urlSession | n/a | 3.0.0 |
| ti.coremotion | n/a | 3.0.0 |
| ti.applesignin | n/a | 2.0.0 |
| ti.cloud | 3.2.11 | 3.2.11 |
| hyperloop | 6.0.2 | 6.0.2 |

## [9.3.1](https://github.com/tidev/titanium-sdk/compare/9_3_0_GA...9.3.1) (2021-01-25)

## About this release

Titanium SDK 9.3.1 is a patch release of the SDK, addressing high-priority issues from previous releases.

As of this GA release, the previous Titanium SDK patch release (9.3.0) is no longer supported. End of support for this version will be 2021-07-25 or until the next patch release. Note: major and minor releases continue to be supported according to their nominal lifetime.
See [Axway Appcelerator Deprecation Policy](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_deprecation_policy.html) and [Nominal Lifetimes](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_product_lifecycle.html#AxwayAppceleratorProductLifecycle-NominalLifetimes) documents for details.

:warning: With the release of Titanium SDK 9.0.0, we no longer support Node.js 8.X. Node 10.13.0 is the new minimum supported version.


## Bug Fixes

### Android platform

* add elevation and support transparent backgrounds ([9025413](https://github.com/tidev/titanium-sdk/commit/9025413f004fddedffef160892cf09e04135c9bd))
* address minor memory leak ([6d9c62c](https://github.com/tidev/titanium-sdk/commit/6d9c62c8e2a83226a746a17ed088b246cb8080c3))
* amend getBackground() to ignore transparent backgrounds ([541f3f4](https://github.com/tidev/titanium-sdk/commit/541f3f46cf19591841ee32ac6dd91d90c856e6ad))
* [TIMOB-28293](https://jira-archive.titaniumsdk.com/TIMOB-28293) - amend ListView marker behaviour ([1f6ff22](https://github.com/tidev/titanium-sdk/commit/1f6ff229462d126f8675bbf9bb972d6b6d4cb0fb))
* amend method to obtain view in releaseViews() ([52ae6e3](https://github.com/tidev/titanium-sdk/commit/52ae6e3f0c7f2f556f8bdfc19c2889fc3f933503))
* amend scrollend event fire condition ([b7609ff](https://github.com/tidev/titanium-sdk/commit/b7609ff96e11c7eb41464c7c129409eb597b976f))
* date.toLocaleString() to default to numeric date/time ([436c3a3](https://github.com/tidev/titanium-sdk/commit/436c3a374d1c316ec4b6236faf629d929836b697))
* [TIMOB-28312](https://jira-archive.titaniumsdk.com/TIMOB-28312) - decimal comma TextField handling ([5bfa46a](https://github.com/tidev/titanium-sdk/commit/5bfa46afa005155358e38ecc4246121801e3d9bd))
* fire move event after movement ([012d9b5](https://github.com/tidev/titanium-sdk/commit/012d9b5c8732f330066dddd3272ab075f01eb8c5))
* implement missing scroll events for ListView and TableView ([2cde1bc](https://github.com/tidev/titanium-sdk/commit/2cde1bc6dfd4896fb9b86e205c33aa9858304e4e))
* implement old scrolling event behaviour ([393072c](https://github.com/tidev/titanium-sdk/commit/393072c2f9e39fd513480013393fc645c9e548d0))
* include totalItemCount and visibleItemCount properties ([d1079c3](https://github.com/tidev/titanium-sdk/commit/d1079c348ebb772e001025e9ab513c97c814c76f))
* include type property in events ([69ac871](https://github.com/tidev/titanium-sdk/commit/69ac871d456df8f0cd1ca550f13fb2464cdf5f13))
* [TIMOB-28278](https://jira-archive.titaniumsdk.com/TIMOB-28278) - localized date/time format should default to numeric ([6323c69](https://github.com/tidev/titanium-sdk/commit/6323c698de92568f7050f3ddecac55b03f75a67d))
* obtain bindId for child templates ([88b1e2a](https://github.com/tidev/titanium-sdk/commit/88b1e2ab2a6d0b7ed1d4c98b95423d7122be9d08))
* onFling callback return ([29880c7](https://github.com/tidev/titanium-sdk/commit/29880c775adfaa04b28bdc0fc42ad57de89faed0))
* [TIMOB-28294](https://jira-archive.titaniumsdk.com/TIMOB-28294) [TIMOB-28308](https://jira-archive.titaniumsdk.com/TIMOB-28308) - optimize table and list view updates ([23c0f6c](https://github.com/tidev/titanium-sdk/commit/23c0f6cae20dd63e9bb4dbe52d5431702565b41d))
* use parent background when row is transparent ([a743e6d](https://github.com/tidev/titanium-sdk/commit/a743e6d64528adc3bb983731d7a619ff05e645ac))

### Multiple platforms

* [TIMOB-28205](https://jira-archive.titaniumsdk.com/TIMOB-28205) - production builds using aot compiler ([30038d7](https://github.com/tidev/titanium-sdk/commit/30038d72c371dc1009d01e10bf6c475bbda0e662))

### iOS platform

* [TIMOB-28303](https://jira-archive.titaniumsdk.com/TIMOB-28303) - add workspace workaround ([bf6529d](https://github.com/tidev/titanium-sdk/commit/bf6529d891f2bdb26e550b6851a05e9df8fe540c))
* [TIMOB-28267](https://jira-archive.titaniumsdk.com/TIMOB-28267) - removing eventlistener multiple times ourCallbackCount should not be in negative value ([ab9997b](https://github.com/tidev/titanium-sdk/commit/ab9997b0391fad13fa760604cf807b0239bc8590))
* [TIMOB-28323](https://jira-archive.titaniumsdk.com/TIMOB-28323) - set statusbar height to top of safearea view ([28c62f7](https://github.com/tidev/titanium-sdk/commit/28c62f7a0f3ad4cd7e02591755d7ee9a77808c1e))

## Features

### Android platform

* [TIMOB-28251](https://jira-archive.titaniumsdk.com/TIMOB-28251) - add missing options to Intl.DateTimeFormat.resolvedOptions() ([6aa7c83](https://github.com/tidev/titanium-sdk/commit/6aa7c835f3675b408e762c49dcd7d9afe4015241))
* display drag handle for movable rows ([8d79902](https://github.com/tidev/titanium-sdk/commit/8d7990257c295232dcca483b3e733091df2caeb1))
* fire bubbled-up events synchronously ([7c8ebe6](https://github.com/tidev/titanium-sdk/commit/7c8ebe6489743dc1a8b89d6e146c7bd4caad43e0))
* [TIMOB-28286](https://jira-archive.titaniumsdk.com/TIMOB-28286) - fire touch events synchronously ([59280d2](https://github.com/tidev/titanium-sdk/commit/59280d2ccd0e5e2a632c46dc6dc8551044b58ede))
* implement list and table editable and moveable functionality ([acb26f0](https://github.com/tidev/titanium-sdk/commit/acb26f05956f00c14b29bf9b634372026520d47b))

## SDK Module Versions

| Module      | Android version | iOS Version |
| ----------- | --------------- | ----------- |
| facebook | 11.0.2 | 10.0.0 |
| ti.cloudpush | 7.1.0 | n/a |
| ti.map | 5.0.1 | 4.0.1 |
| ti.webdialog | 2.0.0 | 2.0.0 |
| ti.playservices | 17.5.0 | n/a |
| ti.identity | 3.0.2 | 3.0.0 |
| urlSession | n/a | 3.0.0 |
| ti.coremotion | n/a | 3.0.0 |
| ti.applesignin | n/a | 2.0.0 |
| ti.cloud | 3.2.11 | 3.2.11 |
| hyperloop | 6.0.2 | 6.0.2 |

# [9.3.0](https://github.com/tidev/titanium-sdk/compare/9_2_X...9.3.0) (2020-11-23)

## About this release

Titanium SDK 9.3.0 is a minor release of the SDK, addressing high-priority issues from previous releases.

As of this release, Titanium SDK 9.2.x will not receive updates more than six months after the release of 9.3.0 (2021-05-23). Any needed fixes will be in 9.3.x or later supported releases within the 9.x branch.
See [Axway Appcelerator Deprecation Policy](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_deprecation_policy.html) and [Nominal Lifetimes](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_product_lifecycle.html#AxwayAppceleratorProductLifecycle-NominalLifetimes) documents for details.

:warning: With the release of Titanium SDK 9.0.0, we no longer support Node.js 8.X. Node 10.13.0 is the new minimum supported version.

## Overview

Titanium SDK 9.3.0 is primarily focused on providing support for Android 11.

## Community Credits

* Sergey Volkov
  * [TIMOB-25556](https://jira-archive.titaniumsdk.com/TIMOB-25556) - add separate lock mode for left and right drawers ([e51c84b](https://github.com/tidev/titanium-sdk/commit/e51c84be4482b0daa3c12b0da1e9a8f85a0e4d06))

* Michael Gangolf
  * [TIDOC-3186](https://jira-archive.titaniumsdk.com/TIDOC-3186)adding drawerlayout alloy example ([7d5b1f5](https://github.com/tidev/titanium-sdk/commit/7d5b1f58a6fe443db2b79c46310828ed481ce17c))
  * [TIMOB-27779](https://jira-archive.titaniumsdk.com/TIMOB-27779) - fix TabbedBar Click loop ([1c5327d](https://github.com/tidev/titanium-sdk/commit/1c5327df7f719267a6e9d3f1c6935b90440fbda1))
  * [TIMOB-27859](https://jira-archive.titaniumsdk.com/TIMOB-27859) - add Ti.UI.Tab.badge and badgeColor ([a19c36e](https://github.com/tidev/titanium-sdk/commit/a19c36ec07740d7eb8e139458322335d7e1cb24b)) ([6ca467a](https://github.com/tidev/titanium-sdk/commit/6ca467a888012f4e1ec6f2d5b0fd24e562420258))
  * fix Ti.UI.Window.extendSafeArea default value text ([ec2f867](https://github.com/tidev/titanium-sdk/commit/ec2f8675e5ba23247a9d1e5c54954b0554b14fe6))

* Hans Knöchel
  * [TIMOB-28104](https://jira-archive.titaniumsdk.com/TIMOB-28104) - support new date picker styles ([78bce40](https://github.com/tidev/titanium-sdk/commit/78bce40cd4dd9b90a06929729122dd9e17272450))

## Features

### Android platform

* [TIMOB-28045](https://jira-archive.titaniumsdk.com/TIMOB-28045) - Android 11 Support
* [TIMOB-18069](https://jira-archive.titaniumsdk.com/TIMOB-18069) - make ListSection.getItemCount() and/or getContentCount() public
* [TIMOB-24983](https://jira-archive.titaniumsdk.com/TIMOB-24983) - Add "HTTPClient.responseHeaders" support (feature parity with iOS)
* [TIMOB-25556](https://jira-archive.titaniumsdk.com/TIMOB-25556) - Extend drawerLockMode to set Gravity
* [TIMOB-25854](https://jira-archive.titaniumsdk.com/TIMOB-25854) - Grant WebView permissions for Audio/Video WebRTC streams
* [TIMOB-25991](https://jira-archive.titaniumsdk.com/TIMOB-25991) - RefreshControl in ListView only works when dragging content
* [TIMOB-27077](https://jira-archive.titaniumsdk.com/TIMOB-27077) - Rewrite Ti.UI.TableView to use RecyclerView
* [TIMOB-27138](https://jira-archive.titaniumsdk.com/TIMOB-27138) - Add photo/video capture support to WebView
* [TIMOB-27201](https://jira-archive.titaniumsdk.com/TIMOB-27201) - Update "Ti.Filesystem.File" to support unimplemented APIs when wrapping a "content://" URL
* [TIMOB-27714](https://jira-archive.titaniumsdk.com/TIMOB-27714) - Add "Material Components" theme support ([eb46ca0](https://github.com/tidev/titanium-sdk/commit/eb46ca07aab67895f010ccae68b9927a685fd538))
* [TIMOB-27743](https://jira-archive.titaniumsdk.com/TIMOB-27743) - Remove hidden API usage from SDK
* [TIMOB-27787](https://jira-archive.titaniumsdk.com/TIMOB-27787) - Add C/C++ debugging to SDK test app builds
* [TIMOB-27838](https://jira-archive.titaniumsdk.com/TIMOB-27838) - Style default tableViewSection headerTitle using XML
* [TIMOB-27859](https://jira-archive.titaniumsdk.com/TIMOB-27859) - Add "badge" support to TabGroup
* [TIMOB-27873](https://jira-archive.titaniumsdk.com/TIMOB-27873) - Remove "nineoldandroids" library from SDK
* [TIMOB-27887](https://jira-archive.titaniumsdk.com/TIMOB-27887) - Support WebAssembly in V8
* [TIMOB-27934](https://jira-archive.titaniumsdk.com/TIMOB-27934) - Update "ti.playservices" module to use 17.5.0
* [TIMOB-27948](https://jira-archive.titaniumsdk.com/TIMOB-27948) - Use of wrong string operator in string comparison in TiJSService
* [TIMOB-27970](https://jira-archive.titaniumsdk.com/TIMOB-27970) - Update V8 runtime to 8.4
* [TIMOB-28046](https://jira-archive.titaniumsdk.com/TIMOB-28046) - Compile with SDK version 30 (Android 11)
* [TIMOB-28047](https://jira-archive.titaniumsdk.com/TIMOB-28047) - Target API Level 30 (Android 11) by default ([4490c3e](https://github.com/tidev/titanium-sdk/commit/4490c3ea8554ad50c60d410208d401723525d771))
* [TIMOB-28049](https://jira-archive.titaniumsdk.com/TIMOB-28049) - Investigate "ACCESS_BACKGROUND_LOCATION" handling on Android 11
* [TIMOB-28050](https://jira-archive.titaniumsdk.com/TIMOB-28050) - Investigate "package visibility" handling on Android 11
* [TIMOB-28051](https://jira-archive.titaniumsdk.com/TIMOB-28051) - Add foreground service type constants for "camera" and "microphone" ([8fcbd4a](https://github.com/tidev/titanium-sdk/commit/8fcbd4a2fee97fb3c53a9f7a65f59ecf08311d68)) ([0e98584](https://github.com/tidev/titanium-sdk/commit/0e985849e0578ca48c3e2c67f3bb5cae179f1391))
* [TIMOB-28057](https://jira-archive.titaniumsdk.com/TIMOB-28057) - Modify WebView to use scoped storage for `<input/>` file selection
* [TIMOB-28058](https://jira-archive.titaniumsdk.com/TIMOB-28058) - Change Ti.Filesystem "temp" APIs to use app's cache folder
* [TIMOB-28059](https://jira-archive.titaniumsdk.com/TIMOB-28059) - Modify Ti.Media APIs to use scoped storage
* [TIMOB-28080](https://jira-archive.titaniumsdk.com/TIMOB-28080) - Add "tapjacking" prevention features ([34cbeea](https://github.com/tidev/titanium-sdk/commit/34cbeeae1b33de1aa056e92f98952786332a2c30)) ([413da3e](https://github.com/tidev/titanium-sdk/commit/413da3e821c5a4ed4f47acec439f6543331c2d9b))
* [TIMOB-28084](https://jira-archive.titaniumsdk.com/TIMOB-28084) - use material theme by default ([00e2816](https://github.com/tidev/titanium-sdk/commit/00e28160218593d5591971b97f1d202ed97d5111))
* [TIMOB-28087](https://jira-archive.titaniumsdk.com/TIMOB-28087) - Add "NoTitleBar" and "Fullscreen" themes which derive from custom app theme ([00e2816](https://github.com/tidev/titanium-sdk/commit/00e28160218593d5591971b97f1d202ed97d5111))
* [TIMOB-28088](https://jira-archive.titaniumsdk.com/TIMOB-28088) - Rewrite Ti.UI.ListView to use RecyclerView
* [TIMOB-28102](https://jira-archive.titaniumsdk.com/TIMOB-28102) - Update module Kotlin language support to 1.4.x ([5dc0872](https://github.com/tidev/titanium-sdk/commit/5dc08725eb313419b5749fea7789731ab534483f))
* [TIMOB-28140](https://jira-archive.titaniumsdk.com/TIMOB-28140) - WebView should request location permission when HTML uses geolocation API
* [TIMOB-28146](https://jira-archive.titaniumsdk.com/TIMOB-28146) - Ti.Filesystem.File rename() should support an absolute path in same directory
* [TIMOB-28173](https://jira-archive.titaniumsdk.com/TIMOB-28173) - Update gradle to 6.7
* [TIMOB-28182](https://jira-archive.titaniumsdk.com/TIMOB-28182) - Only add WRITE_EXTERNAL_STORAGE permission when needed
* [TIMOB-28183](https://jira-archive.titaniumsdk.com/TIMOB-28183) - Add Ti.Media.requestPhotoGalleryPermissions() support
* [TIMOB-28214](https://jira-archive.titaniumsdk.com/TIMOB-28214) - Remove dead "TiAuthenticator" Java code to avoid security warnings
* [TIMOB-28223](https://jira-archive.titaniumsdk.com/TIMOB-28223) - Use vector graphics for list/table icons
* [TIMOB-28230](https://jira-archive.titaniumsdk.com/TIMOB-28230) - Add Ti.Filesystem.externalCacheDirectory support
* [TIMOB-28231](https://jira-archive.titaniumsdk.com/TIMOB-28231) - Change Ti.Filesystem.externalStorageDirectory to use scoped storage
* [MOD-2588](https://jira-archive.titaniumsdk.com/MOD-2588) - add passcode fallback to ti.identity ([7e7934d](https://github.com/tidev/titanium-sdk/commit/7e7934d1c61d9099c02146519048b30046d68d25))

### iOS platform

* [TIMOB-27984](https://jira-archive.titaniumsdk.com/TIMOB-27984) - allow multiple photo selection ([8b53023](https://github.com/tidev/titanium-sdk/commit/8b530233dd21eadb162f35416a98c7ea6ea6df39))
* [TIMOB-28195](https://jira-archive.titaniumsdk.com/TIMOB-28195) - Add node-ios-device v1 support for Node 14
* add iphone 12 models to Node.js `os` shim ([69bf699](https://github.com/tidev/titanium-sdk/commit/69bf69928235551fd055b2fe44a099f2787147f1))
* add new constants for `Ti.Media.VIDEO_MEDIA_TYPE_` ([d85d6f8](https://github.com/tidev/titanium-sdk/commit/d85d6f82f4d38ec51011381bdd93a5ccfd35dcbb))

### Multiple platforms

* add `"build.post.install"` build hook ([372bf70](https://github.com/tidev/titanium-sdk/commit/372bf7040aabfcd497c4038fa9e7af5f0959e45f)) ([7186384](https://github.com/tidev/titanium-sdk/commit/7186384f49eea480b72fdafe1682ef4e28dd3bf2))
* emit `'create.module.app.finalize'` build hook during module build before launching test app ([8778f3f](https://github.com/tidev/titanium-sdk/commit/8778f3f033198e305c7325960a3e86a0a5ca18f0)) ([403d7e2](https://github.com/tidev/titanium-sdk/commit/403d7e2ab1f967f21c9d06206264f45c5d66ad33))

## Bug Fixes

### Android platform

* [TIMOB-15015](https://jira-archive.titaniumsdk.com/TIMOB-15015) - TableView.headerView cannot be set after setting data
* [TIMOB-16498](https://jira-archive.titaniumsdk.com/TIMOB-16498) - Undesired tableView separatorColor is appearing in footerView
* [TIMOB-24874](https://jira-archive.titaniumsdk.com/TIMOB-24874) - Selected row does not stay highlighted when using a TableView.
* [TIMOB-25333](https://jira-archive.titaniumsdk.com/TIMOB-25333) - SearchBar height should default to Ti.UI.SIZE like iOS instead of FILL
* [TIMOB-26602](https://jira-archive.titaniumsdk.com/TIMOB-26602) - Ti.Media.takePicture() will wrongly assign mp4 extension to image file if camera is configured for MEDIA_TYPE_VIDEO
* [TIMOB-26887](https://jira-archive.titaniumsdk.com/TIMOB-26887) - TableView "headerTitle" and "footerTitle" cannot be changed after creation
* [TIMOB-27481](https://jira-archive.titaniumsdk.com/TIMOB-27481) - Navigating back from camera overlay can wrongly close the app
* [TIMOB-27796](https://jira-archive.titaniumsdk.com/TIMOB-27796) - TableViewSection does not scroll after a certain point
* [TIMOB-27948](https://jira-archive.titaniumsdk.com/TIMOB-27948) - string reference equality in service ([5ba35d3](https://github.com/tidev/titanium-sdk/commit/5ba35d344c887191dc0c3f1b2247dc05dae78643))
* [TIMOB-28027](https://jira-archive.titaniumsdk.com/TIMOB-28027) - Build fails as duplicate string with "app_name" in i18n strings.xml file ([98ff0e7](https://github.com/tidev/titanium-sdk/commit/98ff0e7251cf86b9f67584c141fd0ae5fb8ce93e)) ([d8d442e](https://github.com/tidev/titanium-sdk/commit/d8d442ecf09c08010a29a0c79b872b6894343bf3))
* [TIMOB-28048](https://jira-archive.titaniumsdk.com/TIMOB-28048) - RefreshControl in TableView only works when dragging content
* [TIMOB-28079](https://jira-archive.titaniumsdk.com/TIMOB-28079) - ACA module no longer loaded first on startup as of 8.1.0
* [TIMOB-28081](https://jira-archive.titaniumsdk.com/TIMOB-28081) - App build fails if it includes an Apache "commons-logging" library
* [TIMOB-28084](https://jira-archive.titaniumsdk.com/TIMOB-28084) - Modal/Translucent window ignores `<navbar-hidden/>` setting in "tiapp.xml"
* [TIMOB-28105](https://jira-archive.titaniumsdk.com/TIMOB-28105) - AudioRecorder "recording" and "stopped" properties return the wrong state values ([340bc36](https://github.com/tidev/titanium-sdk/commit/340bc3620a00987cdbd3ad1b3ead9a12c0a2f024)) ([8e8d160](https://github.com/tidev/titanium-sdk/commit/8e8d160be4dfc3a35774b227052afd6614a223d1))
* [TIMOB-28149](https://jira-archive.titaniumsdk.com/TIMOB-28149) - App builds fail if it includes "Java-WebSocket" library
* [TIMOB-28161](https://jira-archive.titaniumsdk.com/TIMOB-28161) - Modules built with 9.1.0 and using deprecated getter/setter property methods will crash on 9.0.x apps ([6e025c5](https://github.com/tidev/titanium-sdk/commit/6e025c52f39fd33f07c85ca5a4d35da113ec6bc5))
* [TIMOB-28162](https://jira-archive.titaniumsdk.com/TIMOB-28162) - TableViewRow does not scale to height of parent
* [TIMOB-28163](https://jira-archive.titaniumsdk.com/TIMOB-28163) - TableViewRow ignores borderRadius
* [TIMOB-28164](https://jira-archive.titaniumsdk.com/TIMOB-28164) - TableViewRow displays incorrect background upon press
* [TIMOB-28165](https://jira-archive.titaniumsdk.com/TIMOB-28165) - TableViewRow does not activate ripple effect from child views
* [TIMOB-28166](https://jira-archive.titaniumsdk.com/TIMOB-28166) - TableViewRow does not apply opacity to child views
* [TIMOB-28167](https://jira-archive.titaniumsdk.com/TIMOB-28167) - ListViewItem does not activate ripple effect from child views
* [TIMOB-28176](https://jira-archive.titaniumsdk.com/TIMOB-28176) - createTempDirectory() does not create a directory
* [TIMOB-28177](https://jira-archive.titaniumsdk.com/TIMOB-28177) - createTempFile() should create file under Ti.Filesystem.tempDirectory
* [TIMOB-28178](https://jira-archive.titaniumsdk.com/TIMOB-28178) - Canceling out of Ti.Media.openPhotoGallery() causes a crash as of 9.1.0 ([0e284e5](https://github.com/tidev/titanium-sdk/commit/0e284e58b92179f1d17799418b1e7ab5bd4edd8c))
* [TIMOB-28189](https://jira-archive.titaniumsdk.com/TIMOB-28189) - Opening TabGroup crashes when using AppCompat theme as of 9.3.0 ([6403da2](https://github.com/tidev/titanium-sdk/commit/6403da2453bceed654e7bb5a8c9cb43af51427ae))
* [TIMOB-28193](https://jira-archive.titaniumsdk.com/TIMOB-28193) - Selecting multiple photos/videos via openPhotoGallery() can cause a crash as of 9.1.0 ([0b1116f](https://github.com/tidev/titanium-sdk/commit/0b1116f6eeed4be5c1ac205a53f9288fc8e948aa))
* [TIMOB-28212](https://jira-archive.titaniumsdk.com/TIMOB-28212) - Listview modifies other rows on scroll
* [TIMOB-28220](https://jira-archive.titaniumsdk.com/TIMOB-28220) - tintColor/activeTintColor or titleColor/activeTitleColor not respected for tabgroup with style TABS_STYLE_BOTTOM_NAVIGATION ([f640850](https://github.com/tidev/titanium-sdk/commit/f6408505023dd85a4b13857130e0ef31289cc870))
* [TIMOB-28222](https://jira-archive.titaniumsdk.com/TIMOB-28222) - Ti.Android.R.transition doesn't exist ([2773c51](https://github.com/tidev/titanium-sdk/commit/2773c51368786bb0b9698ece1e3ea0d3b4fe4a45))
* [TIMOB-28240](https://jira-archive.titaniumsdk.com/TIMOB-28240) - TableViewRow unable to change colour of row after a set time (Regression)
* [TIMOB-28246](https://jira-archive.titaniumsdk.com/TIMOB-28246) - Ti.Media.previewImage() fails to display in-memory blobs as of 9.1.0 ([984f811](https://github.com/tidev/titanium-sdk/commit/984f8118d6f39b68c2bdb576871291a0cbb680db))
* add accessor for Ti.Media.fullscreen property, default initialPlaybackTime to 0 ([204827d](https://github.com/tidev/titanium-sdk/commit/204827d863ee3c8f5b546f8e996ee59870127810))
* allow overriding of toString() ([f20ed51](https://github.com/tidev/titanium-sdk/commit/f20ed5123c9da72a581ad4ed5d9f67d99d79747b))
* amend chevron vector icon color and size ([8fde5bb](https://github.com/tidev/titanium-sdk/commit/8fde5bb6cf0851803c42a9bfabde019ee1f4ee7f))
* amend icon color and size ([8e63037](https://github.com/tidev/titanium-sdk/commit/8e63037a16e39d0164f20ba910cf1a930ab362a6))
* amend size of more icon ([ae23408](https://github.com/tidev/titanium-sdk/commit/ae234083e4005076b6b04e813edbe568ca28cbbd))
* amend Ti.UI.Shortcut implementation ([975af13](https://github.com/tidev/titanium-sdk/commit/975af137337ef6dbc6ef324ec548b7efdc04e156))
* debug snapshot generation ([dcfd0c7](https://github.com/tidev/titanium-sdk/commit/dcfd0c70bc1eef5061946ec44754f8a6c32c0857))
* default to newer scalingMode constant default value ([c151ff0](https://github.com/tidev/titanium-sdk/commit/c151ff0ab801d70ff5fe8a7e75145f883cc9ebc0))
* draw outer border path correctly ([e8c6d54](https://github.com/tidev/titanium-sdk/commit/e8c6d549dfb9cb78c11bed55039930d0b9a094fe))
* formatting ([db0cd77](https://github.com/tidev/titanium-sdk/commit/db0cd77859de5f31ad433b3ea0248c34959e51e0))
* formatToParts() on Android 4.4 ([2a2f0dc](https://github.com/tidev/titanium-sdk/commit/2a2f0dc23da360e2edbdd37f179b62bff2a256cf))
* match static value for Ti.Media.MEDIA_TYPE_VIDEO to iOS ([b0f6527](https://github.com/tidev/titanium-sdk/commit/b0f65279fcbd6980d4545ec2fcac2544b18b44c1))
* null out Ti.UI.Window's navigationWindow property before close event ([bdce8ae](https://github.com/tidev/titanium-sdk/commit/bdce8ae291151d2f01279ca29a6c95576015e546))
* remove Ti.Media.VideoPlayer.contentURL property ([5bf7826](https://github.com/tidev/titanium-sdk/commit/5bf7826b37c22425d924a047e6c360b0bafd7856))
* remove unnecessary v8 refs ([4122858](https://github.com/tidev/titanium-sdk/commit/4122858166119d724457e9fcc4a9c28ef872f38c))
* return empty array rather than null for Ti.Media.availableCameras if no cameras ([48006b6](https://github.com/tidev/titanium-sdk/commit/48006b69b6030f84204cb72848402f31428f9966))
* snapshot template ([3eab6b7](https://github.com/tidev/titanium-sdk/commit/3eab6b7241965317dca69912fefae585cde80a46))
* start zip read, close zipfile when done ([bdf7d36](https://github.com/tidev/titanium-sdk/commit/bdf7d365edc39d9d273570996494ddbc3f9a442e))
* update more icon into down chevron ([569dc77](https://github.com/tidev/titanium-sdk/commit/569dc77128df5e1b967bbe2236a1e14c09024eca))
* use manifest shortcuts for staticItems ([79102ee](https://github.com/tidev/titanium-sdk/commit/79102ee7ba7de0385c953f1719aee70687625dee))
* window toString() ([d1fd590](https://github.com/tidev/titanium-sdk/commit/d1fd59090c5e246a8e86bc588baa968b2938a7b2))

### Multiple platforms

* [TIMOB-28200](https://jira-archive.titaniumsdk.com/TIMOB-28200) - Angular: Project created from template fails build with type errors
* set prompt on project dir option ([f5a4391](https://github.com/tidev/titanium-sdk/commit/f5a43911f547dc9500e064b8b38eae26679a4b90))
* return back userInfo.gid not guid ([a70bbe3](https://github.com/tidev/titanium-sdk/commit/a70bbe3367b96e5a451f5be318bffb13ece26ab0))

### iOS platform

* [TIMOB-13903](https://jira-archive.titaniumsdk.com/TIMOB-13903) - Reading TableView's "sectionCount" property crashes app ([149eb4a](https://github.com/tidev/titanium-sdk/commit/149eb4a2bad451630651c46dc60504652394b8a3))
* [TIMOB-27935](https://jira-archive.titaniumsdk.com/TIMOB-27935) - TableViewRow does not return getRect methods
* [TIMOB-28111](https://jira-archive.titaniumsdk.com/TIMOB-28111) - TabGroup focus event firing unexpectedly ([5fa704d](https://github.com/tidev/titanium-sdk/commit/5fa704dfd656609a2698cb5035d12b9b4c20504b))
* [TIMOB-28148](https://jira-archive.titaniumsdk.com/TIMOB-28148) - app crashes when updating tableview
* [TIMOB-28160](https://jira-archive.titaniumsdk.com/TIMOB-28160) - "unrecognized selector sent to instance" logged for errors from native side
* [TIMOB-28207](https://jira-archive.titaniumsdk.com/TIMOB-28207) - Packaging fails when Xcode path contains a space
* [TIMOB-28211](https://jira-archive.titaniumsdk.com/TIMOB-28211)  - The color property of Ti.UI.Button does not work when used in navbar ([66e8d37](https://github.com/tidev/titanium-sdk/commit/66e8d3768a97a963c03c529f62bc05da90aa706a))
* [TIMOB-28218](https://jira-archive.titaniumsdk.com/TIMOB-28218) - Ti.UI.Clipboard example usage crashes on macOS
* [TIMOB-28219](https://jira-archive.titaniumsdk.com/TIMOB-28219) - Ti.UI.Clipboard#remove() doesn't exist, but is documented
* [TIMOB-28221](https://jira-archive.titaniumsdk.com/TIMOB-28221) - Default value of property Ti.Media.VideoPlayer.pictureInPictureEnabled should be true ([ba7e5aa](https://github.com/tidev/titanium-sdk/commit/ba7e5aab70925e9b1ad8cb197e0c1c39056081c2))
* [TIMOB-28227](https://jira-archive.titaniumsdk.com/TIMOB-28227) - Ti.UI.dateTimeColor is crashing on mac
* fix Ti.Filesystem.getAsset and getFile on devices ([3b2865d](https://github.com/tidev/titanium-sdk/commit/3b2865daf131eaabdfeaac2c5b6b6772e514e3dc))
* fix typo on Ti.Media.MUSIC_PLAYER_STATE_SEEK_FORWARD ([de780ec](https://github.com/tidev/titanium-sdk/commit/de780ec99b714056b2e5ebae782f428111d2b766))
* gaurd code for MediaModule on xcode 11 to avoid compile issues ([4144c96](https://github.com/tidev/titanium-sdk/commit/4144c96ea19145e2e1fbb23687bfcad3b875f11d))
* get rid of removed constants/properties ([8a9a05e](https://github.com/tidev/titanium-sdk/commit/8a9a05eba7b158248bc69a1fd5388e05a89481a6))
* handle adding Ti.UI.Shortcut when existing array is nil ([f967cf9](https://github.com/tidev/titanium-sdk/commit/f967cf90c6cf2dea959dc2980a59e5359103418b))
* modify BOOL to bool for return types to fix JS representation ([43042cc](https://github.com/tidev/titanium-sdk/commit/43042cce456c3491e526da2ab2e005acb8339cf3))
* set Ti.Codec.CHARSET_ISO_LATIN_1 to 'latin1' ([4123b9b](https://github.com/tidev/titanium-sdk/commit/4123b9ba88425d647cf29e31708a048409074162))
* shortcut guard in Ti.UI module ([7f44d8d](https://github.com/tidev/titanium-sdk/commit/7f44d8d02fbcb6be8ecfff52debd0e9af7830dad))

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

## [9.2.2](https://github.com/tidev/titanium-sdk/compare/9_2_1_GA...9.2.2) (2020-10-29)

## About this release

Titanium SDK 9.2.2 is a patch release of the SDK, addressing high-priority issues from previous releases.

As of this GA release, the previous Titanium SDK patch release (9.2.1) is no longer supported. End of support for this version will be 2021-04-29 or until the next patch release. Note: major and minor releases continue to be supported according to their nominal lifetime.
See [Axway Appcelerator Deprecation Policy](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_deprecation_policy.html) and [Nominal Lifetimes](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_product_lifecycle.html#AxwayAppceleratorProductLifecycle-NominalLifetimes) documents for details.

:warning: With the release of Titanium SDK 9.0.0, we no longer support Node.js 8.X. Node 10.13.0 is the new minimum supported version.

## Community Credits

* Hans Knöchel
  * [TIMOB-28181](https://jira-archive.titaniumsdk.com/TIMOB-28181) - fix 'dateTimeColor' for iOS 14+ ([88005a3](https://github.com/tidev/titanium-sdk/commit/88005a3ae86b2f1904b528eaa3e16eb7e4fdaa3c))
  * [TIMOB-28203](https://jira-archive.titaniumsdk.com/TIMOB-28203) - Remove deprecated frameworks (AddressBook, AddressBookUI, OpenGLES)

## Bug Fixes

### Multiple platforms

* [TIMOB-28210](https://jira-archive.titaniumsdk.com/TIMOB-28210) - silence aca load failure ([f9e00fd](https://github.com/tidev/titanium-sdk/commit/f9e00fdfb58779adafaf2a3042029010ab9f39ff))
* [TIMOB-28200](https://jira-archive.titaniumsdk.com/TIMOB-28200) - declare missing nodejs namespace for zone.js ([35f59c4](https://github.com/tidev/titanium-sdk/commit/35f59c433108c201a4a633d34d25af45a1fd4248))
* [TIMOB-28079](https://jira-archive.titaniumsdk.com/TIMOB-28079) - always load aca module first on startup ([f911623](https://github.com/tidev/titanium-sdk/commit/f911623670c39028c039891c1217be1a675319a7))
* [TIMOB-28185](https://jira-archive.titaniumsdk.com/TIMOB-28185) - generate missing macOS asset catalog icons ([b242902](https://github.com/tidev/titanium-sdk/commit/b242902a9009f77a1ec227bd5c609a945ef6cc00))
* [TIMOB-28200](https://jira-archive.titaniumsdk.com/TIMOB-28200) - update dependencies of angular template ([701bcec](https://github.com/tidev/titanium-sdk/commit/701bcec93f73a1de843ae4518659e2b30cdef933))
* [TIMOB-28174](https://jira-archive.titaniumsdk.com/TIMOB-28174) - Analytics: Exception can occur when constructing payload

### Android platform

* [TIMOB-28193](https://jira-archive.titaniumsdk.com/TIMOB-28193) - openPhotoGallery() crash selecting multiple files ([29b4116](https://github.com/tidev/titanium-sdk/commit/29b41167184ce7a7f9b6bfc102e203a9d0cf000b))

### iOS platform

* [TIMOB-28202](https://jira-archive.titaniumsdk.com/TIMOB-28202) - fix MediaModule compile error ([b8d2cd1](https://github.com/tidev/titanium-sdk/commit/b8d2cd1d414abb27f0a29c913e476f7d2f028029))
* [TIMOB-28207](https://jira-archive.titaniumsdk.com/TIMOB-28207) - handle spaces in xcode path ([f8c8172](https://github.com/tidev/titanium-sdk/commit/f8c8172f372948aed3397bc1d7ca31b5cf0b49e0))
* make Ti.UI.PickerColumn.rowCount NSNumber*, not NSInteger ([026fe12](https://github.com/tidev/titanium-sdk/commit/026fe120fb6829059fadbb6447964cfb81af76f1))
* make Ti.UI.TableViewSection.rowCount NSNumber*, not NSInteger ([c25a9dd](https://github.com/tidev/titanium-sdk/commit/c25a9dd951dbf277dfeb73889e1300edbcc7cd05))
* [TIMOB-13903](https://jira-archive.titaniumsdk.com/TIMOB-13903) - tableview "sectionCount" property crash ([3b0d8a4](https://github.com/tidev/titanium-sdk/commit/3b0d8a4f27bbfe01cfc042e14e83781f30f92c35))

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

## [9.2.1](https://github.com/tidev/titanium-sdk/compare/9_2_0_GA...9.2.1) (2020-10-05)

## About this release

Titanium SDK 9.2.1 is a patch release of the SDK, addressing high-priority issues from previous releases.

As of this GA release, the previous Titanium SDK patch release (9.2.0) is no longer supported. End of support for this version will be 2021-04-05 or until the next patch release. Note: major and minor releases continue to be supported according to their nominal lifetime.
See [Axway Appcelerator Deprecation Policy](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_deprecation_policy.html) and [Nominal Lifetimes](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_product_lifecycle.html#AxwayAppceleratorProductLifecycle-NominalLifetimes) documents for details.

:warning: With the release of Titanium SDK 9.0.0, we no longer support Node.js 8.X. Node 10.13.0 is the new minimum supported version.

## Bug Fixes

### iOS platform

* [TIMOB-28127](https://jira-archive.titaniumsdk.com/TIMOB-28127) - TiUIListItemProxy overreleased causing intermittent crashing w/ macOS ([6d22e29](https://github.com/tidev/titanium-sdk/commit/6d22e297bb686afa974c0701c578265557acc2e0))
* [TIMOB-28156](https://jira-archive.titaniumsdk.com/TIMOB-28156) - Module build failing for modules not having platform directory ([c4d90fe](https://github.com/tidev/titanium-sdk/commit/c4d90fe0e1cc65f7481c5e715182f0f73f28048f))
* [TIMOB-28150](https://jira-archive.titaniumsdk.com/TIMOB-28150) - Updating backgroundImage displays irrelavant image inbetween change ([de88803](https://github.com/tidev/titanium-sdk/commit/de88803637c7956aba8160fff7e6e1489830bf1b))
* [TIMOB-28152](https://jira-archive.titaniumsdk.com/TIMOB-28152) - Compile error when SDK forces a rebuild ([9b516e4](https://github.com/tidev/titanium-sdk/commit/9b516e4e0163f89187b3ab1ddd2b0f750fad0893))
* [TIMOB-27812](https://jira-archive.titaniumsdk.com/TIMOB-27812) - format js errors in cli output ([bc32947](https://github.com/tidev/titanium-sdk/commit/bc32947554f94acd51561e0bba4585c5a74c56b5))
* [TIMOB-28151](https://jira-archive.titaniumsdk.com/TIMOB-28151) - Compile error if using Ti.Media APIs without openPhotoGallery ([c5d6d8d](https://github.com/tidev/titanium-sdk/commit/c5d6d8d2083db0cc18d03a7c67158101bafcae35))
* [TIMOB-28158](https://jira-archive.titaniumsdk.com/TIMOB-28158) - Duplicate framework search paths ([35e4058](https://github.com/tidev/titanium-sdk/commit/35e4058784e5ad6c104cf6ea2b16f3887e8f58b9))
* [TIMOB-28148](https://jira-archive.titaniumsdk.com/TIMOB-28148) - app crashes when updating tableview ([23c01db](https://github.com/tidev/titanium-sdk/commit/23c01db715a486898f401f68c2aa032550528176))
* [TIMOB-28154](https://jira-archive.titaniumsdk.com/TIMOB-28154) - Build failing on 9.2.0 with Hyperloop
* [TIMOB-28159](https://jira-archive.titaniumsdk.com/TIMOB-28159) - Building Swift module created with sdk < 9.2.0.GA fails
* [TIMOB-27812](https://jira-archive.titaniumsdk.com/TIMOB-27812) - Improve display of uncaught errors

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

# [9.2.0](https://github.com/tidev/titanium-sdk/compare/9_1_X...9.2.0) (2020-09-15)

## About this release

Titanium SDK 9.2.0 is a minor release of the SDK, addressing high-priority issues from previous releases.

As of this release, Titanium SDK 9.1.x will not receive updates more than six months after the release of 9.2.0 (2021-03-15). Any needed fixes will be in 9.2.x or later supported releases within the 9.x branch.
See [Axway Appcelerator Deprecation Policy](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_deprecation_policy.html) and [Nominal Lifetimes](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_product_lifecycle.html#AxwayAppceleratorProductLifecycle-NominalLifetimes) documents for details.

:warning: With the release of Titanium SDK 9.0.0, we no longer support Node.js 8.X. Node 10.13.0 is the new minimum supported version.

## Community Credits

* Hans Knöchel
  * [TIMOB-28147](https://jira-archive.titaniumsdk.com/TIMOB-28147) - support app clips ([56b8da4](https://github.com/tidev/titanium-sdk/commit/56b8da4407e44a64da69d6e32e6eb4a1b696772f))
  * add since version for Ti.UI.Picker.datePickerStyle ([ab250c3](https://github.com/tidev/titanium-sdk/commit/ab250c32cb52d8a6a0c2aa301a1fcd719ca84868))
  * [TIMOB-28104](https://jira-archive.titaniumsdk.com/TIMOB-28104) - support new date picker styles ([d3cdfc5](https://github.com/tidev/titanium-sdk/commit/d3cdfc59bd7707ca2d5a1c27420e91f85019cf3f))

* Michael Gangolf
  * add missing line in scrollableview example ([dbdb869](https://github.com/tidev/titanium-sdk/commit/dbdb869e6fd9003d6801fc2516239f2547b8af90))
  * fix Ti.UI.Window.extendSafeArea default value text ([136620c](https://github.com/tidev/titanium-sdk/commit/136620c668e4a2eb4501331d97cd228c5bca4aed))

## Bug Fixes

### Android platform

* [TIMOB-28090](https://jira-archive.titaniumsdk.com/TIMOB-28090) - allow node to clear event loop ([d6d9a5b](https://github.com/tidev/titanium-sdk/commit/d6d9a5b8333425366fef96333c51942b0f28d799))

### iOS platform

* [TIMOB-27132](https://jira-archive.titaniumsdk.com/TIMOB-27132) - fix location of Ti.Filesystem.applicationDataDirectory on macos ([9caf847](https://github.com/tidev/titanium-sdk/commit/9caf8475b5c55ffac256c181896809d01a5b62e3))
* [TIMOB-28138](https://jira-archive.titaniumsdk.com/TIMOB-28138) - optionally build macos and/or ios arm64 sim ([ed7d149](https://github.com/tidev/titanium-sdk/commit/ed7d149314e7c0efaa5a3150f87d81c104f6c591))
* [TIMOB-28130](https://jira-archive.titaniumsdk.com/TIMOB-28130) - remove Frameworks directory prior to copying ([405e179](https://github.com/tidev/titanium-sdk/commit/405e1799ac15b2a3983d5af55df11543b241a447))
* [TIMOB-28099](https://jira-archive.titaniumsdk.com/TIMOB-28099) - remove old tiverify.xcframework references from project ([cd7c270](https://github.com/tidev/titanium-sdk/commit/cd7c270d538c71deb02c1df8c0be42391b806033))
* tweak titanium.xcconfig template to use variables in sdk path ([7da6dbd](https://github.com/tidev/titanium-sdk/commit/7da6dbd54696a004940a0ce4146f7598624eaade)) 
* [TIMOB-28130](https://jira-archive.titaniumsdk.com/TIMOB-28130) - unmark product directory to prevent removing required files ([635d08c](https://github.com/tidev/titanium-sdk/commit/635d08cc843e098b95e181f792af3ec6993a5df5))
* [TIMOB-28143](https://jira-archive.titaniumsdk.com/TIMOB-28143) - use TITANIUM_SDK variable to point at xcframework path in xcode project ([559b5bc](https://github.com/tidev/titanium-sdk/commit/559b5bca4a2d2f3d58a41018fb61074d157e08dd))
* use xcodeTargetOS of 'iphoneos' for mac catalyst ([60220c7](https://github.com/tidev/titanium-sdk/commit/60220c72a5d35f6ef231d833d911cc2b7408062e))
* [TIMOB-28142](https://jira-archive.titaniumsdk.com/TIMOB-28142) - when building module test project, unzip via spawn to avoid max buffer error ([345eee1](https://github.com/tidev/titanium-sdk/commit/345eee1a3a902f812e461ca9aa9906cd84409993))
* added missing left (“) ([ff27c9b](https://github.com/tidev/titanium-sdk/commit/ff27c9b01f44fee1517ef566af2166f450f07bcd))
* [TIMOB-28108](https://jira-archive.titaniumsdk.com/TIMOB-28108) - allow Ti.UI.RefreshControl.tintColor to accept a semantic color ([815a0fc](https://github.com/tidev/titanium-sdk/commit/815a0fcceeda984578b3451e5688e7dcac429376))
* [TIMOB-28113](https://jira-archive.titaniumsdk.com/TIMOB-28113) - do not update properties if transition animation ([4a835fd](https://github.com/tidev/titanium-sdk/commit/4a835fd1581c7f949a0e05a2ff23b22112b6b7e3))
* [TIMOB-28062](https://jira-archive.titaniumsdk.com/TIMOB-28062) - enable swift development in Titanium ([2b4aa7b](https://github.com/tidev/titanium-sdk/commit/2b4aa7b3a0b7a7ef18c0824a2900db5945206871))
* [TIMOB-28116](https://jira-archive.titaniumsdk.com/TIMOB-28116) - exclude arm64 arch for sim target if native modules aren't xcframeworks ([faba6e1](https://github.com/tidev/titanium-sdk/commit/faba6e1c06c8d468b43189c7422ef326617d0585))
* [TIMOB-28042](https://jira-archive.titaniumsdk.com/TIMOB-28042) - exclude arm64 architecture from simulator build ([178bf92](https://github.com/tidev/titanium-sdk/commit/178bf926f2ba4955a4e4b0939e47e48d7a64e238))
* fix Ti.Filesystem.getAsset and getFile on devices ([f57e938](https://github.com/tidev/titanium-sdk/commit/f57e9381402f87347447231fd140cf7277fedaf3))
* [TIMOB-27985](https://jira-archive.titaniumsdk.com/TIMOB-27985) - fix to add resources and sources file in widget extension ([4b97cec](https://github.com/tidev/titanium-sdk/commit/4b97cec8ec74d7760c3eff0031ef9b75c2fcaa95))
* gaurd code for MediaModule on xcode 11 to avoid compile issues ([a9dae74](https://github.com/tidev/titanium-sdk/commit/a9dae74ca9a993803bdfef52e261fcae2f0c967d))
* [TIMOB-28112](https://jira-archive.titaniumsdk.com/TIMOB-28112) - guard new picker types ([fa8f547](https://github.com/tidev/titanium-sdk/commit/fa8f5475e9588e91eebfd3c0a10c0f663c74e8d2))
* handle adding Ti.UI.Shortcut when existing array is nil ([82e011a](https://github.com/tidev/titanium-sdk/commit/82e011aa1bfff059415ff181e5e4f607ca9fa9b5))
* modify BOOL to bool for return types to fix JS representation ([0b251e2](https://github.com/tidev/titanium-sdk/commit/0b251e28075eba2685efd30a18f8d1df915f5647))
* [TIMOB-28100](https://jira-archive.titaniumsdk.com/TIMOB-28100) - only include presentationControllerDidDismiss when photogallery is used ([14a5e5b](https://github.com/tidev/titanium-sdk/commit/14a5e5ba65de2c5b2d656d0aae4b30c4b6b57ef9))
* [TIMOB-28126](https://jira-archive.titaniumsdk.com/TIMOB-28126) - rely on flush interval ([0c83fab](https://github.com/tidev/titanium-sdk/commit/0c83fabf6bd8abff5370dfb5208ec35b32cc890b))
* [TIMOB-28091](https://jira-archive.titaniumsdk.com/TIMOB-28091) - update liveview for ios 14 compatibility ([e89065b](https://github.com/tidev/titanium-sdk/commit/e89065bad920d25df94f144390912a3bc65190d8))
* [TIMOB-28101](https://jira-archive.titaniumsdk.com/TIMOB-28101) - use arc to create corner radius instead of qudratic curve ([b5ed723](https://github.com/tidev/titanium-sdk/commit/b5ed72357f697293a3d2e2a3ff957ff47bb13fa1))
* [TIMOB-28103](https://jira-archive.titaniumsdk.com/TIMOB-28103) [TIMOB-28110](https://jira-archive.titaniumsdk.com/TIMOB-28110) - view shadow missing with multiple borderRadius values ([2a38bf3](https://github.com/tidev/titanium-sdk/commit/2a38bf33e06831c0c58d489686153acdbf057225))
* fix location of Ti.Filesystem.applicationDataDirectory on macos ([9caf847](https://github.com/tidev/titanium-sdk/commit/9caf8475b5c55ffac256c181896809d01a5b62e3))


### Multiple platforms

* [TIMOB-28094](https://jira-archive.titaniumsdk.com/TIMOB-28094) - process.toString() ([a15f7f6](https://github.com/tidev/titanium-sdk/commit/a15f7f65a6c738ab444570c7236435245e72d6b2))

## Features

### iOS platform

* [TIMOB-27986](https://jira-archive.titaniumsdk.com/TIMOB-27986) - support xcframeworks in modules/platform folders ([b2ccfbf](https://github.com/tidev/titanium-sdk/commit/b2ccfbf7fb44d5ffa03dd358ad8d5930258be838))
* [TIMOB-28077](https://jira-archive.titaniumsdk.com/TIMOB-28077) - added new error constant and updated doc for local network privacy ([f8de8c0](https://github.com/tidev/titanium-sdk/commit/f8de8c08c68398b5b5b871e655455f6d8c529d6e))
* add Ti.Blob.toArrayBuffer() ([e42bbcb](https://github.com/tidev/titanium-sdk/commit/e42bbcbf1295123c3a0f7d8fb94179df89358a28))
* [TIMOB-28098](https://jira-archive.titaniumsdk.com/TIMOB-28098) - add Ti.Platform.versionPatch ([a78e9cc](https://github.com/tidev/titanium-sdk/commit/a78e9ccf9b937fd9066ba13bbc855f3a37557482))
* [TIMOB-27984](https://jira-archive.titaniumsdk.com/TIMOB-27984) - allow multiple photo selection ([04b4292](https://github.com/tidev/titanium-sdk/commit/04b42929d71cef4abc9c6f891caf78da2f714b81))
* build modules as xcframeworks (w/ macos support) ([5b766ae](https://github.com/tidev/titanium-sdk/commit/5b766ae9207255dcc60ee4c04b154cc4b0de04e9))
* [TIMOB-28012](https://jira-archive.titaniumsdk.com/TIMOB-28012) - expose new APIs to customize paging control ([6acad54](https://github.com/tidev/titanium-sdk/commit/6acad54cd44535a5efcb1556a8cce9e73032fb65))
* [TIMOB-27976](https://jira-archive.titaniumsdk.com/TIMOB-27976) - expose new APIs to use location AccuracyAuthorization ([a55f9a3](https://github.com/tidev/titanium-sdk/commit/a55f9a3fc21bd21c4e610e909d9039748b8b05e1))
* [TIMOB-27987](https://jira-archive.titaniumsdk.com/TIMOB-27987) - expose new iOS 14 APIs in Ti.UI.WebView ([840b0d2](https://github.com/tidev/titanium-sdk/commit/840b0d279f79248d1511fc518fa28fda9573be73))
* [TIMOB-27132](https://jira-archive.titaniumsdk.com/TIMOB-27132) - support macos/dist-macappstore targets ([cfac6e4](https://github.com/tidev/titanium-sdk/commit/cfac6e4bf1c6926c3727dcbff5c79221bfb651a2))
* [TIMOB-28078](https://jira-archive.titaniumsdk.com/TIMOB-28078) - support new APIs timeoutForResource and waitsForConnectivity ([09f20d2](https://github.com/tidev/titanium-sdk/commit/09f20d28bcfe8b610291f73dad7bb716cd3ac7d3))
* [TIMOB-28116](https://jira-archive.titaniumsdk.com/TIMOB-28116) - use/support/build xcframeworks ([133527e](https://github.com/tidev/titanium-sdk/commit/133527ed517518b13a64cd50a8dd65d61c8b76b7))

### Multiple platforms

* [TIMOB-28061](https://jira-archive.titaniumsdk.com/TIMOB-28061) - add os version major/minor int constants ([3fd8535](https://github.com/tidev/titanium-sdk/commit/3fd8535013797129fbe6ca381692fce5b7ae55da))
* [TIMOB-28061](https://jira-archive.titaniumsdk.com/TIMOB-28061) - add OS_ANDROID/OS_IOS for non-transpiled builds ([b21c5d7](https://github.com/tidev/titanium-sdk/commit/b21c5d79d00e6efad06fcea441712f57c3bbaa01))
* [TIMOB-28098](https://jira-archive.titaniumsdk.com/TIMOB-28098) - add OS_VERSION_PATCH global ([86d33df](https://github.com/tidev/titanium-sdk/commit/86d33df7d7ce85ff596f392e702095c04b3ca296))
* [TIMOB-28093](https://jira-archive.titaniumsdk.com/TIMOB-28093) - add uprightWidth/uprightHeight props to Ti.Blob ([09b4591](https://github.com/tidev/titanium-sdk/commit/09b4591804f3c15a1854c2d5a48a6c55645af26d))
* [TIMOB-28070](https://jira-archive.titaniumsdk.com/TIMOB-28070) - add vscode config files to app templates ([f8ef53a](https://github.com/tidev/titanium-sdk/commit/f8ef53ac276dace006cd40e65f7ffb798c38eb6e))
* [TIMOB-28030](https://jira-archive.titaniumsdk.com/TIMOB-28030) - add WebView blockedURLs property ([9006c00](https://github.com/tidev/titanium-sdk/commit/9006c0044c6657976951ebb5fb1ede4dde0e2d35))

### Android platform

* add Ti.Blob.toArrayBuffer() ([36e7244](https://github.com/tidev/titanium-sdk/commit/36e7244f5333f40b108eb7847403e629f98ff57f))
* [TIMOB-28098](https://jira-archive.titaniumsdk.com/TIMOB-28098) - add Ti.Platform.versionPatch ([587ddea](https://github.com/tidev/titanium-sdk/commit/587ddea90acf9a5660f6f5499186a09366aaf26c))
* support converting byte[] to ArrayBuffer ([9e77600](https://github.com/tidev/titanium-sdk/commit/9e77600acbaed9dd7d2d301c9fec3687bcf6a77b))

## Performance Improvements

### Multiple platforms

* make buffer shim more efficient ([9efe874](https://github.com/tidev/titanium-sdk/commit/9efe8742508abc1ce40f35d8add9100e675cbab3))

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

# [9.1.0](https://github.com/tidev/titanium-sdk/compare/9_0_X...9.1.0) (2020-08-06)

## About this release

Titanium SDK 9.1.0 is a minor release of the SDK, addressing high-priority issues from previous releases, as well as the addition of new features/functionality/APIs.

As of this release, Titanium SDK 9.0.x will not receive updates more than six months after the release of 9.1.0 (2021-02-03). Any needed fixes will be in 9.1.x or later supported releases within the 9.x branch.
See [Axway Appcelerator Deprecation Policy](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_deprecation_policy.html) and [Nominal Lifetimes](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_product_lifecycle.html#AxwayAppceleratorProductLifecycle-NominalLifetimes) documents for details.

:warning: With the release of Titanium SDK 9.0.0, we no longer support Node.js 8.X. Node 10.13.0 is the new minimum supported version.

## Overview

Titanium SDK 9.1.0's Notable new features include: [Webpack project support](https://jira-archive.titaniumsdk.com/TIMOB-27428), `Intl` JS APIs on both major platforms, Cross-platform Dark/Light mode theming, Named/Semantic Colors, new `focused`/`closed` query methods on some UI components, cross-platform parity for `Ti.UI.Shortcut`, and `Ti.UI.View.borderRadius` extended to support 2 or 4 values (in addition to single value existing support) to allow for custom border radii (rounded corners).

## Community Credits

* Michael Gangolf
  * [TIMOB-27879](https://jira-archive.titaniumsdk.com/TIMOB-27879) - add getScaledTouchSlop() to ListView ([901f991](https://github.com/tidev/titanium-sdk/commit/901f991c242e6d81b999f88ea2dfa2b69f03e57c))
  * [TIMOB-27977](https://jira-archive.titaniumsdk.com/TIMOB-27977) - add "isTrusted" property to Slider "change" event ([8e96445](https://github.com/tidev/titanium-sdk/commit/8e964456613c956661f6769b9af18e2c1bfe393a))
  * [TIMOB-25633](https://jira-archive.titaniumsdk.com/TIMOB-25633) - adding androidback property to showCamera ([b890f7c](https://github.com/tidev/titanium-sdk/commit/b890f7c7743b8e38292c5d669ed502996b665a20))
  * [TIMOB-27855](https://jira-archive.titaniumsdk.com/TIMOB-27855) - animate color ([4fa4e19](https://github.com/tidev/titanium-sdk/commit/4fa4e191f1ec369554b39f596890b5e64629d421)) and elevation ([38a82ed](https://github.com/tidev/titanium-sdk/commit/38a82ed829e57b2c155d07d8856ed92a0a6d9c78))
  * fix OptionDialog example ([c0b13a1](https://github.com/tidev/titanium-sdk/commit/c0b13a1de7999608d79e5a753ab512e964bfa263) and [6b99cf9](https://github.com/tidev/titanium-sdk/commit/6b99cf9fb026658edafd452da355a7b65c76c9bc))
  * [TIMOB-27834](https://jira-archive.titaniumsdk.com/TIMOB-27834) - navigationWindow open/close event ([ec1976a](https://github.com/tidev/titanium-sdk/commit/ec1976a66127b6de024bb4fe6d20207e46fdcb4c))

* Andrea Vitale
  * [TIMOB-27958](https://jira-archive.titaniumsdk.com/TIMOB-27958) - add fallback for countryCode in reverseGeocoder method ([9823b0d](https://github.com/tidev/titanium-sdk/commit/9823b0dba8482fadd809fc6612ad70674fd51a10))

* Hans Knöchel
  * [TIMOB-27895](https://jira-archive.titaniumsdk.com/TIMOB-27895) - support using named colors for color properties directly ([5135b59](https://github.com/tidev/titanium-sdk/commit/5135b595fc4f24f827ec7e63b7273b8a797de5b7))
  * [TIMOB-27757](https://jira-archive.titaniumsdk.com/TIMOB-27757) - fix watchOS targets that include frameworks ([bd59e19](https://github.com/tidev/titanium-sdk/commit/bd59e19fb5036745dbfba857f117899380b88f63))
  * [TIMOB-27745](https://jira-archive.titaniumsdk.com/TIMOB-27745) - add "google-services.json" support ([d04d9e9](https://github.com/tidev/titanium-sdk/commit/d04d9e9782cd34e613781d48f8473151f788b1e0))
  * [TIMOB-27773](https://jira-archive.titaniumsdk.com/TIMOB-27773) - add search bar token API ([0680dcd](https://github.com/tidev/titanium-sdk/commit/0680dcd03b5c65685b35b75187ff45e3d1d16787))

* Sergey Volkov
  * [TIMOB-27519](https://jira-archive.titaniumsdk.com/TIMOB-27519) - semantic colors with alpha value ([3c9aa10](https://github.com/tidev/titanium-sdk/commit/3c9aa102811889793dbdc24eeb03c5a44c1ec449))
  * fix keyboardToolbar property type ([7fbf2c7](https://github.com/tidev/titanium-sdk/commit/7fbf2c70b1c7c9a39805e9d999cf638e5e2f08c4))
  * fix Ti.UI.iOS.MenuPopup.items type ([e886d64](https://github.com/tidev/titanium-sdk/commit/e886d64ee7e81db77fb65b93c3591ae4c6c00c37))

* Skoften
  * [TIMOB-27697](https://jira-archive.titaniumsdk.com/TIMOB-27697) - Add "progress" event to Ti.UI.WebView for Android (parity) ([2caa8e7](https://github.com/tidev/titanium-sdk/commit/2caa8e75a3b40a99d236a5b9b07fe26f5423cbf6))

## Bug Fixes

### Android platform

* [TIMOB-27513](https://jira-archive.titaniumsdk.com/TIMOB-27513) - TabGroup bottom navigation style fires redundant event
* [TIMOB-27519](https://jira-archive.titaniumsdk.com/TIMOB-27519) - Semantic Colors with alpha value
* [TIMOB-27616](https://jira-archive.titaniumsdk.com/TIMOB-27616) - TextField with decimal keyboard type does not allow comma for decimal separator
* [TIMOB-27731](https://jira-archive.titaniumsdk.com/TIMOB-27731) - Camera fails to open when using saveToPhotoGallery: true ([56986c3](https://github.com/tidev/titanium-sdk/commit/56986c33e303081223fd17fa9a13c04d743e517f))
* [TIMOB-27779](https://jira-archive.titaniumsdk.com/TIMOB-27779) - Setting "labels" via TabbedBar "click" event hangs app ([749ff1d](https://github.com/tidev/titanium-sdk/commit/749ff1d67eb812c149f08fc705c87fa440e415a2))
* [TIMOB-27797](https://jira-archive.titaniumsdk.com/TIMOB-27797) - Unable to see "error" event in remote images ([68d11f7](https://github.com/tidev/titanium-sdk/commit/68d11f73cbf317af9a81bd7272fc02d1c39cdac1))
* [TIMOB-27825](https://jira-archive.titaniumsdk.com/TIMOB-27825) - High CPU usage in Android Studio ([11dff9d](https://github.com/tidev/titanium-sdk/commit/11dff9d3ccc61bd04048a11e95016fe8fb409917))
* [TIMOB-27834](https://jira-archive.titaniumsdk.com/TIMOB-27834) - NavigationWindow doesnt trigger open and close events
* [TIMOB-27872](https://jira-archive.titaniumsdk.com/TIMOB-27872) - Blob imageAsX() methods ignore EXIF orientation if not wrapping a file ([7ce3ae1](https://github.com/tidev/titanium-sdk/commit/7ce3ae11f2c886864ed7713b1e88324b60fdf8f6))
* [TIMOB-27882](https://jira-archive.titaniumsdk.com/TIMOB-27882) - Unable to do a production build after switching SDK on Windows
* [TIMOB-27916](https://jira-archive.titaniumsdk.com/TIMOB-27916) - App logs Titanium version as `__VERSION__` on startup as of 9.1.0 ([08227a9](https://github.com/tidev/titanium-sdk/commit/08227a90c0939748b1a93a6764f5949ffa6e0deb))
* [TIMOB-27927](https://jira-archive.titaniumsdk.com/TIMOB-27927) - Changing currently selected row's color in picker does not update shown color
* [TIMOB-27950](https://jira-archive.titaniumsdk.com/TIMOB-27950) - "tiapp.xml" setting `<navbar-hidden>` is ignored if `<fullscreen>` or `<statusbar-hidden>` is also not set as of 9.0.0 ([54e42b1](https://github.com/tidev/titanium-sdk/commit/54e42b1324897f148840a2a0dae431d3b6645ed7))
* [TIMOB-27963](https://jira-archive.titaniumsdk.com/TIMOB-27963) - Always specify default Tab.tintColor ([9a6d417](https://github.com/tidev/titanium-sdk/commit/9a6d417030c1920b5e409bf3de766b22d077f9ee))
* [TIMOB-27972](https://jira-archive.titaniumsdk.com/TIMOB-27972) - ACS push notifications received multiple times on same device after re-installing app
* [TIMOB-27990](https://jira-archive.titaniumsdk.com/TIMOB-27990) - Ti.UI.ShortcutItem has lot of issues
* [TIMOB-28020](https://jira-archive.titaniumsdk.com/TIMOB-28020) - Parity with iOS Shortcut click event payload ([dc102e3](https://github.com/tidev/titanium-sdk/commit/dc102e3ac6c78c35ce294b46a653de710c4958cd))
* changing picker row color should update selected text ([7aa5290](https://github.com/tidev/titanium-sdk/commit/7aa5290036b054bee75240488ae22f8228218906))
* clean/rebuild should release gradle file locks ([be923f1](https://github.com/tidev/titanium-sdk/commit/be923f1d1904912db50218e1addc9acd7147974f))

### iOS platform

* [TIMOB-18256](https://jira-archive.titaniumsdk.com/TIMOB-18256) - setting TextField.value to wrong type triggers change event ([e06f9b5](https://github.com/tidev/titanium-sdk/commit/e06f9b52cdbe494e6c4d19d02373d07fc4a991ff))
* [TIMOB-27649](https://jira-archive.titaniumsdk.com/TIMOB-27649) - deprecate statusbar constant ([3c83fd8](https://github.com/tidev/titanium-sdk/commit/3c83fd80890e7fb44a97702de9600c8b3ef1dc3b))
* [TIMOB-27757](https://jira-archive.titaniumsdk.com/TIMOB-27757) - watchOS: Frameworks are referenced incorrectly
* [TIMOB-27767](https://jira-archive.titaniumsdk.com/TIMOB-27767) - Parity: httpClient should trigger error callback when url is invalid ([7630868](https://github.com/tidev/titanium-sdk/commit/7630868993bac92e2c9d8f005c6a5104683b983c))
* [TIMOB-27821](https://jira-archive.titaniumsdk.com/TIMOB-27821) - ti.urlsession - Event sessioncompleted does not get all specified values ([ebae7bd](https://github.com/tidev/titanium-sdk/commit/ebae7bdc4399d6b0e871db1c60de47d2f0642b89))
* [TIMOB-27832](https://jira-archive.titaniumsdk.com/TIMOB-27832) - Liveview disconnect triggers infinate error loop
* [TIMOB-27846](https://jira-archive.titaniumsdk.com/TIMOB-27846) - Calling Ti.Platform.openURL without all parameters causes the app to crash (regression) ([b5bb437](https://github.com/tidev/titanium-sdk/commit/b5bb4377a384127ccd0702596e396d02f3c9abdf))
* [TIMOB-27874](https://jira-archive.titaniumsdk.com/TIMOB-27874) - parseDecimal() whitespace thousands sep handling ([ed7bbe6](https://github.com/tidev/titanium-sdk/commit/ed7bbe6e1924996f8d173bd757b564f291c24c66))
* [TIMOB-27897](https://jira-archive.titaniumsdk.com/TIMOB-27897) - master branch is not building on Xcode < 11
* [TIMOB-27930](https://jira-archive.titaniumsdk.com/TIMOB-27930) - iPad crashing intermittently during unit test suite ([c2e5fb5](https://github.com/tidev/titanium-sdk/commit/c2e5fb5de565119ce7859298b217abe319f3bb8e))
* [TIMOB-27935](https://jira-archive.titaniumsdk.com/TIMOB-27935) - TableViewRow does not return getRect methods
* [TIMOB-27958](https://jira-archive.titaniumsdk.com/TIMOB-27958) - Ti.Geolocation.reverseGeocoder() crashes the app on iOS
* [TIMOB-27969](https://jira-archive.titaniumsdk.com/TIMOB-27969) - View in a tab window goes under tabs in a tabgroup on Ipad ([e9330a9](https://github.com/tidev/titanium-sdk/commit/e9330a927909f64bd6e7efc05eb3f48de6347476))
* [TIMOB-27994](https://jira-archive.titaniumsdk.com/TIMOB-27994) - itemclick event its firing instead of a move event when ordering items in a list (iOS 13+) ([40cc28d](https://github.com/tidev/titanium-sdk/commit/40cc28da53ed5cebb31c555fe8727db830eee3bb))
* [TIMOB-27997](https://jira-archive.titaniumsdk.com/TIMOB-27997) - Ti.Blob images from device (via Ti.UI.View#toImage()) would report dimensions in points, not pixels ([51b6237](https://github.com/tidev/titanium-sdk/commit/51b6237049a9bec60c1ab31cb268d40c2ecf2093))
* [TIMOB-28001](https://jira-archive.titaniumsdk.com/TIMOB-28001) - setting TableView row layout to "horizontal" or "vertical" crashes ([fd53a51](https://github.com/tidev/titanium-sdk/commit/fd53a51e8e7040f1995c497092fdc782508dfa7e))
* [TIMOB-28031](https://jira-archive.titaniumsdk.com/TIMOB-28031) - CLI: Unable to find an iOS Simulator running iOS 14.0.
* allow custom property getters to work in bindings ([a53f8c6](https://github.com/tidev/titanium-sdk/commit/a53f8c6e05ab34ce7735af617e62f4c308d4f83f))
* call callback with success no byte event on writeFromBuffer with no length ([8a639d8](https://github.com/tidev/titanium-sdk/commit/8a639d8bb50f66468b4ac6cefbe3501c9027110f))
* define dark/light theme constants/properties for ios < 13 ([a16e698](https://github.com/tidev/titanium-sdk/commit/a16e6983ac14955bcf14307a2634cf9b49e63a0d))
* don't ignore close call immediately after open on Window ([07502db](https://github.com/tidev/titanium-sdk/commit/07502db839ef9a4631e28aefbb1c7727ef5fb515))
* handle Ti.Stream.write with length 0 or empty buffer as success no-op ([b58349d](https://github.com/tidev/titanium-sdk/commit/b58349d06b04203c041e1c1d26566260a924db7a))
* have Ti.Color hex be AARRGGBB format (not RRGGBBAA) ([9c3321b](https://github.com/tidev/titanium-sdk/commit/9c3321b1f788c6b18541e4766007ccaeeadb409c))
* make Ti.UI.Window close/open run more async ala Android ([6a6fda4](https://github.com/tidev/titanium-sdk/commit/6a6fda4bc9ca83e44e1c41b9a6d998f2c1e89f64))
* properly report partial results on thrown error for Ti.DB.executeAll ([f1372ba](https://github.com/tidev/titanium-sdk/commit/f1372bab5510eb3abe71b95907b9b6ca0ecbde58))
* remainingComplicationUserInfoTransfers is number on ipad ([0fcd6d2](https://github.com/tidev/titanium-sdk/commit/0fcd6d2c22d3823fe838f1cec2080ee014a9db65))
* TableViewRow does not return getRect methods ([b15d184](https://github.com/tidev/titanium-sdk/commit/b15d1840c9be3cbf7cc74b10381e3656846f87b8))

### Multiple platforms

* [TIMOB-27785](https://jira-archive.titaniumsdk.com/TIMOB-27785) - buffer: Proxy object's 'set' trap returned falsy value for property '0' ([a45a8d0](https://github.com/tidev/titanium-sdk/commit/a45a8d0cd4833a136537a8da27fee976bd617fab))
* [TIMOB-27808](https://jira-archive.titaniumsdk.com/TIMOB-27808) - add missing console.trace ([83a64a1](https://github.com/tidev/titanium-sdk/commit/83a64a1c276b666a2e24e2524fcb10e0a7a25e00))
* [TIMOB-27525](https://jira-archive.titaniumsdk.com/TIMOB-27525) - Liveview: Commented out line with Ti.include in it causes LiveView failure
* [TIMOB-27416](https://jira-archive.titaniumsdk.com/TIMOB-27416) - LiveView: Changes made to a theme's style are not reflected in app when using LiveView
* [TIMOB-26267](https://jira-archive.titaniumsdk.com/TIMOB-26267) - LiveView: Calling "liveview server stop" causes exception, but stops connections
* [TIMOB-26649](https://jira-archive.titaniumsdk.com/TIMOB-26649) - LiveView: Unable to use LiveView with KitchenSink-v2
* [TIMOB-26798](https://jira-archive.titaniumsdk.com/TIMOB-26798) - Angular: Project template is outdated
* do not remove log file when cleaning ([a699bf5](https://github.com/tidev/titanium-sdk/commit/a699bf594d0e41167d4c441de9d958bdc46a9fb4))
* add .buffer and #set to Buffer ([264b175](https://github.com/tidev/titanium-sdk/commit/264b1752d2548a391e4ee4d53832a27d784d5cf6))
* add no-op stubs for fs.chown methods ([1dd99ef](https://github.com/tidev/titanium-sdk/commit/1dd99efecfa6529ac443293e71ee4fbef9ce6f85))
* assume hex is ARGB ([daf8056](https://github.com/tidev/titanium-sdk/commit/daf8056047a0cbdfac0b76862bec8c4d45196075))
* copy sliced buffer doesn't extend beyond view now ([035c579](https://github.com/tidev/titanium-sdk/commit/035c57922d7345985c44e67913c2b9aa9d36feb4))
* expose Buffer.hexSlice to fix console.log of ArrayBuffer ([d7f863b](https://github.com/tidev/titanium-sdk/commit/d7f863b7f618a7b9b617f68936623d224268b614))
* expose constructor off global console instance ([2568c6f](https://github.com/tidev/titanium-sdk/commit/2568c6f15af34a8a7b5a3a6bea9936367623670d))
* correct type sniffing of some ES6 types ([bac4bb3](https://github.com/tidev/titanium-sdk/commit/bac4bb3c4732431b174ed3fd15536932bd0f1f22))

## Features

### Android platform

* [TIMOB-25633](https://jira-archive.titaniumsdk.com/TIMOB-25633) - Add "androidback" callback property to camera overlay ([b890f7c](https://github.com/tidev/titanium-sdk/commit/b890f7c7743b8e38292c5d669ed502996b665a20))
* [TIMOB-26315](https://jira-archive.titaniumsdk.com/TIMOB-26315) - Support touch feedback on backgroundImage, backgroundGradient, and transparent backgrounds ([2a0b1be](https://github.com/tidev/titanium-sdk/commit/2a0b1bea925c9cc1eefb29535e7a33ef724adc09))
* [TIMOB-27240](https://jira-archive.titaniumsdk.com/TIMOB-27240) - Add Intl.NumberFormat support ([269de3f](https://github.com/tidev/titanium-sdk/commit/269de3f91975b758d58608491b44ac6e3dd86323))
* [TIMOB-27242](https://jira-archive.titaniumsdk.com/TIMOB-27242) - Improve getter and setter warnings ([3507dd0](https://github.com/tidev/titanium-sdk/commit/3507dd0d920c027d7a5d1df251ad914b5b7cdfb9))
* [TIMOB-27473](https://jira-archive.titaniumsdk.com/TIMOB-27473) - Replace clang Java formatter with gradle "checkstyle" tool ([3cbc754](https://github.com/tidev/titanium-sdk/commit/3cbc75485d2b6d8a423ef76653b7d2389309bd61))
* [TIMOB-27501](https://jira-archive.titaniumsdk.com/TIMOB-27501) - Be able to determine dark / light theme, as well as changes on it
  * add Ti.UI.Android.getColorResource(), Ti.UI.Color ([d852331](https://github.com/tidev/titanium-sdk/commit/d852331b71a53dbcdae89dd73055210fb04beb37))
* [TIMOB-27697](https://jira-archive.titaniumsdk.com/TIMOB-27697) - Add "progress" event to Ti.UI.WebView for Android (parity) ([82a3579](https://github.com/tidev/titanium-sdk/commit/82a3579c3239a0ed84c83a28c74767effccfa9fe))
* [TIMOB-27719](https://jira-archive.titaniumsdk.com/TIMOB-27719) - Remove python dependency from SDK build
* [TIMOB-27855](https://jira-archive.titaniumsdk.com/TIMOB-27855) - Animate elevation value
* [TIMOB-27862](https://jira-archive.titaniumsdk.com/TIMOB-27862) - Add callback support to Ti.Platform.openURL() ([43d287e](https://github.com/tidev/titanium-sdk/commit/43d287e685fe9da5efedbda9ed0921bf32fff573))
* [TIMOB-27869](https://jira-archive.titaniumsdk.com/TIMOB-27869) - KEYBOARD_TYPE_ASCII should not allow emoji like iOS
* [TIMOB-27870](https://jira-archive.titaniumsdk.com/TIMOB-27870) - KEYBOARD_TYPE_NUMBERS_PUNCTUATION should allow all chars except emoji like iOS
* [TIMOB-27871](https://jira-archive.titaniumsdk.com/TIMOB-27871) - Setting TextField/TextArea "editable" to false should allow user to copy text to clipboard
* [TIMOB-27879](https://jira-archive.titaniumsdk.com/TIMOB-27879) - ListView should only fire "scrolling" event when moving a min distance
* [TIMOB-27889](https://jira-archive.titaniumsdk.com/TIMOB-27889) - Implement Ti.UI.Shortcut ([5432efc](https://github.com/tidev/titanium-sdk/commit/5432efce7a3e6a09b32c1ed6f4bed95fe915b214))
* [TIMOB-27890](https://jira-archive.titaniumsdk.com/TIMOB-27890) - Add Intl.DateTimeFormat support ([269de3f](https://github.com/tidev/titanium-sdk/commit/269de3f91975b758d58608491b44ac6e3dd86323))
* [TIMOB-27891](https://jira-archive.titaniumsdk.com/TIMOB-27891) - Add Intl.Collator support ([269de3f](https://github.com/tidev/titanium-sdk/commit/269de3f91975b758d58608491b44ac6e3dd86323))
* [TIMOB-27892](https://jira-archive.titaniumsdk.com/TIMOB-27892) - Update toLocale*String() methods to support locale/options ([683adaf](https://github.com/tidev/titanium-sdk/commit/683adafc7f32de97656670f570ac696beb5fce6d))
* [TIMOB-27906](https://jira-archive.titaniumsdk.com/TIMOB-27906) - Add Kotlin based template for native modules ([23c3aea](https://github.com/tidev/titanium-sdk/commit/23c3aeafe8fd7c8a64c037fa584201cc8842b243))
* [TIMOB-27938](https://jira-archive.titaniumsdk.com/TIMOB-27938) - Update gradle build tools to 4.0.x
* [TIMOB-27946](https://jira-archive.titaniumsdk.com/TIMOB-27946) - Implement Ti.View.borderRadius multiple values for custom edge radii ([545f8d5](https://github.com/tidev/titanium-sdk/commit/545f8d5d6d641a14289f486a310ca34f08dada6f))
* add NDK side-by-side support ([71f25e8](https://github.com/tidev/titanium-sdk/commit/71f25e8a6d3cf906f59c8c515effa61211f24802))
* [MOD-2588](https://jira-archive.titaniumsdk.com/MOD-2588) - add passcode fallback to ti.identity ([1f84b35](https://github.com/tidev/titanium-sdk/commit/1f84b3551c57ca4a5cf4c91a07d5867f0948ff15))
* added "codeStyleConfig.xml" to SDK ([a9f6895](https://github.com/tidev/titanium-sdk/commit/a9f68957da9304295199096fbbbbc15061cc4bf4))
* [MOD-2634](https://jira-archive.titaniumsdk.com/MOD-2634) [TIMOB-27972](https://jira-archive.titaniumsdk.com/TIMOB-27972) - migrate CloudPush to Firebase ([d61e66e](https://github.com/tidev/titanium-sdk/commit/d61e66e1e33005a9a4bf2204b536b9421fa6c0df))
* module builds should fail with aar in lib folder ([0c72020](https://github.com/tidev/titanium-sdk/commit/0c720208bab8344e08c1ba29a123b78e9ec55d76))

### iOS platform

* [TIMOB-27773](https://jira-archive.titaniumsdk.com/TIMOB-27773) - Support search bar tokens
* [TIMOB-26959](https://jira-archive.titaniumsdk.com/TIMOB-26959) - Add TLS 1.3 support
* [TIMOB-27853](https://jira-archive.titaniumsdk.com/TIMOB-27853) - Add ability to detect that screenshot was taken on iOS ([b9df339](https://github.com/tidev/titanium-sdk/commit/b9df3399d9aa41b34a8d38f1dad96bca20ff9de2))
* [TIMOB-26818](https://jira-archive.titaniumsdk.com/TIMOB-26818) - Move application shortcut under Ti.UI.Shortcut to have parity ([8446d39](https://github.com/tidev/titanium-sdk/commit/8446d3967cd3c1eda8c364af08a99998e9aa1b20))
* [TIMOB-27305](https://jira-archive.titaniumsdk.com/TIMOB-27305) - Implement Ti.View.borderRadius multiple values for custom edge radii ([34b3a93](https://github.com/tidev/titanium-sdk/commit/34b3a930762a5ea47f781644b87a47f78b86657b))
* [TIMOB-27649](https://jira-archive.titaniumsdk.com/TIMOB-27649) - Deprecate Status Bar style constants
* [TIMOB-27767](https://jira-archive.titaniumsdk.com/TIMOB-27767) - Parity: httpClient should trigger error callback when url is invalid
* [TIMOB-27792](https://jira-archive.titaniumsdk.com/TIMOB-27792) - Remove python dependency from SDK build
* [TIMOB-27974](https://jira-archive.titaniumsdk.com/TIMOB-27974) - Make iOS development-project compatible with Xcode 12
* add list of new iPhone/iPad models for `os` module ([8839c2c](https://github.com/tidev/titanium-sdk/commit/8839c2c8c85914ade3f20c55f825da8896aa378f))

### Multiple platforms

* [TIMOB-13764](https://jira-archive.titaniumsdk.com/TIMOB-13764) - TiAPI: After animating properties on a view, update in the view properties ([3fef676](https://github.com/tidev/titanium-sdk/commit/3fef6762cba17f614ca18492883a700a6a6d4665))
* [TIMOB-25968](https://jira-archive.titaniumsdk.com/TIMOB-25968) - Liveview: Write more information to pidfile, such as port and ip data
* [TIMOB-26572](https://jira-archive.titaniumsdk.com/TIMOB-26572) - TiAPI: Extend global console API to be more Node-compatible ([e398a10](https://github.com/tidev/titanium-sdk/commit/e398a10d6eb51a37f13df6500983ff8132353efe))
* [TIMOB-27429](https://jira-archive.titaniumsdk.com/TIMOB-27429) - Webpack: Integration into the CLI build command
* [TIMOB-27501](https://jira-archive.titaniumsdk.com/TIMOB-27501) - cross-platform light/dark mode API ([28eba34](https://github.com/tidev/titanium-sdk/commit/28eba34349ce26dfd1aafca9c16615ce8255ab20))
* [TIMOB-27511](https://jira-archive.titaniumsdk.com/TIMOB-27511) - Webpack: Alloy loader
* [TIMOB-27716](https://jira-archive.titaniumsdk.com/TIMOB-27716) - Webpack: Classic and Alloy project templates
* [TIMOB-27711](https://jira-archive.titaniumsdk.com/TIMOB-27711) - TiAPI: Add state querying methods to UI components
  * add Ti.UI.Window.closed property ([1c66a80](https://github.com/tidev/titanium-sdk/commit/1c66a80bf671309d63cb70d336482de053ed5efb)) ([574fec6](https://github.com/tidev/titanium-sdk/commit/574fec6c3d40762259dcece0512986dec6d85194))
  * add Ti.UI.Window.focused property ([26f8dcd](https://github.com/tidev/titanium-sdk/commit/26f8dcd0be512d4ae09dd70ab4a80bfae9770321)) ([c5de6e2](https://github.com/tidev/titanium-sdk/commit/c5de6e26d253b42483cb270fb8c54de1d9b65d52))
  * add Ti.UI.SearchBar focused property ([64c334d](https://github.com/tidev/titanium-sdk/commit/64c334dd6509dea2884092c0c9e85a1e276afdec)) ([e0161ed](https://github.com/tidev/titanium-sdk/commit/e0161edc73f8c0d32397ec29744d9f40154dce70))
  * add Ti.UI.TextField/Area focused property ([5e822f5](https://github.com/tidev/titanium-sdk/commit/5e822f590219922cf20f1b84edd8609923675788)) ([19ab4dc](https://github.com/tidev/titanium-sdk/commit/19ab4dc1f6bd08537069222a47d428ffbe6edb94)) ([78357ec](https://github.com/tidev/titanium-sdk/commit/78357ecfebb41d24fa3c53029f7f6ae3739e1ace)) ([7b53d67](https://github.com/tidev/titanium-sdk/commit/7b53d675fe4240c6c4673ae90e557dca84fde0d2))
* [TIMOB-27800](https://jira-archive.titaniumsdk.com/TIMOB-27800) - Webpack: Angular plugin
* [TIMOB-27856](https://jira-archive.titaniumsdk.com/TIMOB-27856) - Webpack: Angular project template
* [TIMOB-27857](https://jira-archive.titaniumsdk.com/TIMOB-27857) - Webpack: Add support for plugins from NPM
* [TIMOB-27860](https://jira-archive.titaniumsdk.com/TIMOB-27860) - Webpack: Tap into hooks before/after other plugins
* [TIMOB-27874](https://jira-archive.titaniumsdk.com/TIMOB-27874) - TiAPI: Add Ti.Locale.parseDecimal() method ([6253813](https://github.com/tidev/titanium-sdk/commit/62538137329bcc9fa0c4c5e3d9798d2f5487e421))
* [TIMOB-27895](https://jira-archive.titaniumsdk.com/TIMOB-27895) - TiAPI: Handle semantic colors (dark mode) without helper function
* [TIMOB-27907](https://jira-archive.titaniumsdk.com/TIMOB-27907) - Liveview: Compatibility with Webpack builds
* [TIMOB-27977](https://jira-archive.titaniumsdk.com/TIMOB-27977) - TiAPI: Add "isTrusted" property to Ti.UI.Slider "change" event
* add basic stream shim ([1720456](https://github.com/tidev/titanium-sdk/commit/17204561b22ab39a731a9ed51281d6a34e3dac11))
* [MOD-2621](https://jira-archive.titaniumsdk.com/MOD-2621) - use ASWebAuthenticationSession when possible ([5e1dfa1](https://github.com/tidev/titanium-sdk/commit/5e1dfa1d36c267e8eaed484203366a9fd72ef7b6))

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

## [9.0.3](https://github.com/tidev/titanium-sdk/compare/9_0_2_GA...9.0.3) (2020-06-10)

## About this release

Titanium SDK 9.0.3 is a patch release of the SDK, addressing high-priority issues from previous releases.

As of this GA release, the previous Titanium SDK patch release (9.0.2) is no longer supported. End of support for this version will be 2020-12-10 or until the next patch release. Note: major and minor releases continue to be supported according to their nominal lifetime.
See [Axway Appcelerator Deprecation Policy](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_deprecation_policy.html) and [Nominal Lifetimes](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_product_lifecycle.html#AxwayAppceleratorProductLifecycle-NominalLifetimes) documents for details.

:warning: With the release of Titanium SDK 9.0.0, we no longer support Node.js 8.X. Node 10.13.0 is the new minimum supported version.

## Bug Fixes

### Android platform

* [TIMOB-27573](https://jira-archive.titaniumsdk.com/TIMOB-27573) - Hiding/Showing progress indicator back-to-back puts it in a bad state as of 8.1.1 ([4e4b509](https://github.com/tidev/titanium-sdk/commit/4e4b5094a2d3bc2cabdf46798543fb4b291fa5ed))
* [TIMOB-27776](https://jira-archive.titaniumsdk.com/TIMOB-27776) - NDK version 21 outputs "Bad file descriptor"
* [TIMOB-27795](https://jira-archive.titaniumsdk.com/TIMOB-27795) - WebView crashes when given local HTML URL with parameters as of 8.1.0 ([5038295](https://github.com/tidev/titanium-sdk/commit/50382954eacaf5f7a30f2915a3cd1f7f549cef55))
* [TIMOB-27830](https://jira-archive.titaniumsdk.com/TIMOB-27830) - TabGroup.titleColor has no effect ([#11741](https://github.com/tidev/titanium-sdk/pull/11741))
* [TIMOB-27831](https://jira-archive.titaniumsdk.com/TIMOB-27831) - Implement TabGroup.tintColor ([#11741](https://github.com/tidev/titanium-sdk/pull/11741))
* [TIMOB-27904](https://jira-archive.titaniumsdk.com/TIMOB-27904) - Incremental build duplicates "bootstrap.json" entries as of 8.1.0 ([5ab9a5a](https://github.com/tidev/titanium-sdk/commit/5ab9a5a54f88922fc233c221ccafb1389d7e3854))
* [TIMOB-27911](https://jira-archive.titaniumsdk.com/TIMOB-27911) - ActiveTab not highlighted ([#11741](https://github.com/tidev/titanium-sdk/pull/11741))
* [TIMOB-27912](https://jira-archive.titaniumsdk.com/TIMOB-27912) - chrome devtools URL is no longer valid ([edcb376](https://github.com/tidev/titanium-sdk/commit/edcb37672b058678819b3a3e6efdf03205e770f0))
* [TIMOB-27939](https://jira-archive.titaniumsdk.com/TIMOB-27939) - Module builds should auto-download NDK r21c by default if needed
* allow Tab barColor to be set ([98718ac](https://github.com/tidev/titanium-sdk/commit/98718acd44f71c074e6dbd83ee9d27a4ef6ac95f))

### iOS platform

* [TIMOB-27847](https://jira-archive.titaniumsdk.com/TIMOB-27847) - Implement Tab tintColor and activeTintColor ([#11741](https://github.com/tidev/titanium-sdk/pull/11741))
* [TIMOB-27898](https://jira-archive.titaniumsdk.com/TIMOB-27898) - Race condition in setTimeout/clearTimeout (regression) ([bbba4cd](https://github.com/tidev/titanium-sdk/commit/bbba4cd46aa0a4d5b3ca94c939db176efe27652c))
* [TIMOB-27903](https://jira-archive.titaniumsdk.com/TIMOB-27903) - APSHTTPRequest dealloc logged when using http calls ([14c98df](https://github.com/tidev/titanium-sdk/commit/14c98dfb1b316d33aa9daeb1cbacdcde348dd4a8))

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

## [9.0.2](https://github.com/tidev/titanium-sdk/compare/9_0_1_GA...9.0.2) (2020-05-19)

## About this release

Titanium SDK 9.0.2 is a patch release of the SDK, addressing high-priority issues from previous releases.

As of this GA release, the previous Titanium SDK patch release (9.0.1) is no longer supported. End of support for this version will be 2020-11-19 or until the next patch release. Note: major and minor releases continue to be supported according to their nominal lifetime.
See [Axway Appcelerator Deprecation Policy](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_deprecation_policy.html) and [Nominal Lifetimes](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_product_lifecycle.html#AxwayAppceleratorProductLifecycle-NominalLifetimes) documents for details.

:warning: With the release of Titanium SDK 9.0.0, we no longer support Node.js 8.X. Node 10.13.0 is the new minimum supported version.

## Community Credits

* Hans Knöchel
  * [TIMOB-27721](https://jira-archive.titaniumsdk.com/TIMOB-27721) - properly set ImageView tintColor ([f3e9507](https://github.com/tidev/titanium-sdk/commit/f3e9507b1357d7981c509872f3d524c7cbea2cf4))

* Sergey Volkov
  * [TIMOB-27505](https://jira-archive.titaniumsdk.com/TIMOB-27505) - configuration change not saved in current context ([ddeafd7](https://github.com/tidev/titanium-sdk/commit/ddeafd740949a343e3863b89b77a6dc505632244))

## Bug Fixes

### Android platform

* [TIMOB-27505](https://jira-archive.titaniumsdk.com/TIMOB-27505) - Configuration change not saved in context for API < 26
* [TIMOB-27513](https://jira-archive.titaniumsdk.com/TIMOB-27513) - TabGroup bottom navigation style fires redundant event ([5cd74a5](https://github.com/tidev/titanium-sdk/commit/5cd74a5f47915cd52571a067aace298e265ab6c3))
* [TIMOB-27625](https://jira-archive.titaniumsdk.com/TIMOB-27625) - Setting picker's minDate/maxDate after opening window not correctly applied ([8e8bcc6](https://github.com/tidev/titanium-sdk/commit/8e8bcc64263e787d264b3e8dfb62ea4dcb1561b6))
* [TIMOB-27721](https://jira-archive.titaniumsdk.com/TIMOB-27721) - Ti.UI.ImageView#tintColor is multiplied, not replaced (like iOS)
* [TIMOB-27774](https://jira-archive.titaniumsdk.com/TIMOB-27774) - Ti.Blob.imageAsResized() not working for JPEG with exif rotation as of 8.1.0 ([cf4cc22](https://github.com/tidev/titanium-sdk/commit/cf4cc22ce0342584a735dc101858bd9cd4964a3c))
* [TIMOB-27769](https://jira-archive.titaniumsdk.com/TIMOB-27769) - Textfield inputs not setting in focused textfield and Keyboard not showing (sometimes) on a textfields which is focused ([2afd818](https://github.com/tidev/titanium-sdk/commit/2afd8186e8561056a7ec08b65d3d338edf2a44d6))
* [TIMOB-27798](https://jira-archive.titaniumsdk.com/TIMOB-27798) - module build to download ndk with gradle tool 3.5.0+ ([7545627](https://github.com/tidev/titanium-sdk/commit/75456275f1765db5ef13ecf730e3c878cb6acfbc))
* [TIMOB-27849](https://jira-archive.titaniumsdk.com/TIMOB-27849) - Ti.version returns long version format when transpiled, short when not
* [TIMOB-27850](https://jira-archive.titaniumsdk.com/TIMOB-27850) - App/Module builds fail with JDK 14 as of 9.0.0 ([ba456bf](https://github.com/tidev/titanium-sdk/commit/ba456bf0c0e2098d35f4ce37f74c09785ae6c7a2))
* [TIMOB-27852](https://jira-archive.titaniumsdk.com/TIMOB-27852) - Production builds no longer copy AAB to distribution folder as of 9.0.1 ([1ca5f70](https://github.com/tidev/titanium-sdk/commit/1ca5f70029729e1c378671886fea22a836dd176e))
* [TIMOB-27881](https://jira-archive.titaniumsdk.com/TIMOB-27881) - ImageView tintColor has no effect ([e025e3b](https://github.com/tidev/titanium-sdk/commit/e025e3b3dbe670eedcaff3682ee741f0c66de81c))

### iOS platform

* [TIMOB-27851](https://jira-archive.titaniumsdk.com/TIMOB-27851) - Ti.Network.createHTTPClient memory leak
* [TIMOB-27861](https://jira-archive.titaniumsdk.com/TIMOB-27861) - Ti.Platform.openURL() callback not invoked if missing options dictionary as of 8.1.0 ([19fc45d](https://github.com/tidev/titanium-sdk/commit/19fc45d85b3084ffc4e9a33b33b3fc9142eaf12f))
* [TIMOB-27868](https://jira-archive.titaniumsdk.com/TIMOB-27868) - Ti.UI.Window.barColor cannot be changed after it was appeared ([707259b](https://github.com/tidev/titanium-sdk/commit/707259b14bbd301ebfffe88c8fa5d2d504cdf797))
* [TIMOB-27894](https://jira-archive.titaniumsdk.com/TIMOB-27894) - Navigation bar flickers on open (SDK 9.0.2 regression, iOS 13+) ([71eabb2](https://github.com/tidev/titanium-sdk/commit/71eabb20d3b20017daf491cc287430a9889e2347))
* [TIMOB-27839](https://jira-archive.titaniumsdk.com/TIMOB-27839) - Orientationchange Stops Firing on iPadOS ([bc67f73](https://github.com/tidev/titanium-sdk/commit/bc67f733e443ce2b40606c37e5d84398207d679b))

## Features

### iOS platform

* add list of new iPhone/iPad models for os module ([29795a7](https://github.com/tidev/titanium-sdk/commit/29795a7213fe8a35437e17d8b1572bc0acc0cfb9))

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

## [9.0.1](https://github.com/tidev/titanium-sdk/compare/9_0_0_GA...9.0.1) (2020-04-15)

## About this release

Titanium SDK 9.0.1 is a patch release of the SDK, addressing high-priority issues from previous releases.

As of this GA release, the previous Titanium SDK patch release (9.0.0) is no longer supported. End of support for this version will be 2020-10-15 or until the next patch release. Note: major and minor releases continue to be supported according to their nominal lifetime.
See [Axway Appcelerator Deprecation Policy](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_deprecation_policy.html) and [Nominal Lifetimes](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_product_lifecycle.html#AxwayAppceleratorProductLifecycle-NominalLifetimes) documents for details.

:warning: With the release of Titanium SDK 9.0.0, we no longer support Node.js 8.X. Node 10.13.0 is the new minimum supported version.

## Bug Fixes

### Android platform

* [TIMOB-17203](https://jira-archive.titaniumsdk.com/TIMOB-17203) - TextField keyboardType: parity issues between iOS and Android
* [TIMOB-26678](https://jira-archive.titaniumsdk.com/TIMOB-26678) - Unnecessary default notification channel created when using a custom one ([1652d08](https://github.com/tidev/titanium-sdk/commit/1652d0878f5735db2a1673d46af1254e91147937))
* [TIMOB-27493](https://jira-archive.titaniumsdk.com/TIMOB-27493) - Videos do not play correctly on Android 5.1 (API 22) ([960d208](https://github.com/tidev/titanium-sdk/commit/960d208898939f37c9a11621e3e6a2ce267e50a8)) ([5a5c0f5](https://github.com/tidev/titanium-sdk/commit/5a5c0f5201d1d2209273196348968e3d94088f2c))
* [TIMOB-27530](https://jira-archive.titaniumsdk.com/TIMOB-27530) - UI glitches out when using 'applyProperties' with Scroll View Touch Listeners
* [TIMOB-27695](https://jira-archive.titaniumsdk.com/TIMOB-27695) - Heavy image processing methods do not trigger GC ([26982f3](https://github.com/tidev/titanium-sdk/commit/26982f304121cd235cc6b04b9dc3a3c87614a8bd))
* [TIMOB-27741](https://jira-archive.titaniumsdk.com/TIMOB-27741) - fall through request permissions ([7bede6f](https://github.com/tidev/titanium-sdk/commit/7bede6f7cf52ca78bec65d514ec3e930cc9428c3))
* [TIMOB-27742](https://jira-archive.titaniumsdk.com/TIMOB-27742) - Minor camera focus issues ([ab3d8c6](https://github.com/tidev/titanium-sdk/commit/ab3d8c6083d549d42a1b48ca401086fa074e0374))
* [TIMOB-27777](https://jira-archive.titaniumsdk.com/TIMOB-27777) - Obtain holder for module references ([764f024](https://github.com/tidev/titanium-sdk/commit/764f024daf5b95a288104d5e374c2eb35b80d641))
* [TIMOB-27780](https://jira-archive.titaniumsdk.com/TIMOB-27780) - Hyperloop builds fail if JDK 12 or higher is installed  ([#11510](https://github.com/tidev/titanium-sdk/pull/11510))
* [TIMOB-27781](https://jira-archive.titaniumsdk.com/TIMOB-27781) - App/Module builds fail with JDK 13 as of 9.0.0 ([caaaa04](https://github.com/tidev/titanium-sdk/commit/caaaa0480d3d2ad52e637b34b92e36f0d2195c3e))
* [TIMOB-27784](https://jira-archive.titaniumsdk.com/TIMOB-27784) - Running "clean" on a module will error if "libs" folder does not exist ([e90b8af](https://github.com/tidev/titanium-sdk/commit/e90b8af9304a4911edc50fed3b325f7d2504bdc7))
* [TIMOB-27823](https://jira-archive.titaniumsdk.com/TIMOB-27823) - javascript files/content assumed to be binary for Ti.Blob on apilevel 29+ ([efa3c64](https://github.com/tidev/titanium-sdk/commit/efa3c64e75752ea3b1ea082a41e78584df838462))
* [TIMOB-27837](https://jira-archive.titaniumsdk.com/TIMOB-27837) - Custom theme ignored by modal/translucent windows as of 9.0.0 ([8e3ce4d](https://github.com/tidev/titanium-sdk/commit/8e3ce4da0d1f83ac7f258cb9e1c9092250191951))

### iOS platform

* [TIMOB-27751](https://jira-archive.titaniumsdk.com/TIMOB-27751) - WKWebView cookies issue ([aab53e7](https://github.com/tidev/titanium-sdk/commit/aab53e701ad1f4d50698283ffdb3e2f161624585))
* [TIMOB-27754](https://jira-archive.titaniumsdk.com/TIMOB-27754) - SearchBar text color and hinTextColor does not work properly. ([f881591](https://github.com/tidev/titanium-sdk/commit/f88159142a52a8acf6b6b933fd7e5bd8789d40ab))
* [TIMOB-27768](https://jira-archive.titaniumsdk.com/TIMOB-27768) - TypeError: Cannot read property 'logger' of undefined ([1c0d85f](https://github.com/tidev/titanium-sdk/commit/1c0d85f865a11b935ed86e49e963da54274be823))
* [TIMOB-27799](https://jira-archive.titaniumsdk.com/TIMOB-27799) - App crashes when setting video player url to null ([01e5798](https://github.com/tidev/titanium-sdk/commit/01e57985826b7552e1e23c63f4a31c61b622156e))
* [TIMOB-27820](https://jira-archive.titaniumsdk.com/TIMOB-27820) - iOS 10: SearchBar color property does not work with showCancel property ([e013135](https://github.com/tidev/titanium-sdk/commit/e013135988dc00436c5da9cfc690bd965240306e))
* [TIMOB-27822](https://jira-archive.titaniumsdk.com/TIMOB-27822) - Ti.UI.iPad.Popover including arrow in content view on iOS 13 ([9b349fb](https://github.com/tidev/titanium-sdk/commit/9b349fbe312774a5f25d6f11aac85db36d41bf15))
* [TIMOB-27824](https://jira-archive.titaniumsdk.com/TIMOB-27824) - Hyperloop: iOS - build fails after updating XCode to 11.4 ([14f7bb5](https://github.com/tidev/titanium-sdk/commit/14f7bb5b666534342aa5c8afefab53e61d7b5729))
* [TIMOB-27827](https://jira-archive.titaniumsdk.com/TIMOB-27827) - Error reporting is broken after updating to Xcode 11.4 / iOS 13.4 ([3e06680](https://github.com/tidev/titanium-sdk/commit/3e0668000ef1baac5dff3570cf2a36c61ee91d8e))

## Improvements

### Android platform

* [TIMOB-27574](https://jira-archive.titaniumsdk.com/TIMOB-27574) - Replace SDK "build.properties" with gradle generated "BuildConfig" class
* [TIMOB-27745](https://jira-archive.titaniumsdk.com/TIMOB-27745) - Add "google-services.json" support for Firebase ([5422e25](https://github.com/tidev/titanium-sdk/commit/5422e25d415f77e62486d1fde839ebdffb6de523))
* [TIMOB-27755](https://jira-archive.titaniumsdk.com/TIMOB-27755) - Add NDK side-by-side support ([0935163](https://github.com/tidev/titanium-sdk/commit/0935163c97cd247e35b6a6546c49aa4084f9e3ed))
* [TIMOB-27778](https://jira-archive.titaniumsdk.com/TIMOB-27778) - Update gradle build tools to 3.6.x
* improve sdk kroll-apt incremental build times ([558b6ed](https://github.com/tidev/titanium-sdk/commit/558b6ed670dc376811ecda6d26d1aaeffaccadfd))
* build should auto-download NDK if not installed ([6c1a206](https://github.com/tidev/titanium-sdk/commit/6c1a206c6b66de3bf53578be3f0547e2956944c7))

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


# [9.0.0](https://github.com/tidev/titanium-sdk/compare/8_3_X...9.0.0) (2020-02-07)

## About this release

Titanium SDK 9.0.0 is a major release of the SDK, addressing high-priority issues from previous releases; introducing some breaking changes; and removing a number of long-deprecated APIs.

As of this release, Titanium SDK 8.x will not be supported one calendar year (2021-02-07) from 9.0.0's release date.
See [Axway Appcelerator Deprecation Policy](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_deprecation_policy.html) and [Nominal Lifetimes](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_product_lifecycle.html#AxwayAppceleratorProductLifecycle-NominalLifetimes) documents for details.

:warning: With the release of Titanium SDK 9.0.0, we will no longer support Node.js 8.X. Node 10.2.0 will be the new minimum supported version with SDK 9.0.0.

## Community Credits

* Sergey Volkov
    * fix optional parameters on "timers" methods ([8a00014](https://github.com/tidev/titanium-sdk/commit/8a0001478a94c9714f8b9b68e96c96ad1b5db50b))
    * split interface and property definition for console and JSON ([958a6a3](https://github.com/tidev/titanium-sdk/commit/958a6a3dcc086b835ed2c887512bd65c1c9e3ea5))
    * fix Ti.UI.TableView.setData argument ([70c16f7](https://github.com/tidev/titanium-sdk/commit/70c16f7ca213f39791330758489be4f951dfa1ab))
    * fix PickerColumn parent class ([0a55a4b](https://github.com/tidev/titanium-sdk/commit/0a55a4bf37c78fbbac90029acb2941f0a65f74a2))
    * remove duplicate events from Ti.UI.Tab ([f618aeb](https://github.com/tidev/titanium-sdk/commit/f618aeba79bcaae680ccc9adcfcc07c23f8e2f92))
    * fix Ti.UI.iOS.ApplicationShortcuts.getDynamicShortcut ([a841846](https://github.com/tidev/titanium-sdk/commit/a8418468355e9e12393426dfba51c7062625aec4))
    * fix Ti.Platform.openURL parameters ([17f258d](https://github.com/tidev/titanium-sdk/commit/17f258d651b7d0ead72c195f0a35a4a1d67703b5))
    * fix Ti.UI.Slider.value type ([2663d7d](https://github.com/tidev/titanium-sdk/commit/2663d7d052891bf0a72978e2d476e187e3c2c7ba))
    * fix Ti.Media.audioSessionCategory type ([21bca1d](https://github.com/tidev/titanium-sdk/commit/21bca1db38af27deb0199e56322e185b872cefb2))
    * fix type of "services" property ([410aee2](https://github.com/tidev/titanium-sdk/commit/410aee28f9cd33f68f36d19f545f3bb161edfd1f))
    * add missing types for events properties ([5b7732f](https://github.com/tidev/titanium-sdk/commit/5b7732f71a7b50c0572c07abf1df08a74cba0f5a))
    * remove "optional" key from event property ([b1c0967](https://github.com/tidev/titanium-sdk/commit/b1c09673123bd08c2248dba05735623a13f7e060))
    * add missing types for events properties ([76cd92a](https://github.com/tidev/titanium-sdk/commit/76cd92aaa2676ea7568f63e717b56d675fa06b9d))
    * add Ti.UI.View.id property ([b295e63](https://github.com/tidev/titanium-sdk/commit/b295e6321ba38e29612b51d93c1518e87e6fffee))
    * mark as optional property "animated" of AnimationOption ([aee1bdd](https://github.com/tidev/titanium-sdk/commit/aee1bdda2de633df07013e0102aacfbb3c77d6cb))
    * remove duplicate prop "category" from "localnotificationaction" ([163065a](https://github.com/tidev/titanium-sdk/commit/163065a7496702b9e705f7a9f74b84b5e981220b))

* Hans Knöchel
  *  add generated .cxx directory to .gitignore ([37b446c](https://github.com/tidev/titanium-sdk/commit/37b446cbdb439d0d911f403a8514ca6aa562c748))
    * [TIMOB-27441](https://jira-archive.titaniumsdk.com/TIMOB-27441) - do not log Ti.App events ([2c84e30](https://github.com/tidev/titanium-sdk/commit/2c84e3070a8870edb9b1bc1645468d4f82174fe1))

* Giorgio Mandolini
    * webview onlink is now called only on link activated ([aedd2aa](https://github.com/tidev/titanium-sdk/commit/aedd2aa87d4fa2800bb3ed79fa2aeed9cbbd3568))
  
* Michael Gangolf
    * optimize all pngs (#11321) ([e563e28](https://github.com/tidev/titanium-sdk/commit/e563e28d1d2cc558dbfe924c38f5df764fb3fea8))
    * [TIMOB-13286](https://jira-archive.titaniumsdk.com/TIMOB-13286) - add single/doubletap to scrollview ([0326b7e](https://github.com/tidev/titanium-sdk/commit/0326b7eaf2a7c9f003f955cdad10b2b156dff75c))

* David Bankier
    * [TIMOB-23281](https://jira-archive.titaniumsdk.com/TIMOB-23281) - search bar color ignored on ios 13+ ([0aa9b36](https://github.com/tidev/titanium-sdk/commit/0aa9b36065fe63585208412f8f1818253df65778))

* Mathias Lykkegaard Lorenzen
    * make event argument in fireEvent optional ([0250df0](https://github.com/tidev/titanium-sdk/commit/0250df08784e6e9a86a375882de1bf4d675a3bef))



## Bug Fixes

### Android platform

* add extension to encrypted assets ([bf8a6bf](https://github.com/tidev/titanium-sdk/commit/bf8a6bfd3ca17d3389cb6c8fc775886638226093))
* [TIMOB-27606](https://jira-archive.titaniumsdk.com/TIMOB-27606) - amend load app info order ([38ea44b](https://github.com/tidev/titanium-sdk/commit/38ea44b6d577d8836e0a463032598651a6232a01))
* avoid infinite recursion in tab/tabgroup toJSON() ([7280fcc](https://github.com/tidev/titanium-sdk/commit/7280fcc4f187a10ee41a8fa67d9933c9a8217248))
* avoid recursion, properties beginning with _ in toJSON() ([f5b6561](https://github.com/tidev/titanium-sdk/commit/f5b65613add7357ec4b8fccc663ba24cb84dbfb1))
* [TIMOB-27706](https://jira-archive.titaniumsdk.com/TIMOB-27706) - build with uppercase module JAR on case-sensitive system ([8a906c7](https://github.com/tidev/titanium-sdk/commit/8a906c74d46025247e69179699384c983c09020f))
* can't set versionCode in manifest as of 9.0.0 ([a69f6b6](https://github.com/tidev/titanium-sdk/commit/a69f6b6df5bd433306be51b3d86f283573918a32))
* [TIMOB-27633](https://jira-archive.titaniumsdk.com/TIMOB-27633) - clean up module/require code ([612afd7](https://github.com/tidev/titanium-sdk/commit/612afd7e40dc2469d6e35d5fcea65b44d583b0e0))
* [TIMOB-27747](https://jira-archive.titaniumsdk.com/TIMOB-27747) - crash with old "ti.playservices" in 9.0.0 ([c194ecf](https://github.com/tidev/titanium-sdk/commit/c194ecfe06b5fd42b66131d5809f4bee45aaa9f9))
* [TIMOB-27694](https://jira-archive.titaniumsdk.com/TIMOB-27694) - default Ti.Ui.TextField.editable is true in #focus() ([99d08f6](https://github.com/tidev/titanium-sdk/commit/99d08f6ad81b6caa07a43ecbbbfeca45df4a3ed9))
* [TIMOB-27496](https://jira-archive.titaniumsdk.com/TIMOB-27496) - do not modify original ListView proxy ([e75b514](https://github.com/tidev/titanium-sdk/commit/e75b514c1ea0f14a8f1e2e6e91a33502b921e164))
* [TIMOB-25945](https://jira-archive.titaniumsdk.com/TIMOB-25945) - fix losing elevation effect after dimensions change ([f46784b](https://github.com/tidev/titanium-sdk/commit/f46784bb83bf630de23a89e3c53fea4b5940729e))
* fix scroll view's layout resizing with children ([5723b11](https://github.com/tidev/titanium-sdk/commit/5723b11146548fb759092b0db5567b12a151efe4))
* fix support for Java 8 in Kotlin ([2287e83](https://github.com/tidev/titanium-sdk/commit/2287e8379091bc4c492d33245f0e48e4bfc61b8a))
* getCurrentPosition() compatibility with some Samsung devices ([fa5866a](https://github.com/tidev/titanium-sdk/commit/fa5866aa371e7b34e02e4463abf309946eeb2105))
* improve reliability of fused location lib detection ([b8cc24a](https://github.com/tidev/titanium-sdk/commit/b8cc24a7c4974e886d3dc088edf8a8a88d65a6fd))
* location permission not auto-added as of 9.0.0 ([db56070](https://github.com/tidev/titanium-sdk/commit/db56070cd4366142205b9b0b5d9b783fedb313c0))
* [TIMOB-27684](https://jira-archive.titaniumsdk.com/TIMOB-27684) - prevent duplicate launch animation ([135e3dc](https://github.com/tidev/titanium-sdk/commit/135e3dc35e99b0c1f5ced6c91b1fb3b453a25815))
* prevent snapshots from failing build ([40bd1d9](https://github.com/tidev/titanium-sdk/commit/40bd1d92749857a37ebea2fa87c2f064d1775a51))
* remove deprecated contacts methods ([7e0a46a](https://github.com/tidev/titanium-sdk/commit/7e0a46af3bb795193152f2421e5ea924871365f7))
* remove deprecated contacts methods ([7caecb8](https://github.com/tidev/titanium-sdk/commit/7caecb878cf76e89377c55517a7504c72e732925))
* [TIMOB-27602](https://jira-archive.titaniumsdk.com/TIMOB-27602) - softRestart() must account for snapshots ([62a603d](https://github.com/tidev/titanium-sdk/commit/62a603d4edc74109234306ef00b48dfcacdc3c5e))
* specify default inspector context ([c29960d](https://github.com/tidev/titanium-sdk/commit/c29960d41b18923a497ac0468ff0c9e5a216bcc1))
* [TIMOB-27746](https://jira-archive.titaniumsdk.com/TIMOB-27746) [TIMOB-27746](https://jira-archive.titaniumsdk.com/TIMOB-27746) - strip xmlns definitions from child elements in AndroidManifest.xml ([476ac79](https://github.com/tidev/titanium-sdk/commit/476ac79f4d1d090f6b3399ce35adb0cdb2f1c868))
* [TIMOB-27406](https://jira-archive.titaniumsdk.com/TIMOB-27406) - support raw document identifiers ([c2d89d4](https://github.com/tidev/titanium-sdk/commit/c2d89d48cb652b2426e93176d037661487015f4e))
* use correct blob for toImage() ([f07e012](https://github.com/tidev/titanium-sdk/commit/f07e012dd25a626415fe56c339fed803af0ff281))

### iOS platform

* [TIMOB-27623](https://jira-archive.titaniumsdk.com/TIMOB-27623) -  server is receiving two consecutive calls for the same url ([8cdac18](https://github.com/tidev/titanium-sdk/commit/8cdac1898091dd7020d458c4ef66a8d36cb41e7e))
* [TIMOB-27158](https://jira-archive.titaniumsdk.com/TIMOB-27158) -  ui glitch in lazyloading fixed ([c00da08](https://github.com/tidev/titanium-sdk/commit/c00da0812ba07ed6265f999dc397506687d9698f))
* added proper condtion to import MediaPlayer ([3943012](https://github.com/tidev/titanium-sdk/commit/3943012eca4abf9515c6290548203f68f6754fc6))
* [TIMOB-27159](https://jira-archive.titaniumsdk.com/TIMOB-27159) - allow changing WebView read access when loading local file ([dd7b319](https://github.com/tidev/titanium-sdk/commit/dd7b319207277494fb87731a0d0b0232845d7312))
* behaviour of toString function of TiBlob fixed ([e63b30e](https://github.com/tidev/titanium-sdk/commit/e63b30e41d89f23556a48c6a50d5a6635ff5ef89))
* cookies updated while reloading webview ([fc11337](https://github.com/tidev/titanium-sdk/commit/fc1133732d1d33405e0cf693a74e61d5ef7783a3))
* expose TiApp singleton accessor to swift ([495d76c](https://github.com/tidev/titanium-sdk/commit/495d76ce367551e52f0b2779ed856ec0955e3f52))
* [TIMOB-27350](https://jira-archive.titaniumsdk.com/TIMOB-27350) - fix toString() for binary blobs ([c95ddb3](https://github.com/tidev/titanium-sdk/commit/c95ddb3b45b536f193d60065f7c1cef1ebd44491))
* handle when new proxies are created with dictionary arguments ([2c8e2ac](https://github.com/tidev/titanium-sdk/commit/2c8e2ac07e07a49434bded23324d8e7f9492ae8a))
* handle when throwing new obj-c proxy error without subreason ([3e2934b](https://github.com/tidev/titanium-sdk/commit/3e2934bbe5bd74626e0b6e12fd28583373f6bcb4))
* navBar properties not working properly with extendEdges set to Ti.UI.EXTEND_EDGE_TOP ([d673c36](https://github.com/tidev/titanium-sdk/commit/d673c362888de7d0ceda6509ab2a222231d399c8))
* proper macro used for wrapping code ([5bb63c5](https://github.com/tidev/titanium-sdk/commit/5bb63c55229ba1088a3e9d5c5e2e5819ddc70e24))
* remove deprecated contacts methods ([207b4ab](https://github.com/tidev/titanium-sdk/commit/207b4ab2f59c2852c5e0ba1a5068031fe62fb076))
* remove deprecated contacts methods ([e8c4b43](https://github.com/tidev/titanium-sdk/commit/e8c4b436098883767747acf7cb08add04af5d0cc))
* remove deprecated tab blur/focus events ([f5d0bbe](https://github.com/tidev/titanium-sdk/commit/f5d0bbe4b681a26259ee206ce420ece9dcda0730))
* remove deprecated tabgroup unselected/selected events ([74f1134](https://github.com/tidev/titanium-sdk/commit/74f1134424d825204b9f445499c783711ceb07a7))
* remove deprecated TextField padding properties ([337ee8f](https://github.com/tidev/titanium-sdk/commit/337ee8fb67110a06ce56e37b0617a196dc9377a5))
* remove deprecated Ti.Media methods ([e8fff19](https://github.com/tidev/titanium-sdk/commit/e8fff19fd1cd4b07498e8cdd39b481e70f3a1662))
* remove deprecated Ti.Media methods ([b3bd05e](https://github.com/tidev/titanium-sdk/commit/b3bd05ea6fb2d60ce2591f0bbf7714442384344d))
* remove deprecated UI appearance properties ([b8c1f84](https://github.com/tidev/titanium-sdk/commit/b8c1f845e964a03b3fbb0c6236bc6411efba616a))
* remove references to Ti.Contacts methods that are removed ([440e9cc](https://github.com/tidev/titanium-sdk/commit/440e9ccb720be9ac5096749ad13d44a09107e5cf))
* [TIMOB-27480](https://jira-archive.titaniumsdk.com/TIMOB-27480) - setting last index of tabbedBar after initialization not work ([5fbe782](https://github.com/tidev/titanium-sdk/commit/5fbe78276e04049874e13bcc0a3874593f27254e))
* status bar background color crash fix ios13 ([b999f27](https://github.com/tidev/titanium-sdk/commit/b999f2716088d221bc9e146233cbb559776ad4df))
* statusbar ui issue fixed ([6a5664b](https://github.com/tidev/titanium-sdk/commit/6a5664bf92657ee31d478529ab42df67471abc7c))
* tintColor not working for TabbedBar in  iOS 13 ([ec6fbf6](https://github.com/tidev/titanium-sdk/commit/ec6fbf624e27ac4f7c798bf7d93966ff74a930d7))
* [TIMOB-27484](https://jira-archive.titaniumsdk.com/TIMOB-27484) - update to core-js 3 ([ffa4cef](https://github.com/tidev/titanium-sdk/commit/ffa4cefa7c6f3ec1b33963cbee3eecd3e6b07ab0))
* [TIMOB-27630](https://jira-archive.titaniumsdk.com/TIMOB-27630) - use correct target for transpiling on ios ([c4a998a](https://github.com/tidev/titanium-sdk/commit/c4a998ad8442737afa957deee4e1cc2e938fca57))
* when firing events to new proxies, fill in type/source ([e56abfc](https://github.com/tidev/titanium-sdk/commit/e56abfca2705c71e88acbd2ff946a176a4df4e38))


## Features

### Multiple platforms

* use babel-plugin-transform-titanium when transpiling ([c21f77c](https://github.com/tidev/titanium-sdk/commit/c21f77cec7773b8d925fd801235ce87531c7af9b))

### Android platform

* [TIMOB-26434](https://jira-archive.titaniumsdk.com/TIMOB-26434) - added app-bundle support ([5d93fea](https://github.com/tidev/titanium-sdk/commit/5d93fea7d73b59c510e730167508f789932f3fa2))
* [TIMOB-27686](https://jira-archive.titaniumsdk.com/TIMOB-27686) - allow gradle to automatically download missing dependencies ([57a6b49](https://github.com/tidev/titanium-sdk/commit/57a6b4952a192b6b52f4f8bddef43c126c52a5e3))
* [TIMOB-27718](https://jira-archive.titaniumsdk.com/TIMOB-27718) - log build warnings if res files have invalid names ([e7df669](https://github.com/tidev/titanium-sdk/commit/e7df669db667e1aaf22b57d84b0a2bad8750783b))
* [TIMOB-27696](https://jira-archive.titaniumsdk.com/TIMOB-27696) - replace Support libraries with AndroidX ([0558c28](https://github.com/tidev/titanium-sdk/commit/0558c28b54dfb195d7a5c22851060e416e9811f8))
* target Java8 and Kotlin support for native modules ([5ce5e72](https://github.com/tidev/titanium-sdk/commit/5ce5e72b3a90803fc4b54555cd0e8b900c756d9e))
* [TIMOB-27685](https://jira-archive.titaniumsdk.com/TIMOB-27685) [TIMOB-27298](https://jira-archive.titaniumsdk.com/TIMOB-27298) [TIMOB-27297](https://jira-archive.titaniumsdk.com/TIMOB-27297) - update hyperloop for gradle ([13f78c4](https://github.com/tidev/titanium-sdk/commit/13f78c4a3023ba997e55267b70c039e1331af682))
* Update V8 to 7.8.279.23 ([9006b4d](https://github.com/tidev/titanium-sdk/commit/9006b4d58b8fc827545e7fcbc5ff740bf49fe939))

### iOS platform

* [TIMOB-25847](https://jira-archive.titaniumsdk.com/TIMOB-25847) - support font scaling for custom fonts ([8045620](https://github.com/tidev/titanium-sdk/commit/8045620c933c007d77079e87beeeadddcc0f93f6))


## BREAKING CHANGES

### Multiple platforms

* [TIMOB-27605](https://jira-archive.titaniumsdk.com/TIMOB-27605) - Removal of Node 8 support, move to Node 10.13+ ([f35cf0e](https://github.com/tidev/titanium-sdk/commit/f35cf0ebfc880d0161f65ca075fdd275a2ecb824))
* [TIMOB-27650](https://jira-archive.titaniumsdk.com/TIMOB-27650) - Remove ti.touchid and ti.safaridialog from the SDK distribution
* [TIMOB-25578](https://jira-archive.titaniumsdk.com/TIMOB-25578) - Ti.Geoclocation.reverseGeocoder now uses consistent properties postalCode (in place of zipcode) and countryCode (in place of country_code) ([3d32e33](https://github.com/tidev/titanium-sdk/commit/3d32e334987e67967c9ef0b513fe88b220ac9e19))


### Android platform

* Removed Ti.Contacts requestAuthorization method (in favor of requestContactsPermissions)
* Removed Ti.Contacts getPersonByID method (in favor of getPersonByIdentifier)
* Removed the create, destroy, pause, restart, resume, start, and stop events on Ti.Android.Activity (use callback properties) ([0221467](https://github.com/tidev/titanium-sdk/commit/02214671f1897371b12894e6e8e5654b67697e6d))
* Removed the Ti.UI.Webview onStopBlacklistedUrl event. Please use blacklisturl event instead ([85b32d8](https://github.com/tidev/titanium-sdk/commit/85b32d8b110b56e1d6d8b14276a9f254a8d5f00d))
* Removed deprecated Ti.UI.Window.android:* events ([f01055c](https://github.com/tidev/titanium-sdk/commit/f01055c5038b2da748e3aaecc5819ebcc09abb98))
* Removed deprecated webview error event properties: errorCode and message ([5144ac9](https://github.com/tidev/titanium-sdk/commit/5144ac9646fd9b4ce4e9685238cbcd8de793943f))
* Removed deprecated tcp error callback errorCode property ([7e405aa](https://github.com/tidev/titanium-sdk/commit/7e405aa9449554c81d1014666c57d8497541161a))
* Removed deprecated stream callback properties ([4b48db8](https://github.com/tidev/titanium-sdk/commit/4b48db872f7389218072a07c8734781cc41e7bcb))
* Removed the LINKIFY_* constants living in Android namespace ([7c88912](https://github.com/tidev/titanium-sdk/commit/7c88912487fbc9aa84b73e324f8eda25540aa148))


### iOS platform

* [TIMOB-27497](https://jira-archive.titaniumsdk.com/TIMOB-27497) -  Drops support for Xcode 8. Please use Xcode 9+ ([d5ede39](https://github.com/tidev/titanium-sdk/commit/d5ede39dfb7023c86bd24932166cb390c8e97b69))
* Removed Ti.UI.TextField paddingLeft and paddingRight properties (in favor of padding.left and padding.right)
* Removed Ti.Media requestAudioPermissions method (in favor of requestAudioRecorderPermissions)
* Removed Ti.Media requestAuthorization and requestCameraAccess methods (in favor of requestAudioRecorderPermissions and requestCameraPermissions)
* Removed Ti.Contacts requestAuthorization method (in favor of requestContactsPermissions)
* Removed Ti.Contacts getGroupByID and getPersonByID methods (in favor of getGroupByIdentifier and getPersonByIdentifier)
* Removed Ti.UI.Tab blur/focus events in favor of selected/unselected
* Removed Ti.UI.TabGroup selected/unselected events in favor of focus/blur
* Removed the BLEND_MODE_* constants on Ti.UI.iOS namespace (use constants on Ti.UI namespace) ([3c2a0ec](https://github.com/tidev/titanium-sdk/commit/3c2a0ec5c9b45c30b918c3a116b252ee3077b9bd))
* Removed Ti.UI.TextArea, Ti.UI.TextField appearance property (in favor of keyboardAppearance)
* Removed deprecated Ti.Media.cameraAuthorizationStatus property ([cbf994e](https://github.com/tidev/titanium-sdk/commit/cbf994e09f30a18afebd5607695d157e88d9caf0))
* Removed deprecated ipad popover properties: height, width, leftNavButton and rightNavButton ([14cd341](https://github.com/tidev/titanium-sdk/commit/14cd341a3922a26d8279e66d8e41aa0ac2686dd4))
* Removed deprecated tcp error callback errorCode property ([6f4814d](https://github.com/tidev/titanium-sdk/commit/6f4814d563b4aa2c854ef5938746b7792e5c01ad))
* Removed deprecated stream callback properties ([f4de7a9](https://github.com/tidev/titanium-sdk/commit/f4de7a9017dab69c0ec92e3b1bd7a675085c7c4a))
* Ti.Network.TCPSocket has been removed, use Ti.Network.Socket.TCP in it's place. ([9647181](https://github.com/tidev/titanium-sdk/commit/9647181250f984db9a70b833486191b9fa52c2ca))
* [TIMOB-27619](https://jira-archive.titaniumsdk.com/TIMOB-27619), [TIMOB-27076](https://jira-archive.titaniumsdk.com/TIMOB-27076) -  Ti.Network.BonjourService methods have become asynchronous. Use optional callback arguments or event listeners to react to results.
* Removed the updateLayout(), startLayout() and finishLayout() methods on Ti.UI.View ([54e2eeb](https://github.com/tidev/titanium-sdk/commit/54e2eeb3ce8a309312efcd9cecd2190493b7704c))


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


## [8.3.1](https://github.com/tidev/titanium-sdk/compare/8_3_0_GA...8.3.1) (2020-01-16)

## About this release

Titanium SDK 8.3.1 is a patch release of the SDK, addressing high-priority issues from previous releases.

As of this GA release, the previous Titanium SDK patch release (8.3.0) is no longer supported. End of support for this version will be 2020-07-16 or until the next patch release. Note: major and minor releases continue to be supported according to their nominal lifetime.
See [Axway Appcelerator Deprecation Policy](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_deprecation_policy.html) and [Nominal Lifetimes](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_product_lifecycle.html#AxwayAppceleratorProductLifecycle-NominalLifetimes) documents for details.

:warning: With the release of Titanium SDK 9.0.0, we will no longer support Node.js 8.X. Node 10.2.0 will be the new minimum supported version with SDK 9.0.0.



## Bug Fixes

### Android platform

* [TIMOB-27694](https://jira-archive.titaniumsdk.com/TIMOB-27694) - default Ti.Ui.TextField.editable is true in #focus() ([243afd0](https://github.com/tidev/titanium-sdk/commit/243afd00e0760f2060e797312942ee65d47b9f5f))
* [TIMOB-25945](https://jira-archive.titaniumsdk.com/TIMOB-25945) - fix losing elevation effect after dimensions change ([4b8b22a](https://github.com/tidev/titanium-sdk/commit/4b8b22a296cab1174917a0a672150f75bcecdcf0))
* [TIMOB-27572](https://jira-archive.titaniumsdk.com/TIMOB-27572) - getCurrentPosition() compatibility with some Samsung devices ([1e832a6](https://github.com/tidev/titanium-sdk/commit/1e832a6720aeddbfeec4442efaf02267bf8e1ca7))

### iOS platform

* [TIMOB-27158](https://jira-archive.titaniumsdk.com/TIMOB-27158) -  ui glitch in lazyloading fixed ([a32f713](https://github.com/tidev/titanium-sdk/commit/a32f71313139e6a75fcc7ad99c284a3b6839c65e))
* [TIMOB-27622](https://jira-archive.titaniumsdk.com/TIMOB-27622) - expose TiApp singleton accessor to swift ([981869a](https://github.com/tidev/titanium-sdk/commit/981869a4d40fa5e1aa8c4e34db2f1a096fc11407))
* [TIMOB-27623](https://jira-archive.titaniumsdk.com/TIMOB-27623) - server is receiving two consecutive calls for the same url and cookies updated while reloading webview ([8646a46](https://github.com/tidev/titanium-sdk/commit/8646a4606dac6ff8d554593708d2b29bb17d4d62))
* [TIMOB-27609](https://jira-archive.titaniumsdk.com/TIMOB-27609) - status bar background color crash fix ios13 ([0e0220c](https://github.com/tidev/titanium-sdk/commit/0e0220c6f349e55763acd28053b7f4ce9e4d01a6))
* [TIMOB-27350](https://jira-archive.titaniumsdk.com/TIMOB-27350) - updated Ti.Blob.toString() behaviour to original ([cbb82a6](https://github.com/tidev/titanium-sdk/commit/cbb82a6a97062b47c7a482f50d221027576215e7))


# [8.3.0](https://github.com/tidev/titanium-sdk/compare/8_2_X...8.3.0) (2019-11-14)

## About this release

Titanium SDK 8.3.0 is a minor release of the SDK, addressing high-priority issues from previous releases.

As of this release, Titanium SDK 8.2.x will not receive updates more than six months after the release of 8.3.0 (2020-05-21). Any needed fixes will be in 8.3.x or later supported releases within the 8.x branch.
See [Axway Appcelerator Deprecation Policy](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_deprecation_policy.html) and [Nominal Lifetimes](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_product_lifecycle.html#AxwayAppceleratorProductLifecycle-NominalLifetimes) documents for details.

:warning: With the release of Titanium SDK 9.0.0, we will no longer support Node.js 8.X. Node 10.2.0 will be the new minimum supported version with SDK 9.0.0.

## Community Credits

* Michael Gangolf
    * fix permission example for Android 8 ([be984a1](https://github.com/tidev/titanium-sdk/commit/be984a177c3c279eaf79f6206dff2aa04ed6b56b))
    * [TIMOB-7786](https://jira-archive.titaniumsdk.com/TIMOB-7786)update log strings ([1fc77a1](https://github.com/tidev/titanium-sdk/commit/1fc77a1a1b2355b3b8bf93dfb332edeceb40e054))
    * reset before doing a release (#10800) ([50c645e](https://github.com/tidev/titanium-sdk/commit/50c645e57f563e8499ff318e23e5dd18f920ecd8))
    * [TIMOB-27283](https://jira-archive.titaniumsdk.com/TIMOB-27283) - add contentSize to Ti.UI.ScrollView scroll event ([6ffd9d4](https://github.com/tidev/titanium-sdk/commit/6ffd9d4ce217839017ef66ccf7bc10e9f494e399))

* Hans Knöchel
    * [TIMOB-27272](https://jira-archive.titaniumsdk.com/TIMOB-27272) - expose Ti.UI.Slider „tintColor“ and „trackTintColor“ ([7238427](https://github.com/tidev/titanium-sdk/commit/723842717199b1244162a7b14a9874ed46103d42))
    * properly set tint-color on image-view ([7d96b81](https://github.com/tidev/titanium-sdk/commit/7d96b8132a8569818c78d656fd13463deceab354))

* Sergey Volkov
    * [TIMOB-26463](https://jira-archive.titaniumsdk.com/TIMOB-26463) - accessibility properties SDK version ([72a57ef](https://github.com/tidev/titanium-sdk/commit/72a57ef247abb0bedb0288260ac300385cb3d518))
    * [TIMOB-26463](https://jira-archive.titaniumsdk.com/TIMOB-26463) - add accessibility properties to MenuItem ([9f3c6b7](https://github.com/tidev/titanium-sdk/commit/9f3c6b75c3d71dd65ca7cd33383bc90d3e565d6f))

## Bug Fixes

### Android platform

* allow requestLegacyExternalStorage attribute ([097c5af](https://github.com/tidev/titanium-sdk/commit/097c5af442fdd278db87246fbd8640460f23e6ca))
* call WebView.stopLoading() from main thread ([438a43a](https://github.com/tidev/titanium-sdk/commit/438a43a9ec8d244f358af347b44bb7bb0d28fc5b))
* exclude JS in HTML files from processing ([bc45db4](https://github.com/tidev/titanium-sdk/commit/bc45db4d43dc763282b5bf6a6710be362c205b82))
* fix dialog without selectedIndex reusage ([a2a048f](https://github.com/tidev/titanium-sdk/commit/a2a048fda702bfaee61e2e0f6f9dc85aed9983f5))
* [TIMOB-27238](https://jira-archive.titaniumsdk.com/TIMOB-27238) - fix onlink callback being creation only ([3a46b79](https://github.com/tidev/titanium-sdk/commit/3a46b793111f054cf78babad6c9e2c5fcdaca4e7))
* fix reusing a dialog with a new "parent" window ([a8d06c3](https://github.com/tidev/titanium-sdk/commit/a8d06c35a02d77698ac6fca71e7f118e19108906))
* fix views with border and transparency ([95fed44](https://github.com/tidev/titanium-sdk/commit/95fed440df6051018c73d17e01a0649af820b317))
* fixes background color animation with borders ([86b3699](https://github.com/tidev/titanium-sdk/commit/86b3699667d89077e38f7ebf60aaef867ff95b7e))
* focus on TextInputEditText view ([8192ea2](https://github.com/tidev/titanium-sdk/commit/8192ea2ef626a427d9599324d9c00d8eec785793))
* [TIMOB-27302](https://jira-archive.titaniumsdk.com/TIMOB-27302) - guard for tab counts limit for bottom style ([6a2aa4d](https://github.com/tidev/titanium-sdk/commit/6a2aa4d7d5101824741fe79a77ffa2e0e48fe904))
* [TIMOB-27191](https://jira-archive.titaniumsdk.com/TIMOB-27191) - handle file: URIs without // after scheme ([f4cf7c6](https://github.com/tidev/titanium-sdk/commit/f4cf7c6e97fd19f6c7e7141114a78cafb3e1c7e1))
* [TIMOB-27108](https://jira-archive.titaniumsdk.com/TIMOB-27108) - HTTPClient "responseData" blob returns 0 width/height for images over 512kb ([722d6bc](https://github.com/tidev/titanium-sdk/commit/722d6bc04c79b7831f4fa1ae239d7fb54398e75c))
* performance issue with deeply nested views as of 7.5.0 ([057dad3](https://github.com/tidev/titanium-sdk/commit/057dad3a09c6b041d6ce3ca38a76bca2f6254fb3))
* prevent conflict with TextField.isSingleLine() ([20ae5fd](https://github.com/tidev/titanium-sdk/commit/20ae5fde99a0d8d29b7721d15fccd2b3faf88fcf))
* [TIMOB-27118](https://jira-archive.titaniumsdk.com/TIMOB-27118) - prevents TabGroup duplicate close event firing ([34714b8](https://github.com/tidev/titanium-sdk/commit/34714b854c6faf47d85730ca15e02edcdd5b1eb0))
* [TIMOB-27177](https://jira-archive.titaniumsdk.com/TIMOB-27177) - regression where closing root window from child window causes app exit issues as of 8.0.1 ([be7b776](https://github.com/tidev/titanium-sdk/commit/be7b77663bd5312a38b025ef70d6870312060d2d))
* release string ([0e21a4f](https://github.com/tidev/titanium-sdk/commit/0e21a4f634008eaffd0b0263d5740fcfdc84fcf0))
* [TIMOB-27271](https://jira-archive.titaniumsdk.com/TIMOB-27271) - resuming with intent "FLAG_ACTIVITY_MULTIPLE_TASK" can hang the app ([632c439](https://github.com/tidev/titanium-sdk/commit/632c4398bc71c56be81ffff47422b5686fbb14d1))
* support Geolocation altitudeAccuracy ([ac32e75](https://github.com/tidev/titanium-sdk/commit/ac32e75de7cd7d7c2ab23e539ca223800129d13f))
* ui module dependency path ([3b9bac8](https://github.com/tidev/titanium-sdk/commit/3b9bac8db0f802825c6ff32848cc4289a3551168))
* [TIMOB-27190](https://jira-archive.titaniumsdk.com/TIMOB-27190) - up button flickering when clicked in NavigationWindow ([69dfda5](https://github.com/tidev/titanium-sdk/commit/69dfda5ef5eba65df20cbe979d0bfa912bd4aaa6))
* [TIMOB-27314](https://jira-archive.titaniumsdk.com/TIMOB-27314) - update titanium_prep windows binaries ([978d625](https://github.com/tidev/titanium-sdk/commit/978d625b7b1fb730b53ba8c15929f64b868e91d8))
* [TIMOB-27193](https://jira-archive.titaniumsdk.com/TIMOB-27193) - use specified Ti.Filesystem.File path to createFile() ([37aace6](https://github.com/tidev/titanium-sdk/commit/37aace6017ec9a4b4ca49aff192c27a64c01e7bd))

### Multiple platforms

* Change from ifdef to if due to variable always being defined ([da45e5f](https://github.com/tidev/titanium-sdk/commit/da45e5f84f348cfb0dde1911dc7b14a0455a133e))
* disable bigint type checks ([cbb8165](https://github.com/tidev/titanium-sdk/commit/cbb81651ffd9c0f54a1d487888523c446d3f69c3))
* fix typo and add tests for weak map/set ([bc9faba](https://github.com/tidev/titanium-sdk/commit/bc9faba2f5a8ee7ba1a5470399f66a17a7846346))
* rename isRegexp usage to isRegExp ([8c1e265](https://github.com/tidev/titanium-sdk/commit/8c1e265c88270436476668074d3b0ab7c7d8c7d7))
* update Hyperloop to v4.0.4 for iOS 13 compatibility ([d1cc406](https://github.com/tidev/titanium-sdk/commit/d1cc406abd29662e4e6e1b674caa95a73e8dc95f))
* use correct should assertion syntax ([00b9845](https://github.com/tidev/titanium-sdk/commit/00b98453cf948338fba3986def6cfc057e105508))

### iOS platform

* added xcworkspacedata file generation ([75f3881](https://github.com/tidev/titanium-sdk/commit/75f388128a5f6b9035e1c205ff57cd025995eae2))
* [TIMOB-27403](https://jira-archive.titaniumsdk.com/TIMOB-27403) - also lookup semnantic colors in correct location for classic ([8ecfb1e](https://github.com/tidev/titanium-sdk/commit/8ecfb1e95397c7257c5f2ec71446b2ecb2a3e7fe))
* app crashes when error happens in fetching location ([6100379](https://github.com/tidev/titanium-sdk/commit/610037935b92cb26760b2cafdd5e7711b5bfc51d))
* [TIMOB-26453](https://jira-archive.titaniumsdk.com/TIMOB-26453) - can not show fullscreen modal windows anymore ([1e3d161](https://github.com/tidev/titanium-sdk/commit/1e3d161928136583d8d997b6bb629a495d1c8feb))
* close window handling from presentationController’s delegate method ([40154d7](https://github.com/tidev/titanium-sdk/commit/40154d7b68053f68593c804eacd5221a92b43edd))
* console.log does not log properly if it has multiple arguments ([a57701d](https://github.com/tidev/titanium-sdk/commit/a57701dafdc34e65470cb3921cc9302c5273dcd4))
* [TIMOB-27386](https://jira-archive.titaniumsdk.com/TIMOB-27386) - correctly decode device token for ios 13 compatability ([715ef61](https://github.com/tidev/titanium-sdk/commit/715ef612ac3bfe6ece73bdfd8dc80b4fe4867765))
* fix TiBase header to order macros properly, re-use macros ([ef26648](https://github.com/tidev/titanium-sdk/commit/ef266481f9588bf74dac4fd9e770eb1940f368a9))
* [TIMOB-27354](https://jira-archive.titaniumsdk.com/TIMOB-27354) - guard source property and removed NSNull if it is nil ([80cb018](https://github.com/tidev/titanium-sdk/commit/80cb01890f32a94df07b702ce133a21db551455d))
* hide dimming view ([3d492b7](https://github.com/tidev/titanium-sdk/commit/3d492b727d37548732d13afb8d43da527611fcfd))
* hideShadow handling for iOS 13 ([3b925d3](https://github.com/tidev/titanium-sdk/commit/3b925d3b89e0d59bf89b846bfa127e9656746dbf))
* [TIMOB-27395](https://jira-archive.titaniumsdk.com/TIMOB-27395) - include new iphone models into os extension ([b3a720a](https://github.com/tidev/titanium-sdk/commit/b3a720a415e577d1a93f5d49b3ad4498bdd67a53))
* non large title navigation bars show default navigation bar ([11aef9c](https://github.com/tidev/titanium-sdk/commit/11aef9cc1069c395e8f9a45570633e40dd80f76e))
* remove additional gc protection once proxy is remembered ([2ac7d80](https://github.com/tidev/titanium-sdk/commit/2ac7d80fba4418ddd0187b1b22c9f49b1ede2930))
* select a valid ios sim xcodebuild destination ([65527be](https://github.com/tidev/titanium-sdk/commit/65527be0e66071b53a35f5eee80bbc64caad1928))
* sf symbol handling for application shortcut ([28907e0](https://github.com/tidev/titanium-sdk/commit/28907e0c3808ca019ee02cdc167d6ef4314f0b0b))
* [MOD-2542](https://jira-archive.titaniumsdk.com/MOD-2542) - update ti.applesigning module to 1.1.1 ([1571e40](https://github.com/tidev/titanium-sdk/commit/1571e400817a89101360ffcc5e97868708e3da1c))
* verify module class type ([3b12015](https://github.com/tidev/titanium-sdk/commit/3b120151ade168e4ffacc58534fd09d5e8881ef2))
* volume event handling ([c697822](https://github.com/tidev/titanium-sdk/commit/c6978221163cb9a628859b39042fa697b6065471))


## Features

### Android platform

* add new constants for video scaling ([16f04c5](https://github.com/tidev/titanium-sdk/commit/16f04c5a2437a948b6cbd3895421035a4c180983))
* [TIMOB-26542](https://jira-archive.titaniumsdk.com/TIMOB-26542) - Added Ti.App "close" event support ([44a5968](https://github.com/tidev/titanium-sdk/commit/44a596834c3be1f2c4725461901584a195e861ba))
* [TIMOB-26953](https://jira-archive.titaniumsdk.com/TIMOB-26953) - implement foregroundServiceType parameter ([9ca5864](https://github.com/tidev/titanium-sdk/commit/9ca5864439e2b1c2e4e3ff71db983938adb313b7))
* target api level 29 by default ([4d73a63](https://github.com/tidev/titanium-sdk/commit/4d73a63e9562b25a26c1015278d4bd13b798a80e))

### Multiple platforms

* add method to convert Buffer to Ti.Buffer ([32da366](https://github.com/tidev/titanium-sdk/commit/32da366fd1b2bc1b62de6ffdab77305ffd9ed590))
* [TIMOB-18583](https://jira-archive.titaniumsdk.com/TIMOB-18583) - node compatible fs module ([74d07c1](https://github.com/tidev/titanium-sdk/commit/74d07c1d26eda73397a2c1805425ee0b376ea541))
* [TIMOB-27286](https://jira-archive.titaniumsdk.com/TIMOB-27286) - add string_decoder module ([4c5ac3d](https://github.com/tidev/titanium-sdk/commit/4c5ac3df760c2cfe9b244374582ab329b8f90fd3))
* node 12 compatible util module and improved console ([7f19662](https://github.com/tidev/titanium-sdk/commit/7f19662607d0aae7a43a3e4de79d591889c9b659))
* [MOD-2545](https://jira-archive.titaniumsdk.com/MOD-2545) - update to 3.3.0-ios, 4.5.0-android module releases ([d0f0cb9](https://github.com/tidev/titanium-sdk/commit/d0f0cb98eb768aee5b90753971246f6070ab5b71))
* add custom inspect behavior for buffers ([1feaf6d](https://github.com/tidev/titanium-sdk/commit/1feaf6d272f7d4b0ee69be123c43ab3cd94bd119))
* enable color mode for inspect ([78a15ec](https://github.com/tidev/titanium-sdk/commit/78a15ecbdb881de1a7d5ceb68c2d7ba616546aa8))

### iOS platform

* [MOD-2534](https://jira-archive.titaniumsdk.com/MOD-2534) - update facebook module to 7.0.0 ([16f4d19](https://github.com/tidev/titanium-sdk/commit/16f4d190c1c5bbf02d07f8e528ab6c019addb15e))


## [8.2.1](https://github.com/tidev/titanium-sdk/compare/8_2_0_GA...8.2.1) (2019-10-23)

## About this release

Titanium SDK 8.2.1 is a patch release of the SDK, addressing high-priority issues from previous releases.

As of this GA release, the previous Titanium SDK patch release (8.2.0) is no longer supported. End of support for this version will be 2020-04-23 or until the next patch release. Note: major and minor releases continue to be supported according to their nominal lifetime.
See [Axway Appcelerator Deprecation Policy](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_deprecation_policy.html) and [Nominal Lifetimes](https://docs.axway.com/bundle/AMPLIFY_Appcelerator_Services_Overview_allOS_en/page/axway_appcelerator_product_lifecycle.html#AxwayAppceleratorProductLifecycle-NominalLifetimes) documents for details.

:warning: With the release of Titanium SDK 9.0.0, we will no longer support Node.js 8.X. Node 10.2.0 will be the new minimum supported version with SDK 9.0.0.

## Community Credits

* teunklijn
    * [TIMOB-27165](https://jira-archive.titaniumsdk.com/TIMOB-27165) - localnotificationaction event contains notification id instead of the action id ([3a42ee4](https://github.com/tidev/titanium-sdk/commit/3a42ee478fd387db28e23c761527720d23c3ffea))


## Bug Fixes

### Android platform

* [TIMOB-27434](https://jira-archive.titaniumsdk.com/TIMOB-27434) - performance issue with deeply nested views as of 7.5.0 ([38dc352](https://github.com/tidev/titanium-sdk/commit/38dc3523699fe3e1e81162aa564658365fd23126))

### Multiple platforms

* focus on TextInputEditText view ([433762a](https://github.com/tidev/titanium-sdk/commit/433762ae6d8ee0bf6ded8b057aac9faf296f940d))
* sf symbol handling for application shortcut ([b1d6ce0](https://github.com/tidev/titanium-sdk/commit/b1d6ce01a164e8a7d23edae8ba22d0f788a87716))

### iOS platform

* added xcworkspacedata file generation ([c32f363](https://github.com/tidev/titanium-sdk/commit/c32f3637bcc18efa83245b2b692caee3a9e47bdf))
* [TIMOB-27403](https://jira-archive.titaniumsdk.com/TIMOB-27403) - also lookup semnantic colors in correct location for classic ([df39a91](https://github.com/tidev/titanium-sdk/commit/df39a91fd4586f9e3dbcb12a70e607944b1128df))
* [TIMOB-27453](https://jira-archive.titaniumsdk.com/TIMOB-27453) - can not show fullscreen modal windows anymore ([a341c1b](https://github.com/tidev/titanium-sdk/commit/a341c1b2c317b34aab17875d4145cc86321c6d51))
* close window handling from presentationController’s delegate method ([5fbec83](https://github.com/tidev/titanium-sdk/commit/5fbec83408a7753f0a95119197d5f7d80e218b37))
* fix TiBase header to order macros properly, re-use macros ([94d29f2](https://github.com/tidev/titanium-sdk/commit/94d29f21e87053e90f54102db8d92b5ef2ae170e))
* [TIMOB-27354](https://jira-archive.titaniumsdk.com/TIMOB-27354) - guard source property and removed NSNull if it is nil ([44074a8](https://github.com/tidev/titanium-sdk/commit/44074a80683cb91ca3e7433fd066ad4f6a0f8f69))
* hide dimming view ([4c07280](https://github.com/tidev/titanium-sdk/commit/4c07280a094c25c7b622d9ad0a9cdf9005b60ea2))
* [TIMOB-27413](https://jira-archive.titaniumsdk.com/TIMOB-27413) - hideShadow handling for iOS 13 ([c6a4ba7](https://github.com/tidev/titanium-sdk/commit/c6a4ba78c83aea52877c77becc583ad4e47ba7de))
* properly set tint-color on image-view ([1a47522](https://github.com/tidev/titanium-sdk/commit/1a4752270427cf0be5a40ecde564e21b2bdd18d2))
* remove additional gc protection once proxy is remembered ([dfd5a02](https://github.com/tidev/titanium-sdk/commit/dfd5a02103a0519f6bcc842c4f729e918959a438))
* select a valid ios sim xcodebuild destination [backport] ([65cd2e5](https://github.com/tidev/titanium-sdk/commit/65cd2e57ed605917016c71a018ad7cb203a1c247))
* [TIMOB-27419](https://jira-archive.titaniumsdk.com/TIMOB-27419) - support new property to remove note ([8f1b2a6](https://github.com/tidev/titanium-sdk/commit/8f1b2a6385b4839ae99b38897426c3a12ef76db9))
* [MOD-2542](https://jira-archive.titaniumsdk.com/MOD-2542) - update ti.applesigning module to 1.1.1 ([51ea381](https://github.com/tidev/titanium-sdk/commit/51ea3817cef54b24b1e8cae1d0118195e4cb406d))
* volume event handling ([6d4e417](https://github.com/tidev/titanium-sdk/commit/6d4e41741329d73b9bcd145b82924843b2a4b48d))


## Features

### Multiple platforms

* [MOD-2545](https://jira-archive.titaniumsdk.com/MOD-2545) - update to 3.3.0-ios, 4.5.0-android module releases ([e1156a0](https://github.com/tidev/titanium-sdk/commit/e1156a09c06a902826c03a5b3ffc2ef31e3c0811))


