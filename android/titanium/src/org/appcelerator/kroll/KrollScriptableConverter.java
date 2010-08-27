/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import org.mozilla.javascript.Scriptable;

public interface KrollScriptableConverter {
	public Object convertScriptable(KrollInvocation invocation, Scriptable s); 
}
