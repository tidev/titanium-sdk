/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.android;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.kroll.util.KrollAssetHelper;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.IntentProxy;
import org.appcelerator.titanium.proxy.ServiceProxy;
import org.appcelerator.titanium.util.TiBindingHelper;

import android.app.Service;
import android.content.Intent;
import android.os.Bundle;

public class TiJSIntervalService extends TiJSService
{
	private static final String LCAT = "TiJSIntervalService";
	private static final boolean DBG = TiConfig.LOGD;
	private List<IntervalServiceRunner> runners = null;

	public TiJSIntervalService(String url)
	{
		super(url);
	}

	@Override
	protected void executeServiceCode(ServiceProxy proxy)
	{
		final String EXTRA_NAME = "interval";

		IntentProxy intentProxy = proxy.getIntent();
		if (intentProxy == null || !intentProxy.hasExtra(EXTRA_NAME)) {
			Log.w(LCAT, "The intent is missing the extra value '" + EXTRA_NAME + "', therefore the code will be executed only once.");
			super.executeServiceCode(proxy);
			return;
		}

		Intent intent = intentProxy.getIntent();
		Bundle extras = intent.getExtras();
		Object intervalObj = extras.get(EXTRA_NAME);
		long interval = -1;
		if (intervalObj instanceof Number) {
			interval = ((Number)intervalObj).longValue();
		}

		if (interval < 0) {
			Log.w(LCAT, "The intent's extra '" + EXTRA_NAME + "' value is negative or non-numeric, therefore the code will be executed only once.");
			super.executeServiceCode(proxy);
			return;
		}

		if (runners == null) {
			runners = Collections.synchronizedList( new ArrayList<IntervalServiceRunner>() );
		}

		String fullUrl = url;
		if (!fullUrl.contains("://") && !fullUrl.startsWith("/") && proxy.getCreationUrl().baseUrl != null) {
			fullUrl = proxy.getCreationUrl().baseUrl + fullUrl;
		}

		if (fullUrl.startsWith(TiC.URL_APP_PREFIX)) {
			fullUrl = fullUrl.replaceAll("app:/", "Resources");

		} else if (fullUrl.startsWith(TiC.URL_ANDROID_ASSET_RESOURCES)) {
			fullUrl = fullUrl.replaceAll("file:///android_asset/", "");
		}

		IntervalServiceRunner runner = new IntervalServiceRunner(this, proxy, interval, fullUrl);
		runners.add(runner);
		runner.start();
	}

	private IntervalServiceRunner findRunnerOfProxy(ServiceProxy proxy)
	{
		if (proxy == null || runners == null){
			return null;
		}

		synchronized(runners) {
			for (IntervalServiceRunner runner : runners) {
				if (proxy.equals(runner.proxy)) {
					return runner;
				}
			}
		}

		return null;
	}

	private void destroyRunners()
	{
		try {
			if (runners != null) {
				synchronized (runners) {
					for (IntervalServiceRunner runner : runners) {
						runner.stop();
					}
				}
			}
			runners.clear();
		} catch(Throwable t) {
			Log.w(LCAT, "Thrown while clearing interval service runners: " + t.getMessage(), t);
		}
	}


	@Override
	public void onDestroy()
	{
		if (DBG) {
			Log.d(LCAT, "onDestroy");
		}
		destroyRunners();
		super.onDestroy();
	}

	@Override
	public void unbindProxy(ServiceProxy proxy)
	{
		IntervalServiceRunner runner = findRunnerOfProxy(proxy);
		if (runner != null) {
			if (DBG) {
				Log.d(LCAT, "Stopping IntervalServiceRunner because of unbind");
			}
			runner.stop();
		}
		runners.remove(runner);
	}

	private class IntervalServiceRunner
	{
		protected ServiceProxy proxy;
		private long interval;
		private Timer timer = null;
		private TimerTask task = null;
		private String serviceSimpleName;
		private String url;
		private String source;
		private AtomicInteger counter = new AtomicInteger();

		IntervalServiceRunner(Service service, ServiceProxy proxy, long interval, String url)
		{
			this.proxy = proxy;
			this.interval = interval;
			this.url = url;
			this.source = KrollAssetHelper.readAsset(url);
			this.serviceSimpleName = service.getClass().getSimpleName();
		}

		private void destroyTimer()
		{
			try {
				if (task != null) {
					if (DBG) {
						Log.d(LCAT, "Canceling TimerTask");
					}
					task.cancel();
					task = null;
				}
				if (timer != null) {
					if (DBG) {
						Log.d(LCAT, "Canceling Timer");
					}
					timer.cancel();
					timer.purge();
					timer = null;
				}
			} catch (Throwable t) {
				Log.w(LCAT, "Thrown while destroying timer: " + t.getMessage(), t);
			}
		}

		void stop()
		{
			if (DBG) {
				Log.d(LCAT, "stop runner");
			}
			if (proxy != null) {
				proxy.fireEvent("stop", new KrollDict());
			}
			destroyTimer();
		}

		void start()
		{
			if (DBG) {
				Log.d(LCAT, "start runner");
			}
			task = new TimerTask()
			{
				@Override
				public void run()
				{
					int iteration = counter.incrementAndGet();
					try {
						TiBindingHelper.bindCurrentService(proxy);
						KrollDict event = new KrollDict();
						event.put("iteration", iteration);
						proxy.fireEvent("resume", event);
						KrollRuntime.getInstance().runModule(source, url, proxy) ;
						proxy.fireEvent("pause", event);
					} catch (Throwable e) {
						Log.e(LCAT, "Failure evaluating service JS " + url + ": " + e.getMessage(), e);
					}
				}
			};

			timer = new Timer(serviceSimpleName + "_Timer_" + proxy.getServiceInstanceId());
			timer.schedule(task, 0, interval);
		}
		
	}
}
