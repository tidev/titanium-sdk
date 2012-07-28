/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

public interface KrollEvaluator {
	/**
	 * Evaluate the given string's contents in the given context/scope
	 * @return The result of the evaluated string
	 */
	public Object evaluateString(Object scope, String src, String sourceName);
}
