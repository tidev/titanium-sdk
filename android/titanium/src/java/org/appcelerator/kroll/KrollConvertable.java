/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

// A simple interface for classes that know how to convert
// themselves to or from javascript.
public interface KrollConvertable {
	public Object getJavascriptValue();
	public Object getNativeValue();
}
