/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.util.List;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiLifecycle.OnLifecycleEvent;
import org.appcelerator.titanium.TiRootActivity;

import android.app.Activity;

@Kroll.module(name="KrollModule")
public class KrollModule extends KrollProxy
	implements KrollProxyListener, OnLifecycleEvent
{
	private static final String TAG = "KrollModule";

	public KrollModule() {
		super();

		modelListener = this;
	}

	public KrollModule(String name) {
		this();

		// Register module with TiApplication if a name is provided.
		TiApplication.getInstance().registerModuleInstance(name, this);
	}

	@Override
	protected void initActivity(Activity activity)
	{
		Activity moduleActivity = TiApplication.getInstance().getRootActivity();
		if (moduleActivity == null) {
			// this should only occur in case such as JS activities etc where root 
			// activity will not be available
			moduleActivity = activity;
		}

		super.initActivity(moduleActivity);
		if (moduleActivity instanceof TiBaseActivity) {
			((TiBaseActivity)moduleActivity).addOnLifecycleEventListener(this);
		}
	}

	// TODO @Override
	public void onResume(Activity activity) {
	}

	// TODO @Override
	public void onPause(Activity activity) {
	}
	
	// TODO @Override
	public void onDestroy(Activity activity) {
	}
	
	// TODO @Override
	public void onStart(Activity activity) {
	}
	
	// TODO @Override
	public void onStop(Activity activity) {	
	}
	
	// TODO @Override
	public void listenerAdded(String type, int count, KrollProxy proxy) {
	}
	
	// TODO @Override
	public void listenerRemoved(String type, int count, KrollProxy proxy) {
	}
	
	// TODO @Override
	public void processProperties(KrollDict d) {
	}
	
	// TODO @Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy) {
	}
	
	// TODO @Override
	public void propertiesChanged(List<KrollPropertyChange> changes, KrollProxy proxy) {
		for (KrollPropertyChange change : changes) {
			propertyChanged(change.getName(), change.getOldValue(), change.getNewValue(), proxy);
		}
	}
}
