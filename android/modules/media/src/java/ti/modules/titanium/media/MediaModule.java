/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.util.TiTempFileHelper;
import org.appcelerator.titanium.ContextSpecific;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiFileProxy;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.io.TiFileProvider;
import org.appcelerator.titanium.io.TitaniumBlob;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiActivityResultHandler;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiIntentWrapper;
import org.appcelerator.titanium.util.TiMimeTypeHelper;
import org.appcelerator.titanium.util.TiUIHelper;

import android.Manifest;
import android.app.Activity;
import android.content.ClipData;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.hardware.Camera;
import android.hardware.Camera.CameraInfo;
import android.media.CamcorderProfile;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Message;
import android.os.Vibrator;
import android.provider.MediaStore;
import android.view.Window;

@SuppressWarnings("deprecation")
@Kroll.module
@ContextSpecific
public class MediaModule extends KrollModule implements Handler.Callback
{
	private static final String TAG = "TiMedia";

	private static final long[] DEFAULT_VIBRATE_PATTERN = { 100L, 250L };

	// The mode FOCUS_MODE_CONTINUOUS_PICTURE is added in API 14
	protected static final String FOCUS_MODE_CONTINUOUS_PICTURE = "continuous-picture";
	protected static final String PROP_AUTOHIDE = "autohide";
	protected static final String PROP_AUTOSAVE = "saveToPhotoGallery";
	protected static final String PROP_OVERLAY = "overlay";

	@Kroll.constant
	public static final int UNKNOWN_ERROR = -1;
	@Kroll.constant
	public static final int NO_ERROR = 0;
	@Kroll.constant
	public static final int DEVICE_BUSY = 1;
	@Kroll.constant
	public static final int NO_CAMERA = 2;
	@Kroll.constant
	public static final int NO_VIDEO = 3;

	@Kroll.constant
	public static final int VIDEO_SCALING_NONE = 0;
	@Kroll.constant
	public static final int VIDEO_SCALING_ASPECT_FILL = 1;
	@Kroll.constant
	public static final int VIDEO_SCALING_ASPECT_FIT = 2;
	@Kroll.constant
	public static final int VIDEO_SCALING_MODE_FILL = 3;
	@Kroll.constant
	public static final int VIDEO_SCALING_RESIZE = 4;
	@Kroll.constant
	public static final int VIDEO_SCALING_RESIZE_ASPECT = 5;
	@Kroll.constant
	public static final int VIDEO_SCALING_RESIZE_ASPECT_FILL = 6;

	@Kroll.constant
	public static final int VIDEO_CONTROL_DEFAULT = 0;
	@Kroll.constant
	public static final int VIDEO_CONTROL_EMBEDDED = 1;
	@Kroll.constant
	public static final int VIDEO_CONTROL_FULLSCREEN = 2;
	@Kroll.constant
	public static final int VIDEO_CONTROL_NONE = 3;
	@Kroll.constant
	public static final int VIDEO_CONTROL_HIDDEN = 4;

	@Kroll.constant
	public static final int VIDEO_LOAD_STATE_UNKNOWN = 0;
	@Kroll.constant
	public static final int VIDEO_LOAD_STATE_PLAYABLE = 1 << 0;
	@Kroll.constant
	public static final int VIDEO_LOAD_STATE_PLAYTHROUGH_OK = 1 << 1;
	@Kroll.constant
	public static final int VIDEO_LOAD_STATE_STALLED = 1 << 2;

	@Kroll.constant
	public static final int VIDEO_PLAYBACK_STATE_STOPPED = 0;
	@Kroll.constant
	public static final int VIDEO_PLAYBACK_STATE_PLAYING = 1;
	@Kroll.constant
	public static final int VIDEO_PLAYBACK_STATE_PAUSED = 2;
	@Kroll.constant
	public static final int VIDEO_PLAYBACK_STATE_INTERRUPTED = 3;
	@Kroll.constant
	public static final int VIDEO_PLAYBACK_STATE_SEEKING_FORWARD = 4;
	@Kroll.constant
	public static final int VIDEO_PLAYBACK_STATE_SEEKING_BACKWARD = 5;

	@Kroll.constant
	public static final int QUALITY_LOW = CamcorderProfile.QUALITY_LOW;
	@Kroll.constant
	public static final int QUALITY_HIGH = CamcorderProfile.QUALITY_HIGH;
	@Kroll.constant
	public static final int QUALITY_640x480 = CamcorderProfile.QUALITY_480P;
	@Kroll.constant
	public static final int QUALITY_IFRAME_1280x720 = CamcorderProfile.QUALITY_720P;

	@Kroll.constant
	public static final int VIDEO_FINISH_REASON_PLAYBACK_ENDED = 0;
	@Kroll.constant
	public static final int VIDEO_FINISH_REASON_PLAYBACK_ERROR = 1;
	@Kroll.constant
	public static final int VIDEO_FINISH_REASON_USER_EXITED = 2;

	@Kroll.constant
	public static final int VIDEO_REPEAT_MODE_NONE = 0;
	@Kroll.constant
	public static final int VIDEO_REPEAT_MODE_ONE = 1;

	@Kroll.constant
	public static final int VIDEO_TIME_OPTION_NEAREST_KEYFRAME = MediaMetadataRetriever.OPTION_CLOSEST;
	@Kroll.constant
	public static final int VIDEO_TIME_OPTION_CLOSEST_SYNC = MediaMetadataRetriever.OPTION_CLOSEST_SYNC;
	@Kroll.constant
	public static final int VIDEO_TIME_OPTION_NEXT_SYNC = MediaMetadataRetriever.OPTION_NEXT_SYNC;
	@Kroll.constant
	public static final int VIDEO_TIME_OPTION_PREVIOUS_SYNC = MediaMetadataRetriever.OPTION_PREVIOUS_SYNC;

	@Kroll.constant
	public static final String MEDIA_TYPE_LIVEPHOTO = "com.apple.live-photo";
	@Kroll.constant
	public static final String MEDIA_TYPE_PHOTO = "public.image";
	@Kroll.constant
	public static final String MEDIA_TYPE_VIDEO = "public.video";

	@Kroll.constant
	public static final int CAMERA_FRONT = 0;
	@Kroll.constant
	public static final int CAMERA_REAR = 1;
	@Kroll.constant
	public static final int CAMERA_FLASH_OFF = 0;
	@Kroll.constant
	public static final int CAMERA_FLASH_ON = 1;
	@Kroll.constant
	public static final int CAMERA_FLASH_AUTO = 2;

	@Kroll.constant
	public static final int AUDIO_STATE_BUFFERING = 0; // current playback is in the buffering from the network state
	@Kroll.constant
	public static final int AUDIO_STATE_INITIALIZED = 1; // current playback is in the initialization state
	@Kroll.constant
	public static final int AUDIO_STATE_PAUSED = 2; // current playback is in the paused state
	@Kroll.constant
	public static final int AUDIO_STATE_PLAYING = 3; // current playback is in the playing state
	@Kroll.constant
	public static final int AUDIO_STATE_STARTING = 4; // current playback is in the starting playback state
	@Kroll.constant
	public static final int AUDIO_STATE_STOPPED = 5; // current playback is in the stopped state
	@Kroll.constant
	public static final int AUDIO_STATE_STOPPING = 6; // current playback is in the stopping state
	@Kroll.constant
	public static final int AUDIO_STATE_WAITING_FOR_DATA =
		7; // current playback is in the waiting for audio data from the network state
	@Kroll.constant
	public static final int AUDIO_STATE_WAITING_FOR_QUEUE =
		8; //  current playback is in the waiting for audio data to fill the queue state

	private static String mediaType = MEDIA_TYPE_PHOTO;
	private static String extension = ".jpg";

	private static ContentResolver contentResolver;
	private TiTempFileHelper tempFileHelper;

	private static final String MIME_IMAGE = "image/*";

	private static class ApiLevel16
	{
		private ApiLevel16()
		{
		}

		public static void setIntentClipData(Intent intent, ClipData data)
		{
			if (intent != null) {
				intent.setClipData(data);
			}
		}
	}

	public MediaModule()
	{
		super();

		if (contentResolver == null) {
			contentResolver = TiApplication.getInstance().getContentResolver();
		}
		tempFileHelper = new TiTempFileHelper(TiApplication.getInstance());
	}

	@Kroll.method
	public void vibrate(@Kroll.argument(optional = true) long[] pattern)
	{
		if ((pattern == null) || (pattern.length == 0)) {
			pattern = DEFAULT_VIBRATE_PATTERN;
		}
		Vibrator vibrator = (Vibrator) TiApplication.getInstance().getSystemService(Context.VIBRATOR_SERVICE);
		if (vibrator != null) {
			vibrator.vibrate(pattern, -1);
		}
	}

	static public Uri getMediaUriFrom(File file)
	{
		final String externalStorageDir = Environment.getExternalStorageDirectory().getPath();
		final String dir = file.getParent();
		final String relativePath = dir.replace(externalStorageDir, "").substring(1) + "/";

		// Obtain media from external storage.
		if (dir.startsWith(externalStorageDir)
			&& !relativePath.startsWith("Android/data/" + TiApplication.getInstance().getPackageName())) {
			final boolean isMovie = relativePath.startsWith(Environment.DIRECTORY_MOVIES);

			// Attempt to find existing media.
			final String[] projection =
				new String[] { MediaStore.MediaColumns._ID, MediaStore.MediaColumns.DISPLAY_NAME,
							  MediaStore.MediaColumns.RELATIVE_PATH };
			final Uri contentUri =
				isMovie ? MediaStore.Video.Media.EXTERNAL_CONTENT_URI : MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
			try (Cursor cursor = contentResolver.query(contentUri, projection, null, null, null)) {
				final int idColumn = cursor.getColumnIndex(projection[0]);
				final int nameColumn = cursor.getColumnIndex(projection[1]);
				final int pathColumn = cursor.getColumnIndex(projection[2]);

				while (cursor.moveToNext()) {
					final long id = cursor.getLong(idColumn);
					final String name = cursor.getString(nameColumn);
					final String path = cursor.getString(pathColumn);

					if (relativePath.equals(path) && name.equals(file.getName())) {

						// Found existing media, return uri.
						return ContentUris.withAppendedId(contentUri, id);
					}
				}

				// Could not find media, create new one.
				final ContentValues values = new ContentValues();
				values.put(MediaStore.MediaColumns.DISPLAY_NAME, file.getName());
				values.put(MediaStore.MediaColumns.RELATIVE_PATH, relativePath);
				return contentResolver.insert(contentUri, values);
			} catch (Exception e) {
				// Do nothing...
			}
		}

		// Return uri from our file provider.
		return TiFileProvider.createUriFrom(file);
	}

	private void launchNativeCamera(KrollDict cameraOptions)
	{
		KrollFunction successCallback = null;
		KrollFunction cancelCallback = null;
		KrollFunction errorCallback = null;
		boolean saveToPhotoGallery = false;
		String[] mediaTypes = null;
		String intentType = MediaStore.ACTION_IMAGE_CAPTURE;
		int videoMaximumDuration = 0;
		int videoQuality = QUALITY_HIGH;
		int cameraType = 0;

		if (cameraOptions.containsKeyAndNotNull(TiC.PROPERTY_SUCCESS)) {
			successCallback = (KrollFunction) cameraOptions.get(TiC.PROPERTY_SUCCESS);
		}
		if (cameraOptions.containsKeyAndNotNull(TiC.PROPERTY_CANCEL)) {
			cancelCallback = (KrollFunction) cameraOptions.get(TiC.PROPERTY_CANCEL);
		}
		if (cameraOptions.containsKeyAndNotNull(TiC.EVENT_ERROR)) {
			errorCallback = (KrollFunction) cameraOptions.get(TiC.EVENT_ERROR);
		}
		if (cameraOptions.containsKeyAndNotNull("saveToPhotoGallery")) {
			saveToPhotoGallery = cameraOptions.getBoolean("saveToPhotoGallery");
		}
		if (cameraOptions.containsKeyAndNotNull(TiC.PROPERTY_VIDEO_MAX_DURATION)) {
			videoMaximumDuration = cameraOptions.getInt(TiC.PROPERTY_VIDEO_MAX_DURATION) / 1000;
		}
		if (cameraOptions.containsKeyAndNotNull(TiC.PROPERTY_WHICH_CAMERA)) {
			cameraType = cameraOptions.getInt(TiC.PROPERTY_WHICH_CAMERA);
		}
		if (cameraOptions.containsKeyAndNotNull(TiC.PROPERTY_VIDEO_QUALITY)) {
			videoQuality = cameraOptions.getInt(TiC.PROPERTY_VIDEO_QUALITY);
		}
		if (cameraOptions.containsKeyAndNotNull(TiC.PROPERTY_MEDIA_TYPES)) {
			mediaTypes = cameraOptions.getStringArray(TiC.PROPERTY_MEDIA_TYPES);
			if (Arrays.asList(mediaTypes).contains(MEDIA_TYPE_VIDEO)) {
				mediaType = MEDIA_TYPE_VIDEO;
				intentType = MediaStore.ACTION_VIDEO_CAPTURE;
				extension = ".mp4";
			} else {
				mediaType = MEDIA_TYPE_PHOTO;
				intentType = MediaStore.ACTION_IMAGE_CAPTURE;
				extension = ".jpg";
			}
		}
		final String mediaDirectory =
			mediaType.equals(MEDIA_TYPE_VIDEO) ? Environment.DIRECTORY_MOVIES : Environment.DIRECTORY_PICTURES;
		final File mediaFile = MediaModule.createExternalStorageFile(extension, mediaDirectory, saveToPhotoGallery);

		//Sanity Checks
		if (mediaFile == null) {
			if (errorCallback != null) {
				KrollDict response = new KrollDict();
				response.putCodeAndMessage(NO_CAMERA, "Unable to create file for storage");
				errorCallback.callAsync(getKrollObject(), response);
			}
			return;
		}

		if (getIsCameraSupported() == false) {
			if (errorCallback != null) {
				KrollDict response = new KrollDict();
				response.putCodeAndMessage(UNKNOWN_ERROR, "Camera Not Supported");
				errorCallback.callAsync(getKrollObject(), response);
			}
			Log.e(TAG, "Camera not supported");
			mediaFile.delete();
			return;
		}

		//Create Intent
		final Uri fileUri = getMediaUriFrom(mediaFile);
		Intent intent = new Intent(intentType);
		intent.setFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
		if (Build.VERSION.SDK_INT >= 16) {
			ApiLevel16.setIntentClipData(intent, android.content.ClipData.newRawUri("", fileUri));
		}
		intent.putExtra(MediaStore.EXTRA_OUTPUT, fileUri);
		intent.putExtra(MediaStore.EXTRA_VIDEO_QUALITY, videoQuality);
		intent.putExtra("android.intent.extras.CAMERA_FACING", cameraType);

		if (videoMaximumDuration > 0) {
			intent.putExtra(MediaStore.EXTRA_DURATION_LIMIT, videoMaximumDuration);
		}

		//Setup CameraResultHandler
		Activity activity = TiApplication.getInstance().getCurrentActivity();

		CameraResultHandler resultHandler = new CameraResultHandler();
		resultHandler.mediaFile = mediaFile;
		resultHandler.successCallback = successCallback;
		resultHandler.errorCallback = errorCallback;
		resultHandler.cancelCallback = cancelCallback;
		resultHandler.cameraIntent = intent;
		resultHandler.saveToPhotoGallery = saveToPhotoGallery;
		resultHandler.activitySupport = (TiActivitySupport) activity;
		resultHandler.intentType = intentType;
		activity.runOnUiThread(resultHandler);
	}

	private void launchCameraActivity(KrollDict cameraOptions, TiViewProxy overLayProxy)
	{
		KrollFunction successCallback = null;
		KrollFunction cancelCallback = null;
		KrollFunction errorCallback = null;
		KrollFunction androidbackCallback = null;
		boolean saveToPhotoGallery = false;
		boolean autohide = true;
		int videoMaximumDuration = 0;
		int videoQuality = QUALITY_HIGH;
		int cameraType = 0;
		String[] mediaTypes = null;
		int flashMode = CAMERA_FLASH_OFF;
		int whichCamera = CAMERA_REAR;

		if (cameraOptions.containsKeyAndNotNull(TiC.PROPERTY_SUCCESS)) {
			successCallback = (KrollFunction) cameraOptions.get(TiC.PROPERTY_SUCCESS);
		}
		if (cameraOptions.containsKeyAndNotNull(TiC.PROPERTY_CANCEL)) {
			cancelCallback = (KrollFunction) cameraOptions.get(TiC.PROPERTY_CANCEL);
		}
		if (cameraOptions.containsKeyAndNotNull(TiC.EVENT_ERROR)) {
			errorCallback = (KrollFunction) cameraOptions.get(TiC.EVENT_ERROR);
		}
		if (cameraOptions.containsKeyAndNotNull(TiC.EVENT_ANDROID_BACK)) {
			androidbackCallback = (KrollFunction) cameraOptions.get(TiC.EVENT_ANDROID_BACK);
		}
		if (cameraOptions.containsKeyAndNotNull(PROP_AUTOSAVE)) {
			saveToPhotoGallery = cameraOptions.getBoolean(PROP_AUTOSAVE);
		}
		if (cameraOptions.containsKeyAndNotNull(PROP_AUTOHIDE)) {
			autohide = cameraOptions.getBoolean(PROP_AUTOHIDE);
		}
		if (cameraOptions.containsKeyAndNotNull(TiC.PROPERTY_CAMERA_FLASH_MODE)) {
			flashMode = cameraOptions.getInt(TiC.PROPERTY_CAMERA_FLASH_MODE);
		}
		if (cameraOptions.containsKeyAndNotNull(TiC.PROPERTY_WHICH_CAMERA)) {
			whichCamera = cameraOptions.getInt(TiC.PROPERTY_WHICH_CAMERA);
		}

		// VIDEO
		if (cameraOptions.containsKeyAndNotNull(TiC.PROPERTY_VIDEO_MAX_DURATION)) {
			videoMaximumDuration = cameraOptions.getInt(TiC.PROPERTY_VIDEO_MAX_DURATION);
		}
		if (cameraOptions.containsKeyAndNotNull(TiC.PROPERTY_WHICH_CAMERA)) {
			cameraType = cameraOptions.getInt(TiC.PROPERTY_WHICH_CAMERA);
		}
		if (cameraOptions.containsKeyAndNotNull(TiC.PROPERTY_VIDEO_QUALITY)) {
			videoQuality = cameraOptions.getInt(TiC.PROPERTY_VIDEO_QUALITY);
		}
		if (cameraOptions.containsKeyAndNotNull(TiC.PROPERTY_MEDIA_TYPES)) {
			mediaTypes = cameraOptions.getStringArray(TiC.PROPERTY_MEDIA_TYPES);
			if (Arrays.asList(mediaTypes).contains(MEDIA_TYPE_VIDEO)) {
				mediaType = MEDIA_TYPE_VIDEO;
				extension = ".mp4";
			} else {
				mediaType = MEDIA_TYPE_PHOTO;
				extension = ".jpg";
			}
		}

		TiCameraActivity.callbackContext = getKrollObject();
		TiCameraActivity.mediaContext = this;
		TiCameraActivity.successCallback = successCallback;
		TiCameraActivity.cancelCallback = cancelCallback;
		TiCameraActivity.errorCallback = errorCallback;
		TiCameraActivity.androidbackCallback = androidbackCallback;
		TiCameraActivity.saveToPhotoGallery = saveToPhotoGallery;
		TiCameraActivity.autohide = autohide;
		TiCameraActivity.overlayProxy = overLayProxy;
		TiCameraActivity.whichCamera = whichCamera;
		TiCameraActivity.videoQuality = videoQuality;
		TiCameraActivity.videoMaximumDuration = videoMaximumDuration;
		TiCameraActivity.mediaType = mediaType;
		TiCameraActivity.setFlashMode(flashMode);

		//Create Intent and Launch
		Activity activity = TiApplication.getInstance().getCurrentActivity();
		Intent intent = new Intent(activity, TiCameraActivity.class);
		activity.startActivity(intent);
	}

	@Kroll.method
	public boolean hasCameraPermissions()
	{
		if (Build.VERSION.SDK_INT < 23) {
			return true;
		}
		Context context = TiApplication.getInstance().getApplicationContext();
		if (context.checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
			&& context.checkSelfPermission(Manifest.permission.READ_EXTERNAL_STORAGE)
				   == PackageManager.PERMISSION_GRANTED
			&& context.checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)
				   == PackageManager.PERMISSION_GRANTED) {
			return true;
		}
		return false;
	}

	@Kroll.method
	public boolean hasAudioRecorderPermissions()
	{
		if (Build.VERSION.SDK_INT < 23) {
			return true;
		}
		Context context = TiApplication.getInstance().getApplicationContext();
		if (context.checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
			return true;
		}
		return false;
	}

	private boolean hasCameraPermission()
	{
		if (Build.VERSION.SDK_INT < 23) {
			return true;
		}
		Context context = TiApplication.getInstance().getApplicationContext();
		if (context.checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
			return true;
		}
		return false;
	}

	private boolean hasStoragePermission()
	{
		if (Build.VERSION.SDK_INT < 23) {
			return true;
		}
		Context context = TiApplication.getInstance().getApplicationContext();

		return (context.checkSelfPermission(Manifest.permission.READ_EXTERNAL_STORAGE)
					== PackageManager.PERMISSION_GRANTED
				&& context.checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)
					   == PackageManager.PERMISSION_GRANTED);
	}

	@SuppressWarnings("unchecked")
	@Kroll.method
	public void showCamera(@SuppressWarnings("rawtypes") HashMap options)
	{
		if (!hasCameraPermissions()) {
			return;
		}
		KrollDict cameraOptions = null;
		if ((options == null) || !(options instanceof HashMap<?, ?>)) {
			if (Log.isDebugModeEnabled()) {
				Log.d(TAG, "showCamera called with invalid options", Log.DEBUG_MODE);
			}
			return;
		} else {
			cameraOptions = new KrollDict(options);
		}

		Object overlay = cameraOptions.get(PROP_OVERLAY);

		if ((overlay != null) && (overlay instanceof TiViewProxy)) {
			launchCameraActivity(cameraOptions, (TiViewProxy) overlay);
		} else {
			launchNativeCamera(cameraOptions);
		}
	}

	@Kroll.method
	public void requestCameraPermissions(@Kroll.argument(optional = true) KrollFunction permissionCallback)
	{
		if (hasCameraPermissions()) {
			KrollDict response = new KrollDict();
			response.putCodeAndMessage(0, null);
			permissionCallback.callAsync(getKrollObject(), response);
			return;
		}

		String[] permissions = null;
		if (!hasCameraPermission() && !hasStoragePermission()) {
			permissions = new String[] { Manifest.permission.CAMERA, Manifest.permission.READ_EXTERNAL_STORAGE,
										Manifest.permission.WRITE_EXTERNAL_STORAGE };
		} else if (!hasCameraPermission()) {
			permissions = new String[] { Manifest.permission.CAMERA };
		} else {
			permissions =
				new String[] { Manifest.permission.READ_EXTERNAL_STORAGE, Manifest.permission.WRITE_EXTERNAL_STORAGE };
		}

		TiBaseActivity.registerPermissionRequestCallback(TiC.PERMISSION_CODE_CAMERA, permissionCallback,
														 getKrollObject());
		Activity currentActivity = TiApplication.getInstance().getCurrentActivity();
		currentActivity.requestPermissions(permissions, TiC.PERMISSION_CODE_CAMERA);
	}

	@Kroll.method
	public void requestAudioRecorderPermissions(@Kroll.argument(optional = true) KrollFunction permissionCallback)
	{
		if (hasAudioRecorderPermissions()) {
			KrollDict response = new KrollDict();
			response.putCodeAndMessage(0, null);
			permissionCallback.callAsync(getKrollObject(), response);
			return;
		}
		String[] permissions = new String[] { Manifest.permission.RECORD_AUDIO };
		TiBaseActivity.registerPermissionRequestCallback(TiC.PERMISSION_CODE_MICROPHONE, permissionCallback,
														 getKrollObject());
		Activity currentActivity = TiApplication.getInstance().getCurrentActivity();
		currentActivity.requestPermissions(permissions, TiC.PERMISSION_CODE_MICROPHONE);
	}

	/*
	 * Current implementation on Android limited to saving Images only to photo gallery
	 */
	@SuppressWarnings({ "unchecked", "rawtypes" })
	@Kroll.method
	public void saveToPhotoGallery(Object arg, @Kroll.argument(optional = true) HashMap callbackargs)
	{
		KrollFunction successCallback = null;
		KrollFunction errorCallback = null;

		KrollDict callbackDict = null;

		//Check for callbacks
		if (callbackargs != null) {
			callbackDict = new KrollDict(callbackargs);
			if (callbackDict.containsKeyAndNotNull(TiC.PROPERTY_SUCCESS)) {
				successCallback = (KrollFunction) callbackDict.get(TiC.PROPERTY_SUCCESS);
			}
			if (callbackDict.containsKeyAndNotNull(TiC.EVENT_ERROR)) {
				errorCallback = (KrollFunction) callbackDict.get(TiC.EVENT_ERROR);
			}
		}

		//Validate arguments
		boolean validType = ((arg instanceof TiBlob) || (arg instanceof TiFileProxy));
		if (!validType) {
			if (errorCallback != null) {
				KrollDict response = new KrollDict();
				response.putCodeAndMessage(UNKNOWN_ERROR, "Invalid type passed as argument");
				errorCallback.callAsync(getKrollObject(), response);
			}
			return;
		}

		TiBlob blob = null;
		try {
			//Make sure our processing argument is a Blob
			if (arg instanceof TiFileProxy) {
				blob = TiBlob.blobFromFile(((TiFileProxy) arg).getBaseFile());
			} else {
				blob = (TiBlob) arg;
			}

			boolean isVideo = blob.getMimeType().startsWith("video");
			if (((blob.getWidth() == 0) || (blob.getHeight() == 0)) && !isVideo) {
				if (errorCallback != null) {
					KrollDict response = new KrollDict();
					response.putCodeAndMessage(UNKNOWN_ERROR, "Could not decode bitmap from argument");
					errorCallback.callAsync(getKrollObject(), response);
				}
				return;
			}

			if (blob.getType() == TiBlob.TYPE_IMAGE) {
				Bitmap image = blob.getImage();
				if (image.hasAlpha()) {
					extension = ".png";
				} else {
					extension = ".jpg";
				}
			} else {
				try {
					String mimetype = blob.getMimeType();
					extension =
						'.' + TiMimeTypeHelper.getFileExtensionFromMimeType(mimetype, isVideo ? ".mp4" : ".jpg");
				} catch (Throwable t) {
					extension = null;
				}
			}
			final String mediaDirectory =
				mediaType.equals(MEDIA_TYPE_VIDEO) ? Environment.DIRECTORY_MOVIES : Environment.DIRECTORY_PICTURES;
			final File file = MediaModule.createExternalStorageFile(extension, mediaDirectory, true);
			final Uri uri = getMediaUriFrom(file);

			copyFile(blob.getInputStream(), contentResolver.openOutputStream(uri));

			Intent mediaScanIntent = new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE);
			mediaScanIntent.setData(uri);
			Activity activity = TiApplication.getInstance().getCurrentActivity();
			activity.sendBroadcast(mediaScanIntent);

			//All good. Dispatch success callback
			if (successCallback != null) {
				KrollDict response = new KrollDict();
				response.putCodeAndMessage(NO_ERROR, null);
				successCallback.callAsync(getKrollObject(), response);
			}

		} catch (Throwable t) {
			if (errorCallback != null) {
				KrollDict response = new KrollDict();
				response.putCodeAndMessage(UNKNOWN_ERROR, t.getMessage());
				errorCallback.callAsync(getKrollObject(), response);
			}
		}
	}

	@Kroll.method
	public void hideCamera()
	{
		// make sure the preview / camera are open before trying to hide
		if (TiCameraActivity.cameraActivity != null) {
			TiCameraActivity.hide();
		} else {
			Log.e(TAG, "Camera preview is not open, unable to hide");
		}
	}

	/**
	 * @see org.appcelerator.kroll.KrollProxy#handleMessage(android.os.Message)
	 */
	@Override
	public boolean handleMessage(Message message)
	{
		return super.handleMessage(message);
	}

	public static File createExternalStorageFile(String extension, String type, boolean isPublic)
	{
		final File dir = isPublic ? Environment.getExternalStoragePublicDirectory(type)
								  : TiApplication.getInstance().getExternalFilesDir(type);
		final File appDir = new File(dir, TiApplication.getInstance().getAppInfo().getName());
		final String ext = extension == null ? ".jpg" : extension;

		try {
			return TiFileHelper.getInstance().getTempFile(appDir, ext, !isPublic);
		} catch (IOException e) {
			Log.e(TAG, "Failed to create file: " + e.getMessage());
		}
		return null;
	}

	private void copyFile(InputStream source, OutputStream destination) throws Throwable
	{
		BufferedInputStream bis = new BufferedInputStream(source);
		BufferedOutputStream bos = new BufferedOutputStream(destination);
		byte[] buf = new byte[8192];
		int len = 0;
		while ((len = bis.read(buf)) != -1) {
			bos.write(buf, 0, len);
		}
		if (bis != null) {
			bis.close();
		}
		if (bos != null) {
			bos.close();
		}
	}

	private void copyFile(Uri source, Uri destination) throws Throwable
	{
		InputStream sourceStream = contentResolver.openInputStream(source);
		OutputStream outputStream = contentResolver.openOutputStream(destination);
		copyFile(sourceStream, outputStream);
	}

	private void copyFile(File source, File destination) throws Throwable
	{
		Uri sourceUri = getMediaUriFrom(source);
		Uri destinationUri = getMediaUriFrom(destination);
		copyFile(sourceUri, destinationUri);
	}

	protected class CameraResultHandler implements TiActivityResultHandler, Runnable
	{
		protected File mediaFile;
		protected boolean saveToPhotoGallery;
		protected int code;
		protected KrollFunction successCallback, cancelCallback, errorCallback;
		protected TiActivitySupport activitySupport;
		protected Intent cameraIntent;
		protected String intentType;

		@Override
		public void run()
		{
			code = activitySupport.getUniqueResultCode();
			activitySupport.launchActivityForResult(cameraIntent, code, this);
		}

		@Override
		public void onResult(Activity activity, int requestCode, int resultCode, Intent data)
		{
			if (requestCode == code) {

				Uri uri = data != null ? data.getData() : null;
				if (uri == null) {
					uri = getMediaUriFrom(mediaFile);
				}

				if (resultCode == Activity.RESULT_OK) {
					if (saveToPhotoGallery) {
						// Send out broadcast to add to image gallery.
						Intent mediaScanIntent = new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE);
						mediaScanIntent.setData(uri);
						activity.sendBroadcast(mediaScanIntent);
					}

					// Create a blob for response.
					try {
						TitaniumBlob theFile = new TitaniumBlob(uri.toString());
						TiBlob theBlob = TiBlob.blobFromFile(theFile);
						KrollDict response = MediaModule.createDictForImage(theBlob, theBlob.getMimeType());
						if (successCallback != null) {
							successCallback.callAsync(getKrollObject(), response);
						}
					} catch (Throwable t) {
						if (errorCallback != null) {
							KrollDict response = new KrollDict();
							response.putCodeAndMessage(UNKNOWN_ERROR, t.getMessage());
							errorCallback.callAsync(getKrollObject(), response);
						}
						return;
					}

				} else {
					// Delete the file.
					if (mediaFile != null) {
						mediaFile.delete();
					}
					if (resultCode == Activity.RESULT_CANCELED) {
						if (cancelCallback != null) {
							KrollDict response = new KrollDict();
							response.putCodeAndMessage(NO_ERROR, null);
							cancelCallback.callAsync(getKrollObject(), response);
						}
					} else {
						// Assume error.
						if (errorCallback != null) {
							KrollDict response = new KrollDict();
							response.putCodeAndMessage(UNKNOWN_ERROR, null);
							errorCallback.callAsync(getKrollObject(), response);
						}
					}
				}
			}
		}

		@Override
		public void onError(Activity activity, int requestCode, Exception e)
		{
			if (requestCode != code) {
				return;
			}
			if (mediaFile != null) {
				mediaFile.delete();
			}
			String msg = "Camera problem: " + e.getMessage();
			Log.e(TAG, msg, e);
			if (errorCallback != null) {
				errorCallback.callAsync(getKrollObject(), createErrorResponse(UNKNOWN_ERROR, msg));
			}
		}
	}

	@Kroll
		.method
		@Kroll.setProperty
		public void setCameraFlashMode(int flashMode)
	{
		TiCameraActivity.setFlashMode(flashMode);
	}

	@Kroll
		.method
		@Kroll.getProperty
		public int getCameraFlashMode()
	{
		return TiCameraActivity.cameraFlashMode;
	}

	@Kroll.method
	public void openPhotoGallery(KrollDict options)
	{
		KrollFunction successCallback = null;
		KrollFunction cancelCallback = null;
		KrollFunction errorCallback = null;

		if (options.containsKey(TiC.PROPERTY_SUCCESS)) {
			successCallback = (KrollFunction) options.get(TiC.PROPERTY_SUCCESS);
		}
		if (options.containsKey(TiC.PROPERTY_CANCEL)) {
			cancelCallback = (KrollFunction) options.get(TiC.PROPERTY_CANCEL);
		}
		if (options.containsKey(TiC.EVENT_ERROR)) {
			errorCallback = (KrollFunction) options.get(TiC.EVENT_ERROR);
		}

		final KrollFunction fSuccessCallback = successCallback;
		final KrollFunction fCancelCallback = cancelCallback;
		final KrollFunction fErrorCallback = errorCallback;

		Log.d(TAG, "openPhotoGallery called", Log.DEBUG_MODE);

		Activity activity = TiApplication.getInstance().getCurrentActivity();
		TiActivitySupport activitySupport = (TiActivitySupport) activity;

		TiIntentWrapper galleryIntent = new TiIntentWrapper(new Intent());
		galleryIntent.getIntent().setAction(Intent.ACTION_GET_CONTENT);

		boolean isSelectingPhoto = false;
		boolean isSelectingVideo = false;
		if (options.containsKey(TiC.PROPERTY_MEDIA_TYPES)) {
			Object value = options.get(TiC.PROPERTY_MEDIA_TYPES);
			if (value instanceof String) {
				value = new String[] { (String) value };
			}
			if (value instanceof Object[]) {
				for (Object nextType : (Object[]) value) {
					String stringType = (nextType instanceof String) ? (String) nextType : "";
					switch (stringType) {
						case MEDIA_TYPE_PHOTO:
							isSelectingPhoto = true;
							break;
						case MEDIA_TYPE_VIDEO:
							isSelectingVideo = true;
							break;
					}
				}
			}
		} else {
			isSelectingPhoto = true;
		}
		if (isSelectingPhoto && isSelectingVideo) {
			galleryIntent.getIntent().setType("*/*");
			if (Build.VERSION.SDK_INT >= 19) {
				galleryIntent.getIntent().putExtra(Intent.EXTRA_MIME_TYPES, new String[] { "image/*", "video/*" });
			}
			MediaModule.mediaType = MEDIA_TYPE_PHOTO;
		} else if (isSelectingVideo) {
			galleryIntent.getIntent().setType("video/*");
			MediaModule.mediaType = MEDIA_TYPE_VIDEO;
		} else {
			galleryIntent.getIntent().setType("image/*");
			MediaModule.mediaType = MEDIA_TYPE_PHOTO;
		}

		galleryIntent.getIntent().addCategory(Intent.CATEGORY_DEFAULT);
		galleryIntent.setWindowId(TiIntentWrapper.createActivityName("GALLERY"));

		final int PICK_IMAGE_SINGLE = activitySupport.getUniqueResultCode();
		final int PICK_IMAGE_MULTIPLE = activitySupport.getUniqueResultCode();
		boolean allowMultiple = false;

		if (options.containsKey(TiC.PROPERTY_ALLOW_MULTIPLE) && Build.VERSION.SDK_INT >= 18) {
			allowMultiple = TiConvert.toBoolean(options.get(TiC.PROPERTY_ALLOW_MULTIPLE));
			galleryIntent.getIntent().putExtra(Intent.EXTRA_ALLOW_MULTIPLE, allowMultiple);
		}

		final int code = allowMultiple ? PICK_IMAGE_MULTIPLE : PICK_IMAGE_SINGLE;

		activitySupport.launchActivityForResult(galleryIntent.getIntent(), code, new TiActivityResultHandler() {
			@Override
			public void onResult(Activity activity, int requestCode, int resultCode, Intent data)
			{
				if (requestCode != code) {
					return;
				}
				Log.d(TAG, "OnResult called: " + resultCode, Log.DEBUG_MODE);
				// Fetch a URI to file selected. (Only applicable to single file selection.)
				Uri uri = (data != null) ? data.getData() : null;
				String path = (uri != null) ? uri.toString() : null;

				//Starting with Android-L, backing out of the gallery no longer returns cancel code, but with
				//an ok code and a null data.
				if (resultCode == Activity.RESULT_CANCELED || (Build.VERSION.SDK_INT >= 20 && data == null)) {
					if (fCancelCallback != null) {
						KrollDict response = new KrollDict();
						response.putCodeAndMessage(NO_ERROR, null);
						fCancelCallback.callAsync(getKrollObject(), response);
					}

				} else {
					// Handle multiple file selection, if enabled.
					if (requestCode == PICK_IMAGE_MULTIPLE && Build.VERSION.SDK_INT >= 18) {
						// Wrap all selected file(s) in Titanium "CameraMediaItemType" dictionaries.
						ArrayList<KrollDict> selectedFiles = new ArrayList<>();
						ClipData clipData = data.getClipData();
						if (clipData != null) {
							// Fetch file(s) from clip data.
							int count = clipData.getItemCount();
							for (int index = 0; index < count; index++) {
								ClipData.Item item = clipData.getItemAt(index);
								if ((item == null) || (item.getUri() == null)) {
									continue;
								}
								KrollDict dictionary = createDictForImage(item.getUri().toString());
								if (dictionary == null) {
									continue;
								}
								selectedFiles.add(dictionary);
							}
						} else if (path != null) {
							// Only a single file was found.
							KrollDict dictionary = createDictForImage(path);
							if (dictionary != null) {
								selectedFiles.add(dictionary);
							}
						}

						// Copy each selected file to either an "images" or "videos" collection.
						ArrayList<KrollDict> selectedImages = new ArrayList<>();
						ArrayList<KrollDict> selectedVideos = new ArrayList<>();
						for (KrollDict dictionary : selectedFiles) {
							String mediaType = dictionary.getString("mediaType");
							if (mediaType != null) {
								if (mediaType.equals(MEDIA_TYPE_PHOTO)) {
									selectedImages.add(dictionary);
								} else if (mediaType.equals(MEDIA_TYPE_VIDEO)) {
									selectedVideos.add(dictionary);
								}
							}
						}

						// Invoke a callback with the selection result.
						if (selectedImages.isEmpty() && selectedVideos.isEmpty()) {
							if (selectedFiles.isEmpty()) {
								// Invoke the "cancel" callback if no files were selected.
								if (fCancelCallback != null) {
									KrollDict response = new KrollDict();
									response.putCodeAndMessage(NO_ERROR, null);
									fCancelCallback.callAsync(getKrollObject(), response);
								}
							} else {
								// Invoke the "error" callback if non-image/video files were selected.
								String message = "Invalid file types were selected";
								Log.e(TAG, message);
								if (fErrorCallback != null) {
									fErrorCallback.callAsync(getKrollObject(),
															 createErrorResponse(UNKNOWN_ERROR, message));
								}
							}
						} else {
							// Invoke the "success" callback with the selected file(s).
							if (fSuccessCallback != null) {
								KrollDict d = new KrollDict();
								d.putCodeAndMessage(NO_ERROR, null);
								d.put("images", selectedImages.toArray(new KrollDict[0]));
								d.put("videos", selectedVideos.toArray(new KrollDict[0]));
								fSuccessCallback.callAsync(getKrollObject(), d);
							}
						}
						return;
					}

					// Handle single file selection.
					try {
						//Check for invalid path
						if (path == null) {
							String msg = "File path is invalid";
							Log.e(TAG, msg);
							if (fErrorCallback != null) {
								fErrorCallback.callAsync(getKrollObject(), createErrorResponse(UNKNOWN_ERROR, msg));
							}
							return;
						}
						if (fSuccessCallback != null) {
							fSuccessCallback.callAsync(getKrollObject(), createDictForImage(path));
						}

					} catch (OutOfMemoryError e) {
						String msg = "Not enough memory to get image: " + e.getMessage();
						Log.e(TAG, msg);
						if (fErrorCallback != null) {
							fErrorCallback.callAsync(getKrollObject(), createErrorResponse(UNKNOWN_ERROR, msg));
						}
					}
				}
			}

			@Override
			public void onError(Activity activity, int requestCode, Exception e)
			{
				if (requestCode != code) {
					return;
				}
				String msg = "Gallery problem: " + e.getMessage();
				Log.e(TAG, msg, e);
				if (fErrorCallback != null) {
					fErrorCallback.callAsync(getKrollObject(), createErrorResponse(UNKNOWN_ERROR, msg));
				}
			}
		});
	}

	protected static KrollDict createDictForImage(String path)
	{
		// Validate argument.
		if ((path == null) || path.isEmpty()) {
			return null;
		}

		// Determine the mime type for the given file.
		String mimeType = null;
		try {
			mimeType = contentResolver.getType(Uri.parse(path));
		} catch (Exception ex) {
		}

		// Wrap the given file in a blob.
		TiBlob imageData = createImageData(new String[] { path }, mimeType);

		// Return a Titanium "CameraMediaItemType" dictionary which wraps the given file.
		return createDictForImage(imageData, mimeType);
	}

	public static TiBlob createImageData(String[] parts, String mimeType)
	{
		return TiBlob.blobFromFile(TiFileFactory.createTitaniumFile(parts, false), mimeType);
	}

	protected static KrollDict createDictForImage(TiBlob imageData, String mimeType)
	{
		// Create the dictionary.
		KrollDict d = new KrollDict();
		d.putCodeAndMessage(NO_ERROR, null);

		// Determine and set the media type based on the given mime type.
		boolean isPhoto = false;
		boolean isVideo = false;
		String actualMediaType = MediaModule.mediaType;
		if (mimeType != null) {
			String lowerCaseMimeType = mimeType.toLowerCase();
			if (lowerCaseMimeType.startsWith("image")) {
				actualMediaType = MEDIA_TYPE_PHOTO;
				isPhoto = true;
			} else if (lowerCaseMimeType.startsWith("video")) {
				actualMediaType = MEDIA_TYPE_VIDEO;
				isVideo = true;
			}
		}
		if (actualMediaType == null) {
			actualMediaType = MEDIA_TYPE_PHOTO;
		}
		d.put("mediaType", actualMediaType);

		// Add the image/video's width and height to the dictionary.
		int width = -1;
		int height = -1;
		if (imageData != null) {
			if (isPhoto) {
				// Fetch the image file's pixel width and height.
				BitmapFactory.Options opts = new BitmapFactory.Options();
				opts.inJustDecodeBounds = true;
				opts.outWidth = width;
				opts.outHeight = height;
				try (InputStream inputStream = imageData.getInputStream()) {
					BitmapFactory.decodeStream(inputStream, null, opts);
					width = opts.outWidth;
					height = opts.outHeight;
				} catch (Exception ex) {
					Log.e(TAG, "Failed to acquire dimensions for image.", ex);
				}
			} else if (isVideo) {
				// Fetch the video file's pixel width and height.
				String path = null;
				TiFileProxy fileProxy = imageData.getFile();
				if (fileProxy != null) {
					path = fileProxy.getNativePath();
				}
				if (path != null) {
					MediaMetadataRetriever retriever = new MediaMetadataRetriever();
					try {
						if (path.startsWith("content:")) {
							retriever.setDataSource(TiApplication.getInstance(), Uri.parse(path));
						} else {
							retriever.setDataSource(path);
						}
						width = TiConvert.toInt(
							retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH), width);
						height = TiConvert.toInt(
							retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT), height);
					} catch (Exception ex) {
						Log.e(TAG, "Failed to acquire dimensions for video: " + path, ex);
					} finally {
						try {
							retriever.release();
						} catch (Exception ex) {
						}
					}
				}
			}
		}
		d.put("x", 0);
		d.put("y", 0);
		d.put("width", width);
		d.put("height", height);

		// Add the image/video's crop dimensiosn to the dictionary.
		KrollDict cropRect = new KrollDict();
		cropRect.put("x", 0);
		cropRect.put("y", 0);
		cropRect.put("width", width);
		cropRect.put("height", height);
		d.put("cropRect", cropRect);

		// Add the blob to the dictionary.
		d.put("media", imageData);
		return d;
	}

	KrollDict createDictForImage(int width, int height, byte[] data)
	{
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
		d.put("mediaType", mediaType);
		d.put("media", TiBlob.blobFromData(data, MIME_IMAGE));

		return d;
	}

	@Kroll.method
	public void previewImage(KrollDict options)
	{
		Log.d(TAG, "openPhotoGallery called", Log.DEBUG_MODE);

		Activity activity = TiApplication.getAppCurrentActivity();
		if (activity == null) {
			Log.w(TAG, "Unable to get current activity for previewImage.", Log.DEBUG_MODE);
			return;
		}

		KrollFunction successCallback = null;
		if (options.containsKey(TiC.PROPERTY_SUCCESS)) {
			successCallback = (KrollFunction) options.get(TiC.PROPERTY_SUCCESS);
		}
		final KrollFunction fSuccessCallback = successCallback;

		KrollFunction errorCallback = null;
		if (options.containsKey(TiC.EVENT_ERROR)) {
			errorCallback = (KrollFunction) options.get(TiC.EVENT_ERROR);
		}
		final KrollFunction fErrorCallback = errorCallback;

		TiBlob imageBlob = null;
		if (options.containsKey(TiC.PROPERTY_IMAGE)) {
			String errorMessage = null;
			Object value = options.get(TiC.PROPERTY_IMAGE);
			if (value instanceof TiBlob) {
				imageBlob = (TiBlob) value;
			} else if (value != null) {
				errorMessage = "The image property must be of type blob";
			} else {
				errorMessage = "Missing image property";
			}
			if (errorMessage != null) {
				Log.w(TAG, errorMessage);
				if (errorCallback != null) {
					errorCallback.callAsync(getKrollObject(), createErrorResponse(UNKNOWN_ERROR, errorMessage));
				}
				return;
			}
		}

		Uri imageUri = null;
		if (imageBlob.getType() == TiBlob.TYPE_FILE) {
			TiFileProxy fileProxy = imageBlob.getFile();
			if (fileProxy != null) {
				File file = fileProxy.getBaseFile().getNativeFile();
				if (file != null) {
					imageUri = TiFileProvider.createUriFrom(file);
				} else {
					String path = fileProxy.getNativePath();
					if ((path != null) && path.startsWith("content:")) {
						imageUri = Uri.parse(path);
					}
				}
			}
		}
		if (imageUri == null) {
			try (InputStream stream = imageBlob.getInputStream()) {
				imageUri = TiFileProvider.createUriFrom(
					TiFileHelper.getInstance().getTempFileFromInputStream(stream, null, true));
			} catch (Exception ex) {
			}
		}
		if (imageUri == null) {
			String errorMessage = "Failed to create URI from given 'image' blob";
			Log.w(TAG, errorMessage);
			if (errorCallback != null) {
				errorCallback.callAsync(getKrollObject(), createErrorResponse(UNKNOWN_ERROR, errorMessage));
			}
			return;
		}

		Intent intent = new Intent(Intent.ACTION_VIEW);
		intent.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
		String mimeType = imageBlob.getMimeType();
		if ((mimeType == null) || mimeType.isEmpty()) {
			intent.setData(imageUri);
		} else {
			intent.setDataAndType(imageUri, mimeType);
		}

		TiIntentWrapper previewIntent = new TiIntentWrapper(intent);
		previewIntent.setWindowId(TiIntentWrapper.createActivityName("PREVIEW"));

		TiActivitySupport activitySupport = (TiActivitySupport) activity;
		final int code = activitySupport.getUniqueResultCode();
		activitySupport.launchActivityForResult(intent, code, new TiActivityResultHandler() {
			public void onResult(Activity activity, int requestCode, int resultCode, Intent data)
			{
				if (requestCode != code) {
					return;
				}
				Log.i(TAG, "OnResult called: " + resultCode);
				if (fSuccessCallback != null) {
					KrollDict response = new KrollDict();
					response.putCodeAndMessage(NO_ERROR, null);
					fSuccessCallback.callAsync(getKrollObject(), response);
				}
			}

			public void onError(Activity activity, int requestCode, Exception e)
			{
				if (requestCode != code) {
					return;
				}
				String msg = "Gallery problem: " + e.getMessage();
				Log.e(TAG, msg, e);
				if (fErrorCallback != null) {
					fErrorCallback.callAsync(getKrollObject(), createErrorResponse(UNKNOWN_ERROR, msg));
				}
			}
		});
	}

	@Kroll.method
	public void takeScreenshot(KrollFunction callback)
	{
		Activity a = TiApplication.getAppCurrentActivity();

		if (a == null) {
			Log.w(TAG, "Could not get current activity for takeScreenshot.", Log.DEBUG_MODE);
			callback.callAsync(getKrollObject(), new Object[] { null });
			return;
		}

		while (a.getParent() != null) {
			a = a.getParent();
		}

		Window w = a.getWindow();

		while (w.getContainer() != null) {
			w = w.getContainer();
		}

		KrollDict image = TiUIHelper.viewToImage(null, w.getDecorView());
		if (callback != null) {
			callback.callAsync(getKrollObject(), new Object[] { image });
		}
	}

	@Kroll.method
	public void takePicture()
	{
		// make sure the preview / camera are open before trying to take photo
		if (TiCameraActivity.cameraActivity != null) {
			TiCameraActivity.takePicture();
		} else {
			Log.e(TAG, "Camera preview is not open, unable to take photo");
		}
	}

	@Kroll.method
	public void startVideoCapture()
	{
		// make sure the preview / camera are open before trying to take photo
		if (TiCameraActivity.cameraActivity != null) {
			TiCameraActivity.startVideoCapture();
		} else {
			Log.e(TAG, "Camera preview is not open, unable to take photo");
		}
	}

	@Kroll.method
	public void stopVideoCapture()
	{
		// make sure the preview / camera are open before trying to take photo
		if (TiCameraActivity.cameraActivity != null) {
			TiCameraActivity.stopVideoCapture();
		} else {
			Log.e(TAG, "Camera preview is not open, unable to take photo");
		}
	}

	@Kroll.method
	public void switchCamera(int whichCamera)
	{
		TiCameraActivity activity = TiCameraActivity.cameraActivity;

		if (activity == null || !activity.isPreviewRunning()) {
			Log.e(TAG, "Camera preview is not open, unable to switch camera.");
			return;
		}

		activity.switchCamera(whichCamera);
	}

	@Kroll
		.method
		@Kroll.getProperty
		public boolean getIsCameraSupported()
	{
		return Camera.getNumberOfCameras() > 0;
	}

	@Kroll
		.method
		@Kroll.getProperty
		public int[] getAvailableCameras()
	{
		int cameraCount = Camera.getNumberOfCameras();
		if (cameraCount == 0) {
			return null;
		}

		int[] result = new int[cameraCount];

		CameraInfo cameraInfo = new CameraInfo();

		for (int i = 0; i < cameraCount; i++) {
			Camera.getCameraInfo(i, cameraInfo);
			switch (cameraInfo.facing) {
				case CameraInfo.CAMERA_FACING_FRONT:
					result[i] = CAMERA_FRONT;
					break;
				case CameraInfo.CAMERA_FACING_BACK:
					result[i] = CAMERA_REAR;
					break;
				default:
					// This would be odd. As of API level 17,
					// there are just the two options.
					result[i] = -1;
			}
		}

		return result;
	}

	@Kroll
		.method
		@Kroll.getProperty
		public boolean getCanRecord()
	{
		return TiApplication.getInstance().getPackageManager().hasSystemFeature("android.hardware.microphone");
	}

	@Override
	public String getApiName()
	{
		return "Ti.Media";
	}
}
