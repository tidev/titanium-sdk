/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.ant;

import org.apache.tools.ant.BuildException;
import org.apache.tools.ant.Task;

/**
 * A simple wrapper around convenient String APIs
 */
public class StringTask extends Task {

	protected String string, property;
	protected String substring;
	protected String indexOf, lastIndexOf;
	protected int fromIndex = -1;
	protected String replace, with;
	protected int charAt = -1;
	protected boolean toLowerCase = false;
	protected boolean toUpperCase = false;
	protected boolean trim = false;
	
	@Override
	public void execute() throws BuildException {
		String result = string;
		if (indexOf != null) {
			result = string.indexOf(indexOf, fromIndex == -1 ? 0 : fromIndex) + "";
		} else if (lastIndexOf != null) {
			result = string.lastIndexOf(lastIndexOf, fromIndex == -1 ? string.length() : fromIndex) + "";
		} else if (substring != null) {
			String[] args = substring.split("[,:\\-]");
			if (args.length == 1) {
				int begin = Integer.parseInt(args[0]);
				if (begin < 0) { begin += result.length(); }
				result = string.substring(begin);
			} else {
				int begin = Integer.parseInt(args[0]);
				if (begin < 0) { begin += result.length(); }
				int end = Integer.parseInt(args[1]);
				if (end < 0) { end += result.length(); }
				result = string.substring(begin, end);
			}
		} else if (replace != null && with != null) {
			result = string.replace(replace, with);
		} else if (toLowerCase) {
			result = string.toLowerCase();
		} else if (toUpperCase) {
			result = string.toUpperCase();
		} else if (trim) {
			result = string.trim();
		} else if (charAt != -1) {
			result = string.charAt(charAt) + "";
		}
		
		getProject().setProperty(property, result);
	}

	public void addText(String text) {
		this.string = text;
	}
	
	public String getString() {
		return string;
	}

	public void setString(String string) {
		this.string = string;
	}

	public String getProperty() {
		return property;
	}

	public void setProperty(String property) {
		this.property = property;
	}

	public String getSubstring() {
		return substring;
	}

	public void setSubstring(String substring) {
		this.substring = substring;
	}

	public String getIndexOf() {
		return indexOf;
	}

	public void setIndexOf(String indexOf) {
		this.indexOf = indexOf;
	}

	public boolean isToLowerCase() {
		return toLowerCase;
	}

	public void setToLowerCase(boolean toLowerCase) {
		this.toLowerCase = toLowerCase;
	}

	public boolean isToUpperCase() {
		return toUpperCase;
	}

	public void setToUpperCase(boolean toUpperCase) {
		this.toUpperCase = toUpperCase;
	}

	public String getLastIndexOf() {
		return lastIndexOf;
	}

	public void setLastIndexOf(String lastIndexOf) {
		this.lastIndexOf = lastIndexOf;
	}

	public int getFromIndex() {
		return fromIndex;
	}

	public void setFromIndex(int fromIndex) {
		this.fromIndex = fromIndex;
	}

	public String getReplace() {
		return replace;
	}

	public void setReplace(String replace) {
		this.replace = replace;
	}

	public String getWith() {
		return with;
	}

	public void setWith(String with) {
		this.with = with;
	}

	public boolean isTrim() {
		return trim;
	}

	public void setTrim(boolean trim) {
		this.trim = trim;
	}
}
