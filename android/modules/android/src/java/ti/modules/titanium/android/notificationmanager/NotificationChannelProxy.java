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
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;

@TargetApi(26)
@Kroll.proxy
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
			if (d.containsKey(TiC.PROPERTY_SOUND)) {
				setSound(d.getString(TiC.PROPERTY_SOUND));
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
	@Kroll.getProperty
	public boolean getEnableLights()
	// clang-format on
	{
		return channel.shouldShowLights();
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setEnableLights(boolean lights)
	// clang-format on
	{
		channel.enableLights(lights);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean getEnableVibration()
	// clang-format on
	{
		return channel.shouldVibrate();
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setEnableVibration(boolean vibration)
	// clang-format on
	{
		channel.enableVibration(vibration);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean getBypassDnd()
	// clang-format on
	{
		return channel.canBypassDnd();
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setBypassDnd(boolean bypassDnd)
	// clang-format on
	{
		channel.setBypassDnd(bypassDnd);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getDescription()
	// clang-format on
	{
		return channel.getDescription();
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setDescription(String description)
	// clang-format on
	{
		channel.setDescription(description);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getGroupId()
	// clang-format on
	{
		return channel.getGroup();
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setGroupId(String groupId)
	// clang-format on
	{
		channel.setGroup(groupId);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getImportance()
	// clang-format on
	{
		return channel.getImportance();
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setImportance(int importance)
	// clang-format on
	{
		channel.setImportance(importance);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getLightColor()
	// clang-format on
	{
		return channel.getLightColor();
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setLightColor(int argb)
	// clang-format on
	{
		channel.setLightColor(argb);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getLockscreenVisibility()
	// clang-format on
	{
		return channel.getLockscreenVisibility();
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setLockscreenVisibility(int lockscreenVisibility)
	// clang-format on
	{
		channel.setLockscreenVisibility(lockscreenVisibility);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getName()
	// clang-format on
	{
		return channel.getName().toString();
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setName(String name)
	// clang-format on
	{
		channel.setName(name);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean getShowBadge()
	// clang-format on
	{
		return channel.canShowBadge();
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setShowBadge(boolean showBadge)
	// clang-format on
	{
		channel.setShowBadge(showBadge);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getSound()
	// clang-format on
	{
		Uri uri = channel.getSound();
		return (uri != null) ? uri.toString() : null;
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setSound(String path)
	// clang-format on
	{
		AudioAttributes.Builder attributesBuilder = new AudioAttributes.Builder();
		attributesBuilder.setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION);
		attributesBuilder.setUsage(AudioAttributes.USAGE_NOTIFICATION);
		channel.setSound(Uri.parse(resolveUrl(null, path)), attributesBuilder.build());
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public Object getVibrationPattern()
	// clang-format on
	{
		long[] pattern = channel.getVibrationPattern();
		Object[] patternArray = new Object[pattern.length];
		for (int i = 0; i < pattern.length; i++) {
			patternArray[i] = Long.valueOf(pattern[i]);
		}
		return patternArray;
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
