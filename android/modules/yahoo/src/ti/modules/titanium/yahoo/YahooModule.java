/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.yahoo;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;

@Kroll.module
public class YahooModule extends KrollModule
{
	private static final String LCAT = "YahooModule";

	public YahooModule(TiContext tiContext)
	{
		super(tiContext);
	
		String src = null;
		BufferedReader is = null;
		try {
			is = new BufferedReader(new InputStreamReader(getClass().getResourceAsStream("yahoo.js")));
			if (is != null) {
				char[] buf = new char[8096];
				int len = 0;
				StringBuilder sb = new StringBuilder();
				while ((len = is.read(buf)) != -1) {
					sb.append(buf, 0, len);
				}
				src = sb.toString();
			}
		} catch (IOException e) {
			Log.e(LCAT, "Unable to load yahoo.js");
		} finally {
			if (is != null) {
				try {
					is.close();
				} catch (IOException e) {
					// Ignore
				}
			}
		}

		if (src != null) {
			getTiContext().evalJS(src);
		}
	}


}
