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
import org.appcelerator.kroll.common.Log;

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
	private static final String TAG = "TiBaseService";
	public static final String TI_SERVICE_INTENT_ID_KEY = "$__TITANIUM_SERVICE_INTENT_ID__$";
	protected AtomicInteger proxyCounter = new AtomicInteger();
	protected ServiceProxy serviceProxy;
	private TiBaseService.EventHandler eventHandler;

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
		serviceProxy = new ServiceProxy(this, intent, proxyCounter.incrementAndGet());
		return serviceProxy;
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

		// Increment the runtime's count of services.
		KrollRuntime.incrementServiceReceiverRefCount();

		// Start listening for the runtime's events.
		this.eventHandler = new TiBaseService.EventHandler(this);
		this.eventHandler.subscribe();
	}

	@Override
	public void onDestroy()
	{
		super.onDestroy();

		// Decrement the runtime's count of services.
		KrollRuntime.decrementServiceReceiverRefCount();

		// Stop listening for runtime events. (Also frees this service to be garbage collected.)
		if (this.eventHandler != null) {
			this.eventHandler.unsubscribe();
			this.eventHandler = null;
		}
	}

	@Override
	public void onTaskRemoved(Intent rootIntent)
	{
		if (Log.isDebugModeEnabled()) {
			Log.d(TAG, "The task that comes from the service's application has been removed.");
		}
		serviceProxy.fireSyncEvent(TiC.EVENT_TASK_REMOVED, null);
	}

	private static class EventHandler implements KrollRuntime.OnDisposingListener
	{
		/** The service that owns this event handler. */
		private TiBaseService service;

		/**
		 * Creates a new event handler for the given service instance.
		 * @param service The service that owns this event handler. Cannot be null.
		 */
		public EventHandler(TiBaseService service)
		{
			if (service == null) {
				throw new NullPointerException();
			}
			this.service = service;
		}

		/** Subscribes to KrollRuntime's events. */
		public void subscribe()
		{
			KrollRuntime.addOnDisposingListener(this);
		}

		/** Unsubscribes from KrollRuntime's events. */
		public void unsubscribe()
		{
			KrollRuntime.removeOnDisposingListener(this);
		}

		/**
		 * Called just before the JavaScript runtime is terminated.
		 * <p>
		 * Stops the service since the JavaScript file binded to it can no longer control it.
		 * @param runtime The runtime instance that is about to be terminated/disposed.
		 */
		@Override
		public void onDisposing(KrollRuntime runtime)
		{
			ServiceProxy proxy = this.service.serviceProxy;
			if (proxy != null) {
				proxy.stop();
			} else {
				this.service.stopSelf();
			}
		}
	}
}
