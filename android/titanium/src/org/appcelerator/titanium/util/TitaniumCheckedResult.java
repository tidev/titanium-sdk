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
	public String type;

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
		this.type = "null";
		if (result != null) {
			if (result instanceof Boolean) {
				this.type = "boolean";
			} else if (result instanceof String) {
				this.type = "string";
			} else if (result instanceof Integer || result instanceof Long) {
				this.type = "int";
			} else if (result instanceof Float || result instanceof Double) {
				this.type = "double";
			} else {
				this.type = "object";
			}
		}
	}

	public String getException() {
		return exception;
	}

	public Object getResult() {
		return result;
	}

	public String getType() {
		return type;
	}

	public void destroy() {
		result = null;
		exception = null;
		type = null;
	}
}
