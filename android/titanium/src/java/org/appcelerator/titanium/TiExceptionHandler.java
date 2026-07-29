/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.util.Arrays;
import java.util.LinkedList;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollExceptionHandler;
import org.appcelerator.kroll.common.AsyncResult;
import org.appcelerator.kroll.common.CurrentActivityListener;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiMessenger;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.Dialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.DialogInterface;
import android.content.DialogInterface.OnClickListener;
import android.content.res.Configuration;
import android.content.res.Resources;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.Message;
import android.os.Process;
import android.text.method.ScrollingMovementMethod;
import android.util.TypedValue;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.Scroller;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;

/**
 * A utility class for creating a dialog that displays Javascript errors
 */
public class TiExceptionHandler implements Handler.Callback, KrollExceptionHandler
{
	private static final String TAG = "TiExceptionHandler";
	private static final int MSG_OPEN_ERROR_DIALOG = 10011;

	// Used to re-show the error dialog after its activity has been recreated, such as by a theme change.
	private static final int RESHOW_ATTEMPT_DELAY_MS = 250;
	private static final int RESHOW_MAX_ATTEMPTS = 20;

	private static final LinkedList<ExceptionMessage> errorMessages = new LinkedList<>();
	private static boolean dialogShowing = false;
	private static KrollDict currentError = null;
	private static Handler mainHandler;

	// Strong reference to the listener watching for the theme change which recreates the dialog's activity.
	// Needed because the activity only holds a weak reference to it.
	private static TiBaseActivity.ConfigurationChangedListener themeChangeListener;

	public static final String ERROR_TITLE = "title";
	public static final String ERROR_MESSAGE = "message";
	public static final String ERROR_SOURCENAME = "sourceName";
	public static final String ERROR_LINE = "line";
	public static final String ERROR_LINESOURCE = "lineSource";
	public static final String ERROR_COLUMN = "column";
	public static final String ERROR_STACK = "stack";
	public static final String ERROR_NATIVESTACK = "nativeStack";

	// DEPRECATED in 9.0.0, REMOVE 11.0.0
	public static final String ERROR_LINEOFFSET = "lineOffset";
	public static final String ERROR_JS_STACK = "javascriptStack";
	public static final String ERROR_JAVA_STACK = "javaStack";

	private static String fill(int count)
	{
		char[] string = new char[count];
		Arrays.fill(string, ' ');
		return new String(string);
	}

	public static KrollDict getErrorDict(ExceptionMessage error)
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

		// DEPRECATED in 9.0.0, REMOVE 11.0.0
		dict.put(ERROR_LINEOFFSET, error.lineOffset);
		dict.put(ERROR_JS_STACK, error.jsStack);
		dict.put(ERROR_JAVA_STACK, error.javaStack);
		return dict;
	}

	public static String getError(KrollDict error)
	{
		String output = "";

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

			// no Java stack, attempt to obtain last ten stack entries
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

	/**
	 * To be invoked when the error dialog has been closed, releasing the flag which prevents more than
	 * one dialog from being shown at a time. Must be called for every way the dialog can go away, or else
	 * all later errors would be queued up forever and never shown.
	 * @param handledByUser Set true if the user closed the dialog via one of its buttons. Set false if the
	 *                      dialog was destroyed without a user decision, such as when its activity is
	 *                      recreated by a light/dark theme change, in which case it is shown again.
	 */
	private static void onDialogClosed(boolean handledByUser)
	{
		final KrollDict error = currentError;
		currentError = null;

		// Release the closed dialog's listener so it doesn't keep its activity alive.
		themeChangeListener = null;

		// Re-show the same error if the dialog was destroyed before the user could act on it.
		// Note: We leave the "dialogShowing" flag set until then so that a queued error can't interleave.
		if (!handledByUser && (error != null)) {
			reshowErrorDialog(error, RESHOW_MAX_ATTEMPTS);
			return;
		}

		showNextQueuedError();
	}

	/**
	 * Releases the flag preventing more than one error dialog at a time and then shows the next error
	 * which was reported while a dialog was up, if any.
	 */
	private static void showNextQueuedError()
	{
		dialogShowing = false;
		if (!errorMessages.isEmpty()) {
			handleOpenErrorDialog(errorMessages.removeFirst());
		}
	}

	/**
	 * Shows the given error again once an activity is able to host a dialog, retrying a limited number of
	 * times. Needed because a dialog cannot outlive its activity, and the activity is recreated when the
	 * OS switches between its light/dark theme, which destroys the dialog while it is still relevant.
	 * @param error The error to be shown again.
	 * @param attemptsRemaining Max number of times to check for an activity before giving up.
	 */
	private static void reshowErrorDialog(final KrollDict error, final int attemptsRemaining)
	{
		final Handler handler = mainHandler;
		if ((handler == null) || (attemptsRemaining <= 0)) {
			// No activity came up to show it in. Release the flag so later errors aren't queued forever.
			showNextQueuedError();
			return;
		}

		handler.postDelayed(new Runnable() {
			@Override
			public void run()
			{
				final TiApplication tiApp = TiApplication.getInstance();
				final Activity activity = (tiApp != null) ? tiApp.getCurrentActivity() : null;
				if ((activity != null) && !activity.isFinishing() && !activity.isDestroyed()) {
					createDialog(error);
				} else {
					reshowErrorDialog(error, attemptsRemaining - 1);
				}
			}
		}, RESHOW_ATTEMPT_DELAY_MS);
	}

	protected static void createDialog(final KrollDict error)
	{
		currentError = error;

		final TiApplication tiApp = TiApplication.getInstance();
		if (tiApp == null) {
			currentError = null;
			dialogShowing = false;
			return;
		}

		final Activity activity = tiApp.getCurrentActivity();
		if (activity == null) {
			onDialogClosed(false);
			return;
		}

		// If this is a material theme exception, then show a simpler error without a trace.
		if (error != null) {
			String errorMessage = error.getString(ERROR_MESSAGE);
			errorMessage = (errorMessage != null) ? errorMessage : "";
			if (errorMessage.contains("theme to inherit from Theme.MaterialComponents")
				|| errorMessage.contains("theme to be Theme.MaterialComponents")
				|| errorMessage.contains("theme to inherit from Theme.Material3")
				|| errorMessage.contains("theme to be Theme.Material3")) {
				currentError = null;
				dialogShowing = false;
				showMaterialThemeErrorDialog(activity);
				return;
			}
		}

		final Resources resources = activity.getResources();
		final float density = resources.getDisplayMetrics().density;
		final boolean isDarkMode = (resources.getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK)
			== Configuration.UI_MODE_NIGHT_YES;

		// Show the error log like a rounded monospace "code block" using dark/light mode aware colors.
		final TextView errorView = new TextView(activity);
		errorView.setTextColor(isDarkMode ? 0xFFFF8A80 : 0xFFC62828);
		errorView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
		int textPadding = (int) (12 * density);
		errorView.setPadding(textPadding, textPadding, textPadding, textPadding);
		// Size the log to its content, but cap its height so long traces scroll instead of growing
		// the dialog past the screen. Note that we must not use "match_parent" here since the dialog's
		// layout is "wrap_content", which would grow the log to fit the whole trace.
		errorView.setLayoutParams(new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT,
																LinearLayout.LayoutParams.WRAP_CONTENT));
		errorView.setMaxHeight((int) (resources.getDisplayMetrics().heightPixels * 0.5f));
		errorView.setSingleLine(false);
		errorView.setScroller(new Scroller(activity));
		errorView.setVerticalScrollBarEnabled(true);
		errorView.setHorizontallyScrolling(true);
		errorView.setHorizontalScrollBarEnabled(true);
		errorView.setMovementMethod(new ScrollingMovementMethod());
		errorView.setTypeface(Typeface.MONOSPACE);
		errorView.setText(getError(error));

		GradientDrawable logBackground = new GradientDrawable();
		logBackground.setColor(isDarkMode ? 0xFF1E1E1E : 0xFFF5F5F5);
		logBackground.setCornerRadius(12 * density);
		logBackground.setStroke(Math.max(1, (int) density), isDarkMode ? 0xFF3C3C3C : 0xFFE0E0E0);
		errorView.setBackground(logBackground);

		final LinearLayout layout = new LinearLayout(activity);
		layout.setOrientation(LinearLayout.VERTICAL);
		layout.setLayoutParams(new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT,
															 LinearLayout.LayoutParams.WRAP_CONTENT));
		int layoutPadding = (int) (16 * density);
		layout.setPadding(layoutPadding, (int) (8 * density), layoutPadding, 0);
		layout.addView(errorView);

		// Note: State clean-up is done by the OnDismissListener assigned below, which is invoked after this
		//       listener since a button press always dismisses the dialog. This way every path the dialog
		//       can close by is handled, including having its activity destroyed out from under it.
		final boolean[] handledByUser = { false };
		final OnClickListener clickListener = new OnClickListener() {
			public void onClick(DialogInterface dialog, int which)
			{
				handledByUser[0] = true;
				if (which == DialogInterface.BUTTON_POSITIVE) {
					Process.killProcess(Process.myPid());
				}
			}
		};

		final String title = error.getString("title");
		Dialog dialog;
		try {
			dialog = new MaterialAlertDialogBuilder(activity)
						 .setTitle(title)
						 .setView(layout)
						 .setPositiveButton("Kill", clickListener)
						 .setNegativeButton("Continue", clickListener)
						 .setNeutralButton("Copy", null)
						 .setCancelable(false)
						 .create();
		} catch (Exception ex) {
			// Activity is not using a material theme. Fall back to a plain dialog.
			dialog = new AlertDialog.Builder(activity)
						 .setTitle(title)
						 .setView(layout)
						 .setPositiveButton("Kill", clickListener)
						 .setNegativeButton("Continue", clickListener)
						 .setNeutralButton("Copy", null)
						 .setCancelable(false)
						 .create();
		}

		dialog.setOnDismissListener(new DialogInterface.OnDismissListener() {
			@Override
			public void onDismiss(DialogInterface dialogInterface)
			{
				onDialogClosed(handledByUser[0]);
			}
		});

		// Dismiss the dialog ourselves when a light/dark theme change is about to recreate its activity.
		// Note: A destroyed activity leaks its dialog's window without invoking the dialog's dismiss
		//       listener, which would leave the error unshown and block all later errors from displaying.
		//       We're notified here before the activity recreates itself, letting us show the error again.
		if (activity instanceof TiBaseActivity) {
			final Dialog shownDialog = dialog;
			themeChangeListener = new TiBaseActivity.ConfigurationChangedListener() {
				@Override
				public void onConfigurationChanged(TiBaseActivity changedActivity, Configuration newConfig)
				{
					boolean isNowDarkMode = (newConfig.uiMode & Configuration.UI_MODE_NIGHT_MASK)
						== Configuration.UI_MODE_NIGHT_YES;
					if ((isNowDarkMode != isDarkMode) && shownDialog.isShowing()) {
						shownDialog.dismiss();
					}
				}
			};
			((TiBaseActivity) activity).addConfigurationChangedListener(themeChangeListener);
		}

		// Check if the activity is finishing to avoid WindowLeaked error
		if (activity.isFinishing() || activity.isDestroyed()) {
			onDialogClosed(false);
			return;
		}
		dialog.show();

		// Make the "Copy" button copy the error to the clipboard without closing the dialog.
		// Note: This must be done after show() since a dialog button's default action is to dismiss.
		Button copyButton = null;
		if (dialog instanceof androidx.appcompat.app.AlertDialog) {
			copyButton = ((androidx.appcompat.app.AlertDialog) dialog).getButton(DialogInterface.BUTTON_NEUTRAL);
		} else if (dialog instanceof AlertDialog) {
			copyButton = ((AlertDialog) dialog).getButton(DialogInterface.BUTTON_NEUTRAL);
		}
		if (copyButton != null) {
			copyButton.setOnClickListener(new View.OnClickListener() {
				@Override
				public void onClick(View view)
				{
					ClipboardManager clipboard
						= (ClipboardManager) activity.getSystemService(Context.CLIPBOARD_SERVICE);
					if (clipboard == null) {
						return;
					}
					clipboard.setPrimaryClip(ClipData.newPlainText("Titanium Error", getError(error)));

					// Android 13+ shows its own "copied" overlay. Only show a toast on older versions.
					if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
						Toast.makeText(activity, "Copied to clipboard", Toast.LENGTH_SHORT).show();
					}
				}
			});
		}

	}

	private static void showMaterialThemeErrorDialog(@NonNull Activity activity)
	{
		// Check if the activity is finishing to avoid WindowLeaked error
		if (activity == null || activity.isFinishing() || activity.isDestroyed()) {
			return;
		}

		AlertDialog.Builder builder = new AlertDialog.Builder(activity, R.style.Theme_Titanium_Dialog_Error);
		builder.setTitle("Developer Error");
		builder.setMessage(
			"A custom theme applied to the app or activity window must derive "
				+ "from 'Theme.Material3' or 'Theme.MaterialComponents'.");
		builder.create().show();
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
	 */
	public void handleException(ExceptionMessage error)
	{
		openErrorDialog(error);
	}
}
