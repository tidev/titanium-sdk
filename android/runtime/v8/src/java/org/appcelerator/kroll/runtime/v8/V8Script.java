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
public final class V8Script extends ManagedV8Object {

	/**
	 * Create precompiled script
	 * @param source
	 */
	public V8Script(String source) {
		super(compile(source));
	}

	/**
	 * Run precompiled script in predefined context
	 * @param context
	 * @return
	 */
	public V8Object runInContext(V8Context context) {
		return new V8Object(runInContext(ptr, context.ptr));
	}

	/**
	 * Run precompiled script in context created from provided object
	 * @param object
	 * @return
	 */
	public V8Object runInContext(V8Object object) {
		return new V8Object(runInNewContext(ptr, object.ptr));
	}

	/**
	 * Run precompiled script in an empty context
	 * @return
	 */
	public V8Object runInNewContext() {
		return new V8Object(runInNewContext(ptr, 0));
	}

	/**
	 * Run script sources in predefined context
	 * @param source
	 * @param context
	 * @return
	 */
	public static V8Object runInContext(String source, V8Context context) {
		return new V8Object(runInContext(source, context.ptr));
	}

	/**
	 * Run script sources in context created form provided object
	 * @param source
	 * @param object
	 * @return
	 */
	public static V8Object runInContext(String source, V8Object object) {
		return new V8Object(runInNewContext(source, object.ptr));
	}

	/**
	 * Run script sources in an empty context
	 * @param source
	 * @return
	 */
	public static V8Object runInNewContext(String source) {
		return new V8Object(runInNewContext(source, 0));
	}

	private static native long compile(String source);

	private static native long runInContext(long ptr, long context_ptr);
	private static native long runInContext(String source, long context_ptr);

	private static native long runInNewContext(long ptr, long object_ptr);
	private static native long runInNewContext(String source, long object_ptr);
}
