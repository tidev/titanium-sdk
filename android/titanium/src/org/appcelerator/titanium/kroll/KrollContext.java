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
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiMessageQueue;
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

public class KrollContext implements Handler.Callback
{
	private static final String LCAT = "KrollContext";
	private static boolean DBG = TiConfig.DEBUG;

	private static final int MSG_EVAL_STRING = 1000;
	private static final int MSG_EVAL_FILE = 1001;

	private static AtomicInteger instanceCounter;

	private static final String APP_SCHEME= "app://";
	private static final String FILE_WITH_ASSET = "file:///android_asset/Resources/";
	private static final String STRING_SOURCE = "<anonymous>";

	public static final String CONTEXT_KEY = "krollContext";

	private KrollHandlerThread thread;
	private TiContext tiContext;
	private ScriptableObject jsScope;

	private CountDownLatch initialized;
	private TiMessageQueue messageQueue;
	private boolean useOptimization;

	protected KrollContext(TiContext tiContext, String label)
	{
		this.tiContext = tiContext;
		StringBuilder threadName= new StringBuilder();
		threadName.append("kroll$").append(getInstanceCounter().incrementAndGet());
		if (label != null) {
			threadName.append(": ").append(label);
		}
		// allow a configurable stack size to avoid StackOverflowErrors in some larger apps
		thread = new KrollHandlerThread(
			threadName.toString(),
			Process.THREAD_PRIORITY_DEFAULT,
			tiContext.getTiApp().getThreadStackSize(), this);
		initialized = new CountDownLatch(1);

		// force to true to test compiled JS
		// this.useOptimization = true;
		TiApplication app = tiContext.getTiApp();
		this.useOptimization =
			app.getDeployType() == TiApplication.DEPLOY_TYPE_PRODUCTION || app.forceCompileJS();

		thread.start();
		requireInitialized();
	}

	protected void initContext()
	{
		if (DBG) {
			Log.d(LCAT, "Context Thread: " + Thread.currentThread().getName());
		}
		messageQueue = TiMessageQueue.getMessageQueue();
		messageQueue.setCallback(this);
		Context ctx = enter();
		try {
			if (DBG) {
				Log.d(LCAT, "Context entered, preparing scope");
			}
			this.jsScope = ctx.initStandardObjects();
			if (DBG) {
				Log.d(LCAT, "Initialized scope: " + jsScope);
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
				String src = msg.getData().getString(TiC.MSG_PROPERTY_SRC);
				result.setResult(handleEval(src));
				return true;
			}
			case MSG_EVAL_FILE : {
				AsyncResult result = (AsyncResult) msg.obj;
				String filename = msg.getData().getString(TiC.MSG_PROPERTY_FILENAME);
				result.setResult(handleEvalFile(filename));
				return true;
			}
		}
		return false;
	}

	public void post(Runnable r)
	{
		messageQueue.post(r);
		//contextHandler.post(r);
	}

	protected boolean isOurThread()
	{
		if (DBG) {
			Log.d(LCAT, "ThreadId: " + thread.getId() + " currentThreadId: " + Thread.currentThread().getId());
		}
		return thread.getId() == Thread.currentThread().getId();
	}

	public TiContext getTiContext()
	{
		return tiContext;
	}

	public Scriptable getScope()
	{
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
		Message msg = messageQueue.getHandler().obtainMessage(MSG_EVAL_FILE, result);
		msg.getData().putString(TiC.MSG_PROPERTY_FILENAME, filename);
		return TiMessageQueue.getMessageQueue().sendBlockingMessage(msg, messageQueue, result);
	}

	protected Object runCompiledScript(String filename)
	{
		
		if (filename.contains("://")) {
			if (filename.startsWith(APP_SCHEME)) {
				filename = filename.substring(APP_SCHEME.length());
			} else if (filename.startsWith(FILE_WITH_ASSET)) {
				filename = filename.substring(FILE_WITH_ASSET.length());
			} else {
				// we can only handle pre-compiled app:// and file:///android_asset/Resources/ scripts here
				return evaluateScript(filename);
			}
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

	public Object evaluateScript(String filename)
	{
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
		Message msg = messageQueue.getHandler().obtainMessage(MSG_EVAL_STRING, result);
		msg.getData().putString(TiC.MSG_PROPERTY_SRC, src);
		return TiMessageQueue.getMessageQueue().sendBlockingMessage(msg, messageQueue, result);
	}

	public Object handleEval(String src)
	{
		requireInitialized();

		Object result = null;
		Context ctx = enter(false);
		try {
			result = ctx.evaluateString(jsScope, src, STRING_SOURCE, 0, null);
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

	public void put(String name, Scriptable object)
	{
		jsScope.put(name, jsScope, object);
	}

	public Context enter()
	{
		return enter(this.useOptimization);
	}
	
	public Context enter(boolean useOptimization)
	{
		Context ctx = Context.enter();
		
		if (!useOptimization) {
			ctx.setOptimizationLevel(-1);
		}
			
		ctx.setErrorReporter(getTiContext());
		ctx.putThreadLocal(CONTEXT_KEY, this);
		return ctx;
	}

	public void exit()
	{
		Context.exit();
	}
	
	public static KrollContext getKrollContext(Context context)
	{
		return (KrollContext) context.getThreadLocal(CONTEXT_KEY);
	}
	
	public static KrollContext getCurrentKrollContext()
	{
		Context ctx = Context.getCurrentContext();
		if (ctx == null) {
			return null;
		}
		return getKrollContext(ctx);
	}

	private void requireInitialized()
	{
		try {
			initialized.await();
		} catch (InterruptedException e) {
			// Ignore
		}
	}

	protected static AtomicInteger getInstanceCounter()
	{
		if (instanceCounter == null) {
			instanceCounter = new AtomicInteger();
		}
		return instanceCounter;
	}

	public static final KrollContext createContext(TiContext tiContext, String loadFile)
	{
		return new KrollContext(tiContext, loadFile);
	}

	public TiMessageQueue getMessageQueue()
	{
		return messageQueue;
	}

	public void release()
	{
		if (thread.getLooper() != null) {
			thread.getLooper().quit();
		}
	}
}
