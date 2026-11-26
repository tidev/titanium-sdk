package org.appcelerator.kroll.util;

import java.nio.charset.StandardCharsets;

/** Harness stand-in. */
public class KrollAssetHelper
{
	public static byte[] readAssetBytes(String path)
	{
		return "missing.js".equals(path) ? null : ("asset:" + path + " ä€").getBytes(StandardCharsets.UTF_8);
	}
}
