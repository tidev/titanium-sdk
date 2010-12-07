/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

public class TiFileHelper2
{
	public static String getResourcesPath(String path) {
		return joinSegments("Resources", path);
	}

	public static String joinSegments(String... segments) {
		if (segments.length > 0) {
			String s1 = segments[0];
			for(int i = 1; i < segments.length; i++) {
				String s2 = segments[i];
				if (s1.endsWith("/")) {
					if (s2.startsWith("/")) {
						s1 = s1 + s2.substring(1);
					} else {
						s1 = s1 + s2;
					}
				} else {
					if (s2.startsWith("/")) {
						s1 = s1 + s2;
					} else {
						s1 = s1 + "/" + s2;
					}
				}
			}
			return s1;
		} else {
			return "";
		}
	}
}
