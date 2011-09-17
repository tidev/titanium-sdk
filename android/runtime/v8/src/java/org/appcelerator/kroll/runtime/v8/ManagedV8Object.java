/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.v8;

/* package */abstract class ManagedV8Object {
	
	protected long ptr;
	
	protected ManagedV8Object(long ptr) {
		this.ptr = ptr;
	}

	@Override
	protected void finalize() throws Throwable {
		super.finalize();
		release(ptr);		
		ptr = 0;
	}
	
	private static native void release(long ptr);
}
