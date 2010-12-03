/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;

import android.app.Service;
import android.content.Intent;

@Kroll.proxy
public class ServiceProxy extends KrollProxy
{
	private Service service;
	private int startId;
	private IntentProxy intentProxy;
	
	public ServiceProxy(TiContext context)
	{
		super(context);
	}
	
	public ServiceProxy(TiContext context, Service service, Intent intent, int startId)
	{
		super(context);
		this.service = service;
		setIntent(intent);
		this.startId = startId;
	}
	
	@Kroll.method
	public void stop()
	{
		service.stopSelf();
	}
	
	@Kroll.getProperty @Kroll.method
	public int getStartId()
	{
		return startId;
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
}
