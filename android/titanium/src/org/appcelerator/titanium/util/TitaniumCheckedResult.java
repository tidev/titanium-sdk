/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import org.appcelerator.titanium.api.ITitaniumCheckedResult;

public class TitaniumCheckedResult implements ITitaniumCheckedResult
{
	public Object result;
	public String exception;

	public TitaniumCheckedResult() {
		this(null,null);
	}

	public TitaniumCheckedResult(Object result) {
		this(result, null);
	}

	public TitaniumCheckedResult(Object result, String exception)
	{
		this.result = result;
		this.exception = exception;
	}

	public String getException() {
		return exception;
	}

	public Object getResult() {
		return result;
	}

}
