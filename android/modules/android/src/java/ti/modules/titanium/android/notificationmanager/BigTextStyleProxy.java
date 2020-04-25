/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.android.notificationmanager;

import ti.modules.titanium.android.AndroidModule;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

import androidx.core.app.NotificationCompat.BigTextStyle;

@Kroll.proxy(creatableInModule = AndroidModule.class)
public class BigTextStyleProxy extends StyleProxy
{

	public BigTextStyleProxy()
	{
		super();
		style = new BigTextStyle();
	}

	@Override
	public void handleCreationDict(KrollDict d)
	{
		super.handleCreationDict(d);

		if (d == null) {
			return;
		}

		if (d.containsKey(TiC.PROPERTY_BIG_TEXT)) {
			setBigText(TiConvert.toString(d.get(TiC.PROPERTY_BIG_TEXT)));
		}

		if (d.containsKey(TiC.PROPERTY_BIG_CONTENT_TITLE)) {
			setBigContentTitle(TiConvert.toString(d.get(TiC.PROPERTY_BIG_CONTENT_TITLE)));
		}

		if (d.containsKey(TiC.PROPERTY_SUMMARY_TEXT)) {
			setSummaryText(TiConvert.toString(d.get(TiC.PROPERTY_SUMMARY_TEXT)));
		}
	}

	@Kroll.method
	@Kroll.setProperty
	public void setBigText(String text)
	{
		((BigTextStyle) style).bigText(text);
		setProperty(TiC.PROPERTY_BIG_TEXT, text);
	}

	@Kroll.method
	@Kroll.setProperty
	public void setBigContentTitle(String title)
	{
		((BigTextStyle) style).setBigContentTitle(title);
		setProperty(TiC.PROPERTY_BIG_CONTENT_TITLE, title);
	}

	@Kroll.method
	@Kroll.setProperty
	public void setSummaryText(String text)
	{
		((BigTextStyle) style).setSummaryText(text);
		setProperty(TiC.PROPERTY_SUMMARY_TEXT, text);
	}
}
