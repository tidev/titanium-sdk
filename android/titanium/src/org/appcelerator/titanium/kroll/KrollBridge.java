/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.kroll;

import java.io.IOException;

import org.appcelerator.kroll.KrollConverter;
import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiEvaluator;
import org.mozilla.javascript.Scriptable;

import ti.modules.titanium.TitaniumModule;

public class KrollBridge implements TiEvaluator
{
	private static TitaniumModule tiModule;
	private KrollContext kroll;
	private KrollObject titanium;
	
	public KrollBridge(KrollContext kroll)
	{
		this.kroll = kroll;
		TiContext tiContext = kroll.getTiContext();
		tiContext.setJSContext(this);

		if (tiModule == null) {
			tiModule = new TitaniumModule(kroll.getTiContext());
		}
		titanium = new KrollObject(tiModule);
		tiModule.bindContextSpecific(this);
		
		tiContext.getTiApp().bindModules(this, tiModule);
		bindCustomAPIs();
	}
	
	protected void bindCustomAPIs() {
		bindContextSpecific("String.format", "stringFormat", true);
		bindContextSpecific("String.formatDate", "stringFormatDate", true);
		bindContextSpecific("String.formatTime", "stringFormatTime", true);
		bindContextSpecific("String.formatCurrency", "stringFormatCurrency", true);
		bindContextSpecific("String.formatDecimal", "stringFormatDecimal", true);
	}
	
	public Scriptable getObject(Scriptable globalObject, String... objects) {
		Scriptable object = globalObject;
		for (int i = 0; i < objects.length; i++) {
			Object child = object.get(objects[i], object);
			if (child instanceof Scriptable) {
				object = (Scriptable)child;
			} else {
				return null;
			}
		}
		return object;
	}
	
	public KrollObject getObject(String... objects) {
		Scriptable sObject = getObject(titanium, objects);
		if (sObject instanceof KrollObject) {
			return (KrollObject)sObject;
		}
		return null;
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
	
	public void bindContextSpecific(String ctxSpecificName, String objectName) {
		bindContextSpecific(ctxSpecificName, objectName, false);
	}
	
	public void bindContextSpecific(String ctxSpecificName, String objectName, boolean topLevel) {
		int lastDot = ctxSpecificName.lastIndexOf('.');
		if (lastDot < 0) return;
		
		String objName = ctxSpecificName.substring(0, lastDot);
		String ctxName = ctxSpecificName.substring(lastDot+1);
		
		Scriptable object = getObject(titanium, objectName);
		bindContextSpecific(objName, ctxName, object, topLevel);
	}
	
	public void bindContextSpecific(String objectName, String ctxSpecificName, Object value) {
		bindContextSpecific(objectName, ctxSpecificName, value, false);
	}
	
	public void bindContextSpecific(String objectName, String ctxSpecificName, Object value, boolean topLevel) {
		Scriptable object = titanium;
		if (objectName != null) {
			if (topLevel) {
				object = getObject(kroll.getScope(), objectName);
			} else {
				object = getObject(titanium, objectName);
			}
		}
		if (object != null) {
			KrollInvocation invocation = KrollInvocation.createPropertySetInvocation(object, object, ctxSpecificName, null, null);
			object.put(ctxSpecificName, object, KrollConverter.getInstance().convertNative(invocation, value));
		}
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
	
	public void release() {
		if (kroll != null) {
			kroll.release();
			kroll = null;
		}
	}
}
