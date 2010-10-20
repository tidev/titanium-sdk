/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.util.HashMap;
import java.util.List;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiContext.OnLifecycleEvent;

@Kroll.module
public class KrollModule extends KrollProxy
	implements KrollProxyListener, OnLifecycleEvent
{
	private static final String TAG = "KrollModule";
	protected static HashMap<String, Object> constants = new HashMap<String, Object>();
	protected static HashMap<String, KrollModuleInfo> customModuleInfo = new HashMap<String, KrollModuleInfo>();

	protected KrollModuleInfo moduleInfo;
	
	public static void addModuleInfo(KrollModuleInfo info) {
		customModuleInfo.put(info.getId(), info);
	}
	
	public static KrollModuleInfo getModuleInfo(String id) {
		return customModuleInfo.get(id);
	}

	public KrollModule(TiContext context) {
		super(context);
		context.addOnLifecycleEventListener(this);
		modelListener = this;
		bindConstants();
		
		this.moduleInfo = getModuleInfo(getId());
	}
	
	public String getId() {
		return getModuleBinding().getId();
	}
	
	public KrollModuleInfo getModuleInfo() {
		return moduleInfo;
	}
	
	protected KrollModuleBinding getModuleBinding() {
		return (KrollModuleBinding) getBinding();
	}
	
	public void bindToParent(KrollProxy parent) {
		KrollModuleBinding binding = getModuleBinding();
		binding.bindToParent(parent, this);
	}
	
	protected void bindConstants() {
		for (String name : constants.keySet()) {
			setProperty(name, constants.get(name));
		}
	}
	
	@Override
	public void onResume() {
	}

	@Override
	public void onPause() {
	}
	
	@Override
	public void onDestroy() {
	}
	
	@Override
	public void onStart() {
	}
	
	@Override
	public void onStop() {	
	}
	
	@Override
	public void listenerAdded(String type, int count, KrollProxy proxy) {
	}
	
	@Override
	public void listenerRemoved(String type, int count, KrollProxy proxy) {
	}
	
	@Override
	public void processProperties(KrollDict d) {
	}
	
	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy) {
	}
	
	@Override
	public void propertiesChanged(List<KrollPropertyChange> changes, KrollProxy proxy) {
		for (KrollPropertyChange change : changes) {
			propertyChanged(change.getName(), change.getOldValue(), change.getNewValue(), proxy);
		}
	}
}
