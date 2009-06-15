// Copyright(c) 2009 by Appcelerator, Inc. All Rights Reserved.
// This is proprietary software. Do not redistribute without express
// written permission.

package com.appcelerator.tidroid;

import com.appcelerator.tidroid.R;

import android.app.Activity;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.widget.TextView;

public class Uninstall extends Activity implements PackageManagerListener
{

	private static final String LCAT = "TiUninstall";
	private static final String KEY_CONTENTS = "stateContents";

	private TextView content;
	private Handler handler;

	private String tidir;

	public Uninstall() {
	}

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.log);

		handler = new Handler();
		content = (TextView) findViewById(R.id.log_content);
		final PackageManager tipm = ((App) getApplication()).getTipm();

		tidir = tipm.getAppInstallDirectory() + "/";

		// TODO protect from re-entry, e.g. rotating device during long uninstall
		if (tipm.isAppInstalled()) {
			performUninstall(tipm);
		}
	}

	@Override
	protected void onRestoreInstanceState(Bundle savedInstanceState) {
		super.onRestoreInstanceState(savedInstanceState);
		CharSequence contents = savedInstanceState.getCharSequence(KEY_CONTENTS);
		if (contents != null) {
			this.content.setText(contents);
		}
	}

	@Override
	protected void onSaveInstanceState(Bundle outState) {
		super.onSaveInstanceState(outState);
		outState.putCharSequence(KEY_CONTENTS, content.getText());
	}

	private void performUninstall(final PackageManager tipm) {
		final PackageManagerListener pml = this;
		new Thread(new Runnable(){
			public void run() {
				tipm.addPackageManagerListener(pml);
				try {
					tipm.uninstall();
				} catch (Throwable t) {
					Log.e(LCAT, "Error in uninstall thread.", t);
				} finally {
					tipm.removePackageManagerListener(pml);
				}

			}}).start();
	}

	public void onItemProcessed(final String msg, final String item)
	{
		handler.post(new Runnable() {

			public void run() {
				if (msg != null) {
					content.append(msg);
				}
				if (item != null) {
					String s = item;
					if(item.startsWith(tidir)) {
						s = item.substring(tidir.length());
					}
					content.append(s);
				}
				if (msg != null || item != null) {
					content.append("\n"); //TODO use global constant
				}
			}});
	}
}
