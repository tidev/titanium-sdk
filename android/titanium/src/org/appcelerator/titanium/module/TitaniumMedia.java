/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.Date;
import java.util.HashSet;

import org.appcelerator.titanium.TitaniumActivity;
import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.TitaniumResultHandler;
import org.appcelerator.titanium.TitaniumVideoActivity;
import org.appcelerator.titanium.api.ITitaniumFile;
import org.appcelerator.titanium.api.ITitaniumLifecycle;
import org.appcelerator.titanium.api.ITitaniumMedia;
import org.appcelerator.titanium.api.ITitaniumSound;
import org.appcelerator.titanium.api.ITitaniumVideo;
import org.appcelerator.titanium.config.TitaniumAppInfo;
import org.appcelerator.titanium.module.fs.TitaniumBlob;
import org.appcelerator.titanium.module.media.TitaniumSound;
import org.appcelerator.titanium.util.TitaniumFileHelper;
import org.appcelerator.titanium.util.TitaniumIntentWrapper;
import org.appcelerator.titanium.util.TitaniumUrlHelper;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.hardware.Camera;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Vibrator;
import android.provider.MediaStore;
import android.provider.MediaStore.Images;
import android.util.Config;
import android.util.Log;
import android.webkit.WebView;

public class TitaniumMedia extends TitaniumBaseModule implements ITitaniumMedia
{
	private static final String LCAT = "TiMedia";
	private static final boolean DBG = Config.LOGD;
	private static final long[] DEFAULT_VIBRATE_PATTERN = { 100L,250L };

	private static final String PHOTO_DCIM_CAMERA = "/sdcard/dcim/Camera";

	protected HashSet<ITitaniumLifecycle> mediaObjects;
	protected boolean isContentRoot;

	public TitaniumMedia(TitaniumModuleManager moduleMgr, String name) {
		super(moduleMgr, name);
		mediaObjects = new HashSet<ITitaniumLifecycle>();
		TitaniumIntentWrapper intent = new TitaniumIntentWrapper(moduleMgr.getActivity().getIntent());
		isContentRoot = intent.isContent();
	}

	@Override
	public void register(WebView webView) {
		String name = getModuleName();
		if (DBG) {
			Log.d(LCAT, "Registering TitaniumMedia as " + name);
		}
		webView.addJavascriptInterface((ITitaniumMedia) this, name);
	}

	public void addLifecycleListener(ITitaniumLifecycle listener) {
		if (!mediaObjects.contains(listener)) {
			mediaObjects.add(listener);
		}
	}

	public void removeLifecyleListener(ITitaniumLifecycle listener) {
		mediaObjects.remove(listener);
	}

	class SimpleAudioEffect implements Runnable {

		private Context ctx;
		private int type;
		private Ringtone notification;

		public SimpleAudioEffect(Context ctx, int type)
		{
			this.ctx = ctx;
			this.type = type;
		}

		public void run() {
			try {
				if (notification == null) {
					notification = RingtoneManager.getRingtone(ctx, RingtoneManager.getDefaultUri(type));
				}
				if (notification != null) {
					notification.play();
				}
			} catch (Exception e) {
				Log.e(LCAT, "Error playing beep.", e);
			}
		}
	}

	public void beep() {
		getHandler().post(new SimpleAudioEffect(getContext(), RingtoneManager.TYPE_NOTIFICATION));
	}

	public ITitaniumSound createSound(String url) {
		TitaniumSound s = null;

		if (isContentRoot) {
			url = TitaniumUrlHelper.buildContentUrlFromResourcesRoot(getActivity(), url);
		} else {
			url = TitaniumUrlHelper.buildAssetUrlFromResourcesRoot(getActivity(), url);
		}

		Uri uri = Uri.parse(url);
		s = new TitaniumSound(this, uri);

		return s;
	}

	public void vibrate(long[] pattern)
	{
		if (pattern == null) {
			pattern = DEFAULT_VIBRATE_PATTERN;
		}
		Vibrator vibrator = (Vibrator) getWebView().getContext().getSystemService(Context.VIBRATOR_SERVICE);
		if (vibrator != null) {
			vibrator.vibrate(pattern, -1);
		}
	}

	@Override
	public void onDestroy() {
		super.onDestroy();
		try {
			for(ITitaniumLifecycle listener : mediaObjects) {
				try {
					listener.onDestroy();
				} catch (Throwable t) {
					Log.e(LCAT, "Error in onDestroy", t);
				}
			}
		} finally {
			mediaObjects.clear();
			mediaObjects = null;
		}
	}

	@Override
	public void onPause() {
		super.onPause();
		for(ITitaniumLifecycle listener : mediaObjects) {
			try {
				listener.onPause();
			} catch (Throwable t) {
				Log.e(LCAT, "Error in onPause", t);
			}
		}
	}

	@Override
	public void onResume() {
		super.onResume();
		for(ITitaniumLifecycle listener : mediaObjects) {
			try {
				listener.onResume();
			} catch (Throwable t) {
				Log.e(LCAT, "Error in onResume", t);
			}
		}
	}

	public void showCamera(final String successCallback, final String cancelCallback,
			final String errorCallback, final String options, ITitaniumFile file)
	{
		if (DBG) {
			Log.d(LCAT, "showCamera called");
		}
		if (!(file instanceof TitaniumBlob)) {
			throw new IllegalArgumentException("blob parameter must be of type TitaniumBlob");
		}
		Camera camera = null;
		try {
			camera = Camera.open();
			if (camera != null) {
				camera.release();
				camera = null;
			}
		} catch (Throwable t) {
			if (camera != null) {
				camera.release();
			}
			invokeUserCallback(errorCallback, createJSONError(0, "Camera not available."));
			return;
		}
		boolean saveToPhotoGallery = false;
		try {
			JSONObject json = new JSONObject(options);
			try {
				saveToPhotoGallery = json.getBoolean("saveToPhotoGallery");
			} catch (JSONException e) {
				if (DBG) {
					Log.d(LCAT, "options does not have saveToPhotoGallery option or value is not boolean");
				}
			}
			// TODO allowImageEditing. Don't know if I can do this yet
		} catch (JSONException e) {
			Log.w(LCAT, "Invalid options JSON: " + options, e);
		}

		final TitaniumBlob blob = (TitaniumBlob) file;
		TitaniumActivity activity = getActivity();
		TitaniumFileHelper tfh = new TitaniumFileHelper(getContext());

		File imageDir = null;
		File imageFile = null;

		try {
			if (saveToPhotoGallery) {
				imageDir = new File(PHOTO_DCIM_CAMERA);
				if (!imageDir.exists()) {
					imageDir.mkdirs();
				}
			} else {
				if (activity.getIntent() != null) {
					TitaniumIntentWrapper intent = new TitaniumIntentWrapper(activity.getIntent());
					TitaniumAppInfo appInfo = intent.getAppInfo(activity);
					String name = appInfo.getAppName();
					imageDir = new File(PHOTO_DCIM_CAMERA, name);
					if (!imageDir.exists()) {
						imageDir.mkdirs();
					}
				} else {
					imageDir = tfh.getDataDirectory(false);
				}
			}
			imageFile = tfh.getTempFile(imageDir, ".jpg");

		} catch (IOException e) {
			Log.e(LCAT, "Unable to create temp file", e);
			invokeUserCallback(errorCallback, createJSONError(0, e.getMessage()));
			return;
		}

		final File finalImageFile = imageFile;
		final String imageUrl = "file://" + imageFile.getAbsolutePath();

		Intent cameraIntent = new Intent();
		cameraIntent.setAction(MediaStore.ACTION_IMAGE_CAPTURE);
		cameraIntent.putExtra(MediaStore.EXTRA_OUTPUT, Uri.parse(imageUrl));
		cameraIntent.addCategory(Intent.CATEGORY_DEFAULT);

		final int code = activity.getUniqueResultCode();
		final boolean finalSaveToPhotoGallery = saveToPhotoGallery;

		try {
			activity.registerResultHandler(code,
				new TitaniumResultHandler() {

					public void onResult(TitaniumActivity activity, int requestCode, int resultCode, Intent data)
					{
						if (resultCode == Activity.RESULT_CANCELED) {
							if (finalImageFile != null) {
								finalImageFile.delete();
							}
							invokeUserCallback(cancelCallback, null);
						} else {
							ContentValues values = new ContentValues(7);
							values.put(Images.Media.TITLE, finalImageFile.getName());
							values.put(Images.Media.DISPLAY_NAME, finalImageFile.getName());
							values.put(Images.Media.DATE_TAKEN, new Date().getTime());
							values.put(Images.Media.MIME_TYPE, "image/jpeg");
							if (finalSaveToPhotoGallery) {
								values.put(Images.ImageColumns.BUCKET_ID, PHOTO_DCIM_CAMERA.toLowerCase().hashCode());
								values.put(Images.ImageColumns.BUCKET_DISPLAY_NAME, "Camera");
							} else {
								values.put(Images.ImageColumns.BUCKET_ID, finalImageFile.getPath().toLowerCase().hashCode());
								values.put(Images.ImageColumns.BUCKET_DISPLAY_NAME, finalImageFile.getName());
							}
							values.put("_data", finalImageFile.getAbsolutePath());

							Uri imageUri = activity.getContentResolver().insert(Images.Media.EXTERNAL_CONTENT_URI, values);

							String result = fillBlob(activity, blob, imageUri.toString());
							invokeUserCallback(successCallback, result);
						}
						activity.removeResultHandler(code);
					}
				});

			activity.startActivityForResult(cameraIntent, code);
		} catch (ActivityNotFoundException e) {
			activity.removeResultHandler(code);
			if (finalImageFile != null) {
				finalImageFile.delete();
			}
			Log.e(LCAT, "Camera problem: ", e);
			invokeUserCallback(errorCallback, createJSONError(0, e.getMessage()));
		}
	}

	public void openPhotoGallery(final String successCallback, final String cancelCallback, final String errorCallback, ITitaniumFile file)
	{
		if (DBG) {
			Log.d(LCAT, "openPhotoGallery called");
		}
		if (!(file instanceof TitaniumBlob)) {
			throw new IllegalArgumentException("blob parameter must be of type TitaniumBlob");
		}

		final TitaniumBlob blob = (TitaniumBlob) file;
		TitaniumActivity activity = getActivity();
		Intent galleryIntent = new Intent();
		galleryIntent.setAction(Intent.ACTION_PICK);
		galleryIntent.setType("image/*");
		galleryIntent.addCategory(Intent.CATEGORY_DEFAULT);

		final int code = activity.getUniqueResultCode();
		try {
			 activity.registerResultHandler(code,
				new TitaniumResultHandler() {

					public void onResult(TitaniumActivity activity, int requestCode, int resultCode, Intent data)
					{
						Log.e(LCAT, "OnResult called: " + resultCode);
						if (resultCode == Activity.RESULT_CANCELED) {
							invokeUserCallback(cancelCallback, null);
						} else {
							String path = data.getDataString();
							String result = fillBlob(activity, blob, path);

							invokeUserCallback(successCallback, result);
						}
						activity.removeResultHandler(code);
					}
				});

			activity.startActivityForResult(galleryIntent, code);
		} catch (ActivityNotFoundException e) {
			activity.removeResultHandler(code);
			Log.e(LCAT, "Gallery problem: ", e);
			invokeUserCallback(errorCallback, createJSONError(0, e.getMessage()));
		}

	}

	String fillBlob(TitaniumActivity activity, TitaniumBlob blob, String path)
	{
		blob.setUrl(path);
		// Get image attributes
		int width = -1;
		int height = -1;
		try {
			Bitmap b = BitmapFactory.decodeStream(activity.getContentResolver().openInputStream(Uri.parse(path)));
			if (b != null) {
				width = b.getWidth();
				height = b.getHeight();
				b.recycle();
				b = null;
			}
		} catch (FileNotFoundException e) {
			Log.w(LCAT, "bitmap not found: " + path);
		}
		StringBuilder sb = new StringBuilder(32);
		sb.append("{ w : ").append(width)
			.append(", h : ").append(height).append("}");

		return sb.toString();
	}

	public void previewImage(final String successCallback, String errorCallback, final ITitaniumFile file)
	{
		if (DBG) {
			Log.d(LCAT, "previewImage");
		}

		if (!(file instanceof TitaniumBlob)) {
			throw new IllegalArgumentException("blob parameter must be of type TitaniumBlob");
		}

		final TitaniumBlob blob = (TitaniumBlob) file;

		TitaniumActivity activity = getActivity();
		Uri uri = Uri.parse(blob.nativePath());

		String type = activity.getContentResolver().getType(uri);

		Intent previewIntent = new Intent();
		previewIntent.setAction(Intent.ACTION_VIEW);
		previewIntent.setType(type);
		previewIntent.setData(uri);

		final int code = activity.getUniqueResultCode();
		try {
			 activity.registerResultHandler(code,
				new TitaniumResultHandler() {

					public void onResult(TitaniumActivity activity, int requestCode, int resultCode, Intent data)
					{
						invokeUserCallback(successCallback, null);
						activity.removeResultHandler(code);
					}
				});

			activity.startActivityForResult(previewIntent, code);
		} catch (ActivityNotFoundException e) {
			activity.removeResultHandler(code);
			Log.e(LCAT, "preview problem: ", e);
			invokeUserCallback(errorCallback, createJSONError(0, e.getMessage()));
		}
	}

	public ITitaniumFile createBlob() {
		if (DBG) {
			Log.d(LCAT, "creating blob");
		}
		return new TitaniumBlob(getActivity().getApplicationContext());
	}

	public ITitaniumVideo createVideoPlayer(final String jsonOptions) {
		ITitaniumVideo result = null;
		String errorCallback = null;
		try {
			JSONObject options = new JSONObject(jsonOptions);
			try {
				errorCallback = options.getString("error"); //callbacks will be added on JS side. to track
			} catch (JSONException e2) {
				Log.d(LCAT, "error callback not available");
			}

			String url = null;
			try {
				url = options.getString("contentURL");
				Uri uri = Uri.parse(url);
				String scheme = uri.getScheme();
				if (scheme == null || scheme.length() == 0 || (scheme == null && !(new File(url).exists()))) {
					uri = Uri.parse(TitaniumUrlHelper.buildAssetUrlFromResourcesRoot(getActivity(), url));
				}
				Intent intent = new Intent(getActivity(), TitaniumVideoActivity.class);
				intent.setData(uri);
				getActivity().startActivity(intent);
			} catch (JSONException e2) {
				String msg = "contentURL is required.";
				Log.e(LCAT, msg);
				if (errorCallback != null) {
					invokeUserCallback(errorCallback, createJSONError(0, msg));
				}
			}

		} catch (JSONException e) {
			Log.e(LCAT, "Could not reconstruct options from JSON: ", e);
		}

		return result;
	}
}
