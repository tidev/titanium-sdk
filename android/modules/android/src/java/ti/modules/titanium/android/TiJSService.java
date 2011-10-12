/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.android;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiBaseService;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.kroll.KrollContext;
import org.appcelerator.titanium.proxy.ServiceProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiBindingHelper;
import org.appcelerator.titanium.util.TiConfig;

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
	public void onStart(Intent intent, int startId)
	{
		super.onStart(intent, startId);
		finalizeUrl(intent);
		ServiceProxy proxy = createProxy(intent);
		start(proxy);
	}
	
	protected void executeServiceCode(ServiceProxy proxy)
	{
		//final TiContext ftiContext = proxy.getTiContext();
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
		final String ffullUrl = fullUrl;
		final ServiceProxy fProxy = proxy;
		new Thread(new Runnable(){
			@Override
			public void run() {
				try {
					fProxy.fireEvent("resume", new KrollDict());
					KrollContext.getKrollContext().evalFile(ffullUrl);
					fProxy.fireEvent("pause", new KrollDict());
					fProxy.fireEvent("stop", new KrollDict()); // this basic JS Service class only runs once.
				} catch (Throwable e) {
					Log.e(LCAT, "Failure evaluating service JS " + url + ": " + e.getMessage(), e);
				}
			}
		}).start();
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
		//TiContext context = createTiContext(intent, baseUrl);
		ServiceProxy proxy = new ServiceProxy(this, intent, proxyCounter.incrementAndGet());
		TiBindingHelper.bindCurrentService(proxy);
		return proxy;
	}
	
	@Override
	public void start(ServiceProxy proxy)
	{
		proxy.fireEvent("start", new KrollDict());
		executeServiceCode(proxy);
	}

	// TODO
	public int registerBoundTiContext(int serviceIntentId, TiContext tiContext)
	{
		return registerBoundTiContext(serviceIntentId);
	}

	public int registerBoundTiContext(int serviceIntentId)
	{
		if (url != null) {
			int lastSlash = url.lastIndexOf('/');
			String baseUrl = url.substring(0, lastSlash+1);
			if (baseUrl.length() == 0) {
				baseUrl = null;
			}
			//tiContext.setBaseUrl(baseUrl);
		}
		//return super.registerBoundTiContext(serviceIntentId, tiContext);
		return -1;
	}
}

