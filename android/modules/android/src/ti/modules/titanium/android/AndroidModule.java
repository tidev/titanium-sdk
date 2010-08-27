/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.android;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiContext;

import android.app.Activity;
import android.app.AlarmManager;
import android.content.Intent;

public class AndroidModule extends TiModule
{
	private static final String LCAT = "TiAndroid";

	protected static final int PENDING_INTENT_FOR_ACTIVITY = 0;
	protected static final int PENDING_INTENT_FOR_SERVICE = 1;
	protected static final int PENDING_INTENT_FOR_BROADCAST = 2;
	protected static final int PENDING_INTENT_MAX_VALUE = PENDING_INTENT_FOR_SERVICE;
	
	private static KrollDict constants;


	public AndroidModule(TiContext tiContext) {
		super(tiContext);
	}


	@Override
	public KrollDict getConstants()
	{
		if (constants == null) {
			constants = new KrollDict();

			constants.put("ACTION_AIRPLANE_MODE_CHANGED", Intent.ACTION_AIRPLANE_MODE_CHANGED);
			constants.put("ACTION_ALL_APPS", Intent.ACTION_ALL_APPS);
			constants.put("ACTION_ANSWER", Intent.ACTION_ANSWER);
			constants.put("ACTION_ATTACH_DATA", Intent.ACTION_ATTACH_DATA);
			constants.put("ACTION_BATTERY_CHANGED", Intent.ACTION_BATTERY_CHANGED);
			constants.put("ACTION_BATTERY_LOW", Intent.ACTION_BATTERY_LOW);
			constants.put("ACTION_BATTERY_OKAY", Intent.ACTION_BATTERY_OKAY);
			constants.put("ACTION_BOOT_COMPLETED", Intent.ACTION_BOOT_COMPLETED);
			constants.put("ACTION_BUG_REPORT", Intent.ACTION_BUG_REPORT);
			constants.put("ACTION_CALL", Intent.ACTION_CALL);
			constants.put("ACTION_CALL_BUTTON", Intent.ACTION_CALL_BUTTON);
			constants.put("ACTION_CAMERA_BUTTON", Intent.ACTION_CAMERA_BUTTON);
			constants.put("ACTION_CHOOSER", Intent.ACTION_CHOOSER);
			constants.put("ACTION_CLOSE_SYSTEM_DIALOGS", Intent.ACTION_CLOSE_SYSTEM_DIALOGS);
			constants.put("ACTION_CONFIGURATION_CHANGED", Intent.ACTION_CONFIGURATION_CHANGED);
			constants.put("ACTION_CREATE_SHORTCUT", Intent.ACTION_CREATE_SHORTCUT);
			constants.put("ACTION_DATE_CHANGED", Intent.ACTION_DATE_CHANGED);
			constants.put("ACTION_DEFAULT", Intent.ACTION_DEFAULT);
			constants.put("ACTION_DELETE", Intent.ACTION_DELETE);
			constants.put("ACTION_DEVICE_STORAGE_LOW", Intent.ACTION_DEVICE_STORAGE_LOW);
			constants.put("ACTION_DIAL", Intent.ACTION_DIAL);
			constants.put("ACTION_EDIT", Intent.ACTION_EDIT);
			constants.put("ACTION_GET_CONTENT", Intent.ACTION_GET_CONTENT);
			constants.put("ACTION_GTALK_SERVICE_CONNECTED", Intent.ACTION_GTALK_SERVICE_CONNECTED);
			constants.put("ACTION_GTALK_SERVICE_DISCONNECTED", Intent.ACTION_GTALK_SERVICE_DISCONNECTED);
			constants.put("ACTION_HEADSET_PLUG", Intent.ACTION_HEADSET_PLUG);
			constants.put("ACTION_INPUT_METHOD_CHANGED", Intent.ACTION_INPUT_METHOD_CHANGED);
			constants.put("ACTION_INSERT", Intent.ACTION_INSERT);
			constants.put("ACTION_INSERT_OR_EDIT", Intent.ACTION_INSERT_OR_EDIT);
			constants.put("ACTION_MAIN", Intent.ACTION_MAIN);
			constants.put("ACTION_MANAGE_PACKAGE_STORAGE", Intent.ACTION_MANAGE_PACKAGE_STORAGE);
			constants.put("ACTION_MEDIA_BAD_REMOVAL", Intent.ACTION_MEDIA_BAD_REMOVAL);
			constants.put("ACTION_MEDIA_BUTTON", Intent.ACTION_MEDIA_BUTTON);
			constants.put("ACTION_MEDIA_CHECKING", Intent.ACTION_MEDIA_CHECKING);
			constants.put("ACTION_MEDIA_EJECT", Intent.ACTION_MEDIA_EJECT);
			constants.put("ACTION_MEDIA_MOUNTED", Intent.ACTION_MEDIA_MOUNTED);
			constants.put("ACTION_MEDIA_NOFS", Intent.ACTION_MEDIA_NOFS);
			constants.put("ACTION_MEDIA_REMOVED", Intent.ACTION_MEDIA_REMOVED);
			constants.put("ACTION_MEDIA_SCANNER_FINISHED", Intent.ACTION_MEDIA_SCANNER_FINISHED);
			constants.put("ACTION_MEDIA_SCANNER_SCAN_FILE", Intent.ACTION_MEDIA_SCANNER_SCAN_FILE);
			constants.put("ACTION_MEDIA_SCANNER_STARTED", Intent.ACTION_MEDIA_SCANNER_STARTED);
			constants.put("ACTION_MEDIA_SHARED", Intent.ACTION_MEDIA_SHARED);
			constants.put("ACTION_MEDIA_UNMOUNTABLE", Intent.ACTION_MEDIA_UNMOUNTABLE);
			constants.put("ACTION_MEDIA_UNMOUNTED", Intent.ACTION_MEDIA_UNMOUNTED);
			constants.put("ACTION_NEW_OUTGOING_CALL", Intent.ACTION_NEW_OUTGOING_CALL);
			constants.put("ACTION_PACKAGE_ADDED", Intent.ACTION_PACKAGE_ADDED);
			constants.put("ACTION_PACKAGE_CHANGED", Intent.ACTION_PACKAGE_CHANGED);
			constants.put("ACTION_PACKAGE_DATA_CLEARED", Intent.ACTION_PACKAGE_DATA_CLEARED);
			constants.put("ACTION_PACKAGE_INSTALL", Intent.ACTION_PACKAGE_INSTALL);
			constants.put("ACTION_PACKAGE_REMOVED", Intent.ACTION_PACKAGE_REMOVED);
			constants.put("ACTION_PACKAGE_REPLACED", Intent.ACTION_PACKAGE_REPLACED);
			constants.put("ACTION_PACKAGE_RESTARTED", Intent.ACTION_PACKAGE_RESTARTED);
			constants.put("ACTION_PICK", Intent.ACTION_PICK);
			constants.put("ACTION_PICK_ACTIVITY", Intent.ACTION_PICK_ACTIVITY);
			constants.put("ACTION_POWER_CONNECTED", Intent.ACTION_POWER_CONNECTED);
			constants.put("ACTION_POWER_DISCONNECTED", Intent.ACTION_POWER_DISCONNECTED);
			constants.put("ACTION_POWER_USAGE_SUMMARY", Intent.ACTION_POWER_USAGE_SUMMARY);
			constants.put("ACTION_PROVIDER_CHANGED", Intent.ACTION_PROVIDER_CHANGED);
			constants.put("ACTION_REBOOT", Intent.ACTION_REBOOT);
			constants.put("ACTION_RUN", Intent.ACTION_RUN);
			constants.put("ACTION_SCREEN_OFF", Intent.ACTION_SCREEN_OFF);
			constants.put("ACTION_SCREEN_ON", Intent.ACTION_SCREEN_ON);
			constants.put("ACTION_SEARCH", Intent.ACTION_SEARCH);
			constants.put("ACTION_SEARCH_LONG_PRESS", Intent.ACTION_SEARCH_LONG_PRESS);
			constants.put("ACTION_SEND", Intent.ACTION_SEND);
			constants.put("ACTION_SENDTO", Intent.ACTION_SENDTO);
			constants.put("ACTION_SEND_MULTIPLE", Intent.ACTION_SEND_MULTIPLE);
			constants.put("ACTION_SET_WALLPAPER", Intent.ACTION_SET_WALLPAPER);
			constants.put("ACTION_SHUTDOWN", Intent.ACTION_SHUTDOWN);
			constants.put("ACTION_SYNC", Intent.ACTION_SYNC);
			constants.put("ACTION_SYSTEM_TUTORIAL", Intent.ACTION_SYSTEM_TUTORIAL);
			constants.put("ACTION_TIME_CHANGED", Intent.ACTION_TIME_CHANGED);
			constants.put("ACTION_TIME_TICK", Intent.ACTION_TIME_TICK);
			constants.put("ACTION_UID_REMOVED", Intent.ACTION_UID_REMOVED);
			constants.put("ACTION_UMS_CONNECTED", Intent.ACTION_UMS_CONNECTED);
			constants.put("ACTION_UMS_DISCONNECTED", Intent.ACTION_UMS_DISCONNECTED);
			constants.put("ACTION_USER_PRESENT", Intent.ACTION_USER_PRESENT);
			constants.put("ACTION_VIEW", Intent.ACTION_VIEW);
			constants.put("ACTION_VOICE_COMMAND", Intent.ACTION_VOICE_COMMAND);
			constants.put("ACTION_WALLPAPER_CHANGED", Intent.ACTION_WALLPAPER_CHANGED);
			constants.put("ACTION_WEB_SEARCH", Intent.ACTION_WEB_SEARCH);

			constants.put("CATEGORY_ALTERNATIVE", Intent.CATEGORY_ALTERNATIVE);
			constants.put("CATEGORY_BROWSABLE", Intent.CATEGORY_BROWSABLE);
			constants.put("CATEGORY_DEFAULT", Intent.CATEGORY_DEFAULT);
			constants.put("CATEGORY_DEVELOPMENT_PREFERENCE", Intent.CATEGORY_DEVELOPMENT_PREFERENCE);
			constants.put("CATEGORY_EMBED", Intent.CATEGORY_EMBED);
			constants.put("CATEGORY_FRAMEWORK_INSTRUMENTATION_TEST", Intent.CATEGORY_FRAMEWORK_INSTRUMENTATION_TEST);
			constants.put("CATEGORY_HOME", Intent.CATEGORY_HOME);
			constants.put("CATEGORY_INFO", Intent.CATEGORY_INFO);
			constants.put("CATEGORY_LAUNCHER", Intent.CATEGORY_LAUNCHER);
			constants.put("CATEGORY_MONKEY", Intent.CATEGORY_MONKEY);
			constants.put("CATEGORY_OPENABLE", Intent.CATEGORY_OPENABLE);
			constants.put("CATEGORY_PREFERENCE", Intent.CATEGORY_PREFERENCE);
			constants.put("CATEGORY_SAMPLE_CODE", Intent.CATEGORY_SAMPLE_CODE);
			constants.put("CATEGORY_SELECTED_ALTERNATIVE", Intent.CATEGORY_SELECTED_ALTERNATIVE);
			constants.put("CATEGORY_TAB", Intent.CATEGORY_TAB);
			constants.put("CATEGORY_TEST", Intent.CATEGORY_TEST);
			constants.put("CATEGORY_UNIT_TEST", Intent.CATEGORY_UNIT_TEST);
			
			constants.put("EXTRA_ALARM_COUNT", Intent.EXTRA_ALARM_COUNT);
			constants.put("EXTRA_BCC", Intent.EXTRA_BCC);
			constants.put("EXTRA_CC", Intent.EXTRA_CC);
			constants.put("EXTRA_DATA_REMOVED", Intent.EXTRA_DATA_REMOVED);
			constants.put("EXTRA_DONT_KILL_APP", Intent.EXTRA_DONT_KILL_APP);
			constants.put("EXTRA_EMAIL", Intent.EXTRA_EMAIL);
			constants.put("EXTRA_INTENT", Intent.EXTRA_INTENT);
			constants.put("EXTRA_KEY_EVENT", Intent.EXTRA_KEY_EVENT);
			constants.put("EXTRA_PHONE_NUMBER", Intent.EXTRA_PHONE_NUMBER);
			constants.put("EXTRA_REPLACING", Intent.EXTRA_REPLACING);
			constants.put("EXTRA_SHORTCUT_ICON", Intent.EXTRA_SHORTCUT_ICON);
			constants.put("EXTRA_SHORTCUT_ICON_RESOURCE", Intent.EXTRA_SHORTCUT_ICON_RESOURCE);
			constants.put("EXTRA_SHORTCUT_INTENT", Intent.EXTRA_SHORTCUT_INTENT);
			constants.put("EXTRA_SHORTCUT_NAME", Intent.EXTRA_SHORTCUT_NAME);
			constants.put("EXTRA_STREAM", Intent.EXTRA_STREAM);
			constants.put("EXTRA_SUBJECT", Intent.EXTRA_SUBJECT);
			constants.put("EXTRA_TEMPLATE", Intent.EXTRA_TEMPLATE);
			constants.put("EXTRA_TEXT", Intent.EXTRA_TEXT);
			constants.put("EXTRA_TITLE", Intent.EXTRA_TITLE);
			constants.put("EXTRA_UID", Intent.EXTRA_UID);

			constants.put("FILL_IN_ACTION", Intent.FILL_IN_ACTION);
			constants.put("FILL_IN_CATEGORIES", Intent.FILL_IN_CATEGORIES);
			constants.put("FILL_IN_COMPONENT", Intent.FILL_IN_COMPONENT);
			constants.put("FILL_IN_DATA", Intent.FILL_IN_DATA);
			constants.put("FILL_IN_PACKAGE", Intent.FILL_IN_PACKAGE);

			constants.put("FLAG_ACTIVITY_BROUGHT_TO_FRONT", Intent.FLAG_ACTIVITY_BROUGHT_TO_FRONT);
			constants.put("FLAG_ACTIVITY_CLEAR_TOP", Intent.FLAG_ACTIVITY_CLEAR_TOP);
			constants.put("FLAG_ACTIVITY_CLEAR_WHEN_TASK_RESET", Intent.FLAG_ACTIVITY_CLEAR_WHEN_TASK_RESET);
			constants.put("FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS", Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS);
			constants.put("FLAG_ACTIVITY_FORWARD_RESULT", Intent.FLAG_ACTIVITY_FORWARD_RESULT);
			constants.put("FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY", Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY);
			constants.put("FLAG_ACTIVITY_MULTIPLE_TASK", Intent.FLAG_ACTIVITY_MULTIPLE_TASK);
			constants.put("FLAG_ACTIVITY_NEW_TASK", Intent.FLAG_ACTIVITY_NEW_TASK);
			constants.put("FLAG_ACTIVITY_NO_HISTORY", Intent.FLAG_ACTIVITY_NO_HISTORY);
			constants.put("FLAG_ACTIVITY_NO_USER_ACTION", Intent.FLAG_ACTIVITY_NO_USER_ACTION);
			constants.put("FLAG_ACTIVITY_PREVIOUS_IS_TOP", Intent.FLAG_ACTIVITY_PREVIOUS_IS_TOP);
			constants.put("FLAG_ACTIVITY_REORDER_TO_FRONT", Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
			constants.put("FLAG_ACTIVITY_RESET_TASK_IF_NEEDED", Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
			constants.put("FLAG_ACTIVITY_SINGLE_TOP", Intent.FLAG_ACTIVITY_SINGLE_TOP);
			constants.put("FLAG_DEBUG_LOG_RESOLUTION", Intent.FLAG_DEBUG_LOG_RESOLUTION);
			constants.put("FLAG_FROM_BACKGROUND", Intent.FLAG_FROM_BACKGROUND);
			constants.put("FLAG_GRANT_READ_URI_PERMISSION", Intent.FLAG_GRANT_READ_URI_PERMISSION);
			constants.put("FLAG_GRANT_WRITE_URI_PERMISSION", Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
			constants.put("FLAG_RECEIVER_REGISTERED_ONLY", Intent.FLAG_RECEIVER_REGISTERED_ONLY);

			constants.put("URI_INTENT_SCHEME", Intent.URI_INTENT_SCHEME);
			
			constants.put("PENDING_INTENT_FOR_ACTIVITY", PENDING_INTENT_FOR_ACTIVITY);
			constants.put("PENDING_INTENT_FOR_BROADCAST", PENDING_INTENT_FOR_BROADCAST);
			constants.put("PENDING_INTENT_FOR_SERVICE", PENDING_INTENT_FOR_SERVICE);
		}

		return constants;
	}

	public void registerAlarm(PendingIntentProxy proxy) 
	{
		AlarmManager am = (AlarmManager) getTiContext().getActivity().getApplication().getSystemService(Activity.ALARM_SERVICE);
		am.set(AlarmManager.RTC_WAKEUP, System.currentTimeMillis() + 5000, proxy.getPendingIntent());
	}
}
