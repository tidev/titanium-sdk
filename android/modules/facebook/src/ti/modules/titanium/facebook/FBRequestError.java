/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.facebook;

import java.util.Map;

/**
 * Encapsulates an error from a Facebook API request
 * 
 * See the Facebook API documentation for information about the error codes
 * returned by various API methods.
 * 
 * @author mneeley@gmail.com
 * 
 */
@SuppressWarnings("serial")
public class FBRequestError extends Exception {

	private int code;
	private String message;
	private Map<String, String> args;

	public FBRequestError(int code, String message, Map<String, String> args) {
		this.code = code;
		this.message = message;
		this.args = args;
	}

	/**
	 * Get the integer error code of this error.
	 * 
	 * @return
	 */
	public int getCode() {
		return code;
	}

	/**
	 * Get the error message.
	 */
	public String getMessage() {
		return message;
	}

	/**
	 * Get the args from the request that resulted in this error.
	 * 
	 * @return
	 */
	public Map<String, String> getRequestArgs() {
		return args;
	}

	public String toString() {
		return "FBRequestError (" + code + "): " + message;
	}

}
