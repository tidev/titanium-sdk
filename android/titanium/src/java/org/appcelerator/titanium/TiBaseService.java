/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.titanium.proxy.ServiceProxy;

import android.app.Service;
import android.content.Intent;
import android.os.Binder;
import android.os.IBinder;

/**
 * The base class for Titanium services. To learn more about Services, see the
 * <a href="http://developer.android.com/reference/android/app/Service.html">Android Service documentation</a>.
 */
public class TiBaseService extends Service
{
	public static final String TI_SERVICE_INTENT_ID_KEY = "$__TITANIUM_SERVICE_INTENT_ID__$";
	protected AtomicInteger proxyCounter = new AtomicInteger();

	public class TiServiceBinder extends Binder
	{
		public Service getService()
		{
			return TiBaseService.this;
		}
	}

	@Override
	public IBinder onBind(Intent intent)
	{
		return new TiServiceBinder();
	}

	/**
	 * Creates and returns a service proxy, also increments the instance id.
	 * Each service proxy has a unique instance id.
	 * @param intent the intent used to create the proxy.
	 * @return service proxy
	 */
	protected ServiceProxy createProxy(Intent intent)
	{
		return new ServiceProxy(this, intent, proxyCounter.incrementAndGet());
	}

	/**
	 * Implementing subclasses should use this method to start the service.
	 * @param proxy the ServiceProxy.
	 */
	public void start(ServiceProxy proxy)
	{
		// meant to be overridden
	}

	/**
	 * Implementing subclasses should use this method to release the proxy.
	 * @param proxy the proxy to release.
	 */
	public void unbindProxy(ServiceProxy proxy)
	{
		// meant to be overridden
	}

	/**
	 * @return next service instance id.
	 */
	public int nextServiceInstanceId()
	{
		return proxyCounter.incrementAndGet();
	}

	@Override
	public void onCreate()
	{
		super.onCreate();
		KrollRuntime.incrementServiceRefCount();
	}

	@Override
	public void onDestroy()
	{
		super.onDestroy();
		KrollRuntime.decrementServiceRefCount();
	}
}
