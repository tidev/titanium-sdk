/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.v8;

/**
 * @author Max Stepanov
 *
 */
public final class V8Context extends ManagedV8Object {

	public V8Context(V8Object object) {
		super(create(object));
	}
		
	private static native long create(V8Object object);
}
