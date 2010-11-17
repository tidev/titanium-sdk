/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.lang.ref.WeakReference;
import java.util.ArrayList;

import android.content.res.Configuration;

public class TiActivity extends TiBaseActivity {
	protected ArrayList<WeakReference<TiContext>> contexts;
	
	public TiActivity() {
		super();
		contexts = new ArrayList<WeakReference<TiContext>>();
	}
	
	public void addTiContext(TiContext context) {
		if (!contexts.contains(context)) {
			contexts.add(new WeakReference<TiContext>(context));
		}
	}

	public void removeTiContext(TiContext context) {
		if (contexts.contains(context)) {
			contexts.remove(context);
		}
	}

	@Override
	public void onConfigurationChanged(Configuration newConfig)
	{
		super.onConfigurationChanged(newConfig);
		for (WeakReference<TiContext> contextRef : contexts) {
			if (contextRef.get() != null) {
				contextRef.get().dispatchOnConfigurationChanged(newConfig);
			}
		}
	}

	@Override
	protected void onPause() {
		super.onPause();
		for (WeakReference<TiContext> contextRef : contexts) {
			if (contextRef.get() != null) {
				contextRef.get().dispatchOnPause();
			}
		}
	}

	@Override
	protected void onResume() {
		super.onResume();
		for (WeakReference<TiContext> contextRef : contexts) {
			if (contextRef.get() != null) {
				contextRef.get().dispatchOnResume();
			}
		}
	}

	@Override
	protected void onStart() {
		super.onStart();
		for (WeakReference<TiContext> contextRef : contexts) {
			if (contextRef.get() != null) {
				contextRef.get().dispatchOnStart();
			}
		}
	}

	@Override
	protected void onStop() {
		super.onStop();
		for (WeakReference<TiContext> contextRef : contexts) {
			if (contextRef.get() != null) {
				contextRef.get().dispatchOnStop();
			}
		}
	}

	@Override
	protected void onDestroy() {
		for (WeakReference<TiContext> contextRef : contexts) {
			TiContext ctx = contextRef.get();
			if (ctx != null) {
				ctx.dispatchOnDestroy();
				ctx.release();
			}
		}
		super.onDestroy();
	}
}
