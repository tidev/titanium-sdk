/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

/**
 * Represents an argument to a method in a KrollInvocation
 */
public class KrollArgument {

	protected String name;
	protected Object value;
	protected boolean optional = false;
	protected boolean isValueDefault = false;

	public KrollArgument(String name) {
		this.name = name;
	}
	
	@Override
	public String toString() {
		return String.format("\"%s\"=%s%s", name, value, isValueDefault ? "(default)" : "");
	}

	public String getName() {
		return name;
	}

	public Object getValue() {
		return value;
	}

	public void setValue(Object value) {
		this.value = value;
	}

	public boolean isOptional() {
		return optional;
	}

	public void setOptional(boolean optional) {
		this.optional = optional;
	}

	public boolean isValueDefault() {
		return isValueDefault;
	}

	public void setValueDefault(boolean isValueDefault) {
		this.isValueDefault = isValueDefault;
	}
}
