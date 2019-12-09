/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.webview;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.ActivityProxy;
import org.appcelerator.titanium.proxy.IntentProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiUIHelper;

import ti.modules.titanium.ui.WebViewProxy;
import android.app.Activity;
import android.content.DialogInterface;
import android.content.DialogInterface.OnClickListener;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Message;
import android.provider.MediaStore;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.ConsoleMessage;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebStorage.QuotaUpdater;
import android.webkit.WebView;
import android.widget.FrameLayout;

@SuppressWarnings("deprecation")
public class TiWebChromeClient extends WebChromeClient
{
	private static final String TAG = "TiWebChromeClient";
	private static final String CONSOLE_TAG = TAG + ".console";

	private TiUIWebView tiWebView;
	private FrameLayout mCustomViewContainer;
	private CustomViewCallback mCustomViewCallback;
	private View mCustomView;

	private ValueCallback<Uri[]> mFilePathCallback;
	private ValueCallback<Uri> mFilePathCallbackLegacy;
	private String mCameraPhotoPath;
	private Uri mCameraPhotoUri;

	public TiWebChromeClient(TiUIWebView webView)
	{
		super();
		this.tiWebView = webView;
	}

	@Override
	public void onGeolocationPermissionsShowPrompt(String origin,
												   android.webkit.GeolocationPermissions.Callback callback)
	{
		callback.invoke(origin, true, false);
	}

	@Override
	public boolean onConsoleMessage(ConsoleMessage message)
	{
		switch (message.messageLevel()) {
			case DEBUG:
				Log.d(CONSOLE_TAG, message.message() + " (" + message.lineNumber() + ":" + message.sourceId() + ")");
				break;
			default:
				Log.i(CONSOLE_TAG, message.message() + " (" + message.lineNumber() + ":" + message.sourceId() + ")");
				break;
		}
		return true;
	}

	public boolean onJsAlert(WebView view, String url, String message, final android.webkit.JsResult result)
	{
		TiUIHelper.doOkDialog("Alert", message, new OnClickListener() {
			public void onClick(DialogInterface dialog, int which)
			{
				result.confirm();
			}
		});

		return true;
	}

	public void onProgressChanged(WebView view, int progress)
	{
		WebViewProxy proxy = (WebViewProxy) tiWebView.getProxy();
		if (proxy != null) {
			KrollDict data = new KrollDict();
			data.put("progress", progress);
			proxy.fireEvent("progress", data);
		}
	}

	// This exposes onCreateWindow to JS with a similar API to Android:
	// If the end-developer sets the 'onCreateWindow' property of the WebViewProxy
	// to a callback function, then it gets executed when a new window is created
	// by the WebView (generally, when a link is clicked that has a non-existent target such as _blank)
	// If the end-developer wants to open a new window, they can simply create a WebViewProxy,
	// along with any other supporting views, and return the proxy from their callback.
	// Otherwise, they can return null (or anything other than a WebViewProxy), and nothing will happen
	@Override
	public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg)
	{
		WebViewProxy proxy = (WebViewProxy) tiWebView.getProxy();
		if (proxy == null) {
			return false;
		}

		Object onCreateWindow = proxy.getProperty(TiC.PROPERTY_ON_CREATE_WINDOW);
		if (!(onCreateWindow instanceof KrollFunction)) {
			return false;
		}

		Message href = view.getHandler().obtainMessage();
		view.requestFocusNodeHref(href);
		String url = href.getData().getString("url");

		Object onLink = proxy.getProperty(TiC.PROPERTY_ON_LINK);
		if (onLink instanceof KrollFunction) {
			KrollFunction onLinkFunction = (KrollFunction) onLink;
			KrollDict args = new KrollDict();
			args.put(TiC.EVENT_PROPERTY_URL, url);
			Object result = onLinkFunction.call(proxy.getKrollObject(), args);
			if (result == null || (result instanceof Boolean && ((Boolean) result) == false)) {
				return false;
			}
		}

		KrollFunction onCreateWindowFunction = (KrollFunction) onCreateWindow;
		HashMap<String, Object> args = new HashMap<String, Object>();
		args.put(TiC.EVENT_PROPERTY_IS_DIALOG, isDialog);
		args.put(TiC.EVENT_PROPERTY_IS_USER_GESTURE, isUserGesture);

		Object result = onCreateWindowFunction.call(proxy.getKrollObject(), args);
		if (result instanceof WebViewProxy) {
			WebViewProxy newProxy = (WebViewProxy) result;
			newProxy.setPostCreateMessage(resultMsg);
			newProxy.getWebView().setProxy(proxy);
			return true;
		}

		return false;
	}

	@Override
	public void onExceededDatabaseQuota(String url, String databaseIdentifier, long currentQuota, long estimatedSize,
										long totalUsedQuota, QuotaUpdater quotaUpdater)
	{
		quotaUpdater.updateQuota(estimatedSize * 2);
	}

	@Override
	public void onShowCustomView(View view, CustomViewCallback callback)
	{
		tiWebView.getWebView().setVisibility(View.GONE);

		// If a view already existed then immediately terminate the new one.
		if (mCustomView != null) {
			callback.onCustomViewHidden();
			return;
		}

		Activity activity = tiWebView.getProxy().getActivity();
		FrameLayout.LayoutParams params =
			new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
		if (activity instanceof TiBaseActivity) {
			if (mCustomViewContainer == null) {
				mCustomViewContainer = new FrameLayout(activity);
				mCustomViewContainer.setBackgroundColor(Color.BLACK);
				mCustomViewContainer.setLayoutParams(params);
				activity.getWindow().addContentView(mCustomViewContainer, params);
			}
			mCustomViewContainer.addView(view);
			mCustomView = view;
			mCustomViewCallback = callback;
			mCustomViewContainer.setVisibility(View.VISIBLE);
		}
	}

	@Override
	public void onHideCustomView()
	{
		if (mCustomView == null) {
			return;
		}

		// Hide the custom view and remove it from its container.
		mCustomView.setVisibility(View.GONE);
		mCustomViewContainer.removeView(mCustomView);
		mCustomView = null;
		mCustomViewContainer.setVisibility(View.GONE);
		mCustomViewCallback.onCustomViewHidden();

		tiWebView.getWebView().setVisibility(View.VISIBLE);
	}

	public boolean interceptOnBackPressed()
	{
		if (mCustomView != null) {
			onHideCustomView();
			if (Log.isDebugModeEnabled()) {
				Log.d(TAG, "WebView intercepts the OnBackPressed event to close the full-screen video.");
			}
			return true;
		}
		return false;
	}

	// See: https://code.google.com/p/android/issues/detail?id=62220
	// This is unsupported by Google Android
	// openFileChooser for Android 3.0+
	public void openFileChooser(ValueCallback<Uri> filePathCallback, String acceptType)
	{
		if (mFilePathCallbackLegacy != null) {
			mFilePathCallbackLegacy.onReceiveValue(null);
		}
		mFilePathCallbackLegacy = filePathCallback;

		TiViewProxy proxy = tiWebView.getProxy();
		Activity activity = null;
		PackageManager packageManager = null;
		ActivityProxy activityProxy = null;

		if (proxy != null) {
			activity = proxy.getActivity();
			activityProxy = proxy.getActivityProxy();
		}

		if (activity != null) {
			packageManager = activity.getPackageManager();
		}

		if (activityProxy != null) {
			activityProxy.startActivityForResult(prepareFileChooserIntent(packageManager),
												 new OpenFileChooserCallbackFunction());
		}
	}

	protected IntentProxy prepareFileChooserIntent(PackageManager packageManager)
	{
		Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
		Activity currentActivity = TiApplication.getInstance().getCurrentActivity();

		if (Build.VERSION.SDK_INT < 23
			|| (Build.VERSION.SDK_INT >= 23 && currentActivity != null
				&& currentActivity.checkSelfPermission(android.Manifest.permission.WRITE_EXTERNAL_STORAGE)
					   == PackageManager.PERMISSION_GRANTED)) {
			if (packageManager != null && takePictureIntent.resolveActivity(packageManager) != null) {
				// Create the File where the photo should go
				File photoFile = null;
				try {
					photoFile = createImageFile();
					takePictureIntent.putExtra("PhotoPath", mCameraPhotoPath);
				} catch (IOException ex) {
					// Error occurred while creating the File
					Log.e(TAG, "Unable to create Image File", ex);
				}

				// Continue only if the File was successfully created
				if (photoFile != null) {
					mCameraPhotoPath = "file:" + photoFile.getAbsolutePath();
					mCameraPhotoUri = Uri.fromFile(photoFile);
					takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, mCameraPhotoUri);
				} else {
					takePictureIntent = null;
				}
			}
		} else {
			takePictureIntent = null;
		}

		Intent contentSelectionIntent = new Intent(Intent.ACTION_GET_CONTENT);
		contentSelectionIntent.addCategory(Intent.CATEGORY_OPENABLE);
		contentSelectionIntent.setType("*/*");

		Intent[] intentArray = null;
		if (takePictureIntent != null) {
			intentArray = new Intent[] { takePictureIntent };
		} else {
			intentArray = new Intent[0];
		}

		Intent chooserIntent = new Intent(Intent.ACTION_CHOOSER);
		chooserIntent.putExtra(Intent.EXTRA_INTENT, contentSelectionIntent);
		chooserIntent.putExtra(Intent.EXTRA_TITLE, "Image Chooser");
		if (intentArray != null) {
			chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, intentArray);
		}

		return new IntentProxy(chooserIntent);
	}

	// See: https://code.google.com/p/android/issues/detail?id=62220
	// This is unsupported by Google Android
	// openFileChooser for Android < 3.0
	public void openFileChooser(ValueCallback<Uri> filePathCallback)
	{
		openFileChooser(filePathCallback, "");
	}

	// See: https://code.google.com/p/android/issues/detail?id=62220
	// This is unsupported by Google Android
	//openFileChooser for other Android versions
	public void openFileChooser(ValueCallback<Uri> filePathCallback, String acceptType, String capture)
	{
		openFileChooser(filePathCallback, acceptType);
	}

	// This is officially supported by Google Android
	// This is available on API level 21 and above
	public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback,
									 WebChromeClient.FileChooserParams fileChooserParams)
	{

		if (mFilePathCallback != null) {
			mFilePathCallback.onReceiveValue(null);
		}
		mFilePathCallback = filePathCallback;

		TiViewProxy proxy = tiWebView.getProxy();
		Activity activity = null;
		PackageManager packageManager = null;
		ActivityProxy activityProxy = null;

		if (proxy != null) {
			activity = proxy.getActivity();
			activityProxy = proxy.getActivityProxy();
		}

		if (activity != null) {
			packageManager = activity.getPackageManager();
		}

		if (activityProxy != null) {
			activityProxy.startActivityForResult(prepareFileChooserIntent(packageManager),
												 new ShowFileChooserCallbackFunction());
		}
		return true;
	}

	class ShowFileChooserCallbackFunction implements KrollFunction
	{

		@Override
		public Object call(KrollObject krollObject, HashMap args)
		{
			return null;
		}

		@Override
		public Object call(KrollObject krollObject, Object[] args)
		{
			return null;
		}

		@Override
		public void callAsync(KrollObject krollObject, HashMap args)
		{
			int resultCode = Activity.RESULT_CANCELED;
			Object objectResults = args.get(TiC.EVENT_PROPERTY_RESULT_CODE);
			if (objectResults instanceof Integer) {
				resultCode = (Integer) objectResults;
			}
			IntentProxy intentProxy = (IntentProxy) args.get(TiC.EVENT_PROPERTY_INTENT);
			Intent data = null;
			if (intentProxy != null) {
				data = intentProxy.getIntent();
			}

			Uri[] results = null;
			if (resultCode == Activity.RESULT_OK) {
				if (data == null || (data.getDataString() == null || data.getDataString().isEmpty())) {
					// If there is no data, then we may have taken a photo
					if (mCameraPhotoPath != null) {
						results = new Uri[] { Uri.parse(mCameraPhotoPath) };
					}
				} else {
					String dataString = data.getDataString();
					if (dataString != null) {
						results = new Uri[] { Uri.parse(dataString) };
					}
				}
			}

			mFilePathCallback.onReceiveValue(results);
			mFilePathCallback = null;
		}

		@Override
		public void callAsync(KrollObject krollObject, Object[] args)
		{
		}
	}

	class OpenFileChooserCallbackFunction implements KrollFunction
	{

		@Override
		public Object call(KrollObject krollObject, HashMap args)
		{
			return null;
		}

		@Override
		public Object call(KrollObject krollObject, Object[] args)
		{
			return null;
		}

		@Override
		public void callAsync(KrollObject krollObject, HashMap args)
		{
			int resultCode = Activity.RESULT_CANCELED;
			Object objectResults = args.get(TiC.EVENT_PROPERTY_RESULT_CODE);
			if (objectResults instanceof Integer) {
				resultCode = (Integer) objectResults;
			}
			IntentProxy intentProxy = (IntentProxy) args.get(TiC.EVENT_PROPERTY_INTENT);
			Intent data = null;
			if (intentProxy != null) {
				data = intentProxy.getIntent();
			}

			Uri results = null;
			if (resultCode == Activity.RESULT_OK) {
				if (data == null || (data.getDataString() == null || data.getDataString().isEmpty())) {
					// If there is no data, then we may have taken a photo
					if (mCameraPhotoUri != null) {
						results = mCameraPhotoUri;
					}
				} else {
					String dataString = data.getDataString();
					if (dataString != null) {
						results = Uri.parse(dataString);
					}
				}
			}

			mFilePathCallbackLegacy.onReceiveValue(results);
			mFilePathCallbackLegacy = null;
		}

		@Override
		public void callAsync(KrollObject krollObject, Object[] args)
		{
		}
	}

	private File createImageFile() throws IOException
	{
		// Create an image file name
		String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
		String imageFileName = "JPEG_" + timeStamp + "_";
		File storageDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES);
		File imageFile = File.createTempFile(imageFileName, /* prefix */
											 ".jpg",        /* suffix */
											 storageDir     /* directory */
		);
		return imageFile;
	}
}
