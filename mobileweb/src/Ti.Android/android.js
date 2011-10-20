(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	var _ACTION_AIRPLANE_MODE_CHANGED = null;
	Object.defineProperty(api, 'ACTION_AIRPLANE_MODE_CHANGED', {
		get: function(){return _ACTION_AIRPLANE_MODE_CHANGED;},
		set: function(val){return _ACTION_AIRPLANE_MODE_CHANGED = val;}
	});

	var _ACTION_ALL_APPS = null;
	Object.defineProperty(api, 'ACTION_ALL_APPS', {
		get: function(){return _ACTION_ALL_APPS;},
		set: function(val){return _ACTION_ALL_APPS = val;}
	});

	var _ACTION_ANSWER = null;
	Object.defineProperty(api, 'ACTION_ANSWER', {
		get: function(){return _ACTION_ANSWER;},
		set: function(val){return _ACTION_ANSWER = val;}
	});

	var _ACTION_ATTACH_DATA = null;
	Object.defineProperty(api, 'ACTION_ATTACH_DATA', {
		get: function(){return _ACTION_ATTACH_DATA;},
		set: function(val){return _ACTION_ATTACH_DATA = val;}
	});

	var _ACTION_BATTERY_CHANGED = null;
	Object.defineProperty(api, 'ACTION_BATTERY_CHANGED', {
		get: function(){return _ACTION_BATTERY_CHANGED;},
		set: function(val){return _ACTION_BATTERY_CHANGED = val;}
	});

	var _ACTION_BATTERY_LOW = null;
	Object.defineProperty(api, 'ACTION_BATTERY_LOW', {
		get: function(){return _ACTION_BATTERY_LOW;},
		set: function(val){return _ACTION_BATTERY_LOW = val;}
	});

	var _ACTION_BATTERY_OKAY = null;
	Object.defineProperty(api, 'ACTION_BATTERY_OKAY', {
		get: function(){return _ACTION_BATTERY_OKAY;},
		set: function(val){return _ACTION_BATTERY_OKAY = val;}
	});

	var _ACTION_BOOT_COMPLETED = null;
	Object.defineProperty(api, 'ACTION_BOOT_COMPLETED', {
		get: function(){return _ACTION_BOOT_COMPLETED;},
		set: function(val){return _ACTION_BOOT_COMPLETED = val;}
	});

	var _ACTION_BUG_REPORT = null;
	Object.defineProperty(api, 'ACTION_BUG_REPORT', {
		get: function(){return _ACTION_BUG_REPORT;},
		set: function(val){return _ACTION_BUG_REPORT = val;}
	});

	var _ACTION_CALL = null;
	Object.defineProperty(api, 'ACTION_CALL', {
		get: function(){return _ACTION_CALL;},
		set: function(val){return _ACTION_CALL = val;}
	});

	var _ACTION_CALL_BUTTON = null;
	Object.defineProperty(api, 'ACTION_CALL_BUTTON', {
		get: function(){return _ACTION_CALL_BUTTON;},
		set: function(val){return _ACTION_CALL_BUTTON = val;}
	});

	var _ACTION_CAMERA_BUTTON = null;
	Object.defineProperty(api, 'ACTION_CAMERA_BUTTON', {
		get: function(){return _ACTION_CAMERA_BUTTON;},
		set: function(val){return _ACTION_CAMERA_BUTTON = val;}
	});

	var _ACTION_CHOOSER = null;
	Object.defineProperty(api, 'ACTION_CHOOSER', {
		get: function(){return _ACTION_CHOOSER;},
		set: function(val){return _ACTION_CHOOSER = val;}
	});

	var _ACTION_CLOSE_SYSTEM_DIALOGS = null;
	Object.defineProperty(api, 'ACTION_CLOSE_SYSTEM_DIALOGS', {
		get: function(){return _ACTION_CLOSE_SYSTEM_DIALOGS;},
		set: function(val){return _ACTION_CLOSE_SYSTEM_DIALOGS = val;}
	});

	var _ACTION_CONFIGURATION_CHANGED = null;
	Object.defineProperty(api, 'ACTION_CONFIGURATION_CHANGED', {
		get: function(){return _ACTION_CONFIGURATION_CHANGED;},
		set: function(val){return _ACTION_CONFIGURATION_CHANGED = val;}
	});

	var _ACTION_CREATE_SHORTCUT = null;
	Object.defineProperty(api, 'ACTION_CREATE_SHORTCUT', {
		get: function(){return _ACTION_CREATE_SHORTCUT;},
		set: function(val){return _ACTION_CREATE_SHORTCUT = val;}
	});

	var _ACTION_DATE_CHANGED = null;
	Object.defineProperty(api, 'ACTION_DATE_CHANGED', {
		get: function(){return _ACTION_DATE_CHANGED;},
		set: function(val){return _ACTION_DATE_CHANGED = val;}
	});

	var _ACTION_DEFAULT = null;
	Object.defineProperty(api, 'ACTION_DEFAULT', {
		get: function(){return _ACTION_DEFAULT;},
		set: function(val){return _ACTION_DEFAULT = val;}
	});

	var _ACTION_DELETE = null;
	Object.defineProperty(api, 'ACTION_DELETE', {
		get: function(){return _ACTION_DELETE;},
		set: function(val){return _ACTION_DELETE = val;}
	});

	var _ACTION_DEVICE_STORAGE_LOW = null;
	Object.defineProperty(api, 'ACTION_DEVICE_STORAGE_LOW', {
		get: function(){return _ACTION_DEVICE_STORAGE_LOW;},
		set: function(val){return _ACTION_DEVICE_STORAGE_LOW = val;}
	});

	var _ACTION_DIAL = null;
	Object.defineProperty(api, 'ACTION_DIAL', {
		get: function(){return _ACTION_DIAL;},
		set: function(val){return _ACTION_DIAL = val;}
	});

	var _ACTION_EDIT = null;
	Object.defineProperty(api, 'ACTION_EDIT', {
		get: function(){return _ACTION_EDIT;},
		set: function(val){return _ACTION_EDIT = val;}
	});

	var _ACTION_GET_CONTENT = null;
	Object.defineProperty(api, 'ACTION_GET_CONTENT', {
		get: function(){return _ACTION_GET_CONTENT;},
		set: function(val){return _ACTION_GET_CONTENT = val;}
	});

	var _ACTION_GTALK_SERVICE_CONNECTED = null;
	Object.defineProperty(api, 'ACTION_GTALK_SERVICE_CONNECTED', {
		get: function(){return _ACTION_GTALK_SERVICE_CONNECTED;},
		set: function(val){return _ACTION_GTALK_SERVICE_CONNECTED = val;}
	});

	var _ACTION_GTALK_SERVICE_DISCONNECTED = null;
	Object.defineProperty(api, 'ACTION_GTALK_SERVICE_DISCONNECTED', {
		get: function(){return _ACTION_GTALK_SERVICE_DISCONNECTED;},
		set: function(val){return _ACTION_GTALK_SERVICE_DISCONNECTED = val;}
	});

	var _ACTION_HEADSET_PLUG = null;
	Object.defineProperty(api, 'ACTION_HEADSET_PLUG', {
		get: function(){return _ACTION_HEADSET_PLUG;},
		set: function(val){return _ACTION_HEADSET_PLUG = val;}
	});

	var _ACTION_INPUT_METHOD_CHANGED = null;
	Object.defineProperty(api, 'ACTION_INPUT_METHOD_CHANGED', {
		get: function(){return _ACTION_INPUT_METHOD_CHANGED;},
		set: function(val){return _ACTION_INPUT_METHOD_CHANGED = val;}
	});

	var _ACTION_INSERT = null;
	Object.defineProperty(api, 'ACTION_INSERT', {
		get: function(){return _ACTION_INSERT;},
		set: function(val){return _ACTION_INSERT = val;}
	});

	var _ACTION_INSERT_OR_EDIT = null;
	Object.defineProperty(api, 'ACTION_INSERT_OR_EDIT', {
		get: function(){return _ACTION_INSERT_OR_EDIT;},
		set: function(val){return _ACTION_INSERT_OR_EDIT = val;}
	});

	var _ACTION_MAIN = null;
	Object.defineProperty(api, 'ACTION_MAIN', {
		get: function(){return _ACTION_MAIN;},
		set: function(val){return _ACTION_MAIN = val;}
	});

	var _ACTION_MANAGE_PACKAGE_STORAGE = null;
	Object.defineProperty(api, 'ACTION_MANAGE_PACKAGE_STORAGE', {
		get: function(){return _ACTION_MANAGE_PACKAGE_STORAGE;},
		set: function(val){return _ACTION_MANAGE_PACKAGE_STORAGE = val;}
	});

	var _ACTION_MEDIA_BAD_REMOVAL = null;
	Object.defineProperty(api, 'ACTION_MEDIA_BAD_REMOVAL', {
		get: function(){return _ACTION_MEDIA_BAD_REMOVAL;},
		set: function(val){return _ACTION_MEDIA_BAD_REMOVAL = val;}
	});

	var _ACTION_MEDIA_BUTTON = null;
	Object.defineProperty(api, 'ACTION_MEDIA_BUTTON', {
		get: function(){return _ACTION_MEDIA_BUTTON;},
		set: function(val){return _ACTION_MEDIA_BUTTON = val;}
	});

	var _ACTION_MEDIA_CHECKING = null;
	Object.defineProperty(api, 'ACTION_MEDIA_CHECKING', {
		get: function(){return _ACTION_MEDIA_CHECKING;},
		set: function(val){return _ACTION_MEDIA_CHECKING = val;}
	});

	var _ACTION_MEDIA_EJECT = null;
	Object.defineProperty(api, 'ACTION_MEDIA_EJECT', {
		get: function(){return _ACTION_MEDIA_EJECT;},
		set: function(val){return _ACTION_MEDIA_EJECT = val;}
	});

	var _ACTION_MEDIA_MOUNTED = null;
	Object.defineProperty(api, 'ACTION_MEDIA_MOUNTED', {
		get: function(){return _ACTION_MEDIA_MOUNTED;},
		set: function(val){return _ACTION_MEDIA_MOUNTED = val;}
	});

	var _ACTION_MEDIA_NOFS = null;
	Object.defineProperty(api, 'ACTION_MEDIA_NOFS', {
		get: function(){return _ACTION_MEDIA_NOFS;},
		set: function(val){return _ACTION_MEDIA_NOFS = val;}
	});

	var _ACTION_MEDIA_REMOVED = null;
	Object.defineProperty(api, 'ACTION_MEDIA_REMOVED', {
		get: function(){return _ACTION_MEDIA_REMOVED;},
		set: function(val){return _ACTION_MEDIA_REMOVED = val;}
	});

	var _ACTION_MEDIA_SCANNER_FINISHED = null;
	Object.defineProperty(api, 'ACTION_MEDIA_SCANNER_FINISHED', {
		get: function(){return _ACTION_MEDIA_SCANNER_FINISHED;},
		set: function(val){return _ACTION_MEDIA_SCANNER_FINISHED = val;}
	});

	var _ACTION_MEDIA_SCANNER_SCAN_FILE = null;
	Object.defineProperty(api, 'ACTION_MEDIA_SCANNER_SCAN_FILE', {
		get: function(){return _ACTION_MEDIA_SCANNER_SCAN_FILE;},
		set: function(val){return _ACTION_MEDIA_SCANNER_SCAN_FILE = val;}
	});

	var _ACTION_MEDIA_SCANNER_STARTED = null;
	Object.defineProperty(api, 'ACTION_MEDIA_SCANNER_STARTED', {
		get: function(){return _ACTION_MEDIA_SCANNER_STARTED;},
		set: function(val){return _ACTION_MEDIA_SCANNER_STARTED = val;}
	});

	var _ACTION_MEDIA_SHARED = null;
	Object.defineProperty(api, 'ACTION_MEDIA_SHARED', {
		get: function(){return _ACTION_MEDIA_SHARED;},
		set: function(val){return _ACTION_MEDIA_SHARED = val;}
	});

	var _ACTION_MEDIA_UNMOUNTABLE = null;
	Object.defineProperty(api, 'ACTION_MEDIA_UNMOUNTABLE', {
		get: function(){return _ACTION_MEDIA_UNMOUNTABLE;},
		set: function(val){return _ACTION_MEDIA_UNMOUNTABLE = val;}
	});

	var _ACTION_MEDIA_UNMOUNTED = null;
	Object.defineProperty(api, 'ACTION_MEDIA_UNMOUNTED', {
		get: function(){return _ACTION_MEDIA_UNMOUNTED;},
		set: function(val){return _ACTION_MEDIA_UNMOUNTED = val;}
	});

	var _ACTION_NEW_OUTGOING_CALL = null;
	Object.defineProperty(api, 'ACTION_NEW_OUTGOING_CALL', {
		get: function(){return _ACTION_NEW_OUTGOING_CALL;},
		set: function(val){return _ACTION_NEW_OUTGOING_CALL = val;}
	});

	var _ACTION_PACKAGE_ADDED = null;
	Object.defineProperty(api, 'ACTION_PACKAGE_ADDED', {
		get: function(){return _ACTION_PACKAGE_ADDED;},
		set: function(val){return _ACTION_PACKAGE_ADDED = val;}
	});

	var _ACTION_PACKAGE_CHANGED = null;
	Object.defineProperty(api, 'ACTION_PACKAGE_CHANGED', {
		get: function(){return _ACTION_PACKAGE_CHANGED;},
		set: function(val){return _ACTION_PACKAGE_CHANGED = val;}
	});

	var _ACTION_PACKAGE_DATA_CLEARED = null;
	Object.defineProperty(api, 'ACTION_PACKAGE_DATA_CLEARED', {
		get: function(){return _ACTION_PACKAGE_DATA_CLEARED;},
		set: function(val){return _ACTION_PACKAGE_DATA_CLEARED = val;}
	});

	var _ACTION_PACKAGE_INSTALL = null;
	Object.defineProperty(api, 'ACTION_PACKAGE_INSTALL', {
		get: function(){return _ACTION_PACKAGE_INSTALL;},
		set: function(val){return _ACTION_PACKAGE_INSTALL = val;}
	});

	var _ACTION_PACKAGE_REMOVED = null;
	Object.defineProperty(api, 'ACTION_PACKAGE_REMOVED', {
		get: function(){return _ACTION_PACKAGE_REMOVED;},
		set: function(val){return _ACTION_PACKAGE_REMOVED = val;}
	});

	var _ACTION_PACKAGE_REPLACED = null;
	Object.defineProperty(api, 'ACTION_PACKAGE_REPLACED', {
		get: function(){return _ACTION_PACKAGE_REPLACED;},
		set: function(val){return _ACTION_PACKAGE_REPLACED = val;}
	});

	var _ACTION_PACKAGE_RESTARTED = null;
	Object.defineProperty(api, 'ACTION_PACKAGE_RESTARTED', {
		get: function(){return _ACTION_PACKAGE_RESTARTED;},
		set: function(val){return _ACTION_PACKAGE_RESTARTED = val;}
	});

	var _ACTION_PICK = null;
	Object.defineProperty(api, 'ACTION_PICK', {
		get: function(){return _ACTION_PICK;},
		set: function(val){return _ACTION_PICK = val;}
	});

	var _ACTION_PICK_ACTIVITY = null;
	Object.defineProperty(api, 'ACTION_PICK_ACTIVITY', {
		get: function(){return _ACTION_PICK_ACTIVITY;},
		set: function(val){return _ACTION_PICK_ACTIVITY = val;}
	});

	var _ACTION_POWER_CONNECTED = null;
	Object.defineProperty(api, 'ACTION_POWER_CONNECTED', {
		get: function(){return _ACTION_POWER_CONNECTED;},
		set: function(val){return _ACTION_POWER_CONNECTED = val;}
	});

	var _ACTION_POWER_DISCONNECTED = null;
	Object.defineProperty(api, 'ACTION_POWER_DISCONNECTED', {
		get: function(){return _ACTION_POWER_DISCONNECTED;},
		set: function(val){return _ACTION_POWER_DISCONNECTED = val;}
	});

	var _ACTION_POWER_USAGE_SUMMARY = null;
	Object.defineProperty(api, 'ACTION_POWER_USAGE_SUMMARY', {
		get: function(){return _ACTION_POWER_USAGE_SUMMARY;},
		set: function(val){return _ACTION_POWER_USAGE_SUMMARY = val;}
	});

	var _ACTION_PROVIDER_CHANGED = null;
	Object.defineProperty(api, 'ACTION_PROVIDER_CHANGED', {
		get: function(){return _ACTION_PROVIDER_CHANGED;},
		set: function(val){return _ACTION_PROVIDER_CHANGED = val;}
	});

	var _ACTION_REBOOT = null;
	Object.defineProperty(api, 'ACTION_REBOOT', {
		get: function(){return _ACTION_REBOOT;},
		set: function(val){return _ACTION_REBOOT = val;}
	});

	var _ACTION_RUN = null;
	Object.defineProperty(api, 'ACTION_RUN', {
		get: function(){return _ACTION_RUN;},
		set: function(val){return _ACTION_RUN = val;}
	});

	var _ACTION_SCREEN_OFF = null;
	Object.defineProperty(api, 'ACTION_SCREEN_OFF', {
		get: function(){return _ACTION_SCREEN_OFF;},
		set: function(val){return _ACTION_SCREEN_OFF = val;}
	});

	var _ACTION_SCREEN_ON = null;
	Object.defineProperty(api, 'ACTION_SCREEN_ON', {
		get: function(){return _ACTION_SCREEN_ON;},
		set: function(val){return _ACTION_SCREEN_ON = val;}
	});

	var _ACTION_SEARCH = null;
	Object.defineProperty(api, 'ACTION_SEARCH', {
		get: function(){return _ACTION_SEARCH;},
		set: function(val){return _ACTION_SEARCH = val;}
	});

	var _ACTION_SEARCH_LONG_PRESS = null;
	Object.defineProperty(api, 'ACTION_SEARCH_LONG_PRESS', {
		get: function(){return _ACTION_SEARCH_LONG_PRESS;},
		set: function(val){return _ACTION_SEARCH_LONG_PRESS = val;}
	});

	var _ACTION_SEND = null;
	Object.defineProperty(api, 'ACTION_SEND', {
		get: function(){return _ACTION_SEND;},
		set: function(val){return _ACTION_SEND = val;}
	});

	var _ACTION_SENDTO = null;
	Object.defineProperty(api, 'ACTION_SENDTO', {
		get: function(){return _ACTION_SENDTO;},
		set: function(val){return _ACTION_SENDTO = val;}
	});

	var _ACTION_SEND_MULTIPLE = null;
	Object.defineProperty(api, 'ACTION_SEND_MULTIPLE', {
		get: function(){return _ACTION_SEND_MULTIPLE;},
		set: function(val){return _ACTION_SEND_MULTIPLE = val;}
	});

	var _ACTION_SET_WALLPAPER = null;
	Object.defineProperty(api, 'ACTION_SET_WALLPAPER', {
		get: function(){return _ACTION_SET_WALLPAPER;},
		set: function(val){return _ACTION_SET_WALLPAPER = val;}
	});

	var _ACTION_SHUTDOWN = null;
	Object.defineProperty(api, 'ACTION_SHUTDOWN', {
		get: function(){return _ACTION_SHUTDOWN;},
		set: function(val){return _ACTION_SHUTDOWN = val;}
	});

	var _ACTION_SYNC = null;
	Object.defineProperty(api, 'ACTION_SYNC', {
		get: function(){return _ACTION_SYNC;},
		set: function(val){return _ACTION_SYNC = val;}
	});

	var _ACTION_SYSTEM_TUTORIAL = null;
	Object.defineProperty(api, 'ACTION_SYSTEM_TUTORIAL', {
		get: function(){return _ACTION_SYSTEM_TUTORIAL;},
		set: function(val){return _ACTION_SYSTEM_TUTORIAL = val;}
	});

	var _ACTION_TIME_CHANGED = null;
	Object.defineProperty(api, 'ACTION_TIME_CHANGED', {
		get: function(){return _ACTION_TIME_CHANGED;},
		set: function(val){return _ACTION_TIME_CHANGED = val;}
	});

	var _ACTION_TIME_TICK = null;
	Object.defineProperty(api, 'ACTION_TIME_TICK', {
		get: function(){return _ACTION_TIME_TICK;},
		set: function(val){return _ACTION_TIME_TICK = val;}
	});

	var _ACTION_UID_REMOVED = null;
	Object.defineProperty(api, 'ACTION_UID_REMOVED', {
		get: function(){return _ACTION_UID_REMOVED;},
		set: function(val){return _ACTION_UID_REMOVED = val;}
	});

	var _ACTION_UMS_CONNECTED = null;
	Object.defineProperty(api, 'ACTION_UMS_CONNECTED', {
		get: function(){return _ACTION_UMS_CONNECTED;},
		set: function(val){return _ACTION_UMS_CONNECTED = val;}
	});

	var _ACTION_UMS_DISCONNECTED = null;
	Object.defineProperty(api, 'ACTION_UMS_DISCONNECTED', {
		get: function(){return _ACTION_UMS_DISCONNECTED;},
		set: function(val){return _ACTION_UMS_DISCONNECTED = val;}
	});

	var _ACTION_USER_PRESENT = null;
	Object.defineProperty(api, 'ACTION_USER_PRESENT', {
		get: function(){return _ACTION_USER_PRESENT;},
		set: function(val){return _ACTION_USER_PRESENT = val;}
	});

	var _ACTION_VIEW = null;
	Object.defineProperty(api, 'ACTION_VIEW', {
		get: function(){return _ACTION_VIEW;},
		set: function(val){return _ACTION_VIEW = val;}
	});

	var _ACTION_VOICE_COMMAND = null;
	Object.defineProperty(api, 'ACTION_VOICE_COMMAND', {
		get: function(){return _ACTION_VOICE_COMMAND;},
		set: function(val){return _ACTION_VOICE_COMMAND = val;}
	});

	var _ACTION_WALLPAPER_CHANGED = null;
	Object.defineProperty(api, 'ACTION_WALLPAPER_CHANGED', {
		get: function(){return _ACTION_WALLPAPER_CHANGED;},
		set: function(val){return _ACTION_WALLPAPER_CHANGED = val;}
	});

	var _ACTION_WEB_SEARCH = null;
	Object.defineProperty(api, 'ACTION_WEB_SEARCH', {
		get: function(){return _ACTION_WEB_SEARCH;},
		set: function(val){return _ACTION_WEB_SEARCH = val;}
	});

	var _CATEGORY_ALTERNATIVE = null;
	Object.defineProperty(api, 'CATEGORY_ALTERNATIVE', {
		get: function(){return _CATEGORY_ALTERNATIVE;},
		set: function(val){return _CATEGORY_ALTERNATIVE = val;}
	});

	var _CATEGORY_BROWSABLE = null;
	Object.defineProperty(api, 'CATEGORY_BROWSABLE', {
		get: function(){return _CATEGORY_BROWSABLE;},
		set: function(val){return _CATEGORY_BROWSABLE = val;}
	});

	var _CATEGORY_DEFAULT = null;
	Object.defineProperty(api, 'CATEGORY_DEFAULT', {
		get: function(){return _CATEGORY_DEFAULT;},
		set: function(val){return _CATEGORY_DEFAULT = val;}
	});

	var _CATEGORY_DEVELOPMENT_PREFERENCE = null;
	Object.defineProperty(api, 'CATEGORY_DEVELOPMENT_PREFERENCE', {
		get: function(){return _CATEGORY_DEVELOPMENT_PREFERENCE;},
		set: function(val){return _CATEGORY_DEVELOPMENT_PREFERENCE = val;}
	});

	var _CATEGORY_EMBED = null;
	Object.defineProperty(api, 'CATEGORY_EMBED', {
		get: function(){return _CATEGORY_EMBED;},
		set: function(val){return _CATEGORY_EMBED = val;}
	});

	var _CATEGORY_FRAMEWORK_INSTRUMENTATION_TEST = null;
	Object.defineProperty(api, 'CATEGORY_FRAMEWORK_INSTRUMENTATION_TEST', {
		get: function(){return _CATEGORY_FRAMEWORK_INSTRUMENTATION_TEST;},
		set: function(val){return _CATEGORY_FRAMEWORK_INSTRUMENTATION_TEST = val;}
	});

	var _CATEGORY_HOME = null;
	Object.defineProperty(api, 'CATEGORY_HOME', {
		get: function(){return _CATEGORY_HOME;},
		set: function(val){return _CATEGORY_HOME = val;}
	});

	var _CATEGORY_INFO = null;
	Object.defineProperty(api, 'CATEGORY_INFO', {
		get: function(){return _CATEGORY_INFO;},
		set: function(val){return _CATEGORY_INFO = val;}
	});

	var _CATEGORY_LAUNCHER = null;
	Object.defineProperty(api, 'CATEGORY_LAUNCHER', {
		get: function(){return _CATEGORY_LAUNCHER;},
		set: function(val){return _CATEGORY_LAUNCHER = val;}
	});

	var _CATEGORY_MONKEY = null;
	Object.defineProperty(api, 'CATEGORY_MONKEY', {
		get: function(){return _CATEGORY_MONKEY;},
		set: function(val){return _CATEGORY_MONKEY = val;}
	});

	var _CATEGORY_OPENABLE = null;
	Object.defineProperty(api, 'CATEGORY_OPENABLE', {
		get: function(){return _CATEGORY_OPENABLE;},
		set: function(val){return _CATEGORY_OPENABLE = val;}
	});

	var _CATEGORY_PREFERENCE = null;
	Object.defineProperty(api, 'CATEGORY_PREFERENCE', {
		get: function(){return _CATEGORY_PREFERENCE;},
		set: function(val){return _CATEGORY_PREFERENCE = val;}
	});

	var _CATEGORY_SAMPLE_CODE = null;
	Object.defineProperty(api, 'CATEGORY_SAMPLE_CODE', {
		get: function(){return _CATEGORY_SAMPLE_CODE;},
		set: function(val){return _CATEGORY_SAMPLE_CODE = val;}
	});

	var _CATEGORY_SELECTED_ALTERNATIVE = null;
	Object.defineProperty(api, 'CATEGORY_SELECTED_ALTERNATIVE', {
		get: function(){return _CATEGORY_SELECTED_ALTERNATIVE;},
		set: function(val){return _CATEGORY_SELECTED_ALTERNATIVE = val;}
	});

	var _CATEGORY_TAB = null;
	Object.defineProperty(api, 'CATEGORY_TAB', {
		get: function(){return _CATEGORY_TAB;},
		set: function(val){return _CATEGORY_TAB = val;}
	});

	var _CATEGORY_TEST = null;
	Object.defineProperty(api, 'CATEGORY_TEST', {
		get: function(){return _CATEGORY_TEST;},
		set: function(val){return _CATEGORY_TEST = val;}
	});

	var _CATEGORY_UNIT_TEST = null;
	Object.defineProperty(api, 'CATEGORY_UNIT_TEST', {
		get: function(){return _CATEGORY_UNIT_TEST;},
		set: function(val){return _CATEGORY_UNIT_TEST = val;}
	});

	var _DEFAULT_ALL = null;
	Object.defineProperty(api, 'DEFAULT_ALL', {
		get: function(){return _DEFAULT_ALL;},
		set: function(val){return _DEFAULT_ALL = val;}
	});

	var _DEFAULT_LIGHTS = null;
	Object.defineProperty(api, 'DEFAULT_LIGHTS', {
		get: function(){return _DEFAULT_LIGHTS;},
		set: function(val){return _DEFAULT_LIGHTS = val;}
	});

	var _DEFAULT_SOUND = null;
	Object.defineProperty(api, 'DEFAULT_SOUND', {
		get: function(){return _DEFAULT_SOUND;},
		set: function(val){return _DEFAULT_SOUND = val;}
	});

	var _DEFAULT_VIBRATE = null;
	Object.defineProperty(api, 'DEFAULT_VIBRATE', {
		get: function(){return _DEFAULT_VIBRATE;},
		set: function(val){return _DEFAULT_VIBRATE = val;}
	});

	var _EXTRA_ALARM_COUNT = null;
	Object.defineProperty(api, 'EXTRA_ALARM_COUNT', {
		get: function(){return _EXTRA_ALARM_COUNT;},
		set: function(val){return _EXTRA_ALARM_COUNT = val;}
	});

	var _EXTRA_BCC = null;
	Object.defineProperty(api, 'EXTRA_BCC', {
		get: function(){return _EXTRA_BCC;},
		set: function(val){return _EXTRA_BCC = val;}
	});

	var _EXTRA_CC = null;
	Object.defineProperty(api, 'EXTRA_CC', {
		get: function(){return _EXTRA_CC;},
		set: function(val){return _EXTRA_CC = val;}
	});

	var _EXTRA_DATA_REMOVED = null;
	Object.defineProperty(api, 'EXTRA_DATA_REMOVED', {
		get: function(){return _EXTRA_DATA_REMOVED;},
		set: function(val){return _EXTRA_DATA_REMOVED = val;}
	});

	var _EXTRA_DONT_KILL_APP = null;
	Object.defineProperty(api, 'EXTRA_DONT_KILL_APP', {
		get: function(){return _EXTRA_DONT_KILL_APP;},
		set: function(val){return _EXTRA_DONT_KILL_APP = val;}
	});

	var _EXTRA_EMAIL = null;
	Object.defineProperty(api, 'EXTRA_EMAIL', {
		get: function(){return _EXTRA_EMAIL;},
		set: function(val){return _EXTRA_EMAIL = val;}
	});

	var _EXTRA_INTENT = null;
	Object.defineProperty(api, 'EXTRA_INTENT', {
		get: function(){return _EXTRA_INTENT;},
		set: function(val){return _EXTRA_INTENT = val;}
	});

	var _EXTRA_KEY_EVENT = null;
	Object.defineProperty(api, 'EXTRA_KEY_EVENT', {
		get: function(){return _EXTRA_KEY_EVENT;},
		set: function(val){return _EXTRA_KEY_EVENT = val;}
	});

	var _EXTRA_PHONE_NUMBER = null;
	Object.defineProperty(api, 'EXTRA_PHONE_NUMBER', {
		get: function(){return _EXTRA_PHONE_NUMBER;},
		set: function(val){return _EXTRA_PHONE_NUMBER = val;}
	});

	var _EXTRA_REPLACING = null;
	Object.defineProperty(api, 'EXTRA_REPLACING', {
		get: function(){return _EXTRA_REPLACING;},
		set: function(val){return _EXTRA_REPLACING = val;}
	});

	var _EXTRA_SHORTCUT_ICON = null;
	Object.defineProperty(api, 'EXTRA_SHORTCUT_ICON', {
		get: function(){return _EXTRA_SHORTCUT_ICON;},
		set: function(val){return _EXTRA_SHORTCUT_ICON = val;}
	});

	var _EXTRA_SHORTCUT_ICON_RESOURCE = null;
	Object.defineProperty(api, 'EXTRA_SHORTCUT_ICON_RESOURCE', {
		get: function(){return _EXTRA_SHORTCUT_ICON_RESOURCE;},
		set: function(val){return _EXTRA_SHORTCUT_ICON_RESOURCE = val;}
	});

	var _EXTRA_SHORTCUT_INTENT = null;
	Object.defineProperty(api, 'EXTRA_SHORTCUT_INTENT', {
		get: function(){return _EXTRA_SHORTCUT_INTENT;},
		set: function(val){return _EXTRA_SHORTCUT_INTENT = val;}
	});

	var _EXTRA_SHORTCUT_NAME = null;
	Object.defineProperty(api, 'EXTRA_SHORTCUT_NAME', {
		get: function(){return _EXTRA_SHORTCUT_NAME;},
		set: function(val){return _EXTRA_SHORTCUT_NAME = val;}
	});

	var _EXTRA_STREAM = null;
	Object.defineProperty(api, 'EXTRA_STREAM', {
		get: function(){return _EXTRA_STREAM;},
		set: function(val){return _EXTRA_STREAM = val;}
	});

	var _EXTRA_SUBJECT = null;
	Object.defineProperty(api, 'EXTRA_SUBJECT', {
		get: function(){return _EXTRA_SUBJECT;},
		set: function(val){return _EXTRA_SUBJECT = val;}
	});

	var _EXTRA_TEMPLATE = null;
	Object.defineProperty(api, 'EXTRA_TEMPLATE', {
		get: function(){return _EXTRA_TEMPLATE;},
		set: function(val){return _EXTRA_TEMPLATE = val;}
	});

	var _EXTRA_TEXT = null;
	Object.defineProperty(api, 'EXTRA_TEXT', {
		get: function(){return _EXTRA_TEXT;},
		set: function(val){return _EXTRA_TEXT = val;}
	});

	var _EXTRA_TITLE = null;
	Object.defineProperty(api, 'EXTRA_TITLE', {
		get: function(){return _EXTRA_TITLE;},
		set: function(val){return _EXTRA_TITLE = val;}
	});

	var _EXTRA_UID = null;
	Object.defineProperty(api, 'EXTRA_UID', {
		get: function(){return _EXTRA_UID;},
		set: function(val){return _EXTRA_UID = val;}
	});

	var _FILL_IN_ACTION = null;
	Object.defineProperty(api, 'FILL_IN_ACTION', {
		get: function(){return _FILL_IN_ACTION;},
		set: function(val){return _FILL_IN_ACTION = val;}
	});

	var _FILL_IN_CATEGORIES = null;
	Object.defineProperty(api, 'FILL_IN_CATEGORIES', {
		get: function(){return _FILL_IN_CATEGORIES;},
		set: function(val){return _FILL_IN_CATEGORIES = val;}
	});

	var _FILL_IN_COMPONENT = null;
	Object.defineProperty(api, 'FILL_IN_COMPONENT', {
		get: function(){return _FILL_IN_COMPONENT;},
		set: function(val){return _FILL_IN_COMPONENT = val;}
	});

	var _FILL_IN_DATA = null;
	Object.defineProperty(api, 'FILL_IN_DATA', {
		get: function(){return _FILL_IN_DATA;},
		set: function(val){return _FILL_IN_DATA = val;}
	});

	var _FILL_IN_PACKAGE = null;
	Object.defineProperty(api, 'FILL_IN_PACKAGE', {
		get: function(){return _FILL_IN_PACKAGE;},
		set: function(val){return _FILL_IN_PACKAGE = val;}
	});

	var _FLAG_ACTIVITY_BROUGHT_TO_FRONT = null;
	Object.defineProperty(api, 'FLAG_ACTIVITY_BROUGHT_TO_FRONT', {
		get: function(){return _FLAG_ACTIVITY_BROUGHT_TO_FRONT;},
		set: function(val){return _FLAG_ACTIVITY_BROUGHT_TO_FRONT = val;}
	});

	var _FLAG_ACTIVITY_CLEAR_TOP = null;
	Object.defineProperty(api, 'FLAG_ACTIVITY_CLEAR_TOP', {
		get: function(){return _FLAG_ACTIVITY_CLEAR_TOP;},
		set: function(val){return _FLAG_ACTIVITY_CLEAR_TOP = val;}
	});

	var _FLAG_ACTIVITY_CLEAR_WHEN_TASK_RESET = null;
	Object.defineProperty(api, 'FLAG_ACTIVITY_CLEAR_WHEN_TASK_RESET', {
		get: function(){return _FLAG_ACTIVITY_CLEAR_WHEN_TASK_RESET;},
		set: function(val){return _FLAG_ACTIVITY_CLEAR_WHEN_TASK_RESET = val;}
	});

	var _FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS = null;
	Object.defineProperty(api, 'FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS', {
		get: function(){return _FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS;},
		set: function(val){return _FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS = val;}
	});

	var _FLAG_ACTIVITY_FORWARD_RESULT = null;
	Object.defineProperty(api, 'FLAG_ACTIVITY_FORWARD_RESULT', {
		get: function(){return _FLAG_ACTIVITY_FORWARD_RESULT;},
		set: function(val){return _FLAG_ACTIVITY_FORWARD_RESULT = val;}
	});

	var _FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY = null;
	Object.defineProperty(api, 'FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY', {
		get: function(){return _FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY;},
		set: function(val){return _FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY = val;}
	});

	var _FLAG_ACTIVITY_MULTIPLE_TASK = null;
	Object.defineProperty(api, 'FLAG_ACTIVITY_MULTIPLE_TASK', {
		get: function(){return _FLAG_ACTIVITY_MULTIPLE_TASK;},
		set: function(val){return _FLAG_ACTIVITY_MULTIPLE_TASK = val;}
	});

	var _FLAG_ACTIVITY_NEW_TASK = null;
	Object.defineProperty(api, 'FLAG_ACTIVITY_NEW_TASK', {
		get: function(){return _FLAG_ACTIVITY_NEW_TASK;},
		set: function(val){return _FLAG_ACTIVITY_NEW_TASK = val;}
	});

	var _FLAG_ACTIVITY_NO_HISTORY = null;
	Object.defineProperty(api, 'FLAG_ACTIVITY_NO_HISTORY', {
		get: function(){return _FLAG_ACTIVITY_NO_HISTORY;},
		set: function(val){return _FLAG_ACTIVITY_NO_HISTORY = val;}
	});

	var _FLAG_ACTIVITY_NO_USER_ACTION = null;
	Object.defineProperty(api, 'FLAG_ACTIVITY_NO_USER_ACTION', {
		get: function(){return _FLAG_ACTIVITY_NO_USER_ACTION;},
		set: function(val){return _FLAG_ACTIVITY_NO_USER_ACTION = val;}
	});

	var _FLAG_ACTIVITY_PREVIOUS_IS_TOP = null;
	Object.defineProperty(api, 'FLAG_ACTIVITY_PREVIOUS_IS_TOP', {
		get: function(){return _FLAG_ACTIVITY_PREVIOUS_IS_TOP;},
		set: function(val){return _FLAG_ACTIVITY_PREVIOUS_IS_TOP = val;}
	});

	var _FLAG_ACTIVITY_REORDER_TO_FRONT = null;
	Object.defineProperty(api, 'FLAG_ACTIVITY_REORDER_TO_FRONT', {
		get: function(){return _FLAG_ACTIVITY_REORDER_TO_FRONT;},
		set: function(val){return _FLAG_ACTIVITY_REORDER_TO_FRONT = val;}
	});

	var _FLAG_ACTIVITY_RESET_TASK_IF_NEEDED = null;
	Object.defineProperty(api, 'FLAG_ACTIVITY_RESET_TASK_IF_NEEDED', {
		get: function(){return _FLAG_ACTIVITY_RESET_TASK_IF_NEEDED;},
		set: function(val){return _FLAG_ACTIVITY_RESET_TASK_IF_NEEDED = val;}
	});

	var _FLAG_ACTIVITY_SINGLE_TOP = null;
	Object.defineProperty(api, 'FLAG_ACTIVITY_SINGLE_TOP', {
		get: function(){return _FLAG_ACTIVITY_SINGLE_TOP;},
		set: function(val){return _FLAG_ACTIVITY_SINGLE_TOP = val;}
	});

	var _FLAG_AUTO_CANCEL = null;
	Object.defineProperty(api, 'FLAG_AUTO_CANCEL', {
		get: function(){return _FLAG_AUTO_CANCEL;},
		set: function(val){return _FLAG_AUTO_CANCEL = val;}
	});

	var _FLAG_CANCEL_CURRENT = null;
	Object.defineProperty(api, 'FLAG_CANCEL_CURRENT', {
		get: function(){return _FLAG_CANCEL_CURRENT;},
		set: function(val){return _FLAG_CANCEL_CURRENT = val;}
	});

	var _FLAG_DEBUG_LOG_RESOLUTION = null;
	Object.defineProperty(api, 'FLAG_DEBUG_LOG_RESOLUTION', {
		get: function(){return _FLAG_DEBUG_LOG_RESOLUTION;},
		set: function(val){return _FLAG_DEBUG_LOG_RESOLUTION = val;}
	});

	var _FLAG_FROM_BACKGROUND = null;
	Object.defineProperty(api, 'FLAG_FROM_BACKGROUND', {
		get: function(){return _FLAG_FROM_BACKGROUND;},
		set: function(val){return _FLAG_FROM_BACKGROUND = val;}
	});

	var _FLAG_GRANT_READ_URI_PERMISSION = null;
	Object.defineProperty(api, 'FLAG_GRANT_READ_URI_PERMISSION', {
		get: function(){return _FLAG_GRANT_READ_URI_PERMISSION;},
		set: function(val){return _FLAG_GRANT_READ_URI_PERMISSION = val;}
	});

	var _FLAG_GRANT_WRITE_URI_PERMISSION = null;
	Object.defineProperty(api, 'FLAG_GRANT_WRITE_URI_PERMISSION', {
		get: function(){return _FLAG_GRANT_WRITE_URI_PERMISSION;},
		set: function(val){return _FLAG_GRANT_WRITE_URI_PERMISSION = val;}
	});

	var _FLAG_INSISTENT = null;
	Object.defineProperty(api, 'FLAG_INSISTENT', {
		get: function(){return _FLAG_INSISTENT;},
		set: function(val){return _FLAG_INSISTENT = val;}
	});

	var _FLAG_NO_CLEAR = null;
	Object.defineProperty(api, 'FLAG_NO_CLEAR', {
		get: function(){return _FLAG_NO_CLEAR;},
		set: function(val){return _FLAG_NO_CLEAR = val;}
	});

	var _FLAG_NO_CREATE = null;
	Object.defineProperty(api, 'FLAG_NO_CREATE', {
		get: function(){return _FLAG_NO_CREATE;},
		set: function(val){return _FLAG_NO_CREATE = val;}
	});

	var _FLAG_ONE_SHOT = null;
	Object.defineProperty(api, 'FLAG_ONE_SHOT', {
		get: function(){return _FLAG_ONE_SHOT;},
		set: function(val){return _FLAG_ONE_SHOT = val;}
	});

	var _FLAG_ONGOING_EVENT = null;
	Object.defineProperty(api, 'FLAG_ONGOING_EVENT', {
		get: function(){return _FLAG_ONGOING_EVENT;},
		set: function(val){return _FLAG_ONGOING_EVENT = val;}
	});

	var _FLAG_ONLY_ALERT_ONCE = null;
	Object.defineProperty(api, 'FLAG_ONLY_ALERT_ONCE', {
		get: function(){return _FLAG_ONLY_ALERT_ONCE;},
		set: function(val){return _FLAG_ONLY_ALERT_ONCE = val;}
	});

	var _FLAG_RECEIVER_REGISTERED_ONLY = null;
	Object.defineProperty(api, 'FLAG_RECEIVER_REGISTERED_ONLY', {
		get: function(){return _FLAG_RECEIVER_REGISTERED_ONLY;},
		set: function(val){return _FLAG_RECEIVER_REGISTERED_ONLY = val;}
	});

	var _FLAG_SHOW_LIGHTS = null;
	Object.defineProperty(api, 'FLAG_SHOW_LIGHTS', {
		get: function(){return _FLAG_SHOW_LIGHTS;},
		set: function(val){return _FLAG_SHOW_LIGHTS = val;}
	});

	var _FLAG_UPDATE_CURRENT = null;
	Object.defineProperty(api, 'FLAG_UPDATE_CURRENT', {
		get: function(){return _FLAG_UPDATE_CURRENT;},
		set: function(val){return _FLAG_UPDATE_CURRENT = val;}
	});

	var _PENDING_INTENT_FOR_ACTIVITY = null;
	Object.defineProperty(api, 'PENDING_INTENT_FOR_ACTIVITY', {
		get: function(){return _PENDING_INTENT_FOR_ACTIVITY;},
		set: function(val){return _PENDING_INTENT_FOR_ACTIVITY = val;}
	});

	var _PENDING_INTENT_FOR_BROADCAST = null;
	Object.defineProperty(api, 'PENDING_INTENT_FOR_BROADCAST', {
		get: function(){return _PENDING_INTENT_FOR_BROADCAST;},
		set: function(val){return _PENDING_INTENT_FOR_BROADCAST = val;}
	});

	var _PENDING_INTENT_FOR_SERVICE = null;
	Object.defineProperty(api, 'PENDING_INTENT_FOR_SERVICE', {
		get: function(){return _PENDING_INTENT_FOR_SERVICE;},
		set: function(val){return _PENDING_INTENT_FOR_SERVICE = val;}
	});

	var _PENDING_INTENT_MAX_VALUE = null;
	Object.defineProperty(api, 'PENDING_INTENT_MAX_VALUE', {
		get: function(){return _PENDING_INTENT_MAX_VALUE;},
		set: function(val){return _PENDING_INTENT_MAX_VALUE = val;}
	});

	var _RESULT_CANCELED = null;
	Object.defineProperty(api, 'RESULT_CANCELED', {
		get: function(){return _RESULT_CANCELED;},
		set: function(val){return _RESULT_CANCELED = val;}
	});

	var _RESULT_FIRST_USER = null;
	Object.defineProperty(api, 'RESULT_FIRST_USER', {
		get: function(){return _RESULT_FIRST_USER;},
		set: function(val){return _RESULT_FIRST_USER = val;}
	});

	var _RESULT_OK = null;
	Object.defineProperty(api, 'RESULT_OK', {
		get: function(){return _RESULT_OK;},
		set: function(val){return _RESULT_OK = val;}
	});

	var _SCREEN_ORIENTATION_BEHIND = null;
	Object.defineProperty(api, 'SCREEN_ORIENTATION_BEHIND', {
		get: function(){return _SCREEN_ORIENTATION_BEHIND;},
		set: function(val){return _SCREEN_ORIENTATION_BEHIND = val;}
	});

	var _SCREEN_ORIENTATION_LANDSCAPE = null;
	Object.defineProperty(api, 'SCREEN_ORIENTATION_LANDSCAPE', {
		get: function(){return _SCREEN_ORIENTATION_LANDSCAPE;},
		set: function(val){return _SCREEN_ORIENTATION_LANDSCAPE = val;}
	});

	var _SCREEN_ORIENTATION_NOSENSOR = null;
	Object.defineProperty(api, 'SCREEN_ORIENTATION_NOSENSOR', {
		get: function(){return _SCREEN_ORIENTATION_NOSENSOR;},
		set: function(val){return _SCREEN_ORIENTATION_NOSENSOR = val;}
	});

	var _SCREEN_ORIENTATION_PORTRAIT = null;
	Object.defineProperty(api, 'SCREEN_ORIENTATION_PORTRAIT', {
		get: function(){return _SCREEN_ORIENTATION_PORTRAIT;},
		set: function(val){return _SCREEN_ORIENTATION_PORTRAIT = val;}
	});

	var _SCREEN_ORIENTATION_SENSOR = null;
	Object.defineProperty(api, 'SCREEN_ORIENTATION_SENSOR', {
		get: function(){return _SCREEN_ORIENTATION_SENSOR;},
		set: function(val){return _SCREEN_ORIENTATION_SENSOR = val;}
	});

	var _SCREEN_ORIENTATION_UNSPECIFIED = null;
	Object.defineProperty(api, 'SCREEN_ORIENTATION_UNSPECIFIED', {
		get: function(){return _SCREEN_ORIENTATION_UNSPECIFIED;},
		set: function(val){return _SCREEN_ORIENTATION_UNSPECIFIED = val;}
	});

	var _SCREEN_ORIENTATION_USER = null;
	Object.defineProperty(api, 'SCREEN_ORIENTATION_USER', {
		get: function(){return _SCREEN_ORIENTATION_USER;},
		set: function(val){return _SCREEN_ORIENTATION_USER = val;}
	});

	var _STREAM_DEFAULT = null;
	Object.defineProperty(api, 'STREAM_DEFAULT', {
		get: function(){return _STREAM_DEFAULT;},
		set: function(val){return _STREAM_DEFAULT = val;}
	});

	var _URI_INTENT_SCHEME = null;
	Object.defineProperty(api, 'URI_INTENT_SCHEME', {
		get: function(){return _URI_INTENT_SCHEME;},
		set: function(val){return _URI_INTENT_SCHEME = val;}
	});

	// Methods
	api.createBroadcastIntent = function(){
		console.debug('Method "Titanium.Android..createBroadcastIntent" is not implemented yet.');
	};
	api.createIntent = function(){
		console.debug('Method "Titanium.Android..createIntent" is not implemented yet.');
	};
	api.createIntentChooser = function(){
		console.debug('Method "Titanium.Android..createIntentChooser" is not implemented yet.');
	};
	api.createNotification = function(){
		console.debug('Method "Titanium.Android..createNotification" is not implemented yet.');
	};
	api.createPendingIntent = function(){
		console.debug('Method "Titanium.Android..createPendingIntent" is not implemented yet.');
	};
	api.createService = function(){
		console.debug('Method "Titanium.Android..createService" is not implemented yet.');
	};
	api.createServiceIntent = function(){
		console.debug('Method "Titanium.Android..createServiceIntent" is not implemented yet.');
	};
	api.isServiceRunning = function(){
		console.debug('Method "Titanium.Android..isServiceRunning" is not implemented yet.');
	};
	api.startService = function(){
		console.debug('Method "Titanium.Android..startService" is not implemented yet.');
	};
	api.stopService = function(){
		console.debug('Method "Titanium.Android..stopService" is not implemented yet.');
	};
})(Ti._5.createClass('Titanium.Android'));