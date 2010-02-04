package org.appcelerator.titanium.util;

public class TiFileHelper2
{
	public static String getResourcesPath(String path) {
		return joinSegments("Resources", path);
	}

	public static String joinSegments(String s1, String s2) {
		if (s1.endsWith("/")) {
			if (s2.startsWith("/")) {
				return s1 + s2.substring(1);
			} else {
				return s1 + s2;
			}
		} else {
			if (s2.startsWith("/")) {
				return s1 + s2;
			} else {
				return s1 + "/" + s2;
			}
		}
	}
}
