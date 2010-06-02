/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.facebook;

import android.app.Activity;
import android.app.ProgressDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.os.Handler;
import android.util.Log;

public class FBProgressDialog {

	private static ProgressDialog instance = null;

	private static synchronized void showProgressDialog(Activity activity) {
		if (activity != null) {

			activity.runOnUiThread(new Runnable() {

				public void run() {
					if (instance != null) {
						if (instance != null) {
							try {
								instance.show();
							} catch (Exception ex) {
								Log.e("FBProgressDialog", "Error while showing progress dialog", ex);
							}
						}
					}
				}

			});
		} else {
			Handler handler = new Handler();
			handler.post(new Runnable() {

				public void run() {
					if (instance != null) {
						if (instance != null) {
							try {
								instance.show();
							} catch (Exception ex) {
								Log.e("FBProgressDialog", "Error while showing progress dialog", ex);
							}
						}
					}
				}

			});
		}
	}

	private static synchronized void hideProgressDialog() {
		Handler handler = new Handler();
		handler.post(new Runnable() {

			public void run() {
				if (instance != null) {
					synchronized (instance) {
						if (instance != null) {
							try {
								instance.dismiss();
							} catch (Exception ex) {
								Log.e("FBProgressDialog", "Error while hiding progress dialog", ex);
							}
						}
					}
				}

			}

		});
	}
	
	
	private static synchronized void cancelProgressDialog() {
		Handler handler = new Handler();
		handler.post(new Runnable() {

			public void run() {
				if (instance != null && instance.isShowing()) {
					if (instance != null) {
						try {
							instance.cancel();
						} catch (Exception ex) {
							Log.e("FBProgressDialog", "Error while canceling progress dialog", ex);
						}
					}
				}
				instance = null;
			}

		});
	}

	public static void show(final Context context, final Activity activity) {
		if (instance != null && !instance.isShowing()) {
			showProgressDialog(activity);

		} else if (instance == null) {
			if (instance != null && !context.equals(instance.getContext())) {
				cancelProgressDialog();
			}
			instance = ProgressDialog.show(context, "", "Loading...", true, true);

			instance.setOnCancelListener(new DialogInterface.OnCancelListener() {

				public void onCancel(DialogInterface dialog) {
					if (instance != null) {
						synchronized (instance) {
							instance = null;
						}
					}
				}
			});

			instance.setOnDismissListener(new DialogInterface.OnDismissListener() {

				public void onDismiss(DialogInterface dialog) {
					if (instance != null) {
						synchronized (instance) {
							instance = null;
						}
					}
				}
			});

			showProgressDialog(activity);
		} else {
			cancelProgressDialog();
		}
	}

	public static void hide(Context context) {
		hideProgressDialog();
	}

}
