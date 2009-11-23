/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.api;

public interface ITitaniumFacebook
{
	void setup(String key, String secret, String callback);

	boolean isLoggedIn();
	
	long getUserId();

	void query(String fql, String callback);
	
	void execute(String method, String params, String data, String callback);

	void login(String callback);
	
	void logout(String callback);
	
	boolean hasPermission(String permission);
	
	void requestPermission(String permission, String callback);
	
	void publishStream(String title, String data, String target, String callback);
	
	void publishFeed(long templateBundleId, String data, String body, String callback);
	
}
