/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.util.ArrayList;
import java.util.List;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiLifecycle.OnLifecycleEvent;
import org.appcelerator.titanium.TiRootActivity;

import android.app.Activity;

@Kroll.module(name="KrollModule")
public class KrollModule extends KrollProxy
	implements KrollProxyListener, OnLifecycleEvent
{
	private static final String TAG = "KrollModule";

	@Deprecated
	protected TiContext tiContext;

	protected static ArrayList<KrollModuleInfo> customModuleInfoList = new ArrayList<KrollModuleInfo>();


	public static void addCustomModuleInfo(KrollModuleInfo customModuleInfo)
	{
		customModuleInfoList.add(customModuleInfo);
	}

	public static ArrayList<KrollModuleInfo> getCustomModuleInfoList()
	{
		return customModuleInfoList;
	}

	public KrollModule()
	{
		super();
		modelListener = this;
	}

	/**
	 * Instantiates and registers module with TiApplication.
	 * @param name the name of module.
	 */
	public KrollModule(String name)
	{
		this();
		// Register module with TiApplication if a name is provided.
		TiApplication.getInstance().registerModuleInstance(name, this);
	}

	public KrollModule(TiContext tiContext)
	{
		this();
		this.tiContext = tiContext;
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
	/**
	 * A place holder for subclasses to extend. Its purpose is to receive native Android onResume life cycle event.
	 * @param activity the activity attached to this module.
	 */
	public void onResume(Activity activity) {
	}

	// TODO @Override
	/**
	 * A place holder for subclasses to extend. Its purpose is to receive native Android onPause life cycle event.
	 * @param activity the activity attached to this module.
	 */
	public void onPause(Activity activity) {
	}
	
	// TODO @Override
	/**
	 * A place holder for subclasses to extend. Its purpose is to receive native Android onDestroy life cycle event.
	 * @param activity the activity attached to this module.
	 */
	public void onDestroy(Activity activity) {
	}
	
	// TODO @Override
	/**
	 * A place holder for subclasses to extend. Its purpose is to receive native Android onStart life cycle event.
	 * @param activity the activity attached to this module.
	 */
	public void onStart(Activity activity) {
	}
	
	// TODO @Override
	/**
	 * A place holder for subclasses to extend. Its purpose is to receive native Android onStop life cycle event.
	 * @param activity the activity attached to this module.
	 */
	public void onStop(Activity activity) {	
	}
	
	// TODO @Override
	public void listenerAdded(String type, int count, KrollProxy proxy) {
	}
	
	// TODO @Override
	public void listenerRemoved(String type, int count, KrollProxy proxy) {
	}
	
	// TODO @Override
	/**
	 * A place holder for subclasses to extend. Its purpose is to process initial properties of the module.
	 * @param d
	 */
	public void processProperties(KrollDict d) {
	}
	
	// TODO @Override
	/**
	 * A place holder for subclasses to extend. Its purpose is to modify an existing property.
	 * @param key  the key of the property.
	 * @param oldValue  the property's old value.
	 * @param newValue  the property's new value.
	 * @param proxy     the associated proxy.
	 */
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy) {
	}
	
	// TODO @Override
	public void propertiesChanged(List<KrollPropertyChange> changes, KrollProxy proxy) {
		for (KrollPropertyChange change : changes) {
			propertyChanged(change.getName(), change.getOldValue(), change.getNewValue(), proxy);
		}
	}
}
