/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import org.appcelerator.titanium.TiContext;
import org.mozilla.javascript.Scriptable;

import android.app.Activity;

public class KrollInvocation {
	protected static Object invocationPoolSync = new Object();
	protected static KrollInvocation invocationPool = new KrollInvocation();
	protected static int poolSize = 0;
	protected static final int MAX_POOL_SIZE = 32;
	
	protected Scriptable scope, thisObj;
	protected String name;
	protected boolean isPropertyGet, isPropertySet, isMethod;
	protected KrollMethod method;
	protected ArrayList<KrollArgument> arguments = new ArrayList<KrollArgument>();
	protected KrollProperty property;
	protected TiContext tiContext;
	protected KrollProxy proxy;
	protected KrollInvocation next;
	protected KrollInvocation() {}
	
	protected static KrollInvocation obtainInvocation() {
		synchronized (invocationPoolSync) {
			if (invocationPool != null) {
				KrollInvocation inv = invocationPool;
				invocationPool = inv.next;
				inv.next = null;
				return inv;
			}
		}
		return new KrollInvocation();
	}
	
	public static KrollInvocation createMethodInvocation(Scriptable scope, Scriptable thisObj, String name, KrollMethod method, KrollProxy proxy)
	{
		return createMethodInvocation(TiContext.getCurrentTiContext(), scope, thisObj, name, method, proxy);
	}
	
	public static KrollInvocation createMethodInvocation(TiContext tiContext, Scriptable scope, Scriptable thisObj, String name, KrollMethod method, KrollProxy proxy)
	{
		KrollInvocation invocation = obtainInvocation();
		invocation.tiContext = tiContext;
		invocation.scope = scope;
		invocation.thisObj = thisObj;
		invocation.name = name;
		invocation.method = method;
		invocation.isMethod = true;
		invocation.proxy = proxy;
		return invocation;
	}
	
	public static KrollInvocation createPropertyGetInvocation(Scriptable scope, Scriptable thisObj, String name, KrollProperty property, KrollProxy proxy)
	{
		return createPropertyGetInvocation(TiContext.getCurrentTiContext(), scope, thisObj, name, property, proxy);
	}
	
	public static KrollInvocation createPropertyGetInvocation(TiContext tiContext, Scriptable scope, Scriptable thisObj, String name, KrollProperty property, KrollProxy proxy)
	{
		KrollInvocation invocation = obtainInvocation();
		invocation.tiContext = tiContext;
		invocation.scope = scope;
		invocation.thisObj = thisObj;
		invocation.name = name;
		invocation.isPropertyGet = true;
		invocation.property = property;
		invocation.proxy = proxy;
		return invocation;
	}
	
	public static KrollInvocation createPropertySetInvocation(Scriptable scope, Scriptable thisObj, String name, KrollProperty property, KrollProxy proxy)
	{
		return createPropertySetInvocation(TiContext.getCurrentTiContext(), scope, thisObj, name, property, proxy);
	}
	
	public static KrollInvocation createPropertySetInvocation(TiContext tiContext, Scriptable scope, Scriptable thisObj, String name, KrollProperty property, KrollProxy proxy)
	{
		KrollInvocation invocation = obtainInvocation();
		invocation.tiContext = tiContext;
		invocation.scope = scope;
		invocation.thisObj = thisObj;
		invocation.name = name;
		invocation.isPropertySet = true;
		invocation.property = property;
		invocation.proxy = proxy;
		return invocation;
	}
	
	public String toString() {
		StringBuilder sb = new StringBuilder();
		if (isPropertyGet) {
			sb.append("[getProperty ");
		} else if (isPropertySet) {
			sb.append("[setProperty ");
		} else if (isMethod) {
			sb.append("[callMethod ");
		}
		
		if (proxy != null) {
			sb.append(proxy.getAPIName()).append(".");
		}
		
		sb.append(name).append(" ");
		if (isPropertyGet || isPropertySet) {
			sb.append(property);
		} else if (isMethod) {
			sb.append(method);
			if (arguments != null) {
				Iterator<KrollArgument> iter = arguments.iterator();
				while(iter.hasNext()) {
					KrollArgument arg = iter.next();
					sb.append(arg);
					if (iter.hasNext()) {
						sb.append(" ");
					}
				}
			}
		}
		sb.append("]");
		return sb.toString();
	}

	public void addArgument(KrollArgument arg) {
		arguments.add(arg);
	}
	
	public List<KrollArgument> getArguments() {
		return arguments;
	}
	
	public KrollArgument getArgument(String name) {
		for (KrollArgument arg : arguments) {
			if (arg.getName().equals(name)) {
				return arg;
			}
		}
		return null;
	}
	
	public boolean isDefaultValue(String argName) {
		KrollArgument arg = getArgument(argName);
		if (arg != null) {
			return arg.isValueDefault;
		}
		return false;
	}

	public void recycle() {
		synchronized (invocationPoolSync) {
			if (poolSize < MAX_POOL_SIZE) {
				clearForRecycle();
				next = invocationPool;
				invocationPool = this;
			}
		}
	}

	public KrollInvocation copy() {
		KrollInvocation other = obtainInvocation();
		other.arguments = (ArrayList<KrollArgument>) arguments.clone();
		other.isMethod = isMethod;
		other.isPropertyGet = isPropertyGet;
		other.isPropertySet = isPropertySet;
		other.method = method;
		other.name = name;
		other.property = property;
		other.proxy = proxy;
		other.scope = scope;
		other.thisObj = thisObj;
		other.tiContext = tiContext;
		return other;
	}
	
	protected void clearForRecycle() {
		arguments.clear();
		isMethod = isPropertyGet = isPropertySet = false;
		method = null;
		name = null;
		property = null;
		proxy = null;
		scope = null;
		thisObj = null;
		tiContext = null;
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

	public KrollProperty getProperty() {
		return property;
	}

	public TiContext getTiContext() {
		return tiContext;
	}
	
	public Activity getActivity() {
		if (tiContext == null) {
			return null;
		}
		return tiContext.getActivity();
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
