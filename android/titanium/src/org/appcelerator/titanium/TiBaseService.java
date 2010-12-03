/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;

public class TiBaseService extends Service
{
	private List<WeakReference<TiContext>> weakContexts = null;

	@Override
	public IBinder onBind(Intent arg0)
	{
		return null;
	}
	
	public void addTiContext(TiContext context)
	{
		if (weakContexts == null) {
			weakContexts = Collections.synchronizedList( new ArrayList<WeakReference<TiContext>>() );
		}
		weakContexts.add(new WeakReference<TiContext>(context));
	}

	@Override
	public void onDestroy()
	{
		super.onDestroy();
		if (weakContexts != null) {
			synchronized(weakContexts) {
				for (WeakReference<TiContext> weakContext : weakContexts) {
					TiContext context = weakContext.get();
					if (context != null) {
						context.dispatchOnServiceDestroy(this);
						context.release();
					}
				}
			}
			weakContexts.clear();
		}
		weakContexts = null;
	}
	
	protected TiContext createTiContext(String baseUrl)
	{
		TiContext context = TiContext.createTiContext(this, baseUrl);
		return context;
	}
	
}
