/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import org.appcelerator.titanium.TiContext;
import org.mozilla.javascript.Scriptable;

public class KrollInvocation {

	protected Scriptable scope, thisObj;
	protected String name;
	protected boolean isPropertyGet, isPropertySet, isMethod;
	protected KrollMethod method;
	protected KrollDynamicProperty property;
	protected TiContext tiContext;
	protected KrollProxy proxy;
	protected KrollInvocation() {}
	
	public static KrollInvocation createMethodInvocation(TiContext tiContext, Scriptable scope, Scriptable thisObj, String name, KrollMethod method, KrollProxy proxy)
	{
		KrollInvocation invocation = new KrollInvocation();
		invocation.tiContext = tiContext;
		invocation.scope = scope;
		invocation.thisObj = thisObj;
		invocation.name = name;
		invocation.method = method;
		invocation.isMethod = true;
		invocation.proxy = proxy;
		return invocation;
	}
	
	public static KrollInvocation createPropertyGetInvocation(TiContext tiContext, Scriptable scope, Scriptable thisObj, String name, KrollDynamicProperty property, KrollProxy proxy)
	{
		KrollInvocation invocation = new KrollInvocation();
		invocation.tiContext = tiContext;
		invocation.scope = scope;
		invocation.thisObj = thisObj;
		invocation.name = name;
		invocation.isPropertyGet = true;
		invocation.property = property;
		invocation.proxy = proxy;
		return invocation;
	}
	
	public static KrollInvocation createPropertySetInvocation(TiContext tiContext, Scriptable scope, Scriptable thisObj, String name, KrollDynamicProperty property, KrollProxy proxy)
	{
		KrollInvocation invocation = new KrollInvocation();
		invocation.tiContext = tiContext;
		invocation.scope = scope;
		invocation.thisObj = thisObj;
		invocation.name = name;
		invocation.isPropertySet = true;
		invocation.property = property;
		invocation.proxy = proxy;
		return invocation;
	}

	public Scriptable getScope() {
		return scope;
	}
	
	public Scriptable getThisObj() {
		return thisObj;
	}

	public String getName() {
		return name;
	}
	
	public boolean isPropertyGet() {
		return isPropertyGet;
	}

	public boolean isPropertySet() {
		return isPropertySet;
	}

	public KrollDynamicProperty getProperty() {
		return property;
	}

	public TiContext getTiContext() {
		return tiContext;
	}

	public boolean isMethod() {
		return isMethod;
	}
	
	public KrollMethod getMethod() {
		return method;
	}
	
	public KrollProxy getProxy() {
		return proxy;
	}
}
