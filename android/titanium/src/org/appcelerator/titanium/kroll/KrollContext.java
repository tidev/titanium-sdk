/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.kroll;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiFileHelper2;
import org.appcelerator.titanium.util.TiResourceHelper;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.EcmaError;
import org.mozilla.javascript.EvaluatorException;
import org.mozilla.javascript.Scriptable;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.DialogInterface.OnClickListener;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.Message;

public class KrollContext extends HandlerThread implements Handler.Callback
{
	private static final String LCAT = "KrollContext";
	private static boolean DBG = TiConfig.DEBUG;

	private static final int MSG_EVAL_STRING = 1000;
	private static final int MSG_EVAL_FILE = 1001;

	private static AtomicInteger instanceCounter;

	private TiContext tiContext;
	private Scriptable jsScope;

	private CountDownLatch initialized;
	private Handler contextHandler;


	protected KrollContext(TiContext tiContext)
	{
		super("kroll$" + instanceCounter.incrementAndGet());

		this.tiContext = tiContext;
		this.initialized = new CountDownLatch(1);
	}

	@Override
	protected void onLooperPrepared()
	{
		super.onLooperPrepared();

		if (DBG) {
			Log.e("KrollContext", "Context Thread: " + Thread.currentThread().getName());
		}

		contextHandler = new Handler(this);
        Context ctx = enter();
        try
        {
        	if (DBG) {
        		Log.i(LCAT, "Preparing scope");
        	}
            this.jsScope = ctx.initStandardObjects();
            if (DBG) {
            	Log.i(LCAT, "Scope prepared");
            }
            initialized.countDown();
         } finally {
        	 exit();
         }

	}

	public boolean handleMessage(Message msg)
	{
		switch(msg.what)
		{
			case MSG_EVAL_STRING : {
				AsyncResult result = (AsyncResult) msg.obj;
				String src = msg.getData().getString("src");
				result.setResult(handleEval(src));
				return true;
			}
			case MSG_EVAL_FILE : {
				AsyncResult result = (AsyncResult) msg.obj;
				String filename = msg.getData().getString("filename");
				result.setResult(handleEvalFile(filename));
				return true;
			}
		}
		return false;
	}

	public void post(Runnable r) {
		contextHandler.post(r);
	}

	protected boolean isOurThread() {
		if (DBG) {
			Log.i(LCAT, "ThreadId: " + getId() + " currentThreadId: " + Thread.currentThread().getId());
		}
		return getId() == Thread.currentThread().getId();
	}

	public TiContext getTiContext() {
		return tiContext;
	}

	public Scriptable getScope() {
		requireInitialized();
		return jsScope;
	}

	public Object evalFile(String filename)
	{
		if (DBG) {
			Log.i(LCAT, "evalFile: " + filename);
		}

		if (isOurThread()) {
			return handleEvalFile(filename);
		}

		AsyncResult result = new AsyncResult();

		Message msg = contextHandler.obtainMessage(MSG_EVAL_FILE, result);
		msg.getData().putString("filename", filename);
		msg.sendToTarget();

		return result.getResult();
	}

	public Object handleEvalFile(String filename)
	{
		requireInitialized();
		BufferedReader br = null;   //TODO: remove once new resource code is in
		Object result = null;

		Context ctx = enter();
		try {
			Log.d(LCAT,"eval file: "+filename);
			
			String[] parts = { filename };
			TiBaseFile tbf = TiFileFactory.createTitaniumFile(tiContext, parts, false);
			br = new BufferedReader(new InputStreamReader(tbf.getInputStream()),4000);
			result = ctx.evaluateReader(jsScope, br, filename, 0, null);
			
			/* TODO: re-enable
			String srcPath = "a$"+filename.replace("app://","").replace("file:///android_asset/Resources/","").replace(".js","").replace("/","_").replace(" ","_").replace(".","_");
            Log.d(LCAT,"eval file srcPath: "+srcPath);
			int res = TiResourceHelper.getString(srcPath);
			String src = tiContext.getActivity().getString(res);
			Log.d(LCAT,"src = "+src);
			result = ctx.evaluateString(jsScope, src, filename, 0, null);*/
			
		} catch (EcmaError e) {
			Log.e(LCAT, "ECMA Error evaluating source: " + e.getMessage(), e);
			Context.reportRuntimeError(e.getMessage(), e.sourceName(), e.lineNumber(), e.lineSource(), e.columnNumber());
		} catch (EvaluatorException e) {
			Log.e(LCAT, "Error evaluating source: " + e.getMessage(), e);
			Context.reportRuntimeError(e.getMessage(), e.sourceName(), e.lineNumber(), e.lineSource(), e.columnNumber());
		} catch (Exception e) {
			Log.e(LCAT, "Error: " + e.getMessage(), e);
			Context.throwAsScriptRuntimeEx(e);
		} finally {
            if (br != null) {
             try {
                 br.close();
             } catch(IOException e) {
                 // Ignore
             }
            }
			exit();
		}

		return result;
	}

	public Object eval(String src)
	{
		if (isOurThread()) {
			return handleEval(src);
		}

		AsyncResult result = new AsyncResult();

		Message msg = contextHandler.obtainMessage(MSG_EVAL_STRING, result);
		msg.getData().putString("src", src);
		msg.sendToTarget();

		return result.getResult();
	}

	public Object handleEval(String src)
	{
		requireInitialized();

		Object result = null;
		Context ctx = enter();
		try {
			result = ctx.evaluateString(jsScope, src, "", 0, null);
		} catch (EcmaError e) {
			Log.e(LCAT, "ECMA Error evaluating source: " + e.getMessage(), e);
			Context.reportRuntimeError(e.getMessage(), e.sourceName(), e.lineNumber(), e.lineSource(), e.columnNumber());
		} catch (EvaluatorException e) {
			Log.e(LCAT, "Error evaluating source: " + e.getMessage(), e);
			Context.reportRuntimeError(e.getMessage(), e.sourceName(), e.lineNumber(), e.lineSource(), e.columnNumber());
		} catch (Exception e) {
			Log.e(LCAT, "Error evaluating source: " + e.getMessage(), e);
			Context.throwAsScriptRuntimeEx(e);
		} finally {
			exit();
		}

		return result;
	}

	public InputStream getResourcesInputStream(String filename)
		throws IOException
	{
		InputStream is = null;

		Activity activity = tiContext.getActivity();
		if (activity != null) {
			is = activity.getAssets().open(TiFileHelper2.getResourcesPath(filename));
		}

		return is;
	}

	public void put(String name, Scriptable object) {
		jsScope.put(name, jsScope, object);
	}

	public Context enter() {
		Context ctx = Context.enter();
        // FOR NOW (UNTIL WE CAN COMPILE IN PACKAGING) WE HAVE TO TURN OFF OPTIMIZATIONS
		ctx.setOptimizationLevel(-1);
		ctx.setErrorReporter(getTiContext());
		return ctx;
	}

	public void exit() {
		Context.exit();
	}

	private void requireInitialized() {
		try {
			initialized.await();
		} catch (InterruptedException e) {
			// Ignore
		}
	}

	public static final KrollContext createContext(TiContext tiContext)
	{
		if (instanceCounter == null) {
			instanceCounter = new AtomicInteger();
		}

		KrollContext kc = new KrollContext(tiContext);
		kc.start();
		kc.requireInitialized();
		return kc;
	}
	
	public void release()
	{
		if (getLooper() != null) {
			getLooper().quit();
		}
	}
}
