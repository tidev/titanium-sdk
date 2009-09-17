/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.api;

public interface ITitaniumEmailDialog
{
	public void setSubject(String subject);
	public void addTo(String addr);
	public void addCc(String addr);
	public void addBcc(String addr);
	public void setMessage(String msg);
	public void addAttachment(String json);
	public void open();
}
