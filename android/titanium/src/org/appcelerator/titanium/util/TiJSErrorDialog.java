/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.io.IOException;
import java.util.concurrent.Semaphore;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiFastDev;
import org.appcelerator.titanium.TiMessageQueue;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.DialogInterface.OnClickListener;
import android.graphics.Color;
import android.os.Process;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

/**
 * A utility class for creating a dialog that displays Javascript errors
 */
public class TiJSErrorDialog
{
	private static final String TAG = "TiJSError";

	public static void printError(String title, String message,
		String sourceName, int line, String lineSource, int lineOffset)
	{
		Log.e(TAG, "----- Titanium Javascript " + title + " -----");
		Log.e(TAG, "- In " + sourceName + ":" + line + "," + lineOffset);
		Log.e(TAG, "- Message: " + message);
		Log.e(TAG, "- Source: " + lineSource);
	}

	public static void openErrorDialog(final TiContext tiContext, final Activity activity, final String title, final String message,
		final String sourceName, final int line, final String lineSource, final int lineOffset)
	{
		printError(title, message, sourceName, line, lineSource, lineOffset);
		if (activity == null || activity.isFinishing())
		{
			Log.w(TAG, "Activity is null or already finishing, skipping dialog.");
			return;
		}

		final Semaphore semaphore = new Semaphore(0);
		TiMessageQueue.getMainMessageQueue().post(new Runnable() {
			public void run()
			{
				createDialog(tiContext, semaphore, activity, title, message, sourceName, line, lineSource, lineOffset);
			}
		});
		try {
			semaphore.acquire();
		} catch (InterruptedException e) {
			// Ignore
		}
	}

	protected static void createDialog(final TiContext tiContext, final Semaphore semaphore, Context context, String title, String message,
		final String sourceName, int line, String lineSource, int lineOffset)
	{
		FrameLayout layout = new FrameLayout(context);
		layout.setBackgroundColor(Color.rgb(128, 0, 0));

		LinearLayout vlayout = new LinearLayout(context);
		vlayout.setOrientation(LinearLayout.VERTICAL);
		vlayout.setPadding(10, 10, 10, 10);
		layout.addView(vlayout);

		TextView sourceInfoView = new TextView(context);
		sourceInfoView.setBackgroundColor(Color.WHITE);
		sourceInfoView.setTextColor(Color.BLACK);
		sourceInfoView.setPadding(4, 5, 4, 0);
		sourceInfoView.setText("[" + line + "," + lineOffset + "] " + sourceName);

		TextView messageView = new TextView(context);
		messageView.setBackgroundColor(Color.WHITE);
		messageView.setTextColor(Color.BLACK);
		messageView.setPadding(4, 5, 4, 0);
		messageView.setText(message);

		TextView sourceView = new TextView(context);
		sourceView.setBackgroundColor(Color.WHITE);
		sourceView.setTextColor(Color.BLACK);
		sourceView.setPadding(4, 5, 4, 0);
		sourceView.setText(lineSource);

		TextView infoLabel = new TextView(context);
		infoLabel.setText("Location: ");
		infoLabel.setTextColor(Color.WHITE);
		infoLabel.setTextScaleX(1.5f);

		TextView messageLabel = new TextView(context);
		messageLabel.setText("Message: ");
		messageLabel.setTextColor(Color.WHITE);
		messageLabel.setTextScaleX(1.5f);

		TextView sourceLabel = new TextView(context);
		sourceLabel.setText("Source: ");
		sourceLabel.setTextColor(Color.WHITE);
		sourceLabel.setTextScaleX(1.5f);

		vlayout.addView(infoLabel);
		vlayout.addView(sourceInfoView);
		vlayout.addView(messageLabel);
		vlayout.addView(messageView);
		vlayout.addView(sourceLabel);
		vlayout.addView(sourceView);

		OnClickListener clickListener = new OnClickListener() {
			public void onClick(DialogInterface dialog, int which) {
				if (which == DialogInterface.BUTTON_POSITIVE) {
					// Kill Process
					Process.killProcess(Process.myPid());
				} else if (which == DialogInterface.BUTTON_NEUTRAL) {
					// Continue
					semaphore.release();
				} else if (which == DialogInterface.BUTTON_NEGATIVE) {
					// Reload (Fastdev)
					semaphore.release();
					reload(tiContext, sourceName);
				}
			}
		};

		AlertDialog.Builder builder = new AlertDialog.Builder(context)
			.setTitle(title)
			.setView(layout)
			.setPositiveButton("Kill", clickListener)
			.setNeutralButton("Continue", clickListener)
			.setCancelable(false);
		if (TiFastDev.isFastDevEnabled()) {
			builder.setNegativeButton("Reload", clickListener);
		}
		builder.create().show();

		if (TiMessageQueue.getMainMessageQueue().isBlocking()) {
			semaphore.release();
		}
	}

	protected static void reload(TiContext tiContext, String sourceName)
	{
		try {
			tiContext.evalFile(sourceName);
		} catch (IOException e) {
			Log.e(TAG, e.getMessage(), e);
		}
	}
}
