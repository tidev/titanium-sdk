/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.lang.reflect.Constructor;

import org.appcelerator.titanium.TiContext.OnLifecycleEvent;
import org.appcelerator.titanium.util.Log;

public abstract class TiModule
	extends TiProxy
	implements OnLifecycleEvent, TiProxyListener
{
	private static final String LCAT = "TiModule";

	public TiModule(TiContext tiContext)
	{
		super(tiContext);
		tiContext.addOnLifecycleEventListener(this);
		modelListener = this;
	}

	public void fireEvent(String eventName, TiDict data) {
		getTiContext().dispatchEvent(this, eventName, data);
	}

	public Object createProxy(Object[] args, String name)
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
					o = ctor.newInstance(getTiContext(), args);
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
