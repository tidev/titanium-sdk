/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;

@SuppressWarnings("serial")
public class KrollScriptableMethod extends KrollMethod {

	protected Function function;
	protected Context context;
	protected Scriptable thisObject;
	
	public KrollScriptableMethod(Context context, Function function) {
		super(null);
		
		this.function = function;
		this.context = context;
	}
	
	public Scriptable getThisObject() {
		return thisObject;
	}
	
	public void setThisObject(Scriptable thisObject) {
		this.thisObject = thisObject;
	}
	
	@Override
	public Object invoke(KrollInvocation invocation, Object[] args) {
		
		Object convertedArgs[] = new Object[args.length];
		for (int i = 0; i < args.length; i++) {
			convertedArgs[i] = KrollConverter.getInstance().convertNative(invocation, args[i]);
		}
		
		Object result = function.call(context, invocation.scope, thisObject, convertedArgs);
		return KrollConverter.getInstance().convertJavascript(invocation, result, Object.class);
	}

}
