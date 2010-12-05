/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiBaseService;
import org.appcelerator.titanium.TiBaseService.TiServiceBinder;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;

import android.app.Service;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.IBinder;

@Kroll.proxy
public class ServiceProxy extends KrollProxy
{
	private Service service;
	private boolean forBoundServices;
	private int serviceInstanceId;
	private int serviceIntentId;
	private IntentProxy intentProxy;
	private ServiceConnection serviceConnection = null; // Set only if the service is started via bindService as opposed to startService
	private static final boolean DBG = TiConfig.LOGD;
	private static final String LCAT = "TiServiceProxy";
	
	public ServiceProxy(TiContext context)
	{
		super(context);
	}
	
	/**
	 * For when a service started via startService() creates a proxy when it starts running
	 */
	public ServiceProxy(TiContext context, Service service, Intent intent, int serviceInstanceId)
	{
		super(context);
		this.service = service;
		setIntent(intent);
		this.serviceInstanceId = serviceInstanceId;
	}
	
	/**
	 * For when creating a service proxy directly, for later binding using bindService()
	 */
	public ServiceProxy(TiContext context, IntentProxy intentProxy)
	{
		super(context);
		setIntent(intentProxy);
		serviceIntentId =  TiBaseService.nextServiceBindingIntentId();
		intentProxy.putExtra(TiBaseService.TI_SERVICE_INTENT_ID_KEY, serviceIntentId);
		forBoundServices = true;
	}
	
	@Kroll.getProperty @Kroll.method
	public int getServiceInstanceId()
	{
		return serviceInstanceId;
	}
	
	protected int getServiceIntentId()
	{
		return serviceIntentId;
	}
	
	@Kroll.getProperty @Kroll.method
	public IntentProxy getIntent()
	{
		return intentProxy;
	}
	
	public void setIntent(Intent intent)
	{
		setIntent(new IntentProxy(context, intent));
	}
	
	public void setIntent(IntentProxy intentProxy)
	{
		this.intentProxy = intentProxy;
	}
	
	@Kroll.method
	public void start()
	{
		if (!forBoundServices) {
			Log.w(LCAT, "Only services created via Ti.Android.createService can be started via the start() command. Ignoring start() request.");
			return;
		}
		bindAndInvokeService();
	}
	
	@Kroll.method
	public void stop()
	{
		if (DBG) {
			Log.d(LCAT, "stop");
		}
		if (!forBoundServices) {
			if (DBG) {
				Log.d(LCAT, "stop via stopService");
			}
			service.stopSelf();
		} else {
			unbindService();
		}
		
	}
	
	private void bindAndInvokeService()
	{
		serviceConnection = new ServiceConnection()
		{
			@Override
			public void onServiceDisconnected(ComponentName name) {}
			@Override
			public void onServiceConnected(ComponentName name, IBinder service)
			{
				if (service instanceof TiServiceBinder) {
					TiServiceBinder binder = (TiServiceBinder) service;
					ServiceProxy proxy =  ServiceProxy.this;
					TiBaseService tiService =(TiBaseService) binder.getService();
					if (DBG) {
						Log.d(LCAT, tiService.getClass().getSimpleName() + " service successfully bound");
					}
					proxy.serviceInstanceId = tiService.registerBoundTiContext(proxy.getServiceIntentId(), proxy.getTiContext());
					proxy.invokeBoundService(tiService);
				}
				
			}
		};
		
		getTiContext().getTiApp().bindService(this.getIntent().getIntent(), serviceConnection, Context.BIND_AUTO_CREATE);
	}
	
	private void unbindService()
	{
		if (DBG) {
			Log.d(LCAT, "stop via unbindService for service proxy with intent id " + intentProxy.getIntExtra(TiBaseService.TI_SERVICE_INTENT_ID_KEY, -1));
		}
		TiContext tiContext = this.getTiContext();
		if (tiContext == null) {
			Log.w(LCAT, "Cannot unbind service.  TiContext is null.");
			return;
		}
		Context context = tiContext.getTiApp();
		if (context == null) {
			Log.w(LCAT, "Cannot unbind service.  tiContext.getTiApp() returned null");
			return;
		}
		
		if (service instanceof TiBaseService) {
			((TiBaseService)service).unregisterBoundTiContext(this.getServiceIntentId());
		}
		
		context.unbindService(serviceConnection);
		serviceConnection = null;
		
	}
	
	protected void invokeBoundService(Service boundService)
	{
		this.service = boundService;
		if ( ! (boundService instanceof TiBaseService)) {
			Log.w(LCAT, "Service " + boundService.getClass().getSimpleName() + " is not a Ti Service.  Cannot start directly.");
			return;
		}
		TiBaseService tiService = (TiBaseService)boundService;
		if (DBG) {
			Log.d(LCAT, "Calling tiService.start for this proxy instance");
		}
		tiService.start(this);
	}
	
}
