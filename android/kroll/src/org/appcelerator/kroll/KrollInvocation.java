/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import org.mozilla.javascript.Scriptable;

import android.app.Activity;

public class KrollInvocation {

	protected Scriptable scope;
	protected Activity activity;
	protected String name;
	protected KrollProxy proxy;
	protected boolean isFieldGet, isFieldSet, isMethod;
	protected KrollMethod method;
	protected KrollInvocation() {}
	
	public static KrollInvocation createMethodInvocation(Scriptable scope, Activity activity, String name, KrollMethod method, KrollProxy proxy)
	{
		KrollInvocation invocation = new KrollInvocation();
		invocation.scope = scope;
		invocation.activity = activity;
		invocation.name = name;
		invocation.method = method;
		invocation.isMethod = true;
		invocation.proxy = proxy;
		return invocation;
	}
	
	public static KrollInvocation createFieldGetInvocation(Scriptable scope, Activity activity, String name, KrollProxy proxy)
	{
		KrollInvocation invocation = new KrollInvocation();
		invocation.scope = scope;
		invocation.activity = activity;
		invocation.name = name;
		invocation.isFieldGet = true;
		invocation.proxy = proxy;
		return invocation;
	}
	
	public static KrollInvocation createFieldSetInvocation(Scriptable scope, Activity activity, String name, KrollProxy proxy)
	{
		KrollInvocation invocation = new KrollInvocation();
		invocation.scope = scope;
		invocation.activity = activity;
		invocation.name = name;
		invocation.isFieldSet = true;
		invocation.proxy = proxy;
		return invocation;
	}

	public Scriptable getScope() {
		return scope;
	}

	public Activity getActivity() {
		return activity;
	}

	public String getName() {
		return name;
	}
	
	public boolean isFieldSet() {
		return isFieldSet;
	}
	
	public boolean isFieldGet() {
		return isFieldGet;
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
