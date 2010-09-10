/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.kroll;

import java.io.IOException;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiEvaluator;
import org.mozilla.javascript.Scriptable;

import ti.modules.titanium.TitaniumModule;

public class KrollBridge implements TiEvaluator
{
	private KrollContext kroll;
	private KrollObject titanium;
	
	public KrollBridge(KrollContext kroll)
	{
		this.kroll = kroll;

		kroll.getTiContext().setJSContext(this);
		TitaniumModule tiModule = new TitaniumModule(kroll.getTiContext());
		titanium = new KrollObject(tiModule);
		tiModule.bind(kroll.getScope(), null);
		
		kroll.getTiContext().getTiApp().bootModules(kroll.getTiContext());
	}

	public KrollObject getObject(String... objects) {
		KrollObject object = titanium;
		for (int i = 0; i < objects.length; i++) {
			Object child = object.get(objects[i], object);
			if (child instanceof KrollObject) {
				object = (KrollObject)child;
			} else {
				return null;
			}
		}
		return object;
	}
	
	public KrollObject getObject(String name) {
		if (name == null) return titanium;
		
		return getObject(name.split("\\."));
	}
	
	public void bindToTopLevel(String topLevelName, Object value) {
		if (value instanceof KrollProxy) {
			value = new KrollObject((KrollProxy)value);
		}
		
		kroll.getScope().put(topLevelName, kroll.getScope(), value);
	}
	
	public void bindToTopLevel(String topLevelName, String objectName) {
		bindToTopLevel(topLevelName, getObject(objectName));
	}
	
	public void bindContextSpecific(String objectName, String ctxSpecificName, Object value) {
		KrollObject object = titanium;
		if (objectName != null) {
			object = getObject(objectName);
		}
		object.put(ctxSpecificName, object, value);
	}
	
	public KrollModule getModule(String moduleName) {
		KrollObject object = getObject(moduleName);
		if (object != null) {
			return (KrollModule) object.getProxy();
		}
		return null;
	}

	public Object evalFile(String filename)
		throws IOException
	{
		return kroll.evalFile(filename);
	}

	public Object evalJS(String src) {
		return kroll.eval(src);
	}
	
	public KrollContext getKrollContext() {
		return kroll;
	}
	
	@Override
	public Scriptable getScope() {
		return kroll.getScope();
	}
	
	public KrollProxy getRootObject() {
		return titanium.getProxy();
	}
}
