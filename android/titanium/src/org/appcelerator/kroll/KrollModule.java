/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Set;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiContext.OnLifecycleEvent;

import android.app.Activity;

@Kroll.module
public class KrollModule extends KrollProxy
	implements KrollProxyListener, OnLifecycleEvent
{
	private static final String TAG = "KrollModule";
	protected static HashMap<String, Object> constants = new HashMap<String, Object>();
	protected static HashMap<String, KrollModuleInfo> customModuleInfo = new HashMap<String, KrollModuleInfo>();
	protected static HashMap<Class<? extends KrollModule>, List<Class<? extends KrollModule>>> externalChildModules =
		new HashMap<Class<? extends KrollModule>, List<Class<? extends KrollModule>>>();
	
	protected KrollModuleInfo moduleInfo;
	
	public static void addModuleInfo(KrollModuleInfo info) {
		customModuleInfo.put(info.getId(), info);
	}
	
	public static KrollModuleInfo getModuleInfo(String id) {
		return customModuleInfo.get(id);
	}

	public static Set<String> getCustomModuleIds() {
		return customModuleInfo.keySet();
	}

	public static void addExternalChildModule(Class<? extends KrollModule> parent, Class<? extends KrollModule> child) {
		if (!externalChildModules.containsKey(parent)) {
			externalChildModules.put(parent, new ArrayList<Class<? extends KrollModule>>());
		}
		externalChildModules.get(parent).add(child);
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
	
	public static KrollModule getExternalChildModule(KrollModuleBinding binding, Class<? extends KrollModule> moduleClass, String name) {
		if (!externalChildModules.containsKey(moduleClass)) return null;
		
		if (binding.bindings.containsKey(name)) {
			Object bindingObj = binding.getBinding(name);
			if (bindingObj != null) {
				return (KrollModule)bindingObj;
			}
		}
		
		for (Class<? extends KrollModule> childModuleClass : externalChildModules.get(moduleClass)) {
			KrollModuleBinding childBinding = (KrollModuleBinding) KrollProxy.getBinding(childModuleClass);
			if (childBinding != null) {
				if (childBinding.getShortAPIName().equals(name)) {
					KrollModule module = childBinding.newInstance(TiContext.getCurrentTiContext());
					binding.bindings.put(name, module);
					return module;
				}
			}
		}
		return null;
	}
	
	@Override
	public void onResume(Activity activity) {
	}

	@Override
	public void onPause(Activity activity) {
	}
	
	@Override
	public void onDestroy(Activity activity) {
	}
	
	@Override
	public void onStart(Activity activity) {
	}
	
	@Override
	public void onStop(Activity activity) {	
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
