/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.android;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

import android.content.BroadcastReceiver;

@Kroll.proxy(creatableInModule = AndroidModule.class)
public class BroadcastReceiverProxy extends KrollProxy
{
	private TiBroadcastReceiver receiver;

	public BroadcastReceiverProxy()
	{
		super();
		receiver = new TiBroadcastReceiver(this);
	}

	public BroadcastReceiverProxy(TiBroadcastReceiver receiver)
	{
		super();
		this.receiver = receiver;
	}

	@Override
	public void handleCreationDict(KrollDict dict)
	{
		if (dict != null) {
			if (dict.containsKey(TiC.PROPERTY_URL)) {
				setUrl(TiConvert.toString(dict.get(TiC.PROPERTY_URL)));
			}
			if (dict.containsKey(TiC.PROPERTY_ON_RECEIVED)) {
				setOnReceived(dict.get(TiC.PROPERTY_ON_RECEIVED));
			}
			super.handleCreationDict(dict);
		}
	}

	@Kroll.method
	@Kroll.setProperty
	public void setUrl(String url)
	{
		receiver.setUrl(url);
	}

	@Kroll.method
	@Kroll.setProperty
	public void setOnReceived(Object callback)
	{
		if (callback instanceof KrollFunction) {
			receiver.setCallback((KrollFunction) callback);
		}
	}

	public BroadcastReceiver getBroadcastReceiver()
	{
		return receiver;
	}

	@Override
	public String getApiName()
	{
		return "Ti.Android.BroadcastReceiver";
	}
}
