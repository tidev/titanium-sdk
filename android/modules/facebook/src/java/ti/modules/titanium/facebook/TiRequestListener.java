/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.facebook;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.net.MalformedURLException;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.common.Log;
import org.json.JSONException;
import org.json.JSONObject;

import com.facebook.android.AsyncFacebookRunner.RequestListener;
import com.facebook.android.FacebookError;
import com.facebook.android.Util;

public class TiRequestListener implements RequestListener
{
	private boolean isGraphApiCall;
	private String callPath;
	private KrollFunction callback;
	private FacebookModule module;

	public TiRequestListener(FacebookModule module, String callPath, boolean isGraphApiCall, KrollFunction callback)
	{
		this.module = module;
		this.callback = callback;
		this.callPath = callPath;
		this.isGraphApiCall = isGraphApiCall;
	}
	
	private KrollDict buildEventArgs(boolean success)
	{
		KrollDict d = new KrollDict();
		d.put("graph", isGraphApiCall);
		if (isGraphApiCall) {
			d.put("path", callPath);
		} else {
			d.put("method", callPath);
		}
		d.put("success", success);
		return d;
	}
	
	private KrollDict buildEventArgs(boolean success, Throwable t)
	{
		KrollDict d = buildEventArgs(success);
		d.put("error", t.getLocalizedMessage());
		return d;
	}
	
	private KrollDict buildEventArgs(boolean success, String result)
	{
		KrollDict d = buildEventArgs(success);
		d.put("result", result);
		return d;
	}
	
	private void complete(Throwable t)
	{
		Log.e("FacebookModule", "Request error for '" + callPath + "' call: " + t.getLocalizedMessage(), t);
		doCallback(buildEventArgs(false, t));
	}
	
	private void complete(String result)
	{
		doCallback(buildEventArgs(true, result));
	}
	
	private void doCallback(KrollDict args)
	{
		if (callback != null) {
			callback.callAsync(module.getKrollObject(), args);
		}
	}

	// AsyncFacebookRunner.RequestListener implementation
	@Override
	public void onComplete(String result, Object state)
	{
		try {
			Util.parseJson(result);
			complete(result);
		} catch (JSONException e) {
			complete(result);
		} catch (FacebookError e) {
			complete(e);
		}
	}

	@Override
	public void onFacebookError(FacebookError e, Object state)
	{
		complete(e);
	}

	@Override
	public void onFileNotFoundException(FileNotFoundException e, Object state)
	{
		complete(e);
	}

	@Override
	public void onIOException(IOException e, Object state)
	{
		complete(e);
	}

	@Override
	public void onMalformedURLException(MalformedURLException e, Object state)
	{
		complete(e);
	}

}
