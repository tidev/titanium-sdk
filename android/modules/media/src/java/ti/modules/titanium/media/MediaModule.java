/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.ContextSpecific;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiFileProxy;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.util.TiActivityResultHandler;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiIntentWrapper;
import org.appcelerator.titanium.util.TiUIHelper;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.BitmapFactory;
import android.hardware.Camera;
import android.hardware.Camera.CameraInfo;
import android.net.Uri;
import android.os.Environment;
import android.os.Handler;
import android.os.Message;
import android.os.Vibrator;
import android.provider.MediaStore;
import android.view.Window;

@Kroll.module @ContextSpecific
public class MediaModule extends KrollModule
	implements Handler.Callback
{
	private static final String TAG = "TiMedia";

	private static final long[] DEFAULT_VIBRATE_PATTERN = { 100L, 250L };
//	private static final String PHOTO_DCIM_CAMERA = "/sdcard/dcim/Camera";
//
//	protected static final int MSG_INVOKE_CALLBACK = KrollModule.MSG_LAST_ID + 100;
//	protected static final int MSG_LAST_ID = MSG_INVOKE_CALLBACK;

	// The mode FOCUS_MODE_CONTINUOUS_PICTURE is added in API 14
	public static final String FOCUS_MODE_CONTINUOUS_PICTURE = "continuous-picture";

	@Kroll.constant public static final int UNKNOWN_ERROR = -1;
	@Kroll.constant public static final int NO_ERROR = 0;
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

	@Kroll.constant public static final int CAMERA_FRONT = 0;
	@Kroll.constant public static final int CAMERA_REAR = 1;
	@Kroll.constant public static final int CAMERA_FLASH_OFF = 0;
	@Kroll.constant public static final int CAMERA_FLASH_ON = 1;
	@Kroll.constant public static final int CAMERA_FLASH_AUTO = 2;

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
	
	private int getLastImageId(Activity activity){
	    final String[] imageColumns = { MediaStore.Images.Media._ID };
	    final String imageOrderBy = MediaStore.Images.Media._ID+" DESC";
	    final String imageWhere = null;
	    final String[] imageArguments = null;
	    
	    Cursor imageCursor = activity.getContentResolver().query(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, imageColumns, imageWhere, imageArguments, imageOrderBy);
	    if(imageCursor == null) {
	    	return -1;
	    }
	    if(imageCursor.moveToFirst()){
	        int id = imageCursor.getInt(imageCursor.getColumnIndex(MediaStore.Images.Media._ID));
	        imageCursor.close();
	        return id;
	    }else{
	        return 0;
	    }
	}
	
	private void launchNativeCamera(KrollDict cameraOptions)
	{
		KrollFunction successCallback = null;
		KrollFunction cancelCallback = null;
		KrollFunction errorCallback = null;
		boolean saveToPhotoGallery = false;
		
		if (cameraOptions.containsKeyAndNotNull("success")) {
			successCallback = (KrollFunction) cameraOptions.get("success");
		}
		if (cameraOptions.containsKeyAndNotNull("cancel")) {
			cancelCallback = (KrollFunction) cameraOptions.get("cancel");
		}
		if (cameraOptions.containsKeyAndNotNull("error")) {
			errorCallback = (KrollFunction) cameraOptions.get("error");
		}
		if (cameraOptions.containsKeyAndNotNull("saveToPhotoGallery")) {
			saveToPhotoGallery = cameraOptions.getBoolean("saveToPhotoGallery");
		}
		
		
		//Create an output file irrespective of whether saveToGallery 
		//is true or false. If false, we'll delete it later
		File imageFile = null;
		
		if(saveToPhotoGallery) {
			imageFile = MediaModule.createGalleryImageFile();
		} else {
			imageFile = MediaModule.createExternalStorageFile();
		}
		
		//Sanity Checks
		if (imageFile == null) {
			if(errorCallback != null) {
				KrollDict response = new KrollDict();
				response.putCodeAndMessage(NO_CAMERA, "Unable to create file for storage");
				errorCallback.callAsync(getKrollObject(), response);
			}
			return;
		}
		
		if(getIsCameraSupported() == false) {
			if(errorCallback != null) {
				KrollDict response = new KrollDict();
				response.putCodeAndMessage(UNKNOWN_ERROR, "Camera Not Supported");
				errorCallback.callAsync(getKrollObject(), response);
			}
			Log.e(TAG, "Camera not supported");
			imageFile.delete();
			return;
		}
		
		//Create Intent
		Uri fileUri = Uri.fromFile(imageFile); // create a file to save the image
	    Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
		intent.putExtra(MediaStore.EXTRA_OUTPUT, fileUri);
		
		//Setup CameraResultHandler
		Activity activity = TiApplication.getInstance().getCurrentActivity();
		TiActivitySupport activitySupport = (TiActivitySupport) activity;

		CameraResultHandler resultHandler = new CameraResultHandler();
		resultHandler.imageFile = imageFile;
		resultHandler.successCallback = successCallback;
		resultHandler.errorCallback = errorCallback;
		resultHandler.cancelCallback = cancelCallback;
		resultHandler.cameraIntent = intent;
		resultHandler.saveToPhotoGallery = saveToPhotoGallery;
		resultHandler.activitySupport = activitySupport;
		resultHandler.lastImageId = getLastImageId(activity);
		activity.runOnUiThread(resultHandler);
		
		
	}
	
	
	protected void launchCameraActivity(KrollDict cameraOptions) {
		
	}

	@SuppressWarnings("unchecked")
	@Kroll.method
	public void showCamera(@SuppressWarnings("rawtypes") HashMap options)
	{
		KrollDict cameraOptions = null;
		if ( (options == null) || !(options instanceof HashMap<?, ?>) ) {
			if (Log.isDebugModeEnabled()) {
				Log.d(TAG, "showCamera called with invalid options", Log.DEBUG_MODE);
			}
			return;
		} else {
			cameraOptions = new KrollDict(options);
		}
		
		if (cameraOptions.containsKeyAndNotNull("overlay")) {
			launchCameraActivity(cameraOptions);
		} else {
			launchNativeCamera(cameraOptions);
		}
		
		
//		Activity activity = TiApplication.getInstance().getCurrentActivity();
//
//		Log.d(TAG, "showCamera called", Log.DEBUG_MODE);
//
//		KrollFunction successCallback = null;
//		KrollFunction cancelCallback = null;
//		KrollFunction errorCallback = null;
//		boolean autohide = true;
//		int flashMode = CAMERA_FLASH_OFF;
//		boolean saveToPhotoGallery = false;
//
//		if (options.containsKey("success")) {
//			successCallback = (KrollFunction) options.get("success");
//		}
//		if (options.containsKey("cancel")) {
//			cancelCallback = (KrollFunction) options.get("cancel");
//		}
//		if (options.containsKey("error")) {
//			errorCallback = (KrollFunction) options.get("error");
//		}
//
//		Object autohideOption = options.get("autohide");
//		if (autohideOption != null) {
//			autohide = TiConvert.toBoolean(autohideOption);
//		}
//
//		Object saveToPhotoGalleryOption = options.get("saveToPhotoGallery");
//		if (saveToPhotoGalleryOption != null) {
//			saveToPhotoGallery = TiConvert.toBoolean(saveToPhotoGalleryOption);
//		}
//		
//		Object cameraFlashModeOption = options.get(TiC.PROPERTY_FLASH_MODE);
//		if (cameraFlashModeOption != null) {
//			flashMode = TiConvert.toInt(cameraFlashModeOption);
//		}
//
//		// Use our own custom camera activity when an overlay is provided.
//		if (options.containsKey("overlay")) {
//			TiCameraActivity.overlayProxy = (TiViewProxy) options
//					.get("overlay");
//
//			TiCameraActivity.callbackContext = getKrollObject();
//			TiCameraActivity.successCallback = successCallback;
//			TiCameraActivity.errorCallback = errorCallback;
//			TiCameraActivity.cancelCallback = cancelCallback;
//			TiCameraActivity.saveToPhotoGallery = saveToPhotoGallery;
//			TiCameraActivity.setFlashMode(flashMode);
//			TiCameraActivity.whichCamera = CAMERA_REAR; // default.
//
//			// This option is only applicable when running the custom
//			// TiCameraActivity, since we can't direct the built-in
//			// Activity to open a specific camera.
//			Object whichCamera = options.get("whichCamera");
//			if (whichCamera != null) {
//				TiCameraActivity.whichCamera = TiConvert.toInt(whichCamera);
//			}
//			TiCameraActivity.autohide = autohide;
//
//			Intent intent = new Intent(activity, TiCameraActivity.class);
//			activity.startActivity(intent);
//			return;
//		}
//
//		Camera camera = null;
//		try {
//			camera = Camera.open();
//			if (camera != null) {
//				camera.release();
//				camera = null;
//			}
//
//		} catch (Throwable t) {
//			if (camera != null) {
//				camera.release();
//			}
//
//			if (errorCallback != null) {
//				errorCallback.call(
//						getKrollObject(),
//						new Object[] { createErrorResponse(NO_CAMERA,
//								"Camera not available.") });
//			}
//
//			return;
//		}
//
//		TiActivitySupport activitySupport = (TiActivitySupport) activity;
//		TiFileHelper tfh = TiFileHelper.getInstance();
//
//		TiIntentWrapper cameraIntent = new TiIntentWrapper(new Intent());
//		if (TiCameraActivity.overlayProxy == null) {
//			cameraIntent.getIntent().setAction(
//					MediaStore.ACTION_IMAGE_CAPTURE);
//			cameraIntent.getIntent().addCategory(Intent.CATEGORY_DEFAULT);
//		} else {
//			cameraIntent.getIntent().setClass(
//					TiApplication.getInstance().getBaseContext(),
//					TiCameraActivity.class);
//		}
//
//		cameraIntent.setWindowId(TiIntentWrapper.createActivityName("CAMERA"));
//		PackageManager pm = (PackageManager) activity.getPackageManager();
//		List<ResolveInfo> activities = pm.queryIntentActivities(
//				cameraIntent.getIntent(), PackageManager.MATCH_DEFAULT_ONLY);
//
//		// See if it's the HTC camera app
//		boolean isHTCCameraApp = false;
//
//		for (ResolveInfo rs : activities) {
//			try {
//				if (rs.activityInfo.applicationInfo.sourceDir.contains("HTC")
//						|| Build.MANUFACTURER.equals("HTC")) {
//					isHTCCameraApp = true;
//					break;
//				}
//			} catch (NullPointerException e) {
//				// Ignore
//			}
//		}
//
//		File imageDir = null;
//		File imageFile = null;
//
//		try {
//			if (saveToPhotoGallery) {
//				// HTC camera application will create its own gallery image
//				// file.
//				if (!isHTCCameraApp) {
//					imageFile = createGalleryImageFile();
//				}
//
//			} else {
//				if (activity.getIntent() != null) {
//					String name = TiApplication.getInstance().getAppInfo()
//							.getName();
//					// For HTC cameras, specifying the directory from
//					// getExternalStorageDirectory is /mnt/sdcard and
//					// using that path prevents the gallery from recognizing it.
//					// To avoid this we use /sdcard instead
//					// (this is a legacy path we've been using)
//					if (isHTCCameraApp) {
//						imageDir = new File(PHOTO_DCIM_CAMERA, name);
//					} else {
//						File rootsd = Environment.getExternalStorageDirectory();
//						imageDir = new File(rootsd.getAbsolutePath()
//								+ "/dcim/Camera/", name);
//					}
//					if (!imageDir.exists()) {
//						imageDir.mkdirs();
//						if (!imageDir.exists()) {
//							Log.w(TAG,
//									"Attempt to create '"
//											+ imageDir.getAbsolutePath()
//											+ "' failed silently.");
//						}
//					}
//
//				} else {
//					imageDir = tfh.getDataDirectory(false);
//				}
//
//				imageFile = tfh.getTempFile(imageDir, ".jpg", true);
//			}
//
//		} catch (IOException e) {
//			Log.e(TAG, "Unable to create temp file", e);
//			if (errorCallback != null) {
//				errorCallback.callAsync(getKrollObject(),
//						createErrorResponse(UNKNOWN_ERROR, e.getMessage()));
//			}
//
//			return;
//		}
//
//		// Get the taken date for the last image in EXTERNAL_CONTENT_URI.
//		String[] projection = {
//			Images.ImageColumns.DATE_TAKEN
//		};
//		String dateTaken = null;
//		Cursor c = activity.getContentResolver().query(Images.Media.EXTERNAL_CONTENT_URI, projection, null, null,
//				Images.ImageColumns.DATE_TAKEN);
//		if (c != null) {
//			if (c.moveToLast()) {
//				dateTaken = c.getString(0);
//			}
//			c.close();
//			c = null;
//		}
//
//		CameraResultHandler resultHandler = new CameraResultHandler();
//		resultHandler.imageFile = imageFile;
//		resultHandler.saveToPhotoGallery = saveToPhotoGallery;
//		resultHandler.successCallback = successCallback;
//		resultHandler.cancelCallback = cancelCallback;
//		resultHandler.errorCallback = errorCallback;
//		resultHandler.activitySupport = activitySupport;
//		resultHandler.cameraIntent = cameraIntent.getIntent();
//		resultHandler.dateTaken_lastImageInExternalContentURI = dateTaken;
//
//		if (imageFile != null) {
//			String imageUrl = "file://" + imageFile.getAbsolutePath();
//			cameraIntent.getIntent().putExtra(MediaStore.EXTRA_OUTPUT,
//					Uri.parse(imageUrl));
//			resultHandler.imageUrl = imageUrl;
//		}
//
//		activity.runOnUiThread(resultHandler);
	}

	/*
	 * Current implementation on Android limited to saving Images only to photo gallery
	 */
	@Kroll.method
	public void saveToPhotoGallery(Object arg, @Kroll.argument(optional=true)@SuppressWarnings("rawtypes") HashMap callbackargs)
	{
		KrollFunction successCallback = null;
		KrollFunction errorCallback = null;

		KrollDict callbackDict = null;
		
		//Check for callbacks
		if(callbackargs != null) {
			callbackDict = new KrollDict(callbackargs);
			if (callbackDict.containsKeyAndNotNull("success")) {
				successCallback = (KrollFunction) callbackDict.get("success");
			}
			if (callbackDict.containsKeyAndNotNull("error")) {
				errorCallback = (KrollFunction) callbackDict.get("error");
			}
		}
		
		//Validate arguments
		boolean validType = ( (arg instanceof TiBlob) || (arg instanceof TiFileProxy) );
		if (!validType) {
			if(errorCallback != null) {
				KrollDict response = new KrollDict();
				response.putCodeAndMessage(UNKNOWN_ERROR, "Invalid type passed as argument");
				errorCallback.callAsync(getKrollObject(), response);
			}
			return;
		}
		
		TiBlob theBlob = null;
		try {
			//Make sure our processing argument is a Blob
			if (arg instanceof TiFileProxy) {
				theBlob = TiBlob.blobFromFile(((TiFileProxy)arg).getBaseFile());
			} else {
				theBlob = (TiBlob) arg;
			}
			
			if ((theBlob.getWidth() == 0) || (theBlob.getHeight() == 0)) {
				if(errorCallback != null) {
					KrollDict response = new KrollDict();
					response.putCodeAndMessage(UNKNOWN_ERROR,"Could not decode bitmap from argument");
					errorCallback.callAsync(getKrollObject(), response);
					return;
				}
			}
			
			//Create a temporary file in cache and delete the original file
			BufferedInputStream bis = null;
			BufferedOutputStream bos = null;
			bis = new BufferedInputStream(theBlob.getInputStream());
			
			File imageFile = MediaModule.createGalleryImageFile();
			bos = new BufferedOutputStream(new FileOutputStream(imageFile));
			byte[] buf = new byte[8096];
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
			
			Intent mediaScanIntent = new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE);
			Uri contentUri = Uri.fromFile(imageFile);
			mediaScanIntent.setData(contentUri);
			Activity activity = TiApplication.getInstance().getCurrentActivity();
			activity.sendBroadcast(mediaScanIntent);
			
			//All good. Dispatch success callback
			if(successCallback != null) {
				KrollDict response = new KrollDict();
				response.putCodeAndMessage(NO_ERROR,null);
				successCallback.callAsync(getKrollObject(), response);
			}
			
		} catch(Throwable t) {
			if(errorCallback != null) {
				KrollDict response = new KrollDict();
				response.putCodeAndMessage(UNKNOWN_ERROR,t.getMessage());
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

	protected static File createExternalStorageFile() {
		File pictureDir = TiApplication.getInstance().getExternalFilesDir(Environment.DIRECTORY_PICTURES);
		File appPictureDir = new File(pictureDir, TiApplication.getInstance().getAppInfo().getName());
		if (!appPictureDir.exists()) {
			if (!appPictureDir.mkdirs()) {
				Log.e(TAG, "Failed to create external storage directory.");
				return null;
			}
		}

		File imageFile;
		try {
			imageFile = TiFileHelper.getInstance().getTempFile(appPictureDir, ".jpg", false);

		} catch (IOException e) {
			Log.e(TAG, "Failed to create image file: " + e.getMessage());
			return null;
		}

		return imageFile;
	}
	protected static File createGalleryImageFile() {
		File pictureDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES);
		File appPictureDir = new File(pictureDir, TiApplication.getInstance().getAppInfo().getName());
		if (!appPictureDir.exists()) {
			if (!appPictureDir.mkdirs()) {
				Log.e(TAG, "Failed to create application gallery directory.");
				return null;
			}
		}

		File imageFile;
		try {
			imageFile = TiFileHelper.getInstance().getTempFile(appPictureDir, ".jpg", false);

		} catch (IOException e) {
			Log.e(TAG, "Failed to create gallery image file: " + e.getMessage());
			return null;
		}

		return imageFile;
	}

	protected class CameraResultHandler implements TiActivityResultHandler, Runnable
	{
		protected File imageFile;
		protected boolean saveToPhotoGallery;
		protected int code;
		protected KrollFunction successCallback, cancelCallback, errorCallback;
		protected TiActivitySupport activitySupport;
		protected Intent cameraIntent;
		protected int lastImageId;

		@Override
		public void run()
		{
			code = activitySupport.getUniqueResultCode();
			activitySupport.launchActivityForResult(cameraIntent, code, this);
		}
		
		private void validateFile() throws Throwable
		{
			try {
				BitmapFactory.Options opts = new BitmapFactory.Options();
				opts.inJustDecodeBounds = true;
				
				BitmapFactory.decodeStream(new FileInputStream(imageFile), null, opts);
				if (opts.outWidth == -1 || opts.outHeight == -1) {
					throw new Exception("Could not decode the bitmap from imageFile");
				}
			} catch (Throwable t) {
				Log.e(TAG, t.getMessage());
				throw t;
			}
		}
		
		private void checkAndDeleteDuplicate(Activity activity)
		{
			if(lastImageId != -1) {
				final String[] imageColumns = { MediaStore.Images.Media.DATA, MediaStore.Images.Media.DATE_TAKEN, MediaStore.Images.Media.SIZE, MediaStore.Images.Media._ID };
				final String imageOrderBy = MediaStore.Images.Media._ID+" DESC";
				final String imageWhere = MediaStore.Images.Media._ID+">?";
				final String[] imageArguments = { Integer.toString(lastImageId) };
				Cursor imageCursor = activity.getContentResolver().query(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, imageColumns, imageWhere, imageArguments, imageOrderBy);
				String refPath = imageFile.getAbsolutePath();
				long lastModifiedTime = imageFile.lastModified();
				if (imageCursor == null) {
					Log.e(TAG, "Could not load image cursor. Can not check and delete duplicates");
					return;
				}
				if(imageCursor.getCount()>0){
					//This should just be 1. The extra time check is for the case when user starts camera, pauses app,
					// goes to native camera and takes pictures and returns.
				    while(imageCursor.moveToNext()){
				        int id = imageCursor.getInt(imageCursor.getColumnIndex(MediaStore.Images.Media._ID));
				        String path = imageCursor.getString(imageCursor.getColumnIndex(MediaStore.Images.Media.DATA));
				        if(!path.equalsIgnoreCase(refPath)) {
					        long takenTimeStamp = imageCursor.getLong(imageCursor.getColumnIndex(MediaStore.Images.Media.DATE_TAKEN));
					        if (Math.abs(takenTimeStamp - lastModifiedTime) < 2000) {
					        	//Files created within 1 second of each other
						        int result = activity.getContentResolver().delete(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, MediaStore.Images.Media._ID + "=?", new String[]{ Integer.toString(id) } );
					        	if (result == 1) {
					        		if(Log.isDebugModeEnabled()) {
						        		Log.d(TAG, "Deleting possible duplicate at "+path+" with id "+id, Log.DEBUG_MODE);
					        		}
						        } else {
						        	if(Log.isDebugModeEnabled()) {
						        		Log.d(TAG, "Could not delete possible duplicate at "+path+" with id "+id, Log.DEBUG_MODE);
						        	}
						        }
					        } else {
					        	if(Log.isDebugModeEnabled()) {
					        		Log.d(TAG, "Ignoring file as not a duplicate at path "+path+" with id "+id, Log.DEBUG_MODE);
					        	}
					        }
				        }
				    }               
				}
				imageCursor.close();
			}
		}

		@Override
		public void onResult(Activity activity, int requestCode, int resultCode, Intent data)
		{
			if(requestCode == code) {
				if (resultCode == Activity.RESULT_OK) {
					try {
						validateFile();
					} catch(Throwable t) {
						if(errorCallback != null) {
							KrollDict response = new KrollDict();
							response.putCodeAndMessage(UNKNOWN_ERROR, t.getMessage());
							errorCallback.callAsync(getKrollObject(), response);
						}
						return;
					}
					
					checkAndDeleteDuplicate(activity);
					
					if (!saveToPhotoGallery) {
						//Create a temporary file in cache and delete the original file
						BufferedInputStream bis = null;
						BufferedOutputStream bos = null;
						try {
							File tempFile = TiApplication.getInstance().getTempFileHelper().createTempFile("tia", ".jpg");
							bis = new BufferedInputStream(new FileInputStream(imageFile));
							bos = new BufferedOutputStream(new FileOutputStream(tempFile));
							byte[] buf = new byte[8096];
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
							
							imageFile.delete();
							imageFile = tempFile;

						} catch(Throwable t) {
							if(errorCallback != null) {
								KrollDict response = new KrollDict();
								response.putCodeAndMessage(UNKNOWN_ERROR, t.getMessage());
								errorCallback.callAsync(getKrollObject(), response);
							}
							return;
						}
					} else {
						//Send out broadcast to add to image gallery
						Intent mediaScanIntent = new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE);
						Uri contentUri = Uri.fromFile(imageFile);
						mediaScanIntent.setData(contentUri);
						activity.sendBroadcast(mediaScanIntent);
					}
					
					//Create a blob for response
					try {
						TiFile theFile = new TiFile(imageFile, imageFile.toURI().toURL().toExternalForm(), false);
						TiBlob theBlob = TiBlob.blobFromFile(theFile);
						KrollDict response = MediaModule.createDictForImage(theBlob, theBlob.getMimeType());
						if (successCallback != null) {
							successCallback.callAsync(getKrollObject(), response);
						}
					} catch (Throwable t) {
						if(errorCallback != null) {
							KrollDict response = new KrollDict();
							response.putCodeAndMessage(UNKNOWN_ERROR, t.getMessage());
							errorCallback.callAsync(getKrollObject(), response);
						}
						return;
					}
					
				} else {
					//Delete the file
					if (imageFile != null) {
						imageFile.delete();
					}
					if (resultCode == Activity.RESULT_CANCELED) {
						if (cancelCallback != null) {
							KrollDict response = new KrollDict();
							response.putCodeAndMessage(NO_ERROR, null);
							cancelCallback.callAsync(getKrollObject(), response);
						}
					} else {
						//Assume error
						if(errorCallback != null) {
							KrollDict response = new KrollDict();
							response.putCodeAndMessage(UNKNOWN_ERROR, null);
							errorCallback.callAsync(getKrollObject(), response);
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
			Log.e(TAG, msg, e);
			if (errorCallback != null) {
				errorCallback.callAsync(getKrollObject(), createErrorResponse(UNKNOWN_ERROR, msg));
			}
		}
	}

	@Kroll.method
	@Kroll.setProperty
	public void setFlashMode(int flashMode)
	{
		TiCameraActivity.setFlashMode(flashMode);
	}

	@Kroll.method
	@Kroll.getProperty
	public int getFlashMode()
	{
		return TiCameraActivity.cameraFlashMode;
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

		Log.d(TAG, "openPhotoGallery called", Log.DEBUG_MODE);

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
					Log.e(TAG, "OnResult called: " + resultCode);
					if (resultCode == Activity.RESULT_CANCELED) {
						if (fCancelCallback != null) {
							KrollDict response = new KrollDict();
							response.putCodeAndMessage(NO_ERROR, null);
							fCancelCallback.callAsync(getKrollObject(), response);
						}

					} else {
						String path = data.getDataString();
						try {
							if (fSuccessCallback != null) {
								fSuccessCallback.callAsync(getKrollObject(), createDictForImage(path, "image/jpeg"));
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

				public void onError(Activity activity, int requestCode, Exception e)
				{
					String msg = "Gallery problem: " + e.getMessage();
					Log.e(TAG, msg, e);
					if (fErrorCallback != null) {
						fErrorCallback.callAsync(getKrollObject(), createErrorResponse(UNKNOWN_ERROR, msg));
					}
				}
			});
	}

	public static KrollDict createDictForImage(String path, String mimeType) {
		String[] parts = { path };
		TiBlob imageData = TiBlob.blobFromFile(TiFileFactory.createTitaniumFile(parts, false), mimeType);
		return createDictForImage(imageData, mimeType);
	}

	public static KrollDict createDictForImage(TiBlob imageData, String mimeType) {
		KrollDict d = new KrollDict();
		d.putCodeAndMessage(NO_ERROR, null);

		int width = -1;
		int height = -1;

		BitmapFactory.Options opts = new BitmapFactory.Options();
		opts.inJustDecodeBounds = true;

		// We only need the ContentResolver so it doesn't matter if the root or current activity is used for
		// accessing it
		BitmapFactory.decodeStream(imageData.getInputStream(), null, opts);

		width = opts.outWidth;
		height = opts.outHeight;

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
		d.put("media", imageData);

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

	@Kroll.method
	public void previewImage(KrollDict options)
	{
		Activity activity = TiApplication.getAppCurrentActivity();
		if (activity == null) {
			Log.w(TAG, "Unable to get current activity for previewImage.", Log.DEBUG_MODE);
			return;
		}

		KrollFunction successCallback = null;
		KrollFunction errorCallback = null;
		TiBlob image = null;

		if (options.containsKey("success")) {
			successCallback = (KrollFunction) options.get("success");
		}
		if (options.containsKey("error")) {
			errorCallback = (KrollFunction) options.get("error");
		}
		if (options.containsKey("image")) {
			image = (TiBlob) options.get("image");
		}

		if (image == null) {
			if (errorCallback != null) {
				errorCallback.callAsync(getKrollObject(), createErrorResponse(UNKNOWN_ERROR, "Missing image property"));
			}
		}

		TiBaseFile f = (TiBaseFile) image.getData();

		final KrollFunction fSuccessCallback = successCallback;
		final KrollFunction fErrorCallback = errorCallback;

		Log.d(TAG, "openPhotoGallery called", Log.DEBUG_MODE);

		TiActivitySupport activitySupport = (TiActivitySupport) activity;

		Intent intent = new Intent(Intent.ACTION_VIEW);
		TiIntentWrapper previewIntent = new TiIntentWrapper(intent);
		String mimeType = image.getMimeType();

		if (mimeType != null && mimeType.length() > 0) {
			intent.setDataAndType(Uri.parse(f.nativePath()), mimeType);
		} else {
			intent.setData(Uri.parse(f.nativePath()));
		}

		previewIntent.setWindowId(TiIntentWrapper.createActivityName("PREVIEW"));

		final int code = activitySupport.getUniqueResultCode();
		 activitySupport.launchActivityForResult(intent, code,
			new TiActivityResultHandler() {

				public void onResult(Activity activity, int requestCode, int resultCode, Intent data)
				{
					Log.e(TAG, "OnResult called: " + resultCode);
					if (fSuccessCallback != null) {
						KrollDict response = new KrollDict();
						response.putCodeAndMessage(NO_ERROR, null);
						fSuccessCallback.callAsync(getKrollObject(), response);
					}
				}

				public void onError(Activity activity, int requestCode, Exception e)
				{
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
	public void switchCamera(int whichCamera)
	{
		TiCameraActivity activity = TiCameraActivity.cameraActivity;

		if (activity == null || !activity.isPreviewRunning()) {
			Log.e(TAG, "Camera preview is not open, unable to switch camera.");
			return;
		}

		activity.switchCamera(whichCamera);
	}

	@Kroll.method
	@Kroll.getProperty
	public boolean getIsCameraSupported()
	{
		return Camera.getNumberOfCameras() > 0;
	}

	@Kroll.method
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

	@Override
	public String getApiName()
	{
		return "Ti.Media";
	}
}

