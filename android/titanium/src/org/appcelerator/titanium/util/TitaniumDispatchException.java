/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.util;

public class TitaniumDispatchException extends RuntimeException {

	private static final long serialVersionUID = 1L;

	private String module;

	public TitaniumDispatchException(String message, String module) {
		super(message);
		this.module = module;
	}

	public TitaniumDispatchException(String message, String module, Throwable cause) {
		super(message, cause);
		this.module = module;
	}

	public String getModule() {
		return module;
	}
}
