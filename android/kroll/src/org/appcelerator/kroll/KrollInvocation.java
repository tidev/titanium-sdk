/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.lang.reflect.Field;
import java.lang.reflect.Method;

import org.mozilla.javascript.Scriptable;

import android.app.Activity;

public class KrollInvocation {

	protected Scriptable scope;
	protected Activity activity;
	protected String name;
	protected boolean isFieldGet, isFieldSet, isMethod;
	protected Field field;
	protected Method method;
	protected KrollInvocation() {}
	
	public static KrollInvocation createMethodInvocation(Scriptable scope, Activity activity, String name, Method method)
	{
		KrollInvocation invocation = new KrollInvocation();
		invocation.scope = scope;
		invocation.activity = activity;
		invocation.name = name;
		invocation.method = method;
		invocation.isMethod = true;
		return invocation;
	}
	
	public static KrollInvocation createFieldGetInvocation(Scriptable scope, Activity activity, String name, Field field)
	{
		KrollInvocation invocation = new KrollInvocation();
		invocation.scope = scope;
		invocation.activity = activity;
		invocation.name = name;
		invocation.field = field;
		invocation.isFieldGet = true;
		return invocation;
	}
	
	public static KrollInvocation createFieldSetInvocation(Scriptable scope, Activity activity, String name, Field field)
	{
		KrollInvocation invocation = new KrollInvocation();
		invocation.scope = scope;
		invocation.activity = activity;
		invocation.name = name;
		invocation.field = field;
		invocation.isFieldSet = true;
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
	
	public Method getMethod() {
		return method;
	}
	
	public Field getField() {
		return field;
	}
}
