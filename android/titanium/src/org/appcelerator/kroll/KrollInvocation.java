/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import org.appcelerator.kroll.runtime.v8.V8Object;

public class KrollInvocation
{
	protected static Object invocationPoolSync = new Object();
	protected static KrollInvocation invocationPool = new KrollInvocation();
	protected static int poolSize = 0;
	protected static final int MAX_POOL_SIZE = 32;
	
	protected V8Object scope, thisObj;
	protected String name;
	protected boolean isPropertyGet, isPropertySet, isMethod;
	//protected TiContext tiContext;
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

	public static KrollInvocation createMethodInvocation(V8Object scope, V8Object thisObj, String name, KrollProxy proxy)
	{
		KrollInvocation invocation = obtainInvocation();
		//invocation.tiContext = tiContext;
		invocation.scope = scope;
		invocation.thisObj = thisObj;
		invocation.name = name;
		invocation.isMethod = true;
		invocation.proxy = proxy;
		return invocation;
	}

	public static KrollInvocation createPropertyGetInvocation(V8Object scope, V8Object thisObj, String name, KrollProxy proxy)
	{
		KrollInvocation invocation = obtainInvocation();
		//invocation.tiContext = tiContext;
		invocation.scope = scope;
		invocation.thisObj = thisObj;
		invocation.name = name;
		invocation.isPropertyGet = true;
		invocation.proxy = proxy;
		return invocation;
	}

	public static KrollInvocation createPropertySetInvocation(V8Object scope, V8Object thisObj, String name, KrollProxy proxy)
	{
		KrollInvocation invocation = obtainInvocation();
		//invocation.tiContext = tiContext;
		invocation.scope = scope;
		invocation.thisObj = thisObj;
		invocation.name = name;
		invocation.isPropertySet = true;
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
		
		/*if (proxy != null) {
			sb.append(proxy.getAPIName()).append(".");
		}*/
		
		sb.append(name).append("]");
		return sb.toString();
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
		other.isMethod = isMethod;
		other.isPropertyGet = isPropertyGet;
		other.isPropertySet = isPropertySet;
		other.name = name;
		other.proxy = proxy;
		other.scope = scope;
		other.thisObj = thisObj;
		//other.tiContext = tiContext;
		return other;
	}
	
	protected void clearForRecycle() {
		isMethod = isPropertyGet = isPropertySet = false;
		name = null;
		proxy = null;
		scope = null;
		thisObj = null;
		//tiContext = null;
	}

	public V8Object getScope() {
		return scope;
	}
	
	public V8Object getThisObj() {
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

	/*
	public TiContext getTiContext() {
		return tiContext;
	}
	
	public Activity getActivity() {
		if (tiContext == null) {
			return null;
		}
		return tiContext.getActivity();
	}
	*/

	public boolean isMethod() {
		return isMethod;
	}
	
	public KrollProxy getProxy() {
		return proxy;
	}
}
