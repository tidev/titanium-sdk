/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Date;
import java.util.HashMap;
import java.util.List;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.titanium.ContextSpecific;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiActivityResultHandler;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiIntentWrapper;

import ti.modules.titanium.media.android.AndroidModule.MediaScannerClient;
import android.app.Activity;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.database.Cursor;
import android.graphics.BitmapFactory;
import android.hardware.Camera;
import android.net.Uri;
import android.os.Vibrator;
import android.provider.MediaStore;
import android.provider.MediaStore.Images;

@Kroll.module @ContextSpecific
public class MediaModule extends KrollModule
{
	private static final String LCAT = "TiMedia";
	private static final boolean DBG = TiConfig.LOGD;

	private static final long[] DEFAULT_VIBRATE_PATTERN = { 100L, 250L };
	private static final String PHOTO_DCIM_CAMERA = "/sdcard/dcim/Camera";

	@Kroll.constant public static final int UNKNOWN_ERROR = 0;
	@Kroll.constant public static final int DEVICE_BUSY = 1;
	@Kroll.constant public static final int NO_CAMERA = 2;
	@Kroll.constant public static final int NO_VIDEO = 3;

	@Kroll.constant public static final int VIDEO_SCALING_NONE = 0;
	@Kroll.constant public static final int VIDEO_SCALING_ASPECT_FILL = 1;
	@Kroll.constant public static final int VIDEO_SCALING_ASPECT_FIT = 2;
	@Kroll.constant public static final int VIDEO_SCALING_MODE_FILL = 3;

	@Kroll.constant public static final int VIDEO_CONTROL_DEFAULT = 0;
	@Kroll.constant public static final int VIDEO_CONTROL_EMBEDDED = 1;
	@Kroll.constant public static final int VIDEO_CONTROL_FULLSCREEN = 2;
	@Kroll.constant public static final int VIDEO_CONTROL_NONE = 3;
	@Kroll.constant public static final int VIDEO_CONTROL_HIDDEN = 4;

	@Kroll.constant public static final int VIDEO_LOAD_STATE_UNKNOWN = 0;
	@Kroll.constant public static final int VIDEO_LOAD_STATE_PLAYABLE = 1 << 0;
	@Kroll.constant public static final int VIDEO_LOAD_STATE_PLAYTHROUGH_OK = 1 << 1;
	@Kroll.constant public static final int VIDEO_LOAD_STATE_STALLED = 1 << 2;

	@Kroll.constant public static final int VIDEO_PLAYBACK_STATE_STOPPED = 0;
	@Kroll.constant public static final int VIDEO_PLAYBACK_STATE_PLAYING = 1;
	@Kroll.constant public static final int VIDEO_PLAYBACK_STATE_PAUSED = 2;
	@Kroll.constant public static final int VIDEO_PLAYBACK_STATE_INTERRUPTED = 3;
	@Kroll.constant public static final int VIDEO_PLAYBACK_STATE_SEEKING_FORWARD = 4;
	@Kroll.constant public static final int VIDEO_PLAYBACK_STATE_SEEKING_BACKWARD = 5;

	@Kroll.constant public static final int VIDEO_FINISH_REASON_PLAYBACK_ENDED = 0;
	@Kroll.constant public static final int VIDEO_FINISH_REASON_PLAYBACK_ERROR = 1;
	@Kroll.constant public static final int VIDEO_FINISH_REASON_USER_EXITED = 2;

	@Kroll.constant public static final String MEDIA_TYPE_PHOTO = "public.image";
	@Kroll.constant public static final String MEDIA_TYPE_VIDEO = "public.video";

	public MediaModule()
	{
		super();
	}

	public MediaModule(TiContext tiContext)
	{
		this();
	}

	@Kroll.method
	public void vibrate(@Kroll.argument(optional=true) long[] pattern)
	{
		if ((pattern == null) || (pattern.length == 0)) {
			pattern = DEFAULT_VIBRATE_PATTERN;
		}
		Vibrator vibrator = (Vibrator) TiApplication.getInstance().getSystemService(Context.VIBRATOR_SERVICE);
		if (vibrator != null) {
			vibrator.vibrate(pattern, -1);
		}
	}

	@Kroll.method
	public void showCamera(HashMap options)
	{
		KrollFunction successCallback = null;
		KrollFunction cancelCallback = null;
		KrollFunction errorCallback = null;

		if (options.containsKey("success")) {
			successCallback = (KrollFunction) options.get("success");
		}
		if (options.containsKey("cancel")) {
			cancelCallback = (KrollFunction) options.get("cancel");
		}
		if (options.containsKey("error")) {
			errorCallback = (KrollFunction) options.get("error");
		}
		if (options.containsKey("overlay")) {
			TiCameraActivity.overlayProxy = (TiViewProxy) options.get("overlay");
		}
		if (options.containsKey("autohide")) {
			TiCameraActivity.autohide = TiConvert.toBoolean(options.get("autohide"));
		}

		if (DBG) {
			Log.d(LCAT, "showCamera called");
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

			if (errorCallback != null) {
				errorCallback.call(getKrollObject(), new Object[] { createErrorResponse(NO_CAMERA, "Camera not available.") });
			}

			return;
		}

		boolean saveToPhotoGallery = false;
		if (options.containsKey("saveToPhotoGallery")) {
			saveToPhotoGallery = TiConvert.toBoolean(options.get("saveToPhotoGallery"));
		}

		Activity activity = TiApplication.getInstance().getCurrentActivity();
		TiActivitySupport activitySupport = (TiActivitySupport) activity;
		TiFileHelper tfh = TiFileHelper.getInstance();

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
					String name = TiApplication.getInstance().getAppInfo().getName();
					imageDir = new File(PHOTO_DCIM_CAMERA, name);
					if (!imageDir.exists()) {
						imageDir.mkdirs();
						if (!imageDir.exists()) {
							Log.w(LCAT, "Attempt to create '" + imageDir.getAbsolutePath() +  "' failed silently.");
						}
					}

				} else {
					imageDir = tfh.getDataDirectory(false);
				}
			}

			imageFile = tfh.getTempFile(imageDir, ".jpg");

		} catch (IOException e) {
			Log.e(LCAT, "Unable to create temp file", e);
			if (errorCallback != null) {
				errorCallback.callAsync(getKrollObject(), createErrorResponse(UNKNOWN_ERROR, e.getMessage()));
			}

			return;
		}

		String imageUrl = "file://" + imageFile.getAbsolutePath();
		TiIntentWrapper cameraIntent = new TiIntentWrapper(new Intent());

		if(TiCameraActivity.overlayProxy == null) {
			cameraIntent.getIntent().setAction(MediaStore.ACTION_IMAGE_CAPTURE);
			cameraIntent.getIntent().addCategory(Intent.CATEGORY_DEFAULT);
		} else {
			cameraIntent.getIntent().setClass(TiApplication.getInstance().getBaseContext(), TiCameraActivity.class);
		}

		cameraIntent.setWindowId(TiIntentWrapper.createActivityName("CAMERA"));

		PackageManager pm = (PackageManager) activity.getPackageManager();
		List<ResolveInfo> activities = pm.queryIntentActivities(cameraIntent.getIntent(), PackageManager.MATCH_DEFAULT_ONLY);
		
		// See if it's the HTC camera app
		boolean isHTCCameraApp = false;
		
		for (ResolveInfo rs : activities) {
			try {
				if (rs.activityInfo.applicationInfo.sourceDir.contains("HTC")) {
					isHTCCameraApp = true;
					break;
				}
			} catch (NullPointerException e) {
				//Ignore
			}
		}

		if (!isHTCCameraApp) {
			cameraIntent.getIntent().putExtra(MediaStore.EXTRA_OUTPUT, Uri.parse(imageUrl));
		}

		CameraResultHandler resultHandler = new CameraResultHandler();
		resultHandler.imageFile = imageFile;
		resultHandler.imageUrl = imageUrl;
		resultHandler.saveToPhotoGallery = saveToPhotoGallery;
		resultHandler.successCallback = successCallback;
		resultHandler.cancelCallback = cancelCallback;
		resultHandler.errorCallback = errorCallback;
		resultHandler.activitySupport = activitySupport;
		resultHandler.cameraIntent = cameraIntent.getIntent();
		activity.runOnUiThread(resultHandler);
	}
	
	@Kroll.method
	public void hideCamera()
	{
		TiCameraActivity.cameraActivity.setResult(Activity.RESULT_OK);
		TiCameraActivity.cameraActivity.finish();
	}	

	protected class CameraResultHandler implements TiActivityResultHandler, Runnable
	{
		protected File imageFile;
		protected String imageUrl;
		protected boolean saveToPhotoGallery;
		protected int code;
		protected KrollFunction successCallback, cancelCallback, errorCallback;
		protected TiActivitySupport activitySupport;
		protected Intent cameraIntent;

		@Override
		public void run()
		{
			code = activitySupport.getUniqueResultCode();
			activitySupport.launchActivityForResult(cameraIntent, code, this);
		}

		@Override
		public void onResult(Activity activity, int requestCode, int resultCode, Intent data)
		{
			if (resultCode == Activity.RESULT_CANCELED) {
				if (imageFile != null) {
					imageFile.delete();
				}
				if (cancelCallback != null) {
					cancelCallback.callAsync(getKrollObject(), new Object[] {});
				}

			} else {
				if (data == null) {
					ContentValues values = new ContentValues(7);
					values.put(Images.Media.TITLE, imageFile.getName());
					values.put(Images.Media.DISPLAY_NAME, imageFile.getName());
					values.put(Images.Media.DATE_TAKEN, new Date().getTime());
					values.put(Images.Media.MIME_TYPE, "image/jpeg");
					if (saveToPhotoGallery) {
						values.put(Images.ImageColumns.BUCKET_ID, PHOTO_DCIM_CAMERA.toLowerCase().hashCode());
						values.put(Images.ImageColumns.BUCKET_DISPLAY_NAME, "Camera");

					} else {
						values.put(Images.ImageColumns.BUCKET_ID, imageFile.getPath().toLowerCase().hashCode());
						values.put(Images.ImageColumns.BUCKET_DISPLAY_NAME, imageFile.getName());
					}
					values.put("_data", imageFile.getAbsolutePath());

					Uri imageUri = activity.getContentResolver().insert(Images.Media.EXTERNAL_CONTENT_URI, values);

					// puts newly captured photo into the gallery
					MediaScannerClient mediaScanner = new MediaScannerClient(activity, new String[] {imageUrl}, null, null);
					mediaScanner.scan();

					try {
						if (successCallback != null) {
							successCallback.callAsync(getKrollObject(), createDictForImage(imageUri.toString(), "image/jpeg"));
						}

					} catch (OutOfMemoryError e) {
						String msg = "Not enough memory to get image: " + e.getMessage();
						Log.e(LCAT, msg);
						if (errorCallback != null) {
							errorCallback.callAsync(getKrollObject(), createErrorResponse(UNKNOWN_ERROR, msg));
						}
					}

				} else {
					// Get the content information about the saved image
					String[] projection = {
						Images.Media.TITLE,
						Images.Media.DISPLAY_NAME,
						Images.Media.MIME_TYPE,
						Images.ImageColumns.BUCKET_ID,
						Images.ImageColumns.BUCKET_DISPLAY_NAME,
						"_data"
					};

					String title = null;
					String displayName = null;
					String mimeType = null;
					String bucketId = null;
					String bucketDisplayName = null;
					String dataPath = null;

					Cursor c = activity.getContentResolver().query(data.getData(), projection, null, null, null);
					if (c != null) {
						try {
							if (c.moveToNext()) {
								title = c.getString(0);
								displayName = c.getString(1);
								mimeType = c.getString(2);
								bucketId = c.getString(3);
								bucketDisplayName = c.getString(4);
								dataPath = c.getString(5);
								
								if (DBG) {
									Log.d(LCAT,"Image { title: " + title + " displayName: " + displayName + " mimeType: " + mimeType +
										" bucketId: " + bucketId + " bucketDisplayName: " + bucketDisplayName +
										" path: " + dataPath + " }");
								}
							}

						} finally {
							if (c != null) {
								c.close();
								c = null;
							}
						}
					}
					
					String localImageUrl = dataPath;
					
					if (!saveToPhotoGallery) {
						
						// We need to move the image from dataPath to imageUrl
						try {
							URL url = new URL(imageUrl);
							
							File src = new File(dataPath);
							File dst = new File(url.getPath());
							
							BufferedInputStream bis = null;
							BufferedOutputStream bos = null;
							
							try {
								bis = new BufferedInputStream(new FileInputStream(src), 8096);
								bos = new BufferedOutputStream(new FileOutputStream(dst), 8096);
								
								byte[] buf = new byte[8096];
								int len = 0;
								
								while((len = bis.read(buf)) != -1) {
									bos.write(buf, 0, len);
								}

							} finally {
								if (bis != null) {
									bis.close();
								}

								if (bos != null) {
									bos.close();
								}
							}
							
							// Update Content
							ContentValues values = new ContentValues();
							values.put(Images.ImageColumns.BUCKET_ID, imageFile.getPath().toLowerCase().hashCode());
							values.put(Images.ImageColumns.BUCKET_DISPLAY_NAME, imageFile.getName());
							values.put("_data", imageFile.getAbsolutePath());

							activity.getContentResolver().update(data.getData(), values, null, null);

							src.delete();
							localImageUrl = imageUrl; // make sure it's a good URL before setting it to pass back.

						} catch (MalformedURLException e) {
							Log.e(LCAT, "Invalid URL not moving image: " + e.getMessage());

						} catch (IOException e) {
							Log.e(LCAT, "Unable to move file: " + e.getMessage(), e);
						}
					}
					
					try {
						if (successCallback != null) {
							successCallback.callAsync(getKrollObject(), createDictForImage(localImageUrl, "image/jpeg"));
						}

					} catch (OutOfMemoryError e) {
						String msg = "Not enough memory to get image: " + e.getMessage();
						Log.e(LCAT, msg);
						if (errorCallback != null) {
							errorCallback.callAsync(getKrollObject(), createErrorResponse(UNKNOWN_ERROR, msg));
						}
					}
				}
			}
		}

		@Override
		public void onError(Activity activity, int requestCode, Exception e) {
			if (imageFile != null) {
				imageFile.delete();
			}
			String msg = "Camera problem: " + e.getMessage();
			Log.e(LCAT, msg, e);
			if (errorCallback != null) {
				errorCallback.callAsync(getKrollObject(), createErrorResponse(UNKNOWN_ERROR, msg));
			}
		}
	}

	@Kroll.method
	public void openPhotoGallery(KrollDict options)
	{
		KrollFunction successCallback = null;
		KrollFunction cancelCallback = null;
		KrollFunction errorCallback = null;

		if (options.containsKey("success")) {
			successCallback = (KrollFunction) options.get("success");
		}
		if (options.containsKey("cancel")) {
			cancelCallback = (KrollFunction) options.get("cancel");
		}
		if (options.containsKey("error")) {
			errorCallback = (KrollFunction) options.get("error");
		}

		final KrollFunction fSuccessCallback = successCallback;
		final KrollFunction fCancelCallback = cancelCallback;
		final KrollFunction fErrorCallback = errorCallback;

		if (DBG) {
			Log.d(LCAT, "openPhotoGallery called");
		}

		Activity activity = TiApplication.getInstance().getCurrentActivity();
		TiActivitySupport activitySupport = (TiActivitySupport) activity;

		TiIntentWrapper galleryIntent = new TiIntentWrapper(new Intent());
		galleryIntent.getIntent().setAction(Intent.ACTION_PICK);
		galleryIntent.getIntent().setType("image/*");
		galleryIntent.getIntent().addCategory(Intent.CATEGORY_DEFAULT);
		galleryIntent.setWindowId(TiIntentWrapper.createActivityName("GALLERY"));

		final int code = activitySupport.getUniqueResultCode();
		 activitySupport.launchActivityForResult(galleryIntent.getIntent(), code,
			new TiActivityResultHandler() {

				public void onResult(Activity activity, int requestCode, int resultCode, Intent data)
				{
					Log.e(LCAT, "OnResult called: " + resultCode);
					if (resultCode == Activity.RESULT_CANCELED) {
						if (fCancelCallback != null) {
							fCancelCallback.callAsync(getKrollObject(), new Object[0]);
						}

					} else {
						String path = data.getDataString();
						try {
							if (fSuccessCallback != null) {
								fSuccessCallback.callAsync(getKrollObject(), createDictForImage(path, "image/jpeg"));
							}

						} catch (OutOfMemoryError e) {
							String msg = "Not enough memory to get image: " + e.getMessage();
							Log.e(LCAT, msg);
							if (fErrorCallback != null) {
								fErrorCallback.callAsync(getKrollObject(), createErrorResponse(UNKNOWN_ERROR, msg));
							}
						}
					}
				}

				public void onError(Activity activity, int requestCode, Exception e)
				{
					String msg = "Gallery problem: " + e.getMessage();
					Log.e(LCAT, msg, e);
					if (fErrorCallback != null) {
						fErrorCallback.callAsync(getKrollObject(), createErrorResponse(UNKNOWN_ERROR, msg));
					}
				}
			});
	}

	KrollDict createDictForImage(String path, String mimeType) {
		KrollDict d = new KrollDict();

		int width = -1;
		int height = -1;

		try {
			String fpath = path;
			if (!fpath.startsWith("file://") && !fpath.startsWith("content://")) {
				fpath = "file://" + path;
			}
			BitmapFactory.Options opts = new BitmapFactory.Options();
			opts.inJustDecodeBounds = true;
			BitmapFactory.decodeStream(getActivity().getContentResolver().openInputStream(Uri.parse(fpath)),null, opts);
			width = opts.outWidth;
			height = opts.outHeight;
		} catch (FileNotFoundException e) {
			Log.w(LCAT, "bitmap not found: " + path);
		}

		d.put("x", 0);
		d.put("y", 0);
		d.put("width", width);
		d.put("height", height);

		KrollDict cropRect = new KrollDict();
		cropRect.put("x", 0);
		cropRect.put("y", 0);
		cropRect.put("width", width);
		cropRect.put("height", height);
		d.put("cropRect", cropRect);

		String[] parts = { path };
		d.put("mediaType", MEDIA_TYPE_PHOTO);
		d.put("media", TiBlob.blobFromFile(TiFileFactory.createTitaniumFile(parts, false), mimeType));

		return d;
	}

	KrollDict createDictForImage(int width, int height, byte[] data) {
		KrollDict d = new KrollDict();

		d.put("x", 0);
		d.put("y", 0);
		d.put("width", width);
		d.put("height", height);

		KrollDict cropRect = new KrollDict();
		cropRect.put("x", 0);
		cropRect.put("y", 0);
		cropRect.put("width", width);
		cropRect.put("height", height);
		d.put("cropRect", cropRect);
		d.put("mediaType", MEDIA_TYPE_PHOTO);
		d.put("media", TiBlob.blobFromData(data, "image/png"));

		return d;
	}

	/* TODO @Kroll.method
	public void previewImage(KrollInvocation invocation, KrollDict options)
	{
		if (DBG) {
			Log.d(LCAT, "previewImage");
		}

		V8Callback successCallback = null;
		V8Callback errorCallback = null;
		TiBlob image = null;

		if (options.containsKey("success")) {
			successCallback = (V8Callback) options.get("success");
		}
		if (options.containsKey("error")) {
			errorCallback = (V8Callback) options.get("error");
		}
		if (options.containsKey("image")) {
			image = (TiBlob) options.get("image");
		}

		if (image == null) {
			if (errorCallback != null) {
				errorCallback.callAsync(createErrorResponse(UNKNOWN_ERROR, "Missing image property"));
			}
		}

		TiBaseFile f = (TiBaseFile) image.getData();

		final V8Callback fSuccessCallback = successCallback;
		final V8Callback fErrorCallback = errorCallback;

		if (DBG) {
			Log.d(LCAT, "openPhotoGallery called");
		}

		Activity activity = invocation.getTiContext().getActivity();
		TiActivitySupport activitySupport = (TiActivitySupport) activity;

		TiIntentWrapper previewIntent = new TiIntentWrapper(new Intent());
		previewIntent.getIntent().setAction(Intent.ACTION_VIEW);
		previewIntent.getIntent().setType(image.getMimeType());
		previewIntent.getIntent().setData(Uri.parse(f.nativePath()));
		previewIntent.setWindowId(TiIntentWrapper.createActivityName("PREVIEW"));

		final int code = activitySupport.getUniqueResultCode();
		 activitySupport.launchActivityForResult(previewIntent.getIntent(), code,
			new TiActivityResultHandler() {

				public void onResult(Activity activity, int requestCode, int resultCode, Intent data)
				{
					Log.e(LCAT, "OnResult called: " + resultCode);
					if (fSuccessCallback != null) {
						fSuccessCallback.callAsync();
					}
				}

				public void onError(Activity activity, int requestCode, Exception e)
				{
					String msg = "Gallery problem: " + e.getMessage();
					Log.e(LCAT, msg, e);
					if (fErrorCallback != null) {
						fErrorCallback.callAsync(createErrorResponse(UNKNOWN_ERROR, msg));
					}
				}
			});
	}

	@Kroll.method
	public void takeScreenshot(V8Callback callback)
	{
		Activity a = getTiContext().getActivity();
		while (a.getParent() != null) {
			a = a.getParent();
		}

		Window w = a.getWindow();

		while (w.getContainer() != null) {
			w = w.getContainer();
		}

		KrollDict image = TiUIHelper.viewToImage(getTiContext(), null, w.getDecorView());
		if (callback != null && image != null) {
			callback.callAsync(new Object[] { image });
		}
	}*/

	@Kroll.method
	public void takePicture()
	{
		// make sure the preview / camera are open before trying to take photo
		if (TiCameraActivity.cameraActivity != null) {
			TiCameraActivity.takePicture();
		} else {
			Log.e(LCAT, "camera preview is not open, unable to take photo");
		}
	}
}

