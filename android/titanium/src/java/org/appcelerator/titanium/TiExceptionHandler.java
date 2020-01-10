/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.util.Arrays;
import java.util.LinkedList;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollExceptionHandler;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.common.AsyncResult;
import org.appcelerator.kroll.common.CurrentActivityListener;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiMessenger;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.DialogInterface.OnClickListener;
import android.graphics.Rect;
import android.graphics.Typeface;
import android.os.Handler;
import android.os.Message;
import android.os.Process;
import android.text.InputType;
import android.text.method.ScrollingMovementMethod;
import android.view.Window;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.Scroller;
import android.widget.TextView;

/**
 * A utility class for creating a dialog that displays Javascript errors
 */
public class TiExceptionHandler implements Handler.Callback, KrollExceptionHandler
{
	private static final String TAG = "TiExceptionHandler";
	private static final int MSG_OPEN_ERROR_DIALOG = 10011;
	private static LinkedList<ExceptionMessage> errorMessages = new LinkedList<ExceptionMessage>();
	private static boolean dialogShowing = false;
	private static Handler mainHandler;

	public static final String ERROR_TITLE = "title";
	public static final String ERROR_MESSAGE = "message";
	public static final String ERROR_SOURCENAME = "sourceName";
	public static final String ERROR_LINE = "line";
	public static final String ERROR_LINESOURCE = "lineSource";
	public static final String ERROR_COLUMN = "column";
	public static final String ERROR_STACK = "stack";
	public static final String ERROR_NATIVESTACK = "nativeStack";

	// DEPRECATED in 9.0.0, REMOVE 10.0.0
	public static final String ERROR_LINEOFFSET = "lineOffset";
	public static final String ERROR_JS_STACK = "javascriptStack";
	public static final String ERROR_JAVA_STACK = "javaStack";

	private static final String fill(int count)
	{
		char[] string = new char[count];
		Arrays.fill(string, ' ');
		return new String(string);
	}

	public static final KrollDict getErrorDict(ExceptionMessage error)
	{
		final KrollDict dict = new KrollDict();
		dict.put(ERROR_TITLE, error.title);
		dict.put(ERROR_MESSAGE, error.message);
		dict.put(ERROR_SOURCENAME, error.sourceName);
		dict.put(ERROR_LINE, error.line);
		dict.put(ERROR_LINESOURCE, error.lineSource);
		dict.put(ERROR_COLUMN, error.lineOffset);
		dict.put(ERROR_STACK, error.jsStack);
		dict.put(ERROR_NATIVESTACK, error.javaStack);

		// DEPRECATED in 9.0.0, REMOVE 10.0.0
		dict.put(ERROR_LINEOFFSET, error.lineOffset);
		dict.put(ERROR_JS_STACK, error.jsStack);
		dict.put(ERROR_JAVA_STACK, error.javaStack);
		return dict;
	}

	public static String getError(KrollDict error)
	{
		String output = new String();

		final String sourceName = error.getString(ERROR_SOURCENAME);
		final String message = error.getString(ERROR_MESSAGE);
		final int line = error.getInt(ERROR_LINE);
		final String lineSource = error.getString(ERROR_LINESOURCE);
		final int lineOffset = error.optInt(ERROR_COLUMN, error.getInt(ERROR_LINEOFFSET));
		final String jsStack = error.optString(ERROR_STACK, error.getString(ERROR_JS_STACK));
		final String javaStack = error.optString(ERROR_NATIVESTACK, error.getString(ERROR_JAVA_STACK));

		if (sourceName != null) {
			output += sourceName + ":" + line + "\n";
		}
		if (lineSource != null) {
			output += lineSource + "\n";
			output += fill(lineOffset - 1) + "^\n";
		}
		// sometimes the stacktrace can include the error
		// don't re-print the error if that is the case
		if (jsStack != null) {
			if (!jsStack.contains("Error:")) {
				output += message + "\n";
			}
			output += jsStack + "\n";
		} else {
			output += message + "\n";
		}
		if (javaStack != null) {
			output += javaStack;

			// no java stack, attempt to obtain last ten stack entries
			// omitting our error handling entries
		} else {
			StackTraceElement[] trace = new Error().getStackTrace();
			int startIndex = 0;
			for (StackTraceElement e : trace) {
				startIndex++;
				if (e.getMethodName().equals("dispatchException")) {
					break;
				}
			}
			int endIndex = startIndex + 10;
			for (int i = startIndex; trace.length >= endIndex && i < endIndex; i++) {
				output += "\n    " + trace[i].toString();
			}
		}

		return output;
	}

	public TiExceptionHandler()
	{
		mainHandler = new Handler(TiMessenger.getMainMessenger().getLooper(), this);
	}

	public void openErrorDialog(ExceptionMessage error)
	{
		if (TiApplication.isUIThread()) {
			handleOpenErrorDialog(error);
		} else {
			TiMessenger.sendBlockingMainMessage(mainHandler.obtainMessage(MSG_OPEN_ERROR_DIALOG), error);
		}
	}

	protected static void handleOpenErrorDialog(final ExceptionMessage error)
	{
		final TiApplication tiApp = TiApplication.getInstance();
		if (tiApp == null) {
			return;
		}

		final Activity activity = tiApp.getRootOrCurrentActivity();
		if (activity == null || activity.isFinishing()) {
			return;
		}

		final KrollDict dict = getErrorDict(error);
		tiApp.fireAppEvent("uncaughtException", dict);
		Log.e(TAG, getError(dict));

		if (tiApp.getDeployType().equals(TiApplication.DEPLOY_TYPE_PRODUCTION)) {
			return;
		}

		if (!dialogShowing) {
			dialogShowing = true;
			tiApp.waitForCurrentActivity(new CurrentActivityListener() {
				@Override
				public void onCurrentActivityReady(Activity activity)
				{
					createDialog(dict);
				}
			});
		} else {
			errorMessages.add(error);
		}
	}

	protected static void createDialog(final KrollDict error)
	{
		final TiApplication tiApp = TiApplication.getInstance();
		if (tiApp == null) {
			return;
		}

		final Context context = tiApp.getCurrentActivity();

		final TextView errorView = new TextView(context);
		errorView.setBackgroundColor(0xFFF5F5F5);
		errorView.setTextColor(0xFFE53935);
		errorView.setPadding(5, 5, 5, 5);
		errorView.setLayoutParams(new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT,
																LinearLayout.LayoutParams.MATCH_PARENT));
		errorView.setInputType(InputType.TYPE_TEXT_FLAG_MULTI_LINE);
		errorView.setSingleLine(false);
		errorView.setScroller(new Scroller(context));
		errorView.setVerticalScrollBarEnabled(true);
		errorView.setHorizontallyScrolling(true);
		errorView.setHorizontalScrollBarEnabled(true);
		errorView.setMovementMethod(new ScrollingMovementMethod());
		errorView.setTypeface(Typeface.MONOSPACE);
		errorView.setText(getError(error));

		final RelativeLayout layout = new RelativeLayout(context);
		layout.setPadding(0, 50, 0, 0);
		RelativeLayout.LayoutParams layoutParams = new RelativeLayout.LayoutParams(
			RelativeLayout.LayoutParams.MATCH_PARENT, RelativeLayout.LayoutParams.MATCH_PARENT);
		layout.setLayoutParams(layoutParams);
		layout.addView(errorView);

		final OnClickListener clickListener = new OnClickListener() {
			public void onClick(DialogInterface dialog, int which)
			{
				dialogShowing = false;
				if (which == DialogInterface.BUTTON_POSITIVE) {
					Process.killProcess(Process.myPid());
				}
				if (!errorMessages.isEmpty()) {
					handleOpenErrorDialog(errorMessages.removeFirst());
				}
			}
		};

		final AlertDialog.Builder builder = new AlertDialog.Builder(context)
												.setTitle(error.getString("title"))
												.setView(layout)
												.setPositiveButton("Kill", clickListener)
												.setNeutralButton("Continue", clickListener)
												.setCancelable(false);

		final AlertDialog dialog = builder.create();
		dialog.show();

		final Window window = ((Activity) context).getWindow();
		Rect displayRect = new Rect();
		window.getDecorView().getWindowVisibleDisplayFrame(displayRect);
		dialog.getWindow().setLayout(displayRect.width(), (int) (displayRect.height() * 0.95));
	}

	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_OPEN_ERROR_DIALOG:
				AsyncResult asyncResult = (AsyncResult) msg.obj;
				ExceptionMessage errorMessage = (ExceptionMessage) asyncResult.getArg();
				handleOpenErrorDialog(errorMessage);
				asyncResult.setResult(null);
				return true;
			default:
				break;
		}

		return false;
	}

	/**
	 * Handles the exception by opening an error dialog with an error message
	 * @param error An error message containing line number, error title, message, etc
	 * @module.api
	 */
	public void handleException(ExceptionMessage error)
	{
		openErrorDialog(error);
	}
}
