/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.android.notificationmanager;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;

import ti.modules.titanium.android.AndroidModule;

import android.annotation.TargetApi;
import android.app.NotificationChannel;
import android.os.Build;

@TargetApi(26)
// clang-format off
@Kroll.proxy(propertyAccessors = {
	TiC.PROPERTY_BYPASS_DND,
	TiC.PROPERTY_DESCRIPTION,
	TiC.PROPERTY_ENABLE_LIGHTS,
	TiC.PROPERTY_ENABLE_VIBRATION,
	TiC.PROPERTY_GROUP_ID,
	TiC.PROPERTY_IMPORTANCE,
	TiC.PROPERTY_LIGHT_COLOR,
	TiC.PROPERTY_LOCKSCREEN_VISIBILITY,
	TiC.PROPERTY_NAME,
	TiC.PROPERTY_SHOW_BADGE,
	TiC.PROPERTY_VIBRATE_PATTERN
})
// clang-format on
public class NotificationChannelProxy extends KrollProxy
{
	private static final String TAG = "TiNotificationChannel";

	private NotificationChannel channel = null;

	public NotificationChannelProxy()
	{
		super();
	}

	@Override
	public void handleCreationDict(KrollDict d)
	{
		super.handleCreationDict(d);
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && d != null && d.containsKey(TiC.PROPERTY_ID)
			&& d.containsKey(TiC.PROPERTY_NAME) && d.containsKey(TiC.PROPERTY_IMPORTANCE)) {

			channel = new NotificationChannel(d.getString(TiC.PROPERTY_ID), d.getString(TiC.PROPERTY_NAME),
											  d.getInt(TiC.PROPERTY_IMPORTANCE));

			if (d.containsKey(TiC.PROPERTY_BYPASS_DND)) {
				setBypassDnd(d.getBoolean(TiC.PROPERTY_BYPASS_DND));
			}
			if (d.containsKey(TiC.PROPERTY_DESCRIPTION)) {
				setDescription(d.getString(TiC.PROPERTY_DESCRIPTION));
			}
			if (d.containsKey(TiC.PROPERTY_ENABLE_LIGHTS)) {
				setEnableLights(d.getBoolean(TiC.PROPERTY_ENABLE_LIGHTS));
			}
			if (d.containsKey(TiC.PROPERTY_ENABLE_VIBRATION)) {
				setEnableVibration(d.getBoolean(TiC.PROPERTY_ENABLE_VIBRATION));
			}
			if (d.containsKey(TiC.PROPERTY_GROUP_ID)) {
				setGroupId(d.getString(TiC.PROPERTY_GROUP_ID));
			}
			if (d.containsKey(TiC.PROPERTY_LIGHT_COLOR)) {
				setLightColor(d.getInt(TiC.PROPERTY_LIGHT_COLOR));
			}
			if (d.containsKey(TiC.PROPERTY_LOCKSCREEN_VISIBILITY)) {
				setLockscreenVisibility(d.getInt(TiC.PROPERTY_LOCKSCREEN_VISIBILITY));
			}
			if (d.containsKey(TiC.PROPERTY_SHOW_BADGE)) {
				setShowBadge(d.getBoolean(TiC.PROPERTY_SHOW_BADGE));
			}
			if (d.containsKey(TiC.PROPERTY_VIBRATE_PATTERN)) {
				setVibrationPattern(d.get(TiC.PROPERTY_VIBRATE_PATTERN));
			}
		} else {
			Log.e(TAG, "could not create notification channel");
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getId()
	// clang-format on
	{
		return channel.getId();
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setEnableLights(boolean lights)
	// clang-format on
	{
		channel.enableLights(lights);
		setProperty(TiC.PROPERTY_ENABLE_LIGHTS, lights);
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setEnableVibration(boolean vibration)
	// clang-format on
	{
		channel.enableVibration(vibration);
		setProperty(TiC.PROPERTY_ENABLE_VIBRATION, vibration);
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setBypassDnd(boolean bypassDnd)
	// clang-format on
	{
		channel.setBypassDnd(bypassDnd);
		setProperty(TiC.PROPERTY_BYPASS_DND, bypassDnd);
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setDescription(String description)
	// clang-format on
	{
		channel.setDescription(description);
		setProperty(TiC.PROPERTY_DESCRIPTION, description);
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setGroupId(String groupId)
	// clang-format on
	{
		channel.setGroup(groupId);
		setProperty(TiC.PROPERTY_GROUP_ID, groupId);
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setImportance(int importance)
	// clang-format on
	{
		channel.setImportance(importance);
		setProperty(TiC.PROPERTY_IMPORTANCE, importance);
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setLightColor(int argb)
	// clang-format on
	{
		channel.setLightColor(argb);
		setProperty(TiC.PROPERTY_LIGHT_COLOR, argb);
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setLockscreenVisibility(int lockscreenVisibility)
	// clang-format on
	{
		channel.setLockscreenVisibility(lockscreenVisibility);
		setProperty(TiC.PROPERTY_LOCKSCREEN_VISIBILITY, lockscreenVisibility);
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setName(String name)
	// clang-format on
	{
		channel.setName(name);
		setProperty(TiC.PROPERTY_NAME, name);
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setShowBadge(boolean showBadge)
	// clang-format on
	{
		channel.setShowBadge(showBadge);
		setProperty(TiC.PROPERTY_SHOW_BADGE, showBadge);
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setVibrationPattern(Object patternObj)
	// clang-format on
	{
		if (patternObj instanceof Object[]) {
			Object[] patternArray = (Object[]) patternObj;
			long[] pattern = new long[patternArray.length];

			for (int i = 0; i < patternArray.length; i++) {
				if (!(patternArray[i] instanceof Integer)) {
					Log.e(TAG, "invalid vibratePattern array element");
					return;
				}
				pattern[i] = ((Integer) patternArray[i]).intValue();
			}
			channel.setVibrationPattern(pattern);
			setProperty(TiC.PROPERTY_VIBRATE_PATTERN, patternArray);
		}
	}

	public NotificationChannel getNotificationChannel()
	{
		return channel;
	}

	@Override
	public String getApiName()
	{
		return "Ti.Android.NotificationChannel";
	}
}
