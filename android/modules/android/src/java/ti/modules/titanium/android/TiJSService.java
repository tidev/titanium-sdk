/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.android;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.util.KrollAssetHelper;
import org.appcelerator.titanium.TiBaseService;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.ServiceProxy;

import android.content.Intent;

public class TiJSService extends TiBaseService
{
	protected String url = null;
	private static final String TAG = "TiJSService";

	public TiJSService(String url)
	{
		super();
		this.url = url;
	}

	private void finalizeUrl(Intent intent)
	{
		if (url == null) {
			if (intent != null && intent.getDataString() != null) {
				url = intent.getDataString();
			} else {
				throw new IllegalStateException("Service url required.");
			}
		}
	}

	@Override
	public int onStartCommand(Intent intent, int flags, int startId)
	{
		Log.d(TAG, "onStartCommand", Log.DEBUG_MODE);
		finalizeUrl(intent);
		ServiceProxy proxy = createProxy(intent);
		start(proxy);

		return intent.getIntExtra(TiC.INTENT_PROPERTY_START_MODE, AndroidModule.START_REDELIVER_INTENT);
	}

	protected void executeServiceCode(ServiceProxy proxy)
	{
		String fullUrl = url;
		if (!fullUrl.contains("://") && !fullUrl.startsWith("/") && proxy.getCreationUrl().baseUrl != null) {
			fullUrl = proxy.getCreationUrl().baseUrl + fullUrl;
		}
		if (Log.isDebugModeEnabled()) {
			if (url != fullUrl) {
				Log.d(TAG, "Eval JS Service:" + url + " (" + fullUrl+ ")");
			} else {
				Log.d(TAG, "Eval JS Service:" + url);
			}
		}

		if (fullUrl.startsWith(TiC.URL_APP_PREFIX)) {
			fullUrl = fullUrl.replaceAll("app:/", "Resources");

		} else if (fullUrl.startsWith(TiC.URL_ANDROID_ASSET_RESOURCES)) {
			fullUrl = fullUrl.replaceAll("file:///android_asset/", "");
		}

		proxy.fireEvent(TiC.EVENT_RESUME, new KrollDict());
		KrollRuntime.getInstance().runModule(KrollAssetHelper.readAsset(fullUrl), fullUrl, proxy);
		proxy.fireEvent(TiC.EVENT_PAUSE, new KrollDict());
		proxy.fireEvent(TiC.EVENT_STOP, new KrollDict()); // this basic JS Service class only runs once.

	}

	@Override
	protected ServiceProxy createProxy(Intent intent)
	{
		finalizeUrl(intent);
		int lastSlash = url.lastIndexOf('/');
		String baseUrl = url.substring(0, lastSlash+1);
		if (baseUrl.length() == 0) {
			baseUrl = null;
		}
		ServiceProxy proxy = new ServiceProxy(this, intent, proxyCounter.incrementAndGet());
		return proxy;
	}

	@Override
	public void start(ServiceProxy proxy)
	{
		proxy.fireEvent(TiC.EVENT_START, new KrollDict());
		executeServiceCode(proxy);
	}

}
