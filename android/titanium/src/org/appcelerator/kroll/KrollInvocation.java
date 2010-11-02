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

public class KrollInvocation {

	protected Scriptable scope, thisObj;
	protected String name;
	protected boolean isPropertyGet, isPropertySet, isMethod;
	protected KrollMethod method;
	protected ArrayList<KrollArgument> arguments = new ArrayList<KrollArgument>();
	protected KrollProperty property;
	protected TiContext tiContext;
	protected KrollProxy proxy;
	protected KrollInvocation() {}
	
	public static KrollInvocation createMethodInvocation(Scriptable scope, Scriptable thisObj, String name, KrollMethod method, KrollProxy proxy)
	{
		return createMethodInvocation(TiContext.getCurrentTiContext(), scope, thisObj, name, method, proxy);
	}
	
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
	
	public static KrollInvocation createPropertyGetInvocation(Scriptable scope, Scriptable thisObj, String name, KrollProperty property, KrollProxy proxy)
	{
		return createPropertyGetInvocation(TiContext.getCurrentTiContext(), scope, thisObj, name, property, proxy);
	}
	
	public static KrollInvocation createPropertyGetInvocation(TiContext tiContext, Scriptable scope, Scriptable thisObj, String name, KrollProperty property, KrollProxy proxy)
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
	
	public static KrollInvocation createPropertySetInvocation(Scriptable scope, Scriptable thisObj, String name, KrollProperty property, KrollProxy proxy)
	{
		return createPropertySetInvocation(TiContext.getCurrentTiContext(), scope, thisObj, name, property, proxy);
	}
	
	public static KrollInvocation createPropertySetInvocation(TiContext tiContext, Scriptable scope, Scriptable thisObj, String name, KrollProperty property, KrollProxy proxy)
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
	
	public String toString() {
		String str = "";
		if (isPropertyGet) {
			str += "[getProperty ";
		} else if (isPropertySet) {
			str += "[setProperty ";
		} else if (isMethod) {
			str += "[callMethod ";
		}
		
		if (proxy != null) {
			str += proxy.getAPIName() + ".";
		}
		
		str += name + " ";
		if (isPropertyGet || isPropertySet) {
			str += property;
		} else if (isMethod) {
			str += method;
			if (arguments != null) {
				Iterator<KrollArgument> iter = arguments.iterator();
				while(iter.hasNext()) {
					KrollArgument arg = iter.next();
					str += arg;
					if (iter.hasNext()) {
						str += " ";
					}
				}
			}
		}
		str += "]";
		return str;
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
