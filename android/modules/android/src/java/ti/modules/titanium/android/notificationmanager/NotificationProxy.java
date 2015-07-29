/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.android.notificationmanager;

import java.util.Date;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;

import ti.modules.titanium.android.AndroidModule;
import ti.modules.titanium.android.PendingIntentProxy;
import ti.modules.titanium.android.RemoteViewsProxy;
import android.app.Notification;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.support.v4.app.NotificationCompat;
import android.support.v4.app.NotificationCompat.Builder;

@SuppressWarnings("deprecation")
@Kroll.proxy(creatableInModule=AndroidModule.class, propertyAccessors = {
	TiC.PROPERTY_CONTENT_TEXT,
	TiC.PROPERTY_CONTENT_TITLE
})
public class NotificationProxy extends KrollProxy 
{
	private static final String TAG = "TiNotification";

	protected Builder notificationBuilder;
	private int flags, ledARGB, ledOnMS, ledOffMS;
	private Uri sound;
	private int audioStreamType;
	
	public NotificationProxy() 
	{
		super();
		notificationBuilder =  new NotificationCompat.Builder(TiApplication.getInstance().getApplicationContext())
        .setSmallIcon(android.R.drawable.stat_sys_warning)
        .setWhen(System.currentTimeMillis());
		
		//set up default values
		flags = Notification.FLAG_AUTO_CANCEL;
		audioStreamType = Notification.STREAM_DEFAULT;
		
	}

	public NotificationProxy(TiContext tiContext) 
	{
		this();
	}

	@Override
	public void handleCreationDict(KrollDict d)
	{
		super.handleCreationDict(d);
		if (d == null) {
			return;
		}
		if (d.containsKey(TiC.PROPERTY_ICON)) {
			setIcon(d.get(TiC.PROPERTY_ICON));
		}
		if (d.containsKey(TiC.PROPERTY_LARGE_ICON)) {
			setLargeIcon(d.get(TiC.PROPERTY_LARGE_ICON));
		}
		if (d.containsKey(TiC.PROPERTY_TICKER_TEXT)) {
			setTickerText(TiConvert.toString(d, TiC.PROPERTY_TICKER_TEXT));
		}
		if (d.containsKey(TiC.PROPERTY_WHEN)) {
			setWhen(d.get(TiC.PROPERTY_WHEN));
		}
		if (d.containsKey(TiC.PROPERTY_AUDIO_STREAM_TYPE)) {
			setAudioStreamType(TiConvert.toInt(d, TiC.PROPERTY_AUDIO_STREAM_TYPE));
		}
		if (d.containsKey(TiC.PROPERTY_CONTENT_VIEW)) {
			setContentView((RemoteViewsProxy) d.get(TiC.PROPERTY_CONTENT_VIEW));
		}
		if (d.containsKey(TiC.PROPERTY_CONTENT_INTENT)) {
			setContentIntent((PendingIntentProxy) d.get(TiC.PROPERTY_CONTENT_INTENT));
		}
		if (d.containsKey(TiC.PROPERTY_DEFAULTS)) {
			setDefaults(TiConvert.toInt(d, TiC.PROPERTY_DEFAULTS));
		}
		if (d.containsKey(TiC.PROPERTY_DELETE_INTENT)) {
			setDeleteIntent((PendingIntentProxy) d.get(TiC.PROPERTY_DELETE_INTENT));
		}
		if (d.containsKey(TiC.PROPERTY_FLAGS)) {
			setFlags(TiConvert.toInt(d, TiC.PROPERTY_FLAGS));
		}
		if (d.containsKey(TiC.PROPERTY_LED_ARGB)) {
			setLedARGB(TiConvert.toInt(d, TiC.PROPERTY_LED_ARGB));
		}
		if (d.containsKey(TiC.PROPERTY_LED_OFF_MS)) {
			setLedOffMS(TiConvert.toInt(d, TiC.PROPERTY_LED_OFF_MS));
		}
		if (d.containsKey(TiC.PROPERTY_LED_ON_MS)) {
			setLedOnMS(TiConvert.toInt(d, TiC.PROPERTY_LED_ON_MS));
		}
		if (d.containsKey(TiC.PROPERTY_NUMBER)) {
			setNumber(TiConvert.toInt(d, TiC.PROPERTY_NUMBER));
		}
		if (d.containsKey(TiC.PROPERTY_SOUND)) {
			setSound(TiConvert.toString(d, TiC.PROPERTY_SOUND));
		}
		if (d.containsKey(TiC.PROPERTY_VIBRATE_PATTERN)) {
			setVibratePattern((Object[]) d.get(TiC.PROPERTY_VIBRATE_PATTERN));
		}
		if (d.containsKey(TiC.PROPERTY_VISIBILITY)) {
			setVisibility(TiConvert.toInt(d, TiC.PROPERTY_VISIBILITY));
		}
		if (d.containsKey(TiC.PROPERTY_CATEGORY)) {
			setCategory(TiConvert.toString(d, TiC.PROPERTY_CATEGORY));
		}
		if (d.containsKey(TiC.PROPERTY_PRIORITY)) {
			setPriority(TiConvert.toInt(d, TiC.PROPERTY_PRIORITY));
		}
		checkLatestEventInfoProperties(d);
	}


	@Kroll.method @Kroll.setProperty
	public void setCategory(String category)
	{
		notificationBuilder.setCategory(category);
		setProperty(TiC.PROPERTY_CATEGORY, category);
	}

	@Kroll.method @Kroll.setProperty
	public void setIcon(Object icon)
	{
		if (icon instanceof Number) {
			notificationBuilder.setSmallIcon(((Number)icon).intValue());
		} else {
			String iconUrl = TiConvert.toString(icon);
			if (iconUrl == null) {
				Log.e(TAG, "Url is null");
				return;
			}
			String iconFullUrl = resolveUrl(null, iconUrl);
			notificationBuilder.setSmallIcon(TiUIHelper.getResourceId(iconFullUrl));
		}
		setProperty(TiC.PROPERTY_ICON, icon);
	}
	
	@Kroll.method @Kroll.setProperty
	public void setLargeIcon(Object icon)
	{
		if(icon instanceof Number) {
			Bitmap largeIcon = BitmapFactory.decodeResource(TiApplication.getInstance().getResources(), ((Number)icon).intValue());
			notificationBuilder.setLargeIcon(largeIcon);   
		}else{
			String iconUrl = TiConvert.toString(icon);
			if (iconUrl == null) {
				Log.e(TAG, "Url is null");
				return;
			}
			String iconFullUrl = resolveUrl(null, iconUrl);
			Bitmap largeIcon = BitmapFactory.decodeResource(TiApplication.getInstance().getResources(), TiUIHelper.getResourceId(iconFullUrl));
			notificationBuilder.setLargeIcon(largeIcon);    
		}
		setProperty(TiC.PROPERTY_LARGE_ICON, icon);
	}
	
	@Kroll.method @Kroll.setProperty
	public void setVisibility(int visibility)
	{
		notificationBuilder.setVisibility(visibility);
		setProperty(TiC.PROPERTY_VISIBILITY, visibility);
	
	}
	
	@Kroll.method @Kroll.setProperty
	public void setPriority(int priority)
	{
		notificationBuilder.setPriority(priority);
		setProperty(TiC.PROPERTY_PRIORITY, priority);
	}

	@Kroll.method @Kroll.setProperty
	public void setTickerText(String tickerText)
	{
		notificationBuilder.setTicker(tickerText);
		//set the javascript object
		setProperty(TiC.PROPERTY_TICKER_TEXT, tickerText);
	}

	@Kroll.method @Kroll.setProperty
	public void setWhen(Object when)
	{
		if (when instanceof Date) {
			notificationBuilder.setWhen(((Date)when).getTime());
		} else {
			notificationBuilder.setWhen(((Double) TiConvert.toDouble(when)).longValue());
		}
		setProperty(TiC.PROPERTY_WHEN, when);
	}

	@Kroll.method @Kroll.setProperty
	public void setAudioStreamType(int type)
	{
		audioStreamType = type;
		if (sound != null) {
			notificationBuilder.setSound(this.sound, audioStreamType);
		}
		setProperty(TiC.PROPERTY_AUDIO_STREAM_TYPE, type);
	}

	@Kroll.method @Kroll.setProperty
	public void setContentView(RemoteViewsProxy contentView)
	{
		notificationBuilder.setContent(contentView.getRemoteViews());
		setProperty(TiC.PROPERTY_CONTENT_VIEW, contentView);
	}

	@Kroll.method @Kroll.setProperty
	public void setContentIntent(PendingIntentProxy contentIntent)
	{
		notificationBuilder.setContentIntent(contentIntent.getPendingIntent());	
		setProperty(TiC.PROPERTY_CONTENT_INTENT, contentIntent);
	}

	@Kroll.method @Kroll.setProperty
	public void setDefaults(int defaults)
	{
		notificationBuilder.setDefaults(defaults);
		setProperty(TiC.PROPERTY_DEFAULTS, defaults);
	}

	@Kroll.method @Kroll.setProperty
	public void setDeleteIntent(PendingIntentProxy deleteIntent)
	{
		notificationBuilder.setDeleteIntent(deleteIntent.getPendingIntent());
		setProperty(TiC.PROPERTY_DELETE_INTENT, deleteIntent);
	}

	@Kroll.method @Kroll.setProperty
	public void setFlags(int flags)
	{
		this.flags = flags;
		setProperty(TiC.PROPERTY_FLAGS, flags);
	}


	@Kroll.method @Kroll.setProperty
	public void setLedARGB(int ledARGB)
	{
		this.ledARGB = ledARGB;
		notificationBuilder.setLights(this.ledARGB, ledOnMS, ledOffMS);
		setProperty(TiC.PROPERTY_LED_ARGB, ledARGB);
	}

	@Kroll.method @Kroll.setProperty
	public void setLedOffMS(int ledOffMS)
	{
		this.ledOffMS = ledOffMS;
		notificationBuilder.setLights(ledARGB, ledOnMS, this.ledOffMS);
		setProperty(TiC.PROPERTY_LED_OFF_MS, ledOffMS);
	}

	@Kroll.method @Kroll.setProperty
	public void setLedOnMS(int ledOnMS)
	{
		this.ledOnMS = ledOnMS;
		notificationBuilder.setLights(ledARGB, this.ledOnMS, ledOffMS);
		setProperty(TiC.PROPERTY_LED_ON_MS, ledOnMS);
	}

	@Kroll.method @Kroll.setProperty
	public void setNumber(int number)
	{
		notificationBuilder.setNumber(number);
		setProperty(TiC.PROPERTY_NUMBER, number);
	}

	@Kroll.method @Kroll.setProperty
	public void setSound(String url)
	{
		if (url == null) {
			Log.e(TAG, "Url is null");
			return;
		}
		sound = Uri.parse(resolveUrl(null, url));
		notificationBuilder.setSound(sound, audioStreamType);
		setProperty(TiC.PROPERTY_SOUND, url);
	}

	@Kroll.method @Kroll.setProperty
	public void setVibratePattern(Object[] pattern)
	{
		if (pattern != null) {
			long[] vibrate = new long[pattern.length];
			for (int i = 0; i < pattern.length; i++) {
				vibrate[i] = ((Double)TiConvert.toDouble(pattern[i])).longValue();
			}
			notificationBuilder.setVibrate(vibrate);
		}
		setProperty(TiC.PROPERTY_VIBRATE_PATTERN, pattern);
	}

	protected void checkLatestEventInfoProperties(KrollDict d)
	{
		if (d.containsKeyAndNotNull(TiC.PROPERTY_CONTENT_TITLE)
			|| d.containsKeyAndNotNull(TiC.PROPERTY_CONTENT_TEXT)) {
			String contentTitle = "";
			String contentText = "";
			if (d.containsKeyAndNotNull(TiC.PROPERTY_CONTENT_TITLE)) {
				contentTitle = TiConvert.toString(d, TiC.PROPERTY_CONTENT_TITLE);
				notificationBuilder.setContentTitle(contentTitle);
			}
			if (d.containsKeyAndNotNull(TiC.PROPERTY_CONTENT_TEXT)) {
				contentText = TiConvert.toString(d, TiC.PROPERTY_CONTENT_TEXT);
				notificationBuilder.setContentText(contentText);
			}
	
		}
	}

	@Kroll.method
	public void setLatestEventInfo(String contentTitle, String contentText, PendingIntentProxy contentIntent)
	{
		notificationBuilder.setContentIntent(contentIntent.getPendingIntent())
		.setContentText(contentText)
		.setContentTitle(contentTitle);
	}

	public Notification buildNotification()
	{ 
		Notification notification = notificationBuilder.build();
		notification.flags = this.flags;
		return notification;
	}

	@Override
	public String getApiName()
	{
		return "Ti.Android.Notification";
	}
}