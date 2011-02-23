/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.lang.ref.WeakReference;

import org.appcelerator.titanium.util.TiWeakList;

public class TiActivity extends TiBaseActivity
{
	protected TiWeakList<TiContext> contexts;

	public TiActivity()
	{
		super();
		contexts = new TiWeakList<TiContext>();
	}

	public void addTiContext(TiContext context)
	{
		if (!contexts.contains(context)) {
			contexts.add(new WeakReference<TiContext>(context));
		}
	}

	public void removeTiContext(TiContext context)
	{
		if (contexts.contains(context)) {
			contexts.remove(context);
		}
	}

	@Override
	protected void onPause()
	{
		super.onPause();
		for (TiContext context : contexts.nonNull()) {
			context.fireLifecycleEvent(this, TiContext.LIFECYCLE_ON_PAUSE);
		}
	}

	@Override
	protected void onResume()
	{
		super.onResume();
		for (TiContext context : contexts.nonNull()) {
			context.fireLifecycleEvent(this, TiContext.LIFECYCLE_ON_RESUME);
		}
	}

	@Override
	protected void onStart()
	{
		super.onStart();
		for (TiContext context : contexts.nonNull()) {
			context.fireLifecycleEvent(this, TiContext.LIFECYCLE_ON_START);
		}
	}

	@Override
	protected void onStop()
	{
		super.onStop();
		for (TiContext context : contexts.nonNull()) {
			context.fireLifecycleEvent(this, TiContext.LIFECYCLE_ON_STOP);
		}
	}

	@Override
	protected void onDestroy()
	{
		fireOnDestroy();

		for (TiContext context : contexts.nonNull()) {
			context.fireLifecycleEvent(this, TiContext.LIFECYCLE_ON_DESTROY);
			context.release();
		}
		super.onDestroy();
	}
}
