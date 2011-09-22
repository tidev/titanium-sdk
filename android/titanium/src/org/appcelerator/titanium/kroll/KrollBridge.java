/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.kroll;

import java.io.IOException;

import org.appcelerator.kroll.KrollConverter;
import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollMethod;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiContext;
import org.mozilla.javascript.Scriptable;

import ti.modules.titanium.TitaniumModule;

public class KrollBridge
{
	private static TitaniumModule tiModule;
	private KrollContext kroll;
	private KrollObject titanium;
	private boolean coverageEnabled;

	public KrollBridge(KrollContext kroll)
	{
		this.kroll = kroll;
		TiContext tiContext = kroll.getTiContext();
		tiContext.setKrollBridge(this);
		coverageEnabled = tiContext.getTiApp().isCoverageEnabled();

		if (tiModule == null) {
			tiModule = new TitaniumModule(kroll.getTiContext());
		}
		titanium = tiModule.getKrollObject();
		tiModule.bindContextSpecific(this);

		tiContext.getTiApp().bindModules(this, tiModule);
	}

	public Scriptable getObject(Scriptable globalObject, String... objects)
	{
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

	public KrollObject getObject(String... objects)
	{
		Scriptable sObject = getObject(titanium, objects);
		if (sObject instanceof KrollObject) {
			return (KrollObject)sObject;
		}
		return null;
	}

	public KrollObject getObject(String name)
	{
		if (name == null) return titanium;

		return getObject(name.split("\\."));
	}

	public void bindToTopLevel(String topLevelName, Object value)
	{
		if (value instanceof KrollProxy) {
			value = ((KrollProxy)value).getKrollObject();
		}

		Scriptable parent = kroll.getScope();
		String parentName = null;
		String name = topLevelName;
		if (topLevelName.contains(".")) {
			// Support for setting named properties on existing top level objects
			int lastDot = topLevelName.lastIndexOf(".");
			parentName = topLevelName.substring(0, lastDot);
			parent = getObject(kroll.getScope(), parentName.split("\\."));
			if (parent == null) {
				parent = kroll.getScope();
			} else {
				name = topLevelName.substring(lastDot+1);
			}
		}
		if (coverageEnabled && value instanceof KrollMethod) {
			KrollMethod method = (KrollMethod) value;
			if (parentName == null) {
				parentName = KrollCoverage.TOP_LEVEL;
			}
			value = new KrollCoverage.KrollFunctionCoverage(name, (KrollMethod)value,
				KrollCoverage.OTHER, parentName);
		}
		parent.put(name, parent, value);
	}

	public void bindToTopLevel(String topLevelName, String objectName)
	{
		bindToTopLevel(topLevelName, getObject(objectName));
	}
	
	public void bindContextSpecific(String ctxSpecificName, String objectName)
	{
		int lastDot = ctxSpecificName.lastIndexOf('.');
		if (lastDot < 0) return;

		String objName = ctxSpecificName.substring(0, lastDot);
		String ctxName = ctxSpecificName.substring(lastDot+1);

		Scriptable object = getObject(titanium, objectName);
		bindContextSpecific(objName, ctxName, object);
	}

	public void bindContextSpecific(String objectName, String ctxSpecificName, Object value)
	{
		Scriptable object = titanium;
		if (objectName != null) {
			object = getObject(titanium, objectName);
		}
		if (object != null) {
			KrollInvocation invocation = KrollInvocation.createPropertySetInvocation(object, object, ctxSpecificName, null, null);
			Object convertedValue = KrollConverter.getInstance().convertNative(invocation, value);
			object.put(ctxSpecificName, object, convertedValue);
			invocation.recycle();
		}
	}

	public KrollModule getModule(String moduleName)
	{
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
	public Object evalCommonJsModule(String filename)
		throws IOException
	{
		return kroll.evalCommonJsModule(filename);
	}

	public Object evalJS(String src)
	{
		return kroll.eval(src);
	}

	public KrollContext getKrollContext()
	{
		return kroll;
	}

	public Scriptable getScope()
	{
		return kroll.getScope();
	}

	public KrollProxy getRootObject() 
	{
		return titanium.getProxy();
	}

	public void release()
	{
		if (kroll != null) {
			kroll.release();
			kroll = null;
		}
	}
}
