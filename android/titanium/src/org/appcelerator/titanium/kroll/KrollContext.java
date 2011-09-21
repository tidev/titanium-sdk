/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.kroll;

import java.util.concurrent.CountDownLatch;

import org.appcelerator.kroll.runtime.v8.V8Context;
import org.appcelerator.kroll.runtime.v8.V8Object;
import org.appcelerator.kroll.runtime.v8.V8Runtime;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiMessageQueue;
import org.appcelerator.titanium.TiProperties;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;

import android.os.Handler;
import android.os.Message;
import android.os.Process;

public class KrollContext implements Handler.Callback
{
	private static final String LCAT = "KrollContext";
	private static boolean DBG = TiConfig.DEBUG;

	private static final int MSG_EVAL_STRING = 1000;
	private static final int MSG_EVAL_FILE = 1001;
	private static final int MSG_CREATE_SCOPE = 1002;

	private static final String STRING_SOURCE = "<anonymous>";

	public static final String CONTEXT_KEY = "krollContext";

	private static KrollThreadListener threadListener;
	private static KrollContext _instance;

	private KrollHandlerThread thread;

	private CountDownLatch initialized;
	private TiMessageQueue messageQueue;
	private boolean useOptimization;
	private V8Context context;

	public static KrollContext getKrollContext()
	{
		if (_instance == null) {
			_instance = new KrollContext();
		}
		return _instance;
	}

	protected KrollContext()
	{
		TiApplication app = TiApplication.getInstance();
		// allow a configurable stack size to avoid StackOverflowErrors in some larger apps
		thread = new KrollHandlerThread(
			"KrollContext",
			Process.THREAD_PRIORITY_DEFAULT,
			app.getThreadStackSize(), this);

		initialized = new CountDownLatch(1);

		// force to true to test compiled JS
		// this.useOptimization = true;
		this.useOptimization =
			app.getDeployType() == TiApplication.DEPLOY_TYPE_PRODUCTION || app.forceCompileJS();

		thread.start();
		requireInitialized();
	}

	/*
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
	}*/

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

		TiProperties properties = TiApplication.getInstance().getAppProperties();
		String deviceType = properties.getString("ti.devicetype", "device");
		V8Runtime.Type runtimeType = deviceType.equals("device") ? V8Runtime.Type.Device : V8Runtime.Type.Emulator;
		context = V8Runtime.init(runtimeType);

		initialized.countDown();
	}

	protected void threadEnded()
	{
		if (threadListener != null) {
			threadListener.threadEnded(thread);
		}
	}

	public boolean handleMessage(Message msg)
	{
		switch (msg.what)
		{
			case MSG_EVAL_STRING : {
				/*AsyncResult result = (AsyncResult) msg.obj;
				String src = msg.getData().getString(TiC.MSG_PROPERTY_SRC);
				result.setResult(handleEval(src));
				return true;*/
			}
			case MSG_EVAL_FILE : {
				AsyncResult result = (AsyncResult) msg.obj;
				V8Object scope = (V8Object) result.getArg();
				String filename = msg.getData().getString(TiC.MSG_PROPERTY_FILENAME);
				result.setResult(handleEvalFile(scope, filename));
				return true;
			}
			case MSG_CREATE_SCOPE: {
				AsyncResult result = (AsyncResult) msg.obj;
				// this launches a native allocation
				result.setResult(new V8Object());
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

	public Object evalFile(V8Object scope, String filename)
	{
		if (DBG) {
			Log.i(LCAT, "evalFile: " + filename);
		}

		if (isOurThread()) {
			return handleEvalFile(scope, filename);
		}

		AsyncResult result = new AsyncResult(scope);
		Message msg = messageQueue.getHandler().obtainMessage(MSG_EVAL_FILE, result);
		msg.getData().putString(TiC.MSG_PROPERTY_FILENAME, filename);
		return TiMessageQueue.getMessageQueue().sendBlockingMessage(msg, messageQueue, result);
	}

	public V8Object createScope()
	{
		AsyncResult result = new AsyncResult();
		Message msg = messageQueue.getHandler().obtainMessage(MSG_CREATE_SCOPE, result);

		return (V8Object) TiMessageQueue.getMessageQueue().
			sendBlockingMessage(msg, messageQueue, result);
	}
/*
	public Object evaluateScript(String filename)
	{
		String[] parts = { filename };
		TiBaseFile tbf = TiFileFactory.createTitaniumFile(tiContext, parts, false);
		
		Context context = enter(false);
		return evaluator.evaluateFile(context, jsScope, tbf, filename, 1, null);
	}*/

	public Object handleEvalFile(V8Object scope, String filename)
	{
		requireInitialized();
		V8Runtime.evalFile(scope, filename);
		return null;
	}
/*
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
	}*/

	private void requireInitialized()
	{
		try {
			initialized.await();
		} catch (InterruptedException e) {
			// Ignore
		}
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
