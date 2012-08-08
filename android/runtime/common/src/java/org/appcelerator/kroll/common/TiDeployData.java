/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.common;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;

import org.appcelerator.kroll.util.KrollStreamHelper;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.Application;
import android.os.Environment;

/**
 * This class represents deployment data that is published to
 * /sdcard/[app id]/deploy.json as part of the build process
 */
public class TiDeployData
{
	private static final String TAG = "TiDeployData";

	protected static final String DEBUGGER_ENABLED = "debuggerEnabled";
	protected static final String DEBUGGER_PORT = "debuggerPort";
	protected static final String FASTDEV_PORT = "fastdevPort";
	protected static final String FASTDEV_LISTEN = "fastdevListen";

	private JSONObject deployData;

	/**
	 * Parses the deploy.json file if it exists
	 */
	public TiDeployData(Application app)
	{
		File extStorage = Environment.getExternalStorageDirectory();
		File deployJson = new File(new File(extStorage, app.getPackageName()), "deploy.json");

		if (deployJson.exists()) {
			readDeployData(deployJson);
		}
	}

	protected void readDeployData(File deployJson)
	{
		try {
			FileInputStream stream = new FileInputStream(deployJson);
			deployData = new JSONObject(KrollStreamHelper.toString(stream));
			Log.d(TAG, "Read deploy data: " + deployData.toString(), Log.DEBUG_MODE);

		} catch (FileNotFoundException e) {
			Log.e(TAG, e.getMessage(), e);

		} catch (JSONException e) {
			Log.e(TAG, e.getMessage(), e);
		}
	}

	/**
	 * @return Whether or not the debug server is enabled
	 */
	public boolean isDebuggerEnabled()
	{
		if (deployData == null) {
			return false;
		}

		return deployData.optBoolean(DEBUGGER_ENABLED, false);
	}

	/**
	 * @return The debug server port, or -1
	 */
	public int getDebuggerPort()
	{
		if (deployData == null) {
			return -1;
		}

		return deployData.optInt(DEBUGGER_PORT, -1);
	}

	/**
	 * @return The "fastdev" http server port, or -1
	 */
	public int getFastDevPort()
	{
		if (deployData == null) {
			return -1;
		}

		return deployData.optInt(FASTDEV_PORT, -1);
	}

	/**
	 * @return Whether or not Fastdev mode should listen for a connection (default false)
	 *  This is useful for situations where adb forward or other external methods are necessary
	 */
	public boolean getFastDevListen()
	{
		if (deployData == null) {
			return false;
		}

		return deployData.optBoolean(FASTDEV_LISTEN, false);
	}
}
