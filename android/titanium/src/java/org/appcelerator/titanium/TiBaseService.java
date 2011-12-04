/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.proxy.ServiceProxy;

import android.app.Service;
import android.content.Intent;
import android.os.Binder;
import android.os.IBinder;

public class TiBaseService extends Service
{
	public static final String TI_SERVICE_INTENT_ID_KEY = "$__TITANIUM_SERVICE_INTENT_ID__$";
	protected AtomicInteger proxyCounter = new AtomicInteger();

	public class TiServiceBinder extends Binder
	{
		public Service getService() {
			return TiBaseService.this;
		}
	}

	@Override
	public IBinder onBind(Intent intent)
	{
		return new TiServiceBinder();
	}

	protected ServiceProxy createProxy(Intent intent)
	{
		return new ServiceProxy(this, intent, proxyCounter.incrementAndGet());
	}

	public void start(ServiceProxy proxy)
	{
		// meant to be overridden
	}

	public void unbindProxy(ServiceProxy proxy)
	{
		// meant to be overridden
	}

	public int nextServiceInstanceId()
	{
		return proxyCounter.incrementAndGet();
	}
}
