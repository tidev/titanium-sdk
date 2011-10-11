/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
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

import org.appcelerator.kroll.KrollEvaluator;
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
import org.mozilla.javascript.Script;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.commonjs.module.ModuleScript;
import org.mozilla.javascript.commonjs.module.ModuleScriptProvider;
import org.mozilla.javascript.commonjs.module.Require;
import org.mozilla.javascript.commonjs.module.RequireBuilder;

import android.app.Activity;
import android.os.Handler;
import android.os.Message;
import android.os.Process;

public class KrollContext implements Handler.Callback, ModuleScriptProvider
{
	private static final String LCAT = "KrollContext";
	private static boolean DBG = TiConfig.DEBUG;

	private static final int MSG_EVAL_STRING = 1000;
	private static final int MSG_EVAL_FILE = 1001;

	private static final String STRING_SOURCE = "<anonymous>";

	public static final String CONTEXT_KEY = "krollContext";

	private static AtomicInteger instanceCounter;
	private static KrollEvaluator defaultEvaluator = new DefaultEvaluator();
	private static KrollEvaluator evaluator = defaultEvaluator;
	private static KrollThreadListener threadListener;

	private KrollHandlerThread thread;
	private Require commonJsRequire;
	private TiContext tiContext;
	private ScriptableObject jsScope;
	private String sourceUrl;
	private int krollThreadId;

	private CountDownLatch initialized;
	private TiMessageQueue messageQueue;
	private boolean useOptimization;

	protected KrollContext(TiContext tiContext, String sourceUrl)
	{
		this.tiContext = tiContext;
		this.sourceUrl = sourceUrl;
		this.krollThreadId = getInstanceCounter().incrementAndGet();

		StringBuilder threadName = new StringBuilder();
		threadName.append("kroll$").append(krollThreadId);
		if (sourceUrl != null) {
			threadName.append(": ").append(sourceUrl);
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

	public static final class DefaultEvaluator implements KrollEvaluator
	{
		@Override
		public Object evaluateFile(Context context, Scriptable scope,
			TiBaseFile file, String filename, int lineNo, Object securityDomain)
		{
			BufferedReader br = null;
			Object result = Scriptable.NOT_FOUND;
			try {
				br = new BufferedReader(new InputStreamReader(file.getInputStream()), 4000);
				Log.d(LCAT, "Running evaluated script: " + filename);
				result = context.evaluateReader(scope, br, filename, 1, null);
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
			return result;
		}

		@Override
		public Object evaluateString(Context context, Scriptable scope,
			String src, String sourceName, int lineNo, Object securityDomain)
		{
			return context.evaluateString(scope, src, sourceName, lineNo, securityDomain);
		}

		@Override
		public void handleEcmaError(EcmaError error)
		{
			Log.e(LCAT, "ECMA Error evaluating source: " + error.getMessage(), error);
			Context.reportRuntimeError(error.getMessage(), error.sourceName(),
				error.lineNumber(), error.lineSource(), error.columnNumber());
		}

		@Override
		public void handleEvaluatorException(EvaluatorException ex)
		{
			Log.e(LCAT, "Error evaluating source: " + ex.getMessage(), ex);
			Context.reportRuntimeError(ex.getMessage(), ex.sourceName(),
				ex.lineNumber(), ex.lineSource(), ex.columnNumber());
		}

		@Override
		public void handleException(Exception ex)
		{
			Log.e(LCAT, "Error: " + ex.getMessage(), ex);
			Context.throwAsScriptRuntimeEx(ex);
		}
	}

	public static KrollEvaluator getDefaultKrollEvaluator()
	{
		return defaultEvaluator;
	}

	public static KrollEvaluator getKrollEvaluator()
	{
		return evaluator;
	}

	public static void setKrollEvaluator(KrollEvaluator e)
	{
		evaluator = e;
	}

	public static void setThreadListener(KrollThreadListener l)
	{
		threadListener = l;
	}

	protected void initContext()
	{
		if (DBG) {
			Log.d(LCAT, "Context Thread: " + Thread.currentThread().getName());
		}
		if (threadListener != null) {
			threadListener.threadStarted(thread);
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
			this.commonJsRequire = buildCommonJsRequire(ctx);
			if (DBG) {
				Log.d(LCAT, "Initialized commonJS require() function: " + this.commonJsRequire);
			}
			initialized.countDown();
		} finally {
			exit();
		}
	}

	private Require buildCommonJsRequire(Context ctx)
	{
		RequireBuilder builder = new RequireBuilder();
		builder.setModuleScriptProvider(this);
		return builder.createRequire(ctx, jsScope);
	}

	@Override
	public ModuleScript getModuleScript(Context context, String moduleId,
			Scriptable paths) throws Exception
	{
		Script script = null;
		String uri;

		// CommonJS modules are relative to app://. If a moduleId came
		// in with a forward slash, lose it.
		if (moduleId.startsWith("/")) {
			moduleId = moduleId.substring(1);
		}

		StringBuilder sb = new StringBuilder();
		sb.append(TiC.URL_APP_PREFIX)
			.append(moduleId)
			.append(".js");
		uri = sb.toString();

		if (useOptimization) {
			// get Script from compiled script class
			script = TiScriptRunner.getInstance()
					.getScript(context, jsScope, moduleId);
			if (script == null) {
				Log.e(LCAT, "Could not retrieve a Script object for module '" + moduleId + "'.");
				Context.throwAsScriptRuntimeEx(new Exception("Unable to load Script for module '" + moduleId + "'."));
			}
		} else {
			// make Script from JS source
			TiBaseFile file = TiFileFactory.createTitaniumFile(tiContext, new String[] { uri }, false);
			BufferedReader br = null;
			try {
				br = new BufferedReader(new InputStreamReader(file.getInputStream()), 4000);
				script = context.compileReader(br, uri, 1, null);
			} catch (IOException e) {
				Log.e(LCAT, "IOException reading module file: " + uri, e);
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
		}

		return new ModuleScript(script, uri);
	}

	public Object callCommonJsRequire(String path)
	{
		Context ctx = enter();
		try {
			return commonJsRequire.call(ctx, jsScope, jsScope, new String[] { path });
		} finally {
			exit();
		}
	}

	protected void threadEnded()
	{
		if (threadListener != null) {
			threadListener.threadEnded(thread);
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

	public KrollHandlerThread getThread()
	{
		return thread;
	}

	public TiContext getTiContext()
	{
		return tiContext;
	}

	public String getSourceUrl()
	{
		return sourceUrl;
	}

	public int getKrollThreadId()
	{
		return krollThreadId;
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
		String relativePath = TiFileHelper2.getResourceRelativePath(filename);
		if (relativePath == null) {
			// we can only handle pre-compiled app:// and file:///android_asset/Resources/ scripts here
			return evaluateScript(filename);
		}
		
		Context context = enter(true);
		try {
			Log.d(LCAT, "Running pre-compiled script: " + relativePath);
			return TiScriptRunner.getInstance().runScript(context, jsScope, relativePath);
		} catch (ClassNotFoundException e) {
			Log.e(LCAT, "Couldn't find pre-compiled class for script: " + relativePath, e);
		} finally {
			exit();
		}
		return ScriptableObject.NOT_FOUND;
	}

	public Object evaluateScript(String filename)
	{
		String[] parts = { filename };
		TiBaseFile tbf = TiFileFactory.createTitaniumFile(tiContext, parts, false);
		
		Context context = enter(false);
		return evaluator.evaluateFile(context, jsScope, tbf, filename, 1, null);
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
			evaluator.handleEcmaError(e);
		} catch (EvaluatorException e) {
			evaluator.handleEvaluatorException(e);
		} catch (Exception e) {
			evaluator.handleException(e);
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
			result = evaluator.evaluateString(ctx, jsScope, src, STRING_SOURCE, 1, null);
		} catch (EcmaError e) {
			evaluator.handleEcmaError(e);
		} catch (EvaluatorException e) {
			evaluator.handleEvaluatorException(e);
		} catch (Exception e) {
			evaluator.handleException(e);
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
