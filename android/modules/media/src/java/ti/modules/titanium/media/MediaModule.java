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
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiFileProxy;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.proxy.TiViewProxy;
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
	
	
	private void launchCameraActivity(KrollDict cameraOptions) {
		KrollFunction successCallback = null;
		KrollFunction cancelCallback = null;
		KrollFunction errorCallback = null;
		boolean saveToPhotoGallery = false;
		boolean autohide = true;
		TiViewProxy overLayProxy = (TiViewProxy)cameraOptions.get("overlay");
		int flashMode = CAMERA_FLASH_OFF;
		int whichCamera = CAMERA_REAR;
		
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
		if (cameraOptions.containsKeyAndNotNull("autohide")) {
			autohide = cameraOptions.getBoolean("autohide");
		}
		if (cameraOptions.containsKeyAndNotNull(TiC.PROPERTY_FLASH_MODE)) {
			flashMode = cameraOptions.getInt(TiC.PROPERTY_FLASH_MODE);
		}
		if (cameraOptions.containsKeyAndNotNull("whichCamera")) {
			whichCamera = cameraOptions.getInt("whichCamera");
		}
		
		TiCameraActivity.callbackContext = getKrollObject();
		TiCameraActivity.successCallback = successCallback;
		TiCameraActivity.cancelCallback = cancelCallback;
		TiCameraActivity.errorCallback = errorCallback;
		TiCameraActivity.saveToPhotoGallery = saveToPhotoGallery;
		TiCameraActivity.autohide = autohide;
		TiCameraActivity.overlayProxy = overLayProxy;
		TiCameraActivity.whichCamera = whichCamera;
		TiCameraActivity.setFlashMode(flashMode);
		
		//Create Intent and Launch
		Activity activity = TiApplication.getInstance().getCurrentActivity();
		Intent intent = new Intent(activity, TiCameraActivity.class);
		activity.startActivity(intent);
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
	}

	/*
	 * Current implementation on Android limited to saving Images only to photo gallery
	 */
	@SuppressWarnings({ "unchecked", "rawtypes" })
	@Kroll.method
	public void saveToPhotoGallery(Object arg, @Kroll.argument(optional=true)HashMap callbackargs)
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
				}
				return;
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
				bis = null;
			}
			if (bos != null) {
				bos.close();
				bos = null;
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
		private boolean validFileCreated;

		//Validates if the file is a valid bitmap
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
		
		//Cleanup duplicates if possible.
		private void checkAndDeleteDuplicate(Activity activity)
		{
			if(lastImageId != -1) {
				final String[] imageColumns = { MediaStore.Images.Media.DATA, MediaStore.Images.Media._ID };
				final String imageOrderBy = MediaStore.Images.Media._ID+" DESC";
				final String imageWhere = MediaStore.Images.Media._ID+">?";
				final String[] imageArguments = { Integer.toString(lastImageId) };
				Cursor imageCursor = activity.getContentResolver().query(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, imageColumns, imageWhere, imageArguments, imageOrderBy);
				String refPath = imageFile.getAbsolutePath();
				if (imageCursor == null) {
					Log.e(TAG, "Could not load image cursor. Can not check and delete duplicates");
					return;
				}
				if(imageCursor.getCount()>0){
					
					if (!validFileCreated) {
						try {
							imageFile.delete();
						} catch (Throwable t) {
							//Ignore error
						}
						
						imageFile = saveToPhotoGallery? MediaModule.createGalleryImageFile() : MediaModule.createExternalStorageFile();
					}
					
					long compareLength = (validFileCreated) ? imageFile.length() : 0;
					
					while(imageCursor.moveToNext()){
				        int id = imageCursor.getInt(imageCursor.getColumnIndex(MediaStore.Images.Media._ID));
				        String path = imageCursor.getString(imageCursor.getColumnIndex(MediaStore.Images.Media.DATA));
				        
				        if (!validFileCreated) {
				        	//If file is invalid we will copy over the last image in the gallery
				        	if (imageFile != null) {
				        		try {
				        			File srcFile = new File(path);
				        			copyFile(srcFile, imageFile);
				        			validFileCreated = true;
				        			refPath = imageFile.getAbsolutePath();
				        			compareLength = imageFile.length();
				        		}catch(Throwable t) {
				        			//Ignore this error. It will be caught on the next pass to validateFile.
				        		}
				        	} 
				        }
				        
				        if(!path.equalsIgnoreCase(refPath)) {
				        	
				        	File compareFile = new File(path);
				        	long fileLength = compareFile.length();
				        	
				        	if (compareFile.length() == compareLength) {
					        	//Same file length
						        int result = activity.getContentResolver().delete(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, MediaStore.Images.Media._ID + "=?", new String[]{ Integer.toString(id) } );
					        	if (result == 1) {
					        		android.util.Log.d(TAG, "Deleting possible duplicate at "+path+" with id "+id);
					        		if(Log.isDebugModeEnabled()) {
						        		Log.d(TAG, "Deleting possible duplicate at "+path+" with id "+id, Log.DEBUG_MODE);
					        		}
						        } else {
						        	android.util.Log.d(TAG, "Could not delete possible duplicate at "+path+" with id "+id);
						        	if(Log.isDebugModeEnabled()) {
						        		Log.d(TAG, "Could not delete possible duplicate at "+path+" with id "+id, Log.DEBUG_MODE);
						        	}
						        }
					        } else {
					        	android.util.Log.d(TAG, "Ignoring file as not a duplicate at path "+path+" with id "+id+". Different Sizes "+fileLength+" "+compareLength);
					        	if(Log.isDebugModeEnabled()) {
					        		Log.d(TAG, "Ignoring file as not a duplicate at path "+path+" with id "+id+". Different Sizes "+fileLength+" "+compareLength, Log.DEBUG_MODE);
					        	}
					        }
				        }
				    }               
				}
				imageCursor.close();
			}
		}
		
		//Copies files over using Buffered Streams.
		private void copyFile(File source, File destination) throws Throwable {
			BufferedInputStream bis = new BufferedInputStream(new FileInputStream(source));
			BufferedOutputStream bos = new BufferedOutputStream(new FileOutputStream(destination));
			byte[] buf = new byte[8096];
			int len = 0;

			while ((len = bis.read(buf)) != -1) {
				bos.write(buf, 0, len);
			}
			
			if (bis != null) {
				bis.close();
				bis = null;
			}
			if (bos != null) {
				bos.close();
				bos = null;
			}
		}

		@Override
		public void run()
		{
			code = activitySupport.getUniqueResultCode();
			activitySupport.launchActivityForResult(cameraIntent, code, this);
		}
		
		@Override
		public void onResult(Activity activity, int requestCode, int resultCode, Intent data)
		{
			if(requestCode == code) {
				if (resultCode == Activity.RESULT_OK) {
					
					validFileCreated = true;
					try {
						validateFile();
					} catch(Throwable t) {
						validFileCreated = false;
					}
					
					
					checkAndDeleteDuplicate(activity);

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
					
					
					if (!saveToPhotoGallery) {
						//Create a temporary file in cache and delete the original file
						try {
							File tempFile = TiApplication.getInstance().getTempFileHelper().createTempFile("tia", ".jpg");
							copyFile(imageFile, tempFile);
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
			if(requestCode != code) {
				return;
			}
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
					if(requestCode != code) {
						return;
					}
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
					if(requestCode != code) {
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

	protected static KrollDict createDictForImage(String path, String mimeType) {
		String[] parts = { path };
		TiBlob imageData = TiBlob.blobFromFile(TiFileFactory.createTitaniumFile(parts, false), mimeType);
		return createDictForImage(imageData, mimeType);
	}

	protected static KrollDict createDictForImage(TiBlob imageData, String mimeType) {
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
					if(requestCode != code) {
						return;
					}
					Log.e(TAG, "OnResult called: " + resultCode);
					if (fSuccessCallback != null) {
						KrollDict response = new KrollDict();
						response.putCodeAndMessage(NO_ERROR, null);
						fSuccessCallback.callAsync(getKrollObject(), response);
					}
				}

				public void onError(Activity activity, int requestCode, Exception e)
				{
					if(requestCode != code) {
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

