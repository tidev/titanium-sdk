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
public final class V8Script extends ManagedV8Reference {

	/**
	 * Create precompiled script
	 * @param source
	 * @param filename
	 */
	public V8Script(String source, String filename) {
		super(compile(source, filename));
	}

	/**
	 * Run precompiled script in predefined context
	 * @param context
	 * @return
	 */
	public V8Value runInContext(V8Context context) {
		return new V8Value(runInContext(ptr, context.ptr));
	}

	/**
	 * Run precompiled script in context created from provided object
	 * @param object
	 * @return
	 */
	public V8Value runInContext(V8Object object) {
		return new V8Value(runInNewContext(ptr, object.ptr));
	}

	/**
	 * Run precompiled script in an empty context
	 * @return
	 */
	public V8Value runInNewContext() {
		return new V8Value(runInNewContext(ptr, 0));
	}

	/**
	 * Run script sources in predefined context
	 * @param source
	 * @param context
	 * @param filename
	 * @return
	 */
	public static V8Value runInContext(String source, V8Context context, String filename) {
		return new V8Value(runInContext(source, context.ptr, filename));
	}

	/**
	 * Run script sources in predefined context
	 * @param source
	 * @param context
	 * @param filename
	 * @return
	 */
	public static void runInContextNoResult(String source, V8Context context, String filename) {
		runInContextNoResult(source, context.ptr, filename);
	}

	public static void runInThisContextNoResult(String source, String filename) {
		nativeRunInThisContextNoResult(source, filename);
	}

	/**
	 * Run script sources in context created form provided object
	 * @param source
	 * @param object
	 * @param filename
	 * @return
	 */
	public static V8Value runInContext(String source, V8Object object, String filename) {
		return new V8Value(runInNewContext(source, object.ptr, filename));
	}

	/**
	 * Run script sources in an empty context
	 * @param source
	 * @param filename
	 * @return
	 */
	public static V8Value runInNewContext(String source, String filename) {
		return new V8Value(runInNewContext(source, 0, filename));
	}

	private static native long compile(String source, String filename);

	private static native long runInContext(long ptr, long context_ptr);
	private static native long runInContext(String source, long context_ptr, String filename);
	private static native void runInContextNoResult(String source, long context_ptr, String filename);
	private static native void nativeRunInThisContextNoResult(String source, String filename);

	private static native long runInNewContext(long ptr, long object_ptr);
	private static native long runInNewContext(String source, long object_ptr, String filename);
}
