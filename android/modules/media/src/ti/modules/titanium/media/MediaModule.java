/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.Date;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.ContextSpecific;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiActivityResultHandler;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiIntentWrapper;
import org.appcelerator.titanium.util.TiUIHelper;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.hardware.Camera;
import android.net.Uri;
import android.os.Vibrator;
import android.provider.MediaStore;
import android.provider.MediaStore.Images;
import android.view.Window;

@Kroll.module @ContextSpecific
public class MediaModule extends KrollModule
{
	private static final String LCAT = "TiMedia";
	private static final boolean DBG = TiConfig.LOGD;

	private static final long[] DEFAULT_VIBRATE_PATTERN = { 100L,250L };
	private static final String PHOTO_DCIM_CAMERA = "/sdcard/dcim/Camera";

	@Kroll.constant public static final int UNKNOWN_ERROR = 0;
	@Kroll.constant public static final int DEVICE_BUSY = 1;
	@Kroll.constant public static final int NO_CAMERA = 2;
	@Kroll.constant public static final int NO_VIDEO = 3;

	@Kroll.constant public static final int VIDEO_SCALING_ASPECT_FILL = 0;
	@Kroll.constant public static final int VIDEO_SCALING_MODE_FILL = 1;

	@Kroll.constant public static final int VIDEO_CONTROL_DEFAULT = 0;
	
	public MediaModule(TiContext tiContext)
	{
		super(tiContext);
	}

	@Kroll.method
	public void vibrate(@Kroll.argument(optional=true) long[] pattern)
	{
		if (pattern.length == 0) {
			pattern = DEFAULT_VIBRATE_PATTERN;
		}
		Vibrator vibrator = (Vibrator) getTiContext().getTiApp().getSystemService(Context.VIBRATOR_SERVICE);
		if (vibrator != null) {
			vibrator.vibrate(pattern, -1);
		}
	}

	@Kroll.method
	public void showCamera(KrollDict options)
	{
		KrollCallback successCallback = null;
		KrollCallback cancelCallback = null;
		KrollCallback errorCallback = null;

		if (options.containsKey("success")) {
			successCallback = (KrollCallback) options.get("success");
		}
		if (options.containsKey("cancel")) {
			cancelCallback = (KrollCallback) options.get("cancel");
		}
		if (options.containsKey("error")) {
			errorCallback = (KrollCallback) options.get("error");
		}

		final KrollCallback fSuccessCallback = successCallback;
		final KrollCallback fCancelCallback = cancelCallback;
		final KrollCallback fErrorCallback = errorCallback;

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
				errorCallback.call(createErrorResponse(NO_CAMERA, "Camera not available."));
			}
			return;
		}

		boolean saveToPhotoGallery = false;
		if (options.containsKey("saveToPhotoGallery")) {
			saveToPhotoGallery = options.getBoolean("saveToPhotoGallery");
		}

		Activity activity = getTiContext().getActivity();
		TiActivitySupport activitySupport = (TiActivitySupport) activity;

		TiFileHelper tfh = getTiContext().getTiFileHelper();

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
					String name = getTiContext().getTiApp().getAppInfo().getName();
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
			if (errorCallback != null) {
				errorCallback.call(createErrorResponse(UNKNOWN_ERROR, e.getMessage()));
			}
			return;
		}

		final File finalImageFile = imageFile;
		final String imageUrl = "file://" + imageFile.getAbsolutePath();

		TiIntentWrapper cameraIntent = new TiIntentWrapper(new Intent());
		cameraIntent.getIntent().setAction(MediaStore.ACTION_IMAGE_CAPTURE);
		cameraIntent.getIntent().putExtra(MediaStore.EXTRA_OUTPUT, Uri.parse(imageUrl));
		cameraIntent.getIntent().addCategory(Intent.CATEGORY_DEFAULT);
		cameraIntent.setWindowId(TiIntentWrapper.createActivityName("CAMERA"));

		final int code = activitySupport.getUniqueResultCode();
		final boolean finalSaveToPhotoGallery = saveToPhotoGallery;

		activitySupport.launchActivityForResult(cameraIntent.getIntent(), code,
			new TiActivityResultHandler() {

				public void onResult(Activity activity, int requestCode, int resultCode, Intent data)
				{
					if (resultCode == Activity.RESULT_CANCELED) {
						if (finalImageFile != null) {
							finalImageFile.delete();
						}
						if (fCancelCallback != null) {
							fCancelCallback.call();
						}
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

						try {
							if (fSuccessCallback != null) {
								fSuccessCallback.call(createDictForImage(imageUri.toString(), "image/jpeg"));
							}
						} catch (OutOfMemoryError e) {
							String msg = "Not enough memory to get image: " + e.getMessage();
							Log.e(LCAT, msg);
							if (fErrorCallback != null) {
								fErrorCallback.call(createErrorResponse(UNKNOWN_ERROR, msg));
							}
						}
					}
				}

				public void onError(Activity activity, int requestCode, Exception e) {
					if (finalImageFile != null) {
						finalImageFile.delete();
					}
					String msg = "Camera problem: " + e.getMessage();
					Log.e(LCAT, msg, e);
					if (fErrorCallback != null) {
						fErrorCallback.call(createErrorResponse(UNKNOWN_ERROR, msg));
					}
				}
			});
	}

	@Kroll.method
	public void openPhotoGallery(KrollDict options)
	{
		KrollCallback successCallback = null;
		KrollCallback cancelCallback = null;
		KrollCallback errorCallback = null;

		if (options.containsKey("success")) {
			successCallback = (KrollCallback) options.get("success");
		}
		if (options.containsKey("cancel")) {
			cancelCallback = (KrollCallback) options.get("cancel");
		}
		if (options.containsKey("error")) {
			errorCallback = (KrollCallback) options.get("error");
		}

		final KrollCallback fSuccessCallback = successCallback;
		final KrollCallback fCancelCallback = cancelCallback;
		final KrollCallback fErrorCallback = errorCallback;

		if (DBG) {
			Log.d(LCAT, "openPhotoGallery called");
		}

		Activity activity = getTiContext().getActivity();
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
							fCancelCallback.call();
						}
					} else {
						String path = data.getDataString();
						try {
							if (fSuccessCallback != null) {
								fSuccessCallback.call(createDictForImage(path, "image/jpeg"));
							}
						} catch (OutOfMemoryError e) {
							String msg = "Not enough memory to get image: " + e.getMessage();
							Log.e(LCAT, msg);
							if (fErrorCallback != null) {
								fErrorCallback.call(createErrorResponse(UNKNOWN_ERROR, msg));
							}
						}
					}
				}

				public void onError(Activity activity, int requestCode, Exception e)
				{
					String msg = "Gallery problem: " + e.getMessage();
					Log.e(LCAT, msg, e);
					if (fErrorCallback != null) {
						fErrorCallback.call(createErrorResponse(UNKNOWN_ERROR, msg));
					}
				}
			});
	}

	@Kroll.method
	public void saveToPhotoGallery(Object object)
	{
		Log.w(LCAT, "saveToPhotoGallery not yet implemented in Android");
	}

	KrollDict createDictForImage(String path, String mimeType) {
		KrollDict d = new KrollDict();

		int width = -1;
		int height = -1;

		try {
			Bitmap b = BitmapFactory.decodeStream(getTiContext().getActivity().getContentResolver().openInputStream(Uri.parse(path)));
			if (b != null) {
				width = b.getWidth();
				height = b.getHeight();
				b.recycle();
				b = null;
			}
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
		d.put("media", TiBlob.blobFromFile(getTiContext(), TiFileFactory.createTitaniumFile(getTiContext(), parts, false), mimeType));

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

		d.put("media", TiBlob.blobFromData(getTiContext(), data, "image/png"));

		return d;
	}

	@Kroll.method
	public void previewImage(KrollDict options)
	{
		if (DBG) {
			Log.d(LCAT, "previewImage");
		}

		KrollCallback successCallback = null;
		KrollCallback errorCallback = null;
		TiBlob image = null;

		if (options.containsKey("success")) {
			successCallback = (KrollCallback) options.get("success");
		}
		if (options.containsKey("error")) {
			errorCallback = (KrollCallback) options.get("error");
		}
		if (options.containsKey("image")) {
			image = (TiBlob) options.get("image");
		}

		if (image == null) {
			if (errorCallback != null) {
				errorCallback.call(createErrorResponse(UNKNOWN_ERROR, "Missing image property"));
			}
		}

		TiBaseFile f = (TiBaseFile) image.getData();

		final KrollCallback fSuccessCallback = successCallback;
		final KrollCallback fErrorCallback = errorCallback;

		if (DBG) {
			Log.d(LCAT, "openPhotoGallery called");
		}

		Activity activity = getTiContext().getActivity();
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
						fSuccessCallback.call();
					}
				}

				public void onError(Activity activity, int requestCode, Exception e)
				{
					String msg = "Gallery problem: " + e.getMessage();
					Log.e(LCAT, msg, e);
					if (fErrorCallback != null) {
						fErrorCallback.call(createErrorResponse(UNKNOWN_ERROR, msg));
					}
				}
			});
	}

	@Kroll.method
	public void takeScreenshot(KrollCallback callback)
	{
		Activity a = getTiContext().getActivity();
		while (a.getParent() != null) {
			a = a.getParent();
		}

		Window w = a.getWindow();

		while (w.getContainer() != null) {
			w = w.getContainer();
		}

		KrollDict image = TiUIHelper.viewToImage(getTiContext(), w.getDecorView());
		if (callback != null && image != null) {
			callback.call(new Object[] { image });
		}
	}

	@Override
	public void onDestroy() {
		super.onDestroy();
	}

	@Override
	public void onPause() {
		super.onPause();
	}

	@Override
	public void onResume() {
		super.onResume();
	}
}
