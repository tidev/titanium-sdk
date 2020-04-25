/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.common;

import java.io.ByteArrayOutputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;

import org.appcelerator.kroll.KrollApplication;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.content.res.AssetManager;

/**
 * This class represents deployment data (deploy.json) that is packaged with
 * the app as part of the build process.
 */
public class TiDeployData
{
	private static final String TAG = "TiDeployData";

	protected static final String DEBUGGER_ENABLED = "debuggerEnabled";
	protected static final String DEBUGGER_PORT = "debuggerPort";
	protected static final String PROFILER_ENABLED = "profilerEnabled";
	protected static final String PROFILER_PORT = "profilerPort";
	protected static final String FASTDEV_PORT = "fastdevPort";
	protected static final String FASTDEV_LISTEN = "fastdevListen";

	private KrollApplication krollApp;
	private JSONObject deployData;

	/**
	 * Parses the deploy.json file if it exists
	 */
	public TiDeployData(KrollApplication app)
	{
		krollApp = app;
		deployData = null;

		try {
			AssetManager assetManager = ((Context) app).getAssets();

			if (assetManager == null) {
				Log.e(TAG, "AssetManager is null, can't read deploy.json");
				return;
			}

			InputStream in = assetManager.open("deploy.json");
			ByteArrayOutputStream out = new ByteArrayOutputStream();
			byte[] buffer = new byte[1024];
			int count = 0;

			while ((count = in.read(buffer)) != -1) {
				if (out != null) {
					out.write(buffer, 0, count);
				}
			}

			String deployJson = out.toString();
			if (deployJson == null) {
				Log.d(TAG, "deploy.json does not exist, skipping", Log.DEBUG_MODE);
			} else {
				deployData = new JSONObject(deployJson);
				Log.d(TAG, "Loaded deploy.json: " + deployData.toString(), Log.DEBUG_MODE);
			}
		} catch (FileNotFoundException e) {
			// squeltch
		} catch (IOException e) {
			Log.e(TAG, "IO error while reading deploy.json", e);
		} catch (JSONException e) {
			Log.e(TAG, e.getMessage(), e);
		}
	}

	/**
	 * @return Whether or not the debug server is enabled
	 */
	public boolean isDebuggerEnabled()
	{
		if (deployData == null || isDeployTypeDisabled()) {
			return false;
		}

		return deployData.optBoolean(DEBUGGER_ENABLED, false);
	}

	/**
	 * @return The debug server port, or -1
	 */
	public int getDebuggerPort()
	{
		if (deployData == null || isDeployTypeDisabled()) {
			return -1;
		}

		return deployData.optInt(DEBUGGER_PORT, -1);
	}

	/**
	 * @return Whether or not the profiler server is enabled
	 */
	public boolean isProfilerEnabled()
	{
		if (deployData == null || isDeployTypeDisabled()) {
			return false;
		}

		return deployData.optBoolean(PROFILER_ENABLED, false);
	}

	/**
	 * @return The profiler server port, or -1
	 */
	public int getProfilerPort()
	{
		if (deployData == null || isDeployTypeDisabled()) {
			return -1;
		}

		return deployData.optInt(PROFILER_PORT, -1);
	}

	/**
	 * @return The "fastdev" http server port, or -1
	 */
	public int getFastDevPort()
	{
		// fastdev is deprecated
		return -1;

		/*
		if (isDeployTypeDisabled()) {
			return -1;
		}

		return deployData.optInt(FASTDEV_PORT, -1);
		*/
	}

	/**
	 * @return Whether or not Fastdev mode should listen for a connection (default false)
	 *  This is useful for situations where adb forward or other external methods are necessary
	 */
	public boolean getFastDevListen()
	{
		// fastdev is deprecated
		return false;

		/*
		if (isDeployTypeDisabled()) {
			return false;
		}

		return deployData.optBoolean(FASTDEV_LISTEN, false);
		*/
	}

	private boolean isDeployTypeDisabled()
	{
		String deployType = null;
		if (krollApp != null) {
			deployType = krollApp.getDeployType();
		}

		return (deployData == null || "production".equals(deployType));
	}
}
