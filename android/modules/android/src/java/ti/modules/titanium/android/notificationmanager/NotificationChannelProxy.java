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

	@Kroll.method
	@Kroll.getProperty
	public String getId()
	{
		return channel.getId();
	}

	@Kroll.method
	@Kroll.getProperty
	public boolean getEnableLights()
	{
		return channel.shouldShowLights();
	}

	@Kroll.method
	@Kroll.setProperty
	public void setEnableLights(boolean lights)
	{
		channel.enableLights(lights);
	}

	@Kroll.method
	@Kroll.getProperty
	public boolean getEnableVibration()
	{
		return channel.shouldVibrate();
	}

	@Kroll.method
	@Kroll.setProperty
	public void setEnableVibration(boolean vibration)
	{
		channel.enableVibration(vibration);
	}

	@Kroll.method
	@Kroll.getProperty
	public boolean getBypassDnd()
	{
		return channel.canBypassDnd();
	}

	@Kroll.method
	@Kroll.setProperty
	public void setBypassDnd(boolean bypassDnd)
	{
		channel.setBypassDnd(bypassDnd);
	}

	@Kroll.method
	@Kroll.getProperty
	public String getDescription()
	{
		return channel.getDescription();
	}

	@Kroll.method
	@Kroll.setProperty
	public void setDescription(String description)
	{
		channel.setDescription(description);
	}

	@Kroll.method
	@Kroll.getProperty
	public String getGroupId()
	{
		return channel.getGroup();
	}

	@Kroll.method
	@Kroll.setProperty
	public void setGroupId(String groupId)
	{
		channel.setGroup(groupId);
	}

	@Kroll.method
	@Kroll.getProperty
	public int getImportance()
	{
		return channel.getImportance();
	}

	@Kroll.method
	@Kroll.setProperty
	public void setImportance(int importance)
	{
		channel.setImportance(importance);
	}

	@Kroll.method
	@Kroll.getProperty
	public int getLightColor()
	{
		return channel.getLightColor();
	}

	@Kroll.method
	@Kroll.setProperty
	public void setLightColor(int argb)
	{
		channel.setLightColor(argb);
	}

	@Kroll.method
	@Kroll.getProperty
	public int getLockscreenVisibility()
	{
		return channel.getLockscreenVisibility();
	}

	@Kroll.method
	@Kroll.setProperty
	public void setLockscreenVisibility(int lockscreenVisibility)
	{
		channel.setLockscreenVisibility(lockscreenVisibility);
	}

	@Kroll.method
	@Kroll.getProperty
	public String getName()
	{
		return channel.getName().toString();
	}

	@Kroll.method
	@Kroll.setProperty
	public void setName(String name)
	{
		channel.setName(name);
	}

	@Kroll.method
	@Kroll.getProperty
	public boolean getShowBadge()
	{
		return channel.canShowBadge();
	}

	@Kroll.method
	@Kroll.setProperty
	public void setShowBadge(boolean showBadge)
	{
		channel.setShowBadge(showBadge);
	}

	@Kroll.method
	@Kroll.getProperty
	public String getSound()
	{
		Uri uri = channel.getSound();
		return (uri != null) ? uri.toString() : null;
	}

	@Kroll.method
	@Kroll.setProperty
	public void setSound(String path)
	{
		AudioAttributes.Builder attributesBuilder = new AudioAttributes.Builder();
		attributesBuilder.setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION);
		attributesBuilder.setUsage(AudioAttributes.USAGE_NOTIFICATION);
		channel.setSound(Uri.parse(resolveUrl(null, path)), attributesBuilder.build());
	}

	@Kroll.method
	@Kroll.getProperty
	public Object getVibrationPattern()
	{
		long[] pattern = channel.getVibrationPattern();
		Object[] patternArray = new Object[pattern.length];
		for (int i = 0; i < pattern.length; i++) {
			patternArray[i] = Long.valueOf(pattern[i]);
		}
		return patternArray;
	}

	@Kroll.method
	@Kroll.setProperty
	public void setVibrationPattern(Object patternObj)
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
