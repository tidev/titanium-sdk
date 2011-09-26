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
	/*
	public static final String TI_SERVICE_INTENT_ID_KEY = "$__TITANIUM_SERVICE_INTENT_ID__$";
	private static final AtomicInteger serviceIntentIdGenerator = new AtomicInteger();
	private Map<Integer, WeakReference<TiContext>> weakBoundContexts = null; // contexts started via bindService
	private List<WeakReference<TiContext>> weakUnboundContexts = null; // contexts started via startService
	private static final boolean DBG = TiConfig.LOGD;
	private static final String LCAT = "TiBaseService";
	*/
	protected AtomicInteger proxyCounter = new AtomicInteger();

	public class TiServiceBinder extends Binder
	{
		public Service getService() { return TiBaseService.this; }
	}

	@Override
	public IBinder onBind(Intent intent)
	{
		//return new TiServiceBinder();
		return null;
	}

	/*
	public void unregisterBoundTiContext(int serviceIntentId)
	{
		if (DBG) {
			Log.d(LCAT, "unregisterBoundTiContext " + serviceIntentId);
		}
		if (weakBoundContexts == null) {
			if (DBG) {
				Log.d(LCAT, "unregisterBoundTiContext has no weakBoundContexts to work with.  Exiting...");
			}
			return;
		}
		
		if (!weakBoundContexts.containsKey(serviceIntentId)) {
			if (DBG) {
				Log.d(LCAT, "unregisterBoundTiContxt found no weakBoundContext for service intent with id " + serviceIntentId + ". Exiting...");
			}
			return;
		}
		WeakReference<TiContext> context = weakBoundContexts.get(serviceIntentId);
		if (context != null) {
			if (DBG) {
				Log.d(LCAT, "Unregistering bound context with service intent id " + serviceIntentId);
			}
			unbindContext(context.get());
		}
		return;
	}
	*/

	protected ServiceProxy createProxy(Intent intent)
	{
		// TODO
		/*
		TiContext context = createTiContext(intent, null);
		ServiceProxy proxy = new ServiceProxy(this, intent, proxyCounter.incrementAndGet());
		TiBindingHelper.bindCurrentService(context, proxy);
		return proxy;
		*/
		return null;
	}

	/*
	@Override
	public void onDestroy()
	{
		super.onDestroy();
		if (DBG) {
			Log.d(LCAT, this.getClass().getSimpleName() + " onDestroy");
		}
		if (weakBoundContexts != null) {
			synchronized(weakBoundContexts) {
				for (WeakReference<TiContext> weakContext : weakBoundContexts.values()) {
					TiContext context = weakContext.get();
					if (context != null) {
						context.dispatchOnServiceDestroy(this);
						context.release();
					}
				}
			}
			weakBoundContexts.clear();
		}
		weakBoundContexts = null;
		
		if (weakUnboundContexts != null) {
			synchronized(weakUnboundContexts) {
				for (WeakReference<TiContext> weakContext : weakUnboundContexts) {
					TiContext context = weakContext.get();
					if (context != null) {
						context.dispatchOnServiceDestroy(this);
						context.release();
					}
				}
			}
			weakUnboundContexts.clear();
		}
		weakUnboundContexts = null;
	}
	
	/**
	 * Used only for contexts that are created from inside the service, for when the service is started "un-bound" via Android Context.startService()
	 */
	/*
	protected TiContext createTiContext(Intent intent, String baseUrl)
	{
		TiApplication tiApp = (TiApplication) this.getApplication();
		TiContext context = TiContext.createTiContext(tiApp.getRootActivity(), baseUrl);
		context.setServiceContext(true);
		if (weakUnboundContexts == null) {
			weakUnboundContexts = Collections.synchronizedList( new ArrayList<WeakReference<TiContext>>() );
		}
		weakUnboundContexts.add(new WeakReference<TiContext>(context));
		return context;
	}
	*/
	/**
	 * Used only when the context is created from outside the service, i.e., when a ServiceProxy is created and later bound
	 * to the service.  They are keyed by a unique id given to each intent that is used to bind to the service, so that
	 * when unbind happens the context can be found and cleaned-up.
	 * @return an integer id based on an incrementer indicating how many contexts have attached to the running instance of the service. 
	 * Proxy stores that as serviceInstanceId.
	 */
	/*
	public int registerBoundTiContext(int serviceIntentId, TiContext tiContext)
	{
		if (weakBoundContexts == null) {
			weakBoundContexts = Collections.synchronizedMap(new HashMap<Integer, WeakReference<TiContext>>() );
		}
		weakBoundContexts.put(serviceIntentId, new WeakReference<TiContext>(tiContext));
		return proxyCounter.incrementAndGet();
	}

	*/
	public void start(ServiceProxy proxy)
	{
		// meant to be overridden
	}
	/*
	protected void unbindContext(TiContext context)
	{
		// meant to be overridden
	}
	
	public static int nextServiceBindingIntentId() { return serviceIntentIdGenerator.incrementAndGet(); }
	*/
}
