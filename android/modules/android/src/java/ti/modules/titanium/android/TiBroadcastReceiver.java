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
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.util.KrollAssetHelper;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.IntentProxy;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class TiBroadcastReceiver extends BroadcastReceiver
{
	private String url;
	private KrollFunction callback;
	KrollProxy proxy;

	public TiBroadcastReceiver(KrollProxy proxy)
	{
		super();
		this.proxy = proxy;
	}

	// This constructor is used by the generated Broadcast receiver class when a receiver is registered via tiapp.xml
	public TiBroadcastReceiver(String url)
	{
		super();
		proxy = new BroadcastReceiverProxy(this);
		setUrl(url);
	}

	@Override
	public void onReceive(Context context, Intent intent)
	{
		if (url != null) {
			KrollRuntime.isInitialized();
			KrollRuntime.getInstance().runModule(KrollAssetHelper.readAsset(url), url, proxy);
		} else if (callback != null) {
			KrollDict event = new KrollDict();
			event.put(TiC.EVENT_PROPERTY_INTENT, new IntentProxy(intent));
			callback.call(proxy.getKrollObject(), new Object[] { event });
		}
	}

	public void setUrl(String fullUrl)
	{
		if (!fullUrl.contains("://") && !fullUrl.startsWith("/") && proxy.getCreationUrl().baseUrl != null) {
			fullUrl = proxy.getCreationUrl().baseUrl + fullUrl;
		}

		if (fullUrl.startsWith(TiC.URL_APP_PREFIX)) {
			fullUrl = fullUrl.replaceAll("app:/", "Resources");

		} else if (fullUrl.startsWith(TiC.URL_ANDROID_ASSET_RESOURCES)) {
			fullUrl = fullUrl.replaceAll("file:///android_asset/", "");
		}

		this.url = fullUrl;
	}

	public void setCallback(KrollFunction func)
	{
		callback = func;
	}
}
