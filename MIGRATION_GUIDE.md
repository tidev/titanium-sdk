# MIGRATION GUIDE

This guide is intended to give a very high-level listing of APIs removed in major releases and the replacement API or notes.

- [MIGRATION GUIDE](#migration-guide)
	- [10.0.0](#1000)
	- [9.0.0](#900)
	- [8.2.0](#820)
	- [8.1.0](#810)
	- [8.0.0](#800)
	- [7.0.0](#700)
	- [6.0.0](#600)

## 10.0.0

The following APIs were removed in 10.0.0:

| Removed API | Notes / Replacement |
|-------------|---------------------|
| `Ti.Android.PENDING_INTENT_FOR_ACTIVITY` | No longer used. |
| `Ti.Android.PENDING_INTENT_FOR_BROADCAST` | No longer used. |
| `Ti.Android.PENDING_INTENT_FOR_SERVICE` |  No longer used. |
| `Ti.Android.PENDING_INTENT_MAX_VALUE` |  No longer used. |
| `Ti.Android.Intent#getData()` | Use the `Ti.Android.Intent.data` property instead. |
| `Ti.Android.MenuItem#setCheckable()` | Use the `Ti.Android.MenuItem.checkable` property instead. |
| `Ti.Android.MenuItem#setChecked()` | Use the `Ti.Android.MenuItem.checked` property instead. |
| `Ti.Android.MenuItem#setEnabled()` | Use the `Ti.Android.MenuItem.enabled` property instead. |
| `Ti.Android.MenuItem#setVisible()` | Use the `Ti.Android.MenuItem.visible` property instead. |
| `Ti.Media.AudioPlayer#getPaused()` | Use the cross-platform API `Ti.Media.AudioPlayer.paused` property instead. |
| `Ti.Media.AudioPlayer#isPaused()` | Use the cross-platform API `Ti.Media.AudioPlayer.paused` property instead. |
| `Ti.Media.AudioPlayer#getPlaying()` | Use the cross-platform API `Ti.Media.AudioPlayer.playing` property instead. |
| `Ti.Media.AudioPlayer#isPlaying()` | Use the cross-platform API `Ti.Media.AudioPlayer.playing` property instead. |
| `Ti.Media.AudioPlayer#setPaused()` | Use the cross-platform API `Ti.Media.AudioPlayer.pause` instead. |
| `Ti.Media#hasAudioPermissions()` | Use `Ti.Media.hasAudioRecorderPermissions` instead. |
| `PreviewImageError.message` | Use `error` property instead |
| `Ti.Media.Sound.error.message` | Use the `error` property instead |
| `Ti.Media.VideoPlayer.error.message` | Use `error` property instead |
| `Ti.Network.HTTPClient#setTimeout()` | Use the `Ti.Network.HTTPClient.timeout` property instead. |
| `Ti.UI.iOS.NavigationWindow` | Use `Ti.UI.NavigationWindow` instead. |
| `Ti.UI.iOS.TabbedBar` | Use `Ti.UI.TabbedBar` instead. |
| `Ti.UI.iOS.Toolbar` | Use the cross-platform `Ti.UI.Toolbar` instead. |
| `Ti.UI.TabGroup#getActiveTab()` | Use the `Ti.UI.TabGroup.activeTab` property instead. |
| `Ti.UI.TabGroup#setActiveTab()` | Use the `Ti.UI.TabGroup.activeTab` property instead. |
| `Ti.UI.TabGroup#getTabs()` | Use the `Ti.UI.TabGroup.tabs` property instead. |
| `Ti.UI.TableView#setHeaderPullView()` | Use the `Ti.UI.TableView.headerPullView` property instead. |

## 9.0.0

The following APIs were removed in 9.0.0:

| Removed API | Notes / Replacement |
|-------------|---------------------|
| `Ti.Android.Activity.create` | Use the `Ti.Android.Activity.onCreate` callback property instead. |
| `Ti.Android.Activity.destroy` | Use the `Ti.Android.Activity.onDestroy` callback property instead. |
| `Ti.Android.Activity.pause` | Use the `Ti.Android.Activity.onPause` callback property instead. |
| `Ti.Android.Activity.restart` | Use the `Ti.Android.Activity.onRestart` callback property instead. |
| `Ti.Android.Activity.resume` | Use the `Ti.Android.Activity.onResume` callback property instead. |
| `Ti.Android.Activity.start` | Use the `Ti.Android.Activity.onStart` callback property instead. |
| `Ti.Android.Activity.stop` | Use the `Ti.Android.Activity.onStop` callback property instead. |
| `Ti.Contacts#getGroupByID()` | Use the `Ti.Contacts#getGroupByIdentifier()` method instead. |
| `Ti.Contacts#getPersonByID()` | Use the `Ti.Contacts#getPersonByIdentifier()` method instead. |
| `Ti.Contacts#requestAuthorization()` | Use the `Ti.Contacts#requestContactsPermissions()` method instead. |
| `Ti.Geolocation#reverseGeocoder()` response: `GeocodedAddress.zipcode` | Use the `postalCode` property for parity. |
| `Ti.Geolocation#reverseGeocoder()` response: `GeocodedAddress.country_code` | Use the `countryCode` property for parity. |
| `Ti.Geolocation#reverseGeocoder()` response: `GeocodedAddress.displayAddress` | Use the `address` property for parity. |
| `Ti.Media#requestCameraAccess()` | Please use the `Ti.Media#requestCameraPermissions()` method instead. |
| `Ti.Media#requestAuthorization()` | Use the `Ti.Media.requestAudioRecorderPermissions()` method instead. |
| `Ti.Media#requestAudioPermissions()` | Use the `Ti.Media.requestAudioRecorderPermissions()` method instead. |
| `Ti.Network#createTCPSocket()` | Use the `Ti.Network.Socket#createTCP()` method instead. |
| `Ti.Network.READ_MODE` | Used with the deprecated `Ti.Network.TCPSocket` type only. |
| `Ti.Network.READ_WRITE_MODE` | Used with the deprecated `Ti.Network.TCPSocket` type only. |
| `Ti.Network.SOCKET_LISTENING` | Used with the deprecated `Ti.Network.TCPSocket` type only. |
| `Ti.Network.WRITE_MODE` | Used with the deprecated `Ti.Network.TCPSocket` type only. |
| `ErrorCallbackArgs.errorCode` | Use the `code` property for a numeric error code |
| `Ti.Network.TCPSocket` | Use the `Ti.Network.Socket.TCP` where possible. |
| `Ti.Stream#read()` callback: `ReadCallbackArgs.errorState` | Use the `success` or `code` property values to determine error conditions. |
| `Ti.Stream#read()` callback: `ReadCallbackArgs.errorDescription` | Use the `error` property to determine the error message. |
| `Ti.Stream#write()` callback: `WriteCallbackArgs.errorState` | Use the `success` or `code` property values to determine error conditions. |
| `Ti.Stream#write()` callback: `WriteCallbackArgs.errorDescription` | Use the `error` property to determine the error message. |
| `Ti.Stream#writeStream()` callback: `WriteStreamCallbackArgs.errorState` | Use the `success` or `code` values to determine error conditions. |
| `Ti.Stream#writeStream()` callback: `WriteStreamCallbackArgs.errorDescription` | Use the `error` property to determine the error message. |
| `Ti.Stream#pump()` callback: `PumpCallbackArgs.errorState` | Use the `success` or `code` property values to determine error conditions. |
| `Ti.Stream#pump()` callback: `PumpCallbackArgs.errorDescription` | Use the `error` property to determine the error message. |
| `Ti.UI.Android.LINKIFY_ALL` | Use the `Ti.UI.AUTOLINK_ALL` constant instead. |
| `Ti.UI.Android.LINKIFY_EMAIL_ADDRESSES` | Use the `Ti.UI.AUTOLINK_EMAIL_ADDRESSES` constant instead. |
| `Ti.UI.Android.LINKIFY_MAP_ADDRESSES` | Use the `Ti.UI.AUTOLINK_MAP_ADDRESSES` constant instead. |
| `Ti.UI.Android.LINKIFY_PHONE_NUMBERS` | Use the `Ti.UI.AUTOLINK_PHONE_NUMBERS` constant instead. |
| `Ti.UI.Android.LINKIFY_WEB_URLS` | Use the `Ti.UI.AUTOLINK_URLS` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_CLEAR` | Use the `Ti.UI.BLEND_MODE_CLEAR` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_COLOR` | Use the `Ti.UI.BLEND_MODE_COLOR` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_COLOR_BURN` | Use the `Ti.UI.BLEND_MODE_COLOR_BURN` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_COLOR_DODGE` | Use the `Ti.UI.BLEND_MODE_COLOR_DODGE` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_COPY` | Use the `Ti.UI.BLEND_MODE_COPY` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_DARKEN` | Use the `Ti.UI.BLEND_MODE_DARKEN` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_DESTINATION_ATOP` | Use the `Ti.UI.BLEND_MODE_DESTINATION_ATOP` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_DESTINATION_IN` | Use the `Ti.UI.BLEND_MODE_DESTINATION_IN` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_DESTINATION_OUT` | Use the `Ti.UI.BLEND_MODE_DESTINATION_OUT` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_DESTINATION_OVER` | Use the `Ti.UI.BLEND_MODE_DESTINATION_OVER` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_DIFFERENCE` | Use the `Ti.UI.BLEND_MODE_DIFFERENCE` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_EXCLUSION` | Use the `Ti.UI.BLEND_MODE_EXCLUSION` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_HARD_LIGHT` | Use the `Ti.UI.BLEND_MODE_HARD_LIGHT` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_HUE` | Use the `Ti.UI.BLEND_MODE_HUE` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_LIGHTEN` | Use the `Ti.UI.BLEND_MODE_LIGHTEN` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_LUMINOSITY` | Use the `Ti.UI.BLEND_MODE_LUMINOSITY` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_MULTIPLY` | Use the `Ti.UI.BLEND_MODE_MULTIPLY` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_NORMAL` | Use the `Ti.UI.BLEND_MODE_NORMAL` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_OVERLAY` | Use the `Ti.UI.BLEND_MODE_OVERLAY` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_PLUS_DARKER` | Use the `Ti.UI.BLEND_MODE_PLUS_DARKER` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_PLUS_LIGHTER` | Use the `Ti.UI.BLEND_MODE_PLUS_LIGHTER` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_SATURATION` | Use the `Ti.UI.BLEND_MODE_SATURATION` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_SCREEN` | Use the `Ti.UI.BLEND_MODE_SCREEN` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_SOFT_LIGHT` | Use the `Ti.UI.BLEND_MODE_SOFT_LIGHT` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_SOURCE_ATOP` | Use the `Ti.UI.BLEND_MODE_SOURCE_ATOP` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_SOURCE_IN` | Use the `Ti.UI.BLEND_MODE_SOURCE_IN` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_SOURCE_OUT` | Use the `Ti.UI.BLEND_MODE_SOURCE_OUT` constant instead. |
| `Ti.UI.iOS.BLEND_MODE_XOR` | Use the `Ti.UI.BLEND_MODE_XOR` constant instead. |
| `Ti.UI.iPad.Popover.height` | Set the height on the `Ti.UI.iPad.Popover.contentView` property instead. |
| `Ti.UI.iPad.Popover.width` | Set the width on the `Ti.UI.iPad.Popover.contentView` property instead. |
| `Ti.UI.Tab.blur` | Use the `Ti.UI.Tab.unselected` event instead. |
| `Ti.UI.Tab.focus` | Use the `Ti.UI.Tab.selected` event instead. |
| `Ti.UI.TabGroup.selected` | Use the `Ti.UI.Tab.focus` event instead. |
| `Ti.UI.TabGroup.unselected` | Use the `Ti.UI.Tab.blur` event instead. |
| `Ti.UI.TextArea.appearance` | Use the `Ti.UI.TextArea.keyboardAppearance` property instead. |
| `Ti.UI.TextField.appearance` | Use the `Ti.UI.TextField.keyboardAppearance` property instead. |
| `Ti.UI.TextField.paddingLeft` | Use the `Ti.UI.TextField.padding` property instead. |
| `Ti.UI.TextField.paddingRight` | Use the `Ti.UI.TextField.padding` property instead. |
| `Ti.UI.View#finishLayout()` | Use the `#applyProperties()` method to batch-update layout properties. |
| `Ti.UI.View#startLayout()` | Use the `#applyProperties()` method to batch-update layout properties. |
| `Ti.UI.View#updateLayout()` | Use the `#applyProperties()` method to batch-update layout properties. |
| `Ti.UI.WebView.error.message` | Use the `error` property instead. Removed on ios in 8.0.0. Removed on android in 9.0.0. |
| `Ti.UI.WebView.error.errorCode` | Use the `code` property instead. Removed on ios in 8.0.0. Removed on android in 9.0.0. |
| `Ti.UI.WebView.onStopBlacklistedUrl` | Use the cross-platform `blacklisturl` event instead. |
| `Ti.UI.Window.android:back` | Use the `Ti.UI.Window.androidback` event instead. |
| `Ti.UI.Window.android:camera` | Use the `Ti.UI.Window.androidcamera` event instead. |
| `Ti.UI.Window.android:focus` | Use the `Ti.UI.Window.androidfocus` event instead. |
| `Ti.UI.Window.android:search` | Use the `Ti.UI.Window.androidsearch` event instead. |
| `Ti.UI.Window.android:voldown` | Use the `Ti.UI.Window.androidvoldown` event instead. |
| `Ti.UI.Window.android:volup` | Use the `Ti.UI.Window.androidvolup` event instead. |

## 8.2.0

| Removed API | Notes / Replacement |
|-------------|---------------------|
| `Ti.UI.iOS.WEBVIEW_NAVIGATIONTYPE_LINK_CLICKED` | Not used with Titanium SDK 8.0.0 and later by replacing UIWebView with WKWebView. |
| `Ti.UI.iOS.WEBVIEW_NAVIGATIONTYPE_FORM_SUBMITTED` | Not used with Titanium SDK 8.0.0 and later by replacing UIWebView with WKWebView. |
| `Ti.UI.iOS.WEBVIEW_NAVIGATIONTYPE_BACK_FORWARD` | Not used with Titanium SDK 8.0.0 and later by replacing UIWebView with WKWebView. |
| `Ti.UI.iOS.WEBVIEW_NAVIGATIONTYPE_RELOAD` | Not used with Titanium SDK 8.0.0 and later by replacing UIWebView with WKWebView. |
| `Ti.UI.iOS.WEBVIEW_NAVIGATIONTYPE_FORM_RESUBMITTED` | Not used with Titanium SDK 8.0.0 and later by replacing UIWebView with WKWebView. |
| `Ti.UI.iOS.WEBVIEW_NAVIGATIONTYPE_OTHER` | Not used with Titanium SDK 8.0.0 and later by replacing UIWebView with WKWebView. |

## 8.1.0

| Removed API | Notes / Replacement |
|-------------|---------------------|
| `Ti.Calendar#requestEventsAuthorization()` | Use the `Ti.Calendar#requestCalendarPermissions()` instead. |
| `Ti.Calendar.eventsAuthorization` | Use the `Ti.Calendar.calendarAuthorization` property instead. |

## 8.0.0

| Removed API | Notes / Replacement |
|-------------|---------------------|
| `Ti.App.uncaughtException.backtrace` | Use the `stack` property of the event. |
| `Ti.Contacts.AUTHORIZATION_RESTRICTED` | iOS 9 and later does not use this constant anymore. Use the other available `AUTHORIZATION_*` constants instead. |
| `Ti.UI.KEYBOARD_APPEARANCE_ALERT` | N/A |
| `Ti.UI.KEYBOARD_ASCII` | Use the `Ti.UI.KEYBOARD_TYPE_ASCII` constant instead. |
| `Ti.UI.KEYBOARD_DECIMAL_PAD` | Use the `Ti.UI.KEYBOARD_TYPE_DECIMAL_PAD` constant instead. |
| `Ti.UI.KEYBOARD_DEFAULT` | Use the `Ti.UI.KEYBOARD_TYPE_DEFAULT` constant instead. |
| `Ti.UI.KEYBOARD_EMAIL` | Use the `Ti.UI.KEYBOARD_TYPE_EMAIL` constant instead. |
| `Ti.UI.KEYBOARD_NAMEPHONE_PAD` | Use the `Ti.UI.KEYBOARD_TYPE_NAMEPHONE_PAD` constant instead. |
| `Ti.UI.KEYBOARD_NUMBERS_PUNCTUATION` | Use the `Ti.UI.KEYBOARD_TYPE_NUMBERS_PUNCTUATION` constant instead. |
| `Ti.UI.KEYBOARD_NUMBER_PAD` | Use the `Ti.UI.KEYBOARD_TYPE_NUMBER_PAD` constant instead. |
| `Ti.UI.KEYBOARD_PHONE_PAD` | Use the `Ti.UI.KEYBOARD_TYPE_PHONE_PAD` constant instead. |
| `Ti.UI.KEYBOARD_URL` | Use the `Ti.UI.KEYBOARD_TYPE_URL` constant instead. |
| `Ti.Yahoo` | Use the standalone [Ti.Yahoo](https://github.com/appcelerator-modules/ti.yahoo) module instead. |

## 7.0.0

| Removed API | Notes / Replacement |
|-------------|---------------------|
| `Ti.Calendar.STATUS_CANCELLED` | Use `Ti.Calendar.STATUS_CANCELED` instead. |
| `Ti.Gesture#isLandscape()` | Use the `Ti.Gesture.landscape` property for parity instead. Removed in 7.0.0 on Android, 8.1.0 on iOS. |
| `Ti.Gesture#isPortrait()` | Use the `Ti.Gesture.portrait` property for parity instead. Removed in 7.0.0 on Android, 8.1.0 on iOS. |
| `Ti.Media.CAMERA_AUTHORIZATION_NOT_DETERMINED` | Use `Ti.Media.CAMERA_AUTHORIZATION_UNKNOWN` instead. |
| `Ti.Media.VIDEO_CONTROL_DEFAULT` | This property has been removed for iOS in Titanium SDK 7.0.0 as of the official deprecation by Apple. |
| `Ti.Media.VIDEO_CONTROL_EMBEDDED` | This property has been removed for iOS in Titanium SDK 7.0.0 as of the official deprecation by Apple. |
| `Ti.Media.VIDEO_CONTROL_FULLSCREEN` | This property has been removed for iOS in Titanium SDK 7.0.0 as of the official deprecation by Apple. |
| `Ti.Media.VIDEO_LOAD_STATE_PLAYTHROUGH_OK` | This property has been removed for iOS in Titanium SDK 7.0.0 as of the official deprecation by Apple. |
| `Ti.Media.VIDEO_LOAD_STATE_STALLED` | This property has been removed for iOS in Titanium SDK 7.0.0 as of the official deprecation by Apple. |
| `Ti.Media.VIDEO_MEDIA_TYPE_AUDIO` | This property has been removed in Titanium SDK 7.0.0 as of the official deprecation by Apple. |
| `Ti.Media.VIDEO_MEDIA_TYPE_NONE` | This property has been removed in Titanium SDK 7.0.0 as of the official deprecation by Apple. |
| `Ti.Media.VIDEO_MEDIA_TYPE_VIDEO` | This property has been removed in Titanium SDK 7.0.0 as of the official deprecation by Apple. |
| `Ti.Media.VIDEO_PLAYBACK_STATE_SEEKING_BACKWARD` | This constant has been removed on iOS by using the official Apple AVPlayer that does not expose this functionality so far. |
| `Ti.Media.VIDEO_PLAYBACK_STATE_SEEKING_FORWARD` | This constant has been removed on iOS by using the official Apple AVPlayer that does not expose this functionality so far. |
| `Ti.Media.VIDEO_SCALING_ASPECT_FILL` | This property has been removed for iOS in Titanium SDK 7.0.0 as of the official deprecation by Apple. |
| `Ti.Media.VIDEO_SCALING_ASPECT_FIT` | This property has been removed for iOS in Titanium SDK 7.0.0 as of the official deprecation by Apple. |
| `Ti.Media.VIDEO_SCALING_MODE_FILL` | This property has been removed for iOS in Titanium SDK 7.0.0 as of the official deprecation by Apple. |
| `Ti.Media.VIDEO_SCALING_NONE` | This property has been removed for iOS in Titanium SDK 7.0.0 as of the official deprecation by Apple. |
| `Ti.Media.VIDEO_SOURCE_TYPE_FILE` | This property has been removed in Titanium SDK 7.0.0 as of the official deprecation by Apple. |
| `Ti.Media.VIDEO_SOURCE_TYPE_STREAMING` | This property has been removed in Titanium SDK 7.0.0 as of the official deprecation by Apple. |
| `Ti.Media.VIDEO_SOURCE_TYPE_UNKNOWN` | This property has been removed in Titanium SDK 7.0.0 as of the official deprecation by Apple. |
| `Ti.Media.VideoPlayer.fullscreen` | This method has been removed for iOS in Titanium SDK 7.0.0 as of the official deprecation by Apple. |
| `Ti.Media.VideoPlayer.mediaControlStyle` | On iOS, use `Ti.Media.VideoPlayer.showsControls` instead. |
| `Ti.Media.VideoPlayer.sourceType` | This method has been removed in Titanium SDK 7.0.0 as of the official deprecation by Apple. |
| `Ti.Media.VideoPlayer.fullscreen` | This event has been removed in Titanium SDK 7.0.0 as of the official deprecation by Apple. |
| `Ti.Media.VideoPlayer.mediatypesavailable` | This event has been removed in Titanium SDK 7.0.0 as of the official deprecation by Apple. |
| `Ti.Media.VideoPlayer.sourcechange` | This event has been removed in Titanium SDK 7.0.0 as of the official deprecation by Apple. |
| `Ti.Network.INADDR_ANY` | N/A |
| `Ti.UI.iPhone.ActivityIndicatorStyle` | Use the `Ti.UI.ActivityIndicatorStyle` constants instead (without the iPhone namespace). |
| `Ti.UI.iPhone.ActivityIndicatorStyle.BIG` | Use `Ti.UI.ActivityIndicatorStyle.BIG` instead. |
| `Ti.UI.iPhone.ActivityIndicatorStyle.DARK` | Use `Ti.UI.ActivityIndicatorStyle.DARK` instead. |
| `Ti.UI.iPhone.ActivityIndicatorStyle.PLAIN` | Use `Ti.UI.ActivityIndicatorStyle.PLAIN` instead. |
| `Ti.UI.iPhone.AlertDialogStyle` | Use `Ti.UI.iOS.AlertDialogStyle` instead. |
| `Ti.UI.iPhone.AlertDialogStyle.DEFAULT` | Use `Ti.UI.iOS.AlertDialogStyle.DEFAULT` instead. |
| `Ti.UI.iPhone.AlertDialogStyle.PLAIN_TEXT_INPUT` | Use `Ti.UI.iOS.AlertDialogStyle.PLAIN_TEXT_INPUT` instead. |
| `Ti.UI.iPhone.AlertDialogStyle.SECURE_TEXT_INPUT` | Use `Ti.UI.iOS.AlertDialogStyle.SECURE_TEXT_INPUT` instead. |
| `Ti.UI.iPhone.AlertDialogStyle.LOGIN_AND_PASSWORD_INPUT` | Use `Ti.UI.iOS.AlertDialogStyle.LOGIN_AND_PASSWORD_INPUT` instead. |
| `Ti.UI.iPhone.AnimationStyle` | Use `Ti.UI.iOS.AnimationStyle` instead. |
| `Ti.UI.iPhone.AnimationStyle.CURL_DOWN` | Use `Ti.UI.iOS.AnimationStyle.CURL_DOWN` instead. |
| `Ti.UI.iPhone.AnimationStyle.CURL_UP` | Use `Ti.UI.iOS.AnimationStyle.CURL_UP` instead. |
| `Ti.UI.iPhone.AnimationStyle.FLIP_FROM_LEFT` | Use `Ti.UI.iOS.AnimationStyle.FLIP_FROM_LEFT` instead. |
| `Ti.UI.iPhone.AnimationStyle.FLIP_FROM_RIGHT` | Use `Ti.UI.iOS.AnimationStyle.FLIP_FROM_RIGHT` instead. |
| `Ti.UI.iPhone.AnimationStyle.NONE` | Use `Ti.UI.iOS.AnimationStyle.NONE` instead. |
| `Ti.UI.iPhone` | Use the unified `Ti.UI.iOS` namespace instead. |
| `Ti.UI.iPhone.MODAL_PRESENTATION_CURRENT_CONTEXT` | Use `Ti.UI.iOS.MODAL_TRANSITION_STYLE_FLIP_HORIZONTAL` instead. |
| `Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET` | Use `Ti.UI.iOS.MODAL_TRANSITION_STYLE_FLIP_HORIZONTAL` instead. |
| `Ti.UI.iPhone.MODAL_PRESENTATION_FULLSCREEN` | Use `Ti.UI.iOS.MODAL_TRANSITION_STYLE_FLIP_HORIZONTAL` instead. |
| `Ti.UI.iPhone.MODAL_PRESENTATION_PAGESHEET` | Use `Ti.UI.iOS.MODAL_TRANSITION_STYLE_FLIP_HORIZONTAL` instead. |
| `Ti.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL` | Use `Ti.UI.iOS.MODAL_TRANSITION_STYLE_FLIP_HORIZONTAL` instead. |
| `Ti.UI.iPhone.MODAL_TRANSITION_STYLE_CROSS_DISSOLVE` | Use `Ti.UI.iOS.MODAL_TRANSITION_STYLE_FLIP_HORIZONTAL` instead. |
| `Ti.UI.iPhone.MODAL_TRANSITION_STYLE_FLIP_HORIZONTAL` | Use `Ti.UI.iOS.MODAL_TRANSITION_STYLE_FLIP_HORIZONTAL` instead. |
| `Ti.UI.iPhone.MODAL_TRANSITION_STYLE_PARTIAL_CURL` | Use `Ti.UI.iOS.MODAL_TRANSITION_STYLE_FLIP_HORIZONTAL` instead. |
| `Ti.UI.iPhone.appBadge` | Use `Ti.UI.iOS.appBadge` instead. |
| `Ti.UI.iPhone.appSupportsShakeToEdit` | Use `Ti.UI.iOS.appSupportsShakeToEdit` instead. |
| `Ti.UI.iPhone.ListViewCellSelectionStyle` | Use `Ti.UI.iOS.ListViewCellSelectionStyle` instead. |
| `Ti.UI.iPhone.ListViewScrollPosition` | Use `Ti.UI.iOS.ListViewScrollPosition` instead. |
| `Ti.UI.iPhone.ListViewSeparatorStyle` | Use `Ti.UI.TABLE_VIEW_SEPARATOR_STYLE_SINGLE_LINE` and `Ti.UI.TABLE_VIEW_SEPARATOR_STYLE_NONE` instead. |
| `Ti.UI.iPhone.ListViewStyle` | Use `Ti.UI.iOS.ListViewStyle` instead. |
| `Ti.UI.iPhone.ProgressBarStyle` | Use `Ti.UI.iOS.ProgressBarStyle` instead. |
| `Ti.UI.iPhone.RowAnimationStyle` | Use `Ti.UI.iOS.RowAnimationStyle` instead. |
| `Ti.UI.iPhone.ScrollIndicatorStyle` | Use `Ti.UI.iOS.ScrollIndicatorStyle` instead. |
| `Ti.UI.iPhone.SystemButton` | Use `Ti.UI.iOS.SystemButton` instead. |
| `Ti.UI.iPhone.SystemButtonStyle` | Use `Ti.UI.iOS.SystemButtonStyle` instead. |
| `Ti.UI.iPhone.SystemIcon` | Use `Ti.UI.iOS.SystemIcon` instead. |
| `Ti.UI.iPhone.TableViewCellSelectionStyle` | Use `Ti.UI.iOS.TableViewCellSelectionStyle` instead. |
| `Ti.UI.iPhone.TableViewScrollPosition` | Use `Ti.UI.iOS.TableViewScrollPosition` instead. |
| `Ti.UI.iPhone.TableViewSeparatorStyle` | Use `Ti.UI.TABLE_VIEW_SEPARATOR_STYLE_SINGLE_LINE` and `Ti.UI.TABLE_VIEW_SEPARATOR_STYLE_NONE` instead. |
| `Ti.UI.iPhone.TableViewStyle` | Use `Ti.UI.iOS.TableViewStyle` instead. |

## 6.0.0

| Removed API | Notes / Replacement |
|-------------|---------------------|
| `Ti.Android.Calendar.Alert` | Use `Ti.Calendar` instead. |
| `Ti.Android.Calendar` | Use `Ti.Calendar` instead. |
| `Ti.Android.Calendar.Calendar` | Use `Ti.Calendar` instead. |
| `Ti.Android.Calendar.Event` | Use `Ti.Calendar` instead. |
| `Ti.Android.Calendar.Reminder` | Use `Ti.Calendar` instead. |
| `Ti.Filesystem.File.writeable` | Use `Ti.Filesystem.File.writable` instead. |
| `Ti.Media.AUDIO_SESSION_MODE_AMBIENT` | Deprecated in favor of the `AUDIO_SESSION_CATEGORY` constants defined in `Ti.Media`. |
| `Ti.Media.AUDIO_SESSION_MODE_PLAYBACK` | Deprecated in favor of the `AUDIO_SESSION_CATEGORY` constants defined in `Ti.Media`. |
| `Ti.Media.AUDIO_SESSION_MODE_PLAY_AND_RECORD` | Deprecated in favor of the `AUDIO_SESSION_CATEGORY` constants defined in `Ti.Media`. |
| `Ti.Media.AUDIO_SESSION_MODE_RECORD` | Deprecated in favor of the `AUDIO_SESSION_CATEGORY_*` constants defined in `Ti.Media`. |
| `Ti.Media.VIDEO_CONTROL_VOLUME_ONLY` | Use `Ti.Media.VIDEO_CONTROL_EMBEDDED` instead. |
| `Ti.Media.audioSessionMode` | Use `Ti.Media.audioSessionCategory` instead. |
| `Ti.UI.iOS.3DMatrix` | Use `Ti.UI.3DMatrix` instead. |
| `Ti.UI.iOS.Attribute` | Use `Ti.UI.Attribute` instead. |
| `Ti.UI.iOS.AttributedString` | Use `Ti.UI.AttributedString` instead. |
| `Ti.UI.iOS.ANIMATION_CURVE_EASE_IN` | Use `Ti.UI.ANIMATION_CURVE_EASE_IN` instead. |
| `Ti.UI.iOS.ANIMATION_CURVE_EASE_IN_OUT` | Use `Ti.UI.ANIMATION_CURVE_EASE_IN_OUT` instead. |
| `Ti.UI.iOS.ANIMATION_CURVE_EASE_OUT` | Use `Ti.UI.ANIMATION_CURVE_EASE_OUT` instead. |
| `Ti.UI.iOS.ANIMATION_CURVE_LINEAR` | Use `Ti.UI.ANIMATION_CURVE_LINEAR` instead. |
| `Ti.UI.iOS.ATTRIBUTE_FONT` | Use the `Ti.UI.ATTRIBUTE_FONT` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_FOREGROUND_COLOR` | Use the `Ti.UI.ATTRIBUTE_FOREGROUND_COLOR` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_BACKGROUND_COLOR` | Use the `Ti.UI.ATTRIBUTE_BACKGROUND_COLOR` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_LIGATURE` | Use the `Ti.UI.ATTRIBUTE_LIGATURE` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_LETTERPRESS_STYLE` | Use the `Ti.UI.ATTRIBUTE_LETTERPRESS_STYLE` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_KERN` | Use the `Ti.UI.ATTRIBUTE_KERN` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_STRIKETHROUGH_STYLE` | Use the `Ti.UI.ATTRIBUTE_STRIKETHROUGH_STYLE` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_UNDERLINES_STYLE` | Use the `Ti.UI.ATTRIBUTE_UNDERLINES_STYLE` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_STROKE_COLOR` | Use the `Ti.UI.ATTRIBUTE_STROKE_COLOR` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_STROKE_WIDTH` | Use the `Ti.UI.ATTRIBUTE_STROKE_WIDTH` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_SHADOW` | Use the `Ti.UI.ATTRIBUTE_SHADOW` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_WRITING_DIRECTION` | Use the `Ti.UI.ATTRIBUTE_WRITING_DIRECTION` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_TEXT_EFFECT` | Use the `Ti.UI.ATTRIBUTE_TEXT_EFFECT` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_LINK` | Use the `Ti.UI.ATTRIBUTE_LINK` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_BASELINE_OFFSET` | Use the `Ti.UI.ATTRIBUTE_BASELINE_OFFSET` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_UNDERLINE_COLOR` | Use the `Ti.UI.ATTRIBUTE_UNDERLINE_COLOR` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_STRIKETHROUGH_COLOR` | Use the `Ti.UI.ATTRIBUTE_STRIKETHROUGH_COLOR` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_OBLIQUENESS` | Use the `Ti.UI.ATTRIBUTE_OBLIQUENESS` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_EXPANSION` | Use the `Ti.UI.ATTRIBUTE_EXPANSION` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_UNDERLINE_STYLE_NONE` | Use the `Ti.UI.ATTRIBUTE_UNDERLINE_STYLE_NONE` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_UNDERLINE_STYLE_SINGLE` | Use the `Ti.UI.ATTRIBUTE_UNDERLINE_STYLE_SINGLE` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_UNDERLINE_STYLE_THICK` | Use the `Ti.UI.ATTRIBUTE_UNDERLINE_STYLE_THICK` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_UNDERLINE_STYLE_DOUBLE` | Use the `Ti.UI.ATTRIBUTE_UNDERLINE_STYLE_DOUBLE` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_UNDERLINE_PATTERN_SOLID` | Use the `Ti.UI.ATTRIBUTE_UNDERLINE_PATTERN_SOLID` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_UNDERLINE_PATTERN_DOT` | Use the `Ti.UI.ATTRIBUTE_UNDERLINE_PATTERN_DOT` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_UNDERLINE_PATTERN_DASH` | Use the `Ti.UI.ATTRIBUTE_UNDERLINE_PATTERN_DASH` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_UNDERLINE_PATTERN_DASH_DOT` | Use the `Ti.UI.ATTRIBUTE_UNDERLINE_PATTERN_DASH_DOT` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_UNDERLINE_PATTERN_DASH_DOT_DOT` | Use the `Ti.UI.ATTRIBUTE_UNDERLINE_PATTERN_DASH_DOT_DOT` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_UNDERLINE_BY_WORD` | Use the `Ti.UI.ATTRIBUTE_UNDERLINE_BY_WORD` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_WRITING_DIRECTION_EMBEDDING` | Use the `Ti.UI.ATTRIBUTE_WRITING_DIRECTION_EMBEDDING` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_WRITING_DIRECTION_OVERRIDE` | Use the `Ti.UI.ATTRIBUTE_WRITING_DIRECTION_OVERRIDE` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_WRITING_DIRECTION_NATURAL` | Use the `Ti.UI.ATTRIBUTE_WRITING_DIRECTION_NATURAL` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_WRITING_DIRECTION_LEFT_TO_RIGHT` | Use the `Ti.UI.ATTRIBUTE_WRITING_DIRECTION_LEFT_TO_RIGHT` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.ATTRIBUTE_WRITING_DIRECTION_RIGHT_TO_LEFT` | Use the `Ti.UI.ATTRIBUTE_WRITING_DIRECTION_RIGHT_TO_LEFT` constant instead (without the iOS namespace). |
| `Ti.UI.iOS.AUTODETECT_ADDRESS` | Use `Ti.UI.AUTOLINK_MAP_ADDRESSES` instead. |
| `Ti.UI.iOS.AUTODETECT_ALL` | Use `Ti.UI.AUTOLINK_ALL` instead. |
| `Ti.UI.iOS.AUTODETECT_CALENDAR` | Use `Ti.UI.AUTOLINK_CALENDAR` instead. |
| `Ti.UI.iOS.AUTODETECT_LINK` | Use `Ti.UI.AUTOLINK_URLS` instead. |
| `Ti.UI.iOS.AUTODETECT_NONE` | Use `Ti.UI.AUTOLINK_NONE` instead. |
| `Ti.UI.iOS.AUTODETECT_PHONE` | Use `Ti.UI.AUTOLINK_PHONE_NUMBERS` instead. |
| `Ti.UI.iPad.DocumentViewer` | Use `Ti.UI.iOS.DocumentViewer` instead. |
| `Ti.UI.iPad.SplitWindow` | Use `Ti.UI.iOS.SplitWindow` instead. |
| `Ti.UI.AUTODETECT_ADDRESS` | Use `Ti.UI.AUTOLINK_MAP_ADDRESSES` instead. |
| `Ti.UI.AUTODETECT_ALL` | Use `Ti.UI.AUTOLINK_ALL` instead. |
| `Ti.UI.AUTODETECT_CALENDAR` | Use `Ti.UI.AUTOLINK_CALENDAR` instead. |
| `Ti.UI.AUTODETECT_LINK` | Use `Ti.UI.AUTOLINK_URLS` instead. |
| `Ti.UI.AUTODETECT_NONE` | Use `Ti.UI.AUTOLINK_NONE` instead. |
| `Ti.UI.AUTODETECT_PHONE` | Use `Ti.UI.AUTOLINK_PHONE_NUMBERS` instead. |
| `Ti.UI.currentTab` | N/A |
| `Ti.UI.currentWindow` | N/A |
| `Ti.UI.Window.url` | N/A |
