/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010-2012 by Appcelerator, Inc. All Rights Reserved.
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

import android.app.Activity;

/**
 * This is the parent class for all modules. All modules must extend this class.
 */
@Kroll.module(name="KrollModule")
public class KrollModule extends KrollProxy
	implements KrollProxyListener, OnLifecycleEvent
{
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

	/**
	 * Constructs a new KrollModule object.
	 * @module.api
	 */
	public KrollModule()
	{
		super();
		modelListener = this;
	}

	/**
	 * Instantiates and registers module with TiApplication.
	 * @param name the name of module.
	 * @module.api
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

	/**
	 * A place holder for subclasses to extend. Its purpose is to receive native Android onResume life cycle events.
	 * @param activity the activity attached to this module.
	 * @module.api
	 */
	public void onResume(Activity activity) {
	}

	/**
	 * A place holder for subclasses to extend. Its purpose is to receive native Android onPause life cycle events.
	 * @param activity the activity attached to this module.
	 * @module.api
	 */
	public void onPause(Activity activity) {
	}

	/**
	 * A place holder for subclasses to extend. Its purpose is to receive native Android onDestroy life cycle events.
	 * @param activity the activity attached to this module.
	 * @module.api
	 */
	public void onDestroy(Activity activity) {
	}

	/**
	 * A place holder for subclasses to extend. Its purpose is to receive native Android onStart life cycle events.
	 * @param activity the activity attached to this module.
	 * @module.api
	 */
	public void onStart(Activity activity) {
	}

	/**
	 * A place holder for subclasses to extend. Its purpose is to receive native Android onStop life cycle events.
	 * @param activity the activity attached to this module.
	 * @module.api
	 */
	public void onStop(Activity activity) {	
	}

	/**
	 * Subclasses can override this method to be notified when an event listener
	 * for a specific <code>type</code> has been added.
	 * 
	 * @param type the event type
	 * @param count the count of event listeners for the event
	 * @param proxy the proxy instance that the event listener was added to
	 * @module.api
	 */
	public void listenerAdded(String type, int count, KrollProxy proxy) {
	}

	/**
	 * Subclasses can override this method to be notified when an event listener
	 * for a specific <code>type</code> has been removed.
	 * 
	 * @param type the event type
	 * @param count the count of event listeners for the event
	 * @param proxy the proxy instance that the event listener was removed from
	 * @module.api
	 */
	public void listenerRemoved(String type, int count, KrollProxy proxy) {
	}

	/**
	 * Implementing classes can use this method to examine the properties passed into the proxy when it's first created.
	 * @param properties  a set of properties to process.
	 * @module.api
	 */
	public void processProperties(KrollDict properties) {
	}

	/**
	 * A place holder for subclasses to extend. Its purpose is to be notified when an existing property is changed.
	 * @param key  the key of the property.
	 * @param oldValue  the property's old value.
	 * @param newValue  the property's new value.
	 * @param proxy     the associated proxy.
	 * @module.api
	 */
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy) {
	}

	public void propertiesChanged(List<KrollPropertyChange> changes, KrollProxy proxy) {
		for (KrollPropertyChange change : changes) {
			propertyChanged(change.getName(), change.getOldValue(), change.getNewValue(), proxy);
		}
	}

}
