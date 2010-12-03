/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.android;

import org.appcelerator.titanium.TiBaseService;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.ServiceProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiBindingHelper;
import org.appcelerator.titanium.util.TiConfig;

import android.content.Intent;

public class TiJSService extends TiBaseService
{
	private String url = null;
	private static final String LCAT = "TiJSService";
	private static final boolean DBG = TiConfig.LOGD;
	
	
	public TiJSService(String url)
	{
		super();
		this.url = url;
	}

	@Override
	public void onStart(Intent intent, int startId)
	{
		super.onStart(intent, startId);
		if (url == null) {
			if (intent != null && intent.getDataString() != null) {
				url = intent.getDataString();
			} else {
				throw new IllegalStateException("Service url required.");
			}
		}
		
		int lastSlash = url.lastIndexOf('/');
		String baseUrl = url.substring(0, lastSlash+1);
		if (baseUrl.length() == 0) {
			baseUrl = null;
		}
		TiContext context = createTiContext(baseUrl);
		executeServiceCode(new ServiceProxy(context, this, intent, startId));
	}
	
	protected void executeServiceCode(ServiceProxy proxy)
	{
		TiBindingHelper.bindCurrentService(proxy.getTiContext(), proxy);
		final TiContext ftiContext = proxy.getTiContext();
		String fullUrl = url;
		if (!fullUrl.contains("://") && !fullUrl.startsWith("/")) {
			fullUrl = ftiContext.getBaseUrl() + fullUrl;
		}
		if (DBG) {
			if (url != fullUrl) {
				Log.d(LCAT, "Eval JS Service:" + url + " (" + fullUrl+ ")");
			} else {
				Log.d(LCAT, "Eval JS Service:" + url);
			}
		}
		final String ffullUrl = fullUrl;
		new Thread(new Runnable(){
			@Override
			public void run() {
				try {
					ftiContext.evalFile(ffullUrl);
				} catch (Throwable e) {
					Log.e(LCAT, "Failure evaluating service JS " + url + ": " + e.getMessage(), e);
				}
			}
		}).start();
	}
	
	
}
