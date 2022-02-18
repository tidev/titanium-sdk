/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.android.notificationmanager;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiDrawableReference;

import ti.modules.titanium.android.AndroidModule;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import androidx.core.app.NotificationCompat.BigPictureStyle;

@Kroll.proxy(creatableInModule = AndroidModule.class, propertyAccessors = { TiC.PROPERTY_DECODE_RETRIES })
public class BigPictureStyleProxy extends StyleProxy
{

	private static final String TAG = "TiNotificationBigPictureStyle";

	public BigPictureStyleProxy()
	{
		super();
		style = new BigPictureStyle();
	}

	@Override
	public void handleCreationDict(KrollDict d)
	{
		super.handleCreationDict(d);

		if (d == null) {
			return;
		}

		if (d.containsKey(TiC.PROPERTY_BIG_LARGE_ICON)) {
			setBigLargeIcon(d.get(TiC.PROPERTY_BIG_LARGE_ICON));
		}

		if (d.containsKey(TiC.PROPERTY_BIG_PICTURE)) {
			setBigPicture(d.get(TiC.PROPERTY_BIG_PICTURE));
		}

		if (d.containsKey(TiC.PROPERTY_BIG_CONTENT_TITLE)) {
			setBigContentTitle(TiConvert.toString(d.get(TiC.PROPERTY_BIG_CONTENT_TITLE)));
		}

		if (d.containsKey(TiC.PROPERTY_SUMMARY_TEXT)) {
			setSummaryText(TiConvert.toString(d.get(TiC.PROPERTY_SUMMARY_TEXT)));
		}
	}

	@Kroll.setProperty
	public void setBigLargeIcon(Object icon)
	{
		if (icon instanceof Number) {
			Bitmap bigLargeIcon =
				BitmapFactory.decodeResource(TiApplication.getInstance().getResources(), ((Number) icon).intValue());
			((BigPictureStyle) style).bigLargeIcon(bigLargeIcon);
		} else {
			String iconUrl = TiConvert.toString(icon);
			if (iconUrl == null) {
				Log.e(TAG, "Url is null");
				return;
			}
			String iconFullUrl = resolveUrl(null, iconUrl);
			Bitmap bigLargeIcon = BitmapFactory.decodeResource(TiApplication.getInstance().getResources(),
															   TiUIHelper.getResourceId(iconFullUrl));
			((BigPictureStyle) style).bigLargeIcon(bigLargeIcon);
		}

		setProperty(TiC.PROPERTY_BIG_LARGE_ICON, icon);
	}

	@Kroll.setProperty
	public void setBigPicture(Object picture)
	{
		TiDrawableReference source = TiDrawableReference.fromObject(this, picture);

		// Check for decodeRetries
		if (hasProperty(TiC.PROPERTY_DECODE_RETRIES)) {
			source.setDecodeRetries(
				TiConvert.toInt(getProperty(TiC.PROPERTY_DECODE_RETRIES), TiDrawableReference.DEFAULT_DECODE_RETRIES));
		}

		((BigPictureStyle) style).bigPicture(source.getBitmap());

		setProperty(TiC.PROPERTY_BIG_PICTURE, picture);
	}

	@Kroll.setProperty
	public void setBigContentTitle(String title)
	{
		((BigPictureStyle) style).setBigContentTitle(title);
		setProperty(TiC.PROPERTY_BIG_CONTENT_TITLE, title);
	}

	@Kroll.setProperty
	public void setSummaryText(String text)
	{
		((BigPictureStyle) style).setSummaryText(text);
		setProperty(TiC.PROPERTY_SUMMARY_TEXT, text);
	}
}
