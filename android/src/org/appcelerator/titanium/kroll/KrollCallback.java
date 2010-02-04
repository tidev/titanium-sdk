/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.kroll;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.util.Log;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;

public class KrollCallback
{
	private static final String LCAT = "KrollCallback";

	private KrollContext kroll;
	private KrollObject thisObj;
	private Function method;

	public KrollCallback(KrollContext kroll, KrollObject thisObj, Function method) {
		this.kroll = kroll;
		this.thisObj = thisObj;
		this.method = method;
	}

	public void call(final TiDict data) {
		kroll.post(new Runnable(){

			public void run() {
				Context ctx = kroll.enter();

				try {
					TiDict dataArg = data;
					if (data == null) {
						dataArg = new TiDict();
					}
					Object event = KrollObject.fromNative(dataArg, kroll);
					Object[] args = { event };
					method.call(ctx, thisObj, thisObj.getPrototype(), args);
				} catch (Throwable e) {
					Log.e(LCAT, "ERROR: " + e.getMessage(), e);
					//Context.throwAsScriptRuntimeEx(e);
				} finally {
					kroll.exit();
				}
			}
		});
	}
}
