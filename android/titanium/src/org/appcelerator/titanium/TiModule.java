/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.lang.reflect.Constructor;
import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;
import java.util.HashMap;
import java.lang.ref.WeakReference;

import org.appcelerator.titanium.TiContext.OnLifecycleEvent;
import org.appcelerator.titanium.util.Log;

public abstract class TiModule
	extends TiProxy
	implements OnLifecycleEvent, TiProxyListener
{
	private static final String LCAT = "TiModule";
	
	// keep a map of module name to module reference so we can retrieve them
	// and since modules *should* be singletons
	private static final HashMap<String,WeakReference<TiModule>> modules = new HashMap<String,WeakReference<TiModule>>();

	private String buildVersion;

	public TiModule(TiContext tiContext)
	{
		super(tiContext);
		tiContext.addOnLifecycleEventListener(this);
		modelListener = this;
		
		// register our module but keep a weak reference to it so it 
		// can get cleaned up as needed
		// Addendum: only do it if it's not a "context-aware" module.
		if (!getClass().isAnnotationPresent(ContextSpecific.class)) {
			String moduleName = getClass().getSimpleName();
			moduleName = moduleName.substring(0,moduleName.length()-6);
			modules.put(moduleName,new WeakReference<TiModule>(this));
		}
	}
	
	public static TiModule getModule(String name)
	{
		WeakReference<TiModule> m = modules.get(name);
		return m == null ? null : m.get();
	}
	
	public static void clearModuleSingletons()
	{
		modules.clear();	
	}
	
	/**
	 * return the compiled-in Titanium build version (not the version of the module
	 * build the Titanium SDK that this module was compiled with).  This is only
	 * guaranteed to be valid for internal Titanium modules.
	 */
	public String getBuildVersion()
	{
		if (buildVersion==null)
		{
			// read the Titanium build version
			InputStream versionStream = getClass().getClassLoader().getResourceAsStream("org/appcelerator/titanium/build.properties");
			if (versionStream != null) {
				Properties properties = new Properties();
				try {
					properties.load(versionStream);
					if (properties.containsKey("build.version")) {
						buildVersion = properties.getProperty("build.version");
					}
				} catch (IOException e) {}
			}
		}
		return buildVersion;
	}

	public void postCreate() {}
	
	public boolean fireEvent(String eventName, TiDict data) {
		return getTiContext().dispatchEvent(eventName, data, this);
	}

	public Object createProxy(TiContext tiContext, Object[] args, String name)
	{
		Object o = null;
		String pname = buildProxyName(name);

		try {
			Class<?> c = Class.forName(pname);
			if (c != null) {
				Class<?>[] types = {
					TiContext.class,
					Object[].class
				};
				Constructor<?> ctor = c.getConstructor(types);
				if (ctor != null) {
					o = ctor.newInstance(tiContext, args);
				} else {
					Log.e(LCAT, "No valid constructor found");
				}
			} else {
				Log.e(LCAT, "No class for name " + pname);
			}
		} catch (Exception e) {
			Log.e(LCAT, "Error creating proxy " + pname + ": " + e.getMessage(), e);
		}

		return o;
	}

	// Proxy Object Support
	private String buildProxyName(String name)
	{
		String newName = name.substring(6);

		// The TitaniumAPI has proxies that have names that start with Digits. The convention
		// is to simply prepend an _ to the classname

		if (newName.matches("^[0-9].*")) {
			newName = "_" + newName;
		}
		StringBuilder sb = new StringBuilder(128);
		sb.append(getClass().getPackage().getName())
			.append(".")
			.append(newName)
			.append("Proxy");
		;

		return sb.toString();
	}

	public void listenerAdded(String type, int count, TiProxy proxy) {
	}

	public void listenerRemoved(String type, int count, TiProxy proxy) {
	}

	public void processProperties(TiDict d) {
	}

	public void propertyChanged(String key, Object oldValue, Object newValue, TiProxy proxy) {
	}

	public void onStart() {

	}

	public void onResume() {

	}

	public void onPause() {

	}

	public void onStop() {

	}

	public void onDestroy() {
		getTiContext().removeOnLifecycleEventListener(this);
	}
}
