// Copyright(c) 2009 by Appcelerator, Inc. All Rights Reserved.
// This is proprietary software. Do not redistribute without express
// written permission.

package com.appcelerator.tidroid;


import com.appcelerator.tidroid.R;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.widget.TextView;

public class Market extends Activity implements PackageManagerListener
{
	private static final String LCAT = "TiMkt";
	private static final String KEY_CONTENTS = "stateContents";

	private static final int LIST_ACTIVITY = 1;

	private TextView content;
	private Handler handler;

	public Market() {
	}

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.log);

		handler = new Handler();
		content = (TextView) findViewById(R.id.log_content);

		Intent i = new Intent(getApplicationContext(), AppList.class);
		startActivityForResult(i, LIST_ACTIVITY);
	}


	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		super.onActivityResult(requestCode, resultCode, data);
		if (requestCode == LIST_ACTIVITY) {
			if (resultCode == RESULT_OK && data != null) {
				PackageManager tipm = ((App) getApplication()).getTipm();

				if (!tipm.isAppInstalled()) {
					Uri uri = data.getData();
					performInstall(tipm, uri);
				}
			}
		}
	}

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

	private void performInstall(final PackageManager tipm, final Uri uri) {
		final PackageManagerListener pml = this;
		new Thread(new Runnable(){
			public void run() {
				tipm.addPackageManagerListener(pml);
				try {
					tipm.install(uri);
				} catch (Throwable t) {
					Log.e(LCAT, "Error in install thread.", t);
				} finally {
					tipm.removePackageManagerListener(pml);
				}

			}}).start();
	}

	public void onItemProcessed(final String msg, final String item) {
		handler.post(new Runnable() {

			public void run() {
				if (msg != null) {
					content.append(msg);
				}
				if (item != null) {
					content.append(item);
				}
				if (msg != null || item != null) {
					content.append("\n"); //TODO use global constant
				}
			}});
	}

}
