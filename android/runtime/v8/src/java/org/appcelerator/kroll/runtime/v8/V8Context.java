/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.v8;

public final class V8Context extends V8Object {

	public V8Context(long contextPtr) {
		super(contextPtr);
	}

	private static native long create(long contextPtr);
}
