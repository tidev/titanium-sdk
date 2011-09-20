/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.v8;

public final class V8Context extends ManagedV8Reference {

	protected V8Context(long contextPtr) {
		super(contextPtr);
	}

	public V8Context(V8Object object) {
		super(create(object != null ? object.ptr : 0));
	}

	public V8Context() {
		this(null);
	}

	private static native long create(long objectPtr);
}
