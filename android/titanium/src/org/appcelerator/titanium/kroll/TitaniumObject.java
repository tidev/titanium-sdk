/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.kroll;



public class TitaniumObject extends KrollObject
{
	private static final String LCAT = "TitaniumObject";
	private static final long serialVersionUID = 1L;

	public TitaniumObject(KrollContext kroll) {
		super(kroll);

		this.target = loadModule("Titanium");
	}

	@Override
	public String getClassName() {
		return "Titanium";
	}
}
