/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.io.IOException;

import org.mozilla.javascript.Scriptable;

public interface TiEvaluator
{
	public Object evalJS(String src);
	public Object evalFile(String filename) throws IOException;
	
	public Scriptable getScope();
}
