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

import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiProperties;
import org.appcelerator.titanium.TiScriptRunner;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiFileHelper2;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.EcmaError;
import org.mozilla.javascript.EvaluatorException;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import android.app.Activity;
import android.os.Handler;
import android.os.Message;
import android.os.Process;

public class KrollContext extends KrollHandlerThread implements Handler.Callback
{
	private static final String LCAT = "KrollContext";
	private static boolean DBG = TiConfig.DEBUG;

	private static final int MSG_EVAL_STRING = 1000;
	private static final int MSG_EVAL_FILE = 1001;

	private static AtomicInteger instanceCounter;
	
	private static final String APP_SCHEME= "app://";
	private static final String FILE_WITH_ASSET = "file:///android_asset/Resources/";
	
	public static final String CONTEXT_KEY = "krollContext";
	
	private TiContext tiContext;
	private ScriptableObject jsScope;

	private CountDownLatch initialized;
	private Handler contextHandler;
	private boolean useOptimization;

	protected KrollContext(TiContext tiContext)
	{
		// allow a configurable stack size to avoid StackOverflowErrors in some larger apps
		super("kroll$" + instanceCounter.incrementAndGet(),
			Process.THREAD_PRIORITY_DEFAULT,
			tiContext.getTiApp().getThreadStackSize());

		this.tiContext = tiContext;
		this.initialized = new CountDownLatch(1);
		
		// force to true to test compiled JS
		// this.useOptimization = true;
		TiApplication app = tiContext.getTiApp();
		this.useOptimization =
			app.getDeployType() == TiApplication.DEPLOY_TYPE_PRODUCTION || app.forceCompileJS();
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
		try {
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
	
	protected Object runCompiledScript(String filename) {
		
		if (filename.startsWith(APP_SCHEME)) {
			filename = filename.substring(APP_SCHEME.length());
		} else if (filename.startsWith(FILE_WITH_ASSET)) {
			filename = filename.substring(FILE_WITH_ASSET.length());
		} else {
			// we can only handle pre-compiled app:// and file:///android_asset/Resources/ scripts here
			return evaluateScript(filename);
		}
		
		Context context = enter(true);
		try {
			Log.d(LCAT, "Running pre-compiled script: "+filename);
			return TiScriptRunner.getInstance().runScript(context, jsScope, filename);
		} catch (ClassNotFoundException e) {
			Log.e(LCAT, "Couldn't find pre-compiled class for script: " + filename, e);
		} finally {
			exit();
		}
		return ScriptableObject.NOT_FOUND;
	}
	
	public Object evaluateScript(String filename) { 
		String[] parts = { filename };
		TiBaseFile tbf = TiFileFactory.createTitaniumFile(tiContext, parts, false);
		BufferedReader br = null;
		
		Context context = enter(false);
		try {
			br = new BufferedReader(new InputStreamReader(tbf.getInputStream()), 4000);
			Log.d(LCAT, "Running evaluated script: " + filename);
			return context.evaluateReader(jsScope, br, filename, 0, null);
		} catch (IOException e) {
			Log.e(LCAT, "IOException reading file: " + filename, e);
			Context.throwAsScriptRuntimeEx(e);
		} finally {
			if (br != null) {
				try {
					br.close();
				} catch (IOException e) {
					// Ignore
				}
			}
		}
		return ScriptableObject.NOT_FOUND;
	}
	
	public Object handleEvalFile(String filename)
	{
		requireInitialized();
		Object result = null;

		try {
			if (useOptimization) {
				result = runCompiledScript(filename);
			} else {
				result = evaluateScript(filename);
			}
		} catch (EcmaError e) {
			Log.e(LCAT, "ECMA Error evaluating source: " + e.getMessage(), e);
			Context.reportRuntimeError(e.getMessage(), e.sourceName(), e.lineNumber(), e.lineSource(), e.columnNumber());
		} catch (EvaluatorException e) {
			Log.e(LCAT, "Error evaluating source: " + e.getMessage(), e);
			Context.reportRuntimeError(e.getMessage(), e.sourceName(), e.lineNumber(), e.lineSource(), e.columnNumber());
		} catch (Exception e) {
			Log.e(LCAT, "Error: " + e.getMessage(), e);
			Context.throwAsScriptRuntimeEx(e);
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
		Context ctx = enter(false);
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
		return enter(this.useOptimization);
	}
	
	public Context enter(boolean useOptimization) {
		Context ctx = Context.enter();
		
		if (!useOptimization) {
			ctx.setOptimizationLevel(-1);
		}
			
		ctx.setErrorReporter(getTiContext());
		ctx.putThreadLocal(CONTEXT_KEY, this);
		return ctx;
	}

	public void exit() {
		Context.exit();
	}
	
	public static KrollContext getKrollContext(Context context) {
		return (KrollContext) context.getThreadLocal(CONTEXT_KEY);
	}
	
	public static KrollContext getCurrentKrollContext() {
		Context ctx = Context.getCurrentContext();
		if (ctx == null) {
			return null;
		}
		return getKrollContext(ctx);
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
