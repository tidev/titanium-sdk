/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.util.HashMap;

import org.mozilla.javascript.Scriptable;

public class KrollProxy {

	public static final Object UNDEFINED = new Object();
	
	protected HashMap<String, Object> properties = new HashMap<String, Object>();
	
	public String getAPIClassName() {
		return getClass().getSimpleName();
	}
	
	public void bind(Scriptable scope, KrollProxy rootObject) {
		KrollProxyBindings.getBinding(this).bind(scope, rootObject, this);
	}
	
	public boolean has(Scriptable scope, String name) {
		try {
			get(scope, name);
			return true;
		} catch (NoSuchFieldException e) {
			return false;
		}
	}
	
	public Object get(Scriptable scope, String name) throws NoSuchFieldException {
		if (properties.containsKey(name)) {
			Object value = properties.get(name);
			if (value instanceof KrollDynamicProperty) {
				return getDynamicProperty(scope, name, (KrollDynamicProperty)value);
			} else {
				return value;
			}
		}
		return UNDEFINED;
	}
	
	public void set(Scriptable scope, String name, Object value) throws NoSuchFieldException {
		if (properties.containsKey(name)) {
			Object currentValue = properties.get(name);
			if (currentValue instanceof KrollDynamicProperty) {
				setDynamicProperty(scope, name, (KrollDynamicProperty)currentValue, value);
				return;
			}
		}
		properties.put(name, value);
	}
	
	public void call(Scriptable scope, String name, Object[] args) throws Exception {
		Object value = UNDEFINED;
		try {
			value = get(scope, name);
		} catch (NoSuchFieldException e) {}
		
		if (value != UNDEFINED && value instanceof KrollMethod) {
			KrollMethod method = (KrollMethod)value;
			KrollInvocation inv = KrollInvocation.createMethodInvocation(scope, null, name, method, this);
			
			method.invoke(inv, args);
		} else throw new NoSuchMethodException("method \""+name+"\" of proxy \""+
			getAPIClassName()+"\" wasn't found");
	}
	
	protected Object getDynamicProperty(Scriptable scope, String name, KrollDynamicProperty dynprop)
		throws NoSuchFieldException {
		if (dynprop.supportsGet(name)) {
			KrollInvocation inv = KrollInvocation.createFieldGetInvocation(scope, null, name, this);
			return dynprop.get(inv, name);
		} else {
			throw new NoSuchFieldException("dynamic property \""+name+"\" of proxy \""+
				getAPIClassName()+"\" doesn't have read support");
		}
	}
	
	protected void setDynamicProperty(Scriptable scope, String name, KrollDynamicProperty dynprop, Object value)
		throws NoSuchFieldException {
		if (dynprop.supportsSet(name)) {
			KrollInvocation inv = KrollInvocation.createFieldSetInvocation(scope, null, name, this);
			dynprop.set(inv, name, value);
		} else {
			throw new NoSuchFieldException("dynamic property \""+name+"\" of proxy \""+
				getAPIClassName()+"\" doesn't have write support");
		}
	}
}
