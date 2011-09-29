/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.android;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

import android.net.Uri;
import android.widget.RemoteViews;

@Kroll.proxy(creatableInModule=AndroidModule.class)
public class RemoteViewsProxy extends KrollProxy {
	protected String packageName;
	protected int layoutId;
	protected RemoteViews remoteViews;

	/*
	public RemoteViewsProxy(TiContext context)
	{
		super(context);
	}*/
	
	@Override
	public void handleCreationArgs(KrollModule createdInModule, Object[] args) {
		packageName = TiApplication.getInstance().getPackageName();
		layoutId = -1;
		if (args.length >= 1) {
			if (args[0] instanceof Number) {
				layoutId = TiConvert.toInt(args[0]);
			} else if (args.length >= 2 && args[0] instanceof String) {
				packageName = (String) args[0];
				layoutId = TiConvert.toInt(args[1]);
			}
		}
		super.handleCreationArgs(createdInModule, args);
		remoteViews = new RemoteViews(packageName, layoutId);
	}

	@Override
	public void handleCreationDict(KrollDict dict) {
		super.handleCreationDict(dict);
		if (dict.containsKey(TiC.PROPERTY_PACKAGE_NAME)) {
			packageName = TiConvert.toString(dict, TiC.PROPERTY_PACKAGE_NAME);
		}
		if (dict.containsKey(TiC.PROPERTY_LAYOUT_ID)) {
			layoutId = TiConvert.toInt(dict, TiC.PROPERTY_LAYOUT_ID);
		}
	}

	@Kroll.method
	public void setBoolean(int viewId, String methodName, boolean value)
	{
		remoteViews.setBoolean(viewId, methodName, value);
	}

	@Kroll.method
	public void setDouble(int viewId, String methodName, double value)
	{
		remoteViews.setDouble(viewId, methodName, value);
	}

	@Kroll.method
	public void setInt(int viewId, String methodName, int value)
	{
		remoteViews.setInt(viewId, methodName, value);
	}

	@Kroll.method
	public void setString(int viewId, String methodName, String value)
	{
		remoteViews.setString(viewId, methodName, value);
	}

	@Kroll.method
	public void setUri(int viewId, String methodName, String value)
	{
		remoteViews.setUri(viewId, methodName, Uri.parse(value));
	}

	@Kroll.method
	public void setImageViewResource(int viewId, int srcId)
	{
		remoteViews.setImageViewResource(viewId, srcId);
	}

	@Kroll.method
	public void setImageViewUri(int viewId, String uriString)
	{
		Uri uri = Uri.parse(resolveUrl(null, uriString));
		remoteViews.setImageViewUri(viewId, uri);
	}

	@Kroll.method
	public void setOnClickPendingIntent(int viewId, PendingIntentProxy pendingIntent)
	{
		remoteViews.setOnClickPendingIntent(viewId, pendingIntent.getPendingIntent());
	}

	@Kroll.method
	public void setProgressBar(int viewId, int max, int progress, boolean indeterminate)
	{
		remoteViews.setProgressBar(viewId, max, progress, indeterminate);
	}

	@Kroll.method
	public void setTextColor(int viewId, int color)
	{
		remoteViews.setTextColor(viewId, color);
	}

	@Kroll.method
	public void setTextViewText(int viewId, String text)
	{
		remoteViews.setTextViewText(viewId, text);
	}

	@Kroll.method
	public void setViewVisibility(int viewId, int visibility)
	{
		remoteViews.setViewVisibility(viewId, visibility);
	}

	@Kroll.method
	public void setChronometer(int viewId, long base, String format, boolean started)
	{
		remoteViews.setChronometer(viewId, base, format, started);
	}

	public RemoteViews getRemoteViews()
	{
		return remoteViews;
	}
}
