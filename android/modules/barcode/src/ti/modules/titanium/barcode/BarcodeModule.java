/*
 * Copyright (c) 2010 by M-Way Solutions GmbH
 * 
 *      http://www.mwaysolutions.com
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package ti.modules.titanium.barcode;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiActivityResultHandler;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiIntentWrapper;

import android.app.Activity;
import android.content.Intent;

/**
 * This is the titanium appcelerator module which allows to use the zxing
 * library from an appcelerator application
 * 
 * @author sven@roothausen.de (Sven Pfleiderer)
 * 
 */

public class BarcodeModule extends TiModule {

	private static final String LCAT = "TiBarcode";
	private static final boolean DBG = true; // TiConfig.LOGD;
	protected static final int UNKNOWN_ERROR = 0;

	public BarcodeModule(final TiContext context) {
		super(context);
	}

	public void scan(final Object[] args) {
		logDebug("scan() called");

		final TiDict options = (TiDict) args[0];

		final KrollCallback successCallback = getCallback(options, "success");
		final KrollCallback cancelCallback = getCallback(options, "cancel");
		final KrollCallback errorCallback = getCallback(options, "error");

		launchScanActivity(successCallback, cancelCallback, errorCallback);
		logDebug("scan() ended");
	}

	private void launchScanActivity(final KrollCallback successCallback,
			final KrollCallback cancelCallback,
			final KrollCallback errorCallback) {

		logDebug("launchScanActivity() called");

		final Activity activity = getTiContext().getActivity();
		final TiActivitySupport activitySupport = (TiActivitySupport) activity;
		final int resultCode = activitySupport.getUniqueResultCode();

		final TiIntentWrapper scanIntent = new TiIntentWrapper(new Intent(
				activity, BarcodeActivity.class));
		scanIntent.setWindowId(TiIntentWrapper.createActivityName("SCANNER"));
		final Intent intent = scanIntent.getIntent();

		activitySupport.launchActivityForResult(intent, resultCode,
				new TiActivityResultHandler() {

					@Override
					public void onResult(final Activity activity,
							final int requestCode, final int resultCode,
							final Intent data) {

						logDebug("onResult() called");

						if (resultCode == Activity.RESULT_CANCELED) {
							logDebug("scan canceled");
							if (cancelCallback != null) {
								cancelCallback.call(null);
							}
						} else {
							logDebug("scan successful");
							String result = data
									.getStringExtra(BarcodeActivity.EXTRA_RESULT);
							logDebug("scan result: " + result);
							successCallback
									.callWithProperties(getDictForResult(result));
						}
					}

					@Override
					public void onError(Activity activity, int requestCode,
							Exception e) {
						String msg = "Problem with scanner; " + e.getMessage();
						logError("error: " + msg);
						if (errorCallback != null) {
							errorCallback
									.callWithProperties(createErrorResponse(
											UNKNOWN_ERROR, msg));
						}
					}
				});

		logDebug("launchScanActivity() ended");

	}

	private TiDict getDictForResult(final String result) {
		final TiDict dict = new TiDict();
		dict.put("barcode", result);
		return dict;
	}

	private KrollCallback getCallback(final TiDict options, final String name) {
		if (options.containsKey(name)) {
			return (KrollCallback) options.get(name);
		} else {
			logError("Callback not found: " + name);
			return null;
		}
	}

	private void logError(final String msg) {
		Log.e(LCAT, msg);
	}

	private void logDebug(final String msg) {
		if (DBG) {
			Log.d(LCAT, msg);
		}
	}
}
