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
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.kroll.util.KrollAssetHelper;
import org.appcelerator.titanium.TiBaseService;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.ServiceProxy;

import android.app.Service;
import android.content.Intent;

public class TiJSService extends TiBaseService
{
	protected String url = null;
	private static final String LCAT = "TiJSService";
	private static final boolean DBG = TiConfig.LOGD;

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
		if (DBG) {
			Log.d(LCAT, "onStartCommand");
		}
		finalizeUrl(intent);
		ServiceProxy proxy = createProxy(intent);
		start(proxy);
		return Service.START_REDELIVER_INTENT;
	}

	protected void executeServiceCode(ServiceProxy proxy)
	{
		String fullUrl = url;
		if (!fullUrl.contains("://") && !fullUrl.startsWith("/") && proxy.getCreationUrl().baseUrl != null) {
			fullUrl = proxy.getCreationUrl().baseUrl + fullUrl;
		}
		if (DBG) {
			if (url != fullUrl) {
				Log.d(LCAT, "Eval JS Service:" + url + " (" + fullUrl+ ")");
			} else {
				Log.d(LCAT, "Eval JS Service:" + url);
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
