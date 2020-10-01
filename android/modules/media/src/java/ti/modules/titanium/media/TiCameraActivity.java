/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012-2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import java.io.BufferedOutputStream;
import java.io.OutputStream;
import java.util.List;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.io.TiContentFile;
import org.appcelerator.titanium.proxy.TiViewProxy;

import android.Manifest;
import android.app.Activity;
import android.content.ContentResolver;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.hardware.Camera;
import android.hardware.Camera.AutoFocusCallback;
import android.hardware.Camera.CameraInfo;
import android.hardware.Camera.Parameters;
import android.hardware.Camera.PictureCallback;
import android.hardware.Camera.ShutterCallback;
import android.hardware.Camera.Size;
import android.media.CamcorderProfile;
import android.media.MediaRecorder;
import android.net.Uri;
import android.os.Bundle;
import android.os.ParcelFileDescriptor;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.Surface;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;
import android.view.WindowManager;
import android.widget.FrameLayout;

@SuppressWarnings("deprecation")
public class TiCameraActivity extends TiBaseActivity implements SurfaceHolder.Callback, MediaRecorder.OnInfoListener
{
	private static final String TAG = "TiCameraActivity";
	private static Camera camera;
	private static boolean takingPicture = false;
	private static boolean surfaceHolder = false;
	private static Size optimalPreviewSize;
	private static Size optimalVideoSize;
	private static List<Size> supportedPreviewSizes;
	private static List<Size> supportedVideoSizes;
	private static int frontCameraId = Integer.MIN_VALUE; // cache
	private static int backCameraId = Integer.MIN_VALUE;  //cache
	private static final int VIDEO_QUALITY_LOW = CamcorderProfile.QUALITY_LOW;
	private static final int VIDEO_QUALITY_HIGH = CamcorderProfile.QUALITY_HIGH;
	private static final String MEDIA_TYPE_PHOTO = "public.image";
	private static final String MEDIA_TYPE_VIDEO = "public.video";

	private TiViewProxy localOverlayProxy = null;
	private SurfaceView preview;
	private PreviewLayout previewLayout;
	private FrameLayout cameraLayout;
	private boolean previewRunning = false;
	private int currentRotation;

	public static TiViewProxy overlayProxy = null;
	public static TiCameraActivity cameraActivity = null;

	public static MediaModule mediaContext;
	public static KrollObject callbackContext;
	public static KrollFunction successCallback, errorCallback, cancelCallback, androidbackCallback;
	public static boolean saveToPhotoGallery = false;
	public static int whichCamera = MediaModule.CAMERA_REAR;
	public static int cameraFlashMode = MediaModule.CAMERA_FLASH_OFF;
	public static boolean autohide = true;

	public static int videoMaximumDuration = 0;
	public static int videoQuality = VIDEO_QUALITY_HIGH;
	public static String mediaType = MEDIA_TYPE_PHOTO;
	public static int cameraType = 0;
	private static int cameraRotation = 0;
	private static MediaRecorder recorder;
	private static Uri videoContentUri;
	private static ParcelFileDescriptor videoParcelFileDescriptor;

	private static class PreviewLayout extends FrameLayout
	{
		private double aspectRatio = 1;
		private Runnable runAfterMeasure;

		public PreviewLayout(Context context)
		{
			super(context);
		}

		protected void prepareNewPreview(Runnable runnable)
		{
			runAfterMeasure = runnable;

			this.post(() -> {
				PreviewLayout.this.requestLayout();
				PreviewLayout.this.invalidate();
			});
		}

		@Override
		protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
		{
			final int width = resolveSize(getSuggestedMinimumWidth(), widthMeasureSpec);
			final int height = resolveSize(getSuggestedMinimumHeight(), heightMeasureSpec);
			setMeasuredDimension(width, height);

			int previewWidth = MeasureSpec.getSize(widthMeasureSpec);
			int previewHeight = MeasureSpec.getSize(heightMeasureSpec);

			// Set the preview size to the most optimal given the target size
			optimalPreviewSize = getOptimalPreviewSize(supportedPreviewSizes, previewWidth, previewHeight);
			optimalVideoSize = getOptimalPreviewSize(supportedVideoSizes, previewWidth, previewHeight);
			if (optimalPreviewSize != null) {
				if (previewWidth > previewHeight) {
					aspectRatio = (double) optimalPreviewSize.width / optimalPreviewSize.height;
				} else {
					aspectRatio = (double) optimalPreviewSize.height / optimalPreviewSize.width;
				}
			}
			if (previewHeight < previewWidth / aspectRatio) {
				previewHeight = (int) (previewWidth / aspectRatio + .5);

			} else {
				previewWidth = (int) (previewHeight * aspectRatio + .5);
			}

			super.onMeasure(MeasureSpec.makeMeasureSpec(previewWidth, MeasureSpec.EXACTLY),
							MeasureSpec.makeMeasureSpec(previewHeight, MeasureSpec.EXACTLY));

			if (runAfterMeasure != null) {
				final Runnable run = runAfterMeasure;
				runAfterMeasure = null;
				this.post(run);
			}
		}
	}

	@Override
	public void onCreate(Bundle savedInstanceState)
	{
		// setting Fullscreen
		getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
		super.onCreate(savedInstanceState);

		// checks if device has only front facing camera and sets it
		checkWhichCameraAsDefault();

		// create camera preview
		preview = new SurfaceView(this);
		SurfaceHolder previewHolder = preview.getHolder();
		previewHolder.addCallback(this);
		previewHolder.setType(SurfaceHolder.SURFACE_TYPE_PUSH_BUFFERS);

		// set preview overlay
		localOverlayProxy = overlayProxy;

		// set overall layout - will populate in onResume
		previewLayout = new PreviewLayout(this);
		cameraLayout = new FrameLayout(this);
		cameraLayout.setBackgroundColor(Color.BLACK);
		cameraLayout.addView(previewLayout, new FrameLayout.LayoutParams(LayoutParams.MATCH_PARENT,
																		 LayoutParams.MATCH_PARENT, Gravity.CENTER));

		setContentView(cameraLayout);
	}

	@Override
	public void surfaceChanged(SurfaceHolder previewHolder, int format, int width, int height)
	{
		// force initial onMeasure
		previewLayout.prepareNewPreview(() -> {
			startPreview(preview.getHolder());
		});
	}

	@Override
	public void surfaceCreated(SurfaceHolder previewHolder)
	{
		try {
			if (whichCamera == MediaModule.CAMERA_FRONT) {
				openCamera(getFrontCameraId());
			} else {
				openCamera();
			}
			camera.setPreviewDisplay(previewHolder);
			surfaceHolder = true;
			currentRotation = getWindowManager().getDefaultDisplay().getRotation();
		} catch (Exception e) {
			onError(MediaModule.UNKNOWN_ERROR, "Unable to setup preview surface: " + e.getMessage());
			cancelCallback = null;
			finish();
		}
	}

	@Override
	public void surfaceDestroyed(SurfaceHolder previewHolder)
	{
		// Release the camera preview so that other apps can use the camera.
		stopPreview();
		if (camera != null) {
			camera.release();
			camera = null;
		}
		surfaceHolder = false;
	}

	@Override
	protected void onResume()
	{
		super.onResume();
		if (camera == null) {

			if (whichCamera == MediaModule.CAMERA_FRONT) {
				openCamera(getFrontCameraId());

			} else {
				openCamera();
			}
		}
		if (camera != null) {
			setFlashMode(cameraFlashMode);
		}
		if (camera == null) {
			return; // openCamera will have logged error.
		}

		cameraActivity = this;
		previewLayout.addView(preview,
							  new FrameLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
		View overlayView = localOverlayProxy.getOrCreateView().getNativeView();
		ViewGroup parent = (ViewGroup) overlayView.getParent();
		// Detach from the parent if applicable
		if (parent != null) {
			parent.removeView(overlayView);
		}
		cameraLayout.addView(overlayView,
							 new FrameLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
	}

	public static void setFlashMode(int cameraFlashMode)
	{
		TiCameraActivity.cameraFlashMode = cameraFlashMode;
		if (camera != null) {
			try {
				Parameters p = camera.getParameters();
				if (cameraFlashMode == MediaModule.CAMERA_FLASH_OFF) {
					p.setFlashMode(Parameters.FLASH_MODE_OFF);
				} else if (cameraFlashMode == MediaModule.CAMERA_FLASH_ON) {
					p.setFlashMode(Parameters.FLASH_MODE_ON);
				} else if (cameraFlashMode == MediaModule.CAMERA_FLASH_AUTO) {
					p.setFlashMode(Parameters.FLASH_MODE_AUTO);
				}
				camera.setParameters(p);
			} catch (Throwable t) {
				Log.e(TAG, "Could not set flash mode", t);
			}
		}
	}

	@Override
	protected void onPause()
	{
		super.onPause();

		// Stop video capture if recording.
		stopVideoCapture();

		// Stop the camera preview so that other apps can use the camera.
		stopPreview();
		previewLayout.removeView(preview);
		cameraLayout.removeView(localOverlayProxy.getOrCreateView().getNativeView());
		try {
			camera.release();
			camera = null;
		} catch (Throwable t) {
			Log.d(TAG, "Camera is not open, unable to release", Log.DEBUG_MODE);
		}
	}

	@Override
	protected void onDestroy()
	{
		// Release our camera activity reference.
		if (cameraActivity == this) {
			cameraActivity = null;
		}

		// Destroy this activity.
		super.onDestroy();
	}

	private void startPreview(SurfaceHolder previewHolder)
	{
		if (camera == null) {
			return;
		}

		int rotation = getWindowManager().getDefaultDisplay().getRotation();

		if (currentRotation == rotation && previewRunning) {
			return;
		}

		if (previewRunning) {
			try {
				camera.stopPreview();
			} catch (Exception e) {
				// ignore: tried to stop a non=existent preview
			}
		}

		//Set the proper display orientation
		int cameraId = Integer.MIN_VALUE;
		if (whichCamera == MediaModule.CAMERA_FRONT) {
			cameraId = TiCameraActivity.getFrontCameraId();
		} else {
			cameraId = TiCameraActivity.getBackCameraId();
		}
		CameraInfo info = new Camera.CameraInfo();
		Camera.getCameraInfo(cameraId, info);

		currentRotation = rotation;

		//Clockwise and anticlockwise
		int degrees = 0, degrees2 = 0;

		//Let Camera display in same orientation as display
		switch (currentRotation) {
			case Surface.ROTATION_0:
				degrees = degrees2 = 0;
				break;
			case Surface.ROTATION_180:
				degrees = degrees2 = 180;
				break;
			case Surface.ROTATION_90: {
				degrees = 90;
				degrees2 = 270;
			} break;
			case Surface.ROTATION_270: {
				degrees = 270;
				degrees2 = 90;
			} break;
		}

		int result, result2;
		if (info.facing == Camera.CameraInfo.CAMERA_FACING_FRONT) {
			result = (info.orientation + degrees) % 360;
			result = (360 - result) % 360; // compensate the mirror
		} else {                           // back-facing
			result = (info.orientation - degrees + 360) % 360;
		}

		//Set up Camera Rotation so jpegCallback has correctly rotated image
		Parameters param = camera.getParameters();
		if (info.facing == CameraInfo.CAMERA_FACING_FRONT) {
			result2 = (info.orientation - degrees2 + 360) % 360;
		} else { // back-facing camera
			result2 = (info.orientation + degrees2) % 360;
		}

		camera.setDisplayOrientation(result);
		param.setRotation(result2);
		cameraRotation = result2;

		// Set appropriate focus mode if supported.
		List<String> supportedFocusModes = param.getSupportedFocusModes();
		if (supportedFocusModes.contains(MediaModule.FOCUS_MODE_CONTINUOUS_PICTURE)) {
			param.setFocusMode(MediaModule.FOCUS_MODE_CONTINUOUS_PICTURE);
		} else if (supportedFocusModes.contains(Parameters.FOCUS_MODE_AUTO)) {
			param.setFocusMode(Parameters.FOCUS_MODE_AUTO);
		} else if (supportedFocusModes.contains(Parameters.FOCUS_MODE_MACRO)) {
			param.setFocusMode(Parameters.FOCUS_MODE_MACRO);
		}

		if (optimalPreviewSize != null) {
			param.setPreviewSize(optimalPreviewSize.width, optimalPreviewSize.height);
		}

		List<Size> pictSizes = param.getSupportedPictureSizes();
		Size pictureSize = getOptimalPictureSize(pictSizes);

		if (pictureSize != null) {
			param.setPictureSize(pictureSize.width, pictureSize.height);
		}
		if (MEDIA_TYPE_VIDEO.equals(mediaType)) {
			param.setRecordingHint(true);
		}
		camera.setParameters(param);

		try {
			camera.setPreviewDisplay(previewHolder);
			previewRunning = true;
			camera.startPreview();
			mediaContext.fireEvent(TiC.EVENT_CAMERA_READY, null);
		} catch (Exception e) {
			onError(MediaModule.UNKNOWN_ERROR, "Unable to setup preview surface: " + e.getMessage());
			finish();
		}
	}

	private void stopPreview()
	{
		if (camera == null || !previewRunning) {
			return;
		}
		camera.stopPreview();
		previewRunning = false;
	}

	public static void startVideoCapture()
	{
		// Do not continue if already started.
		if (recorder != null) {
			return;
		}

		// Unlock the camera for recorder use, only if necessary.
		try {
			camera.unlock();
		} catch (Exception e) {
			onError(MediaModule.UNKNOWN_ERROR, "Unable to unlock camera: " + e.getMessage());
			return;
		}

		// Create and configure a new video recorder.
		recorder = new MediaRecorder();
		recorder.setOnInfoListener(cameraActivity);
		recorder.setCamera(camera);
		recorder.setVideoSource(MediaRecorder.VideoSource.CAMERA);
		CamcorderProfile profile = CamcorderProfile.get(whichCamera, videoQuality);
		if (optimalVideoSize != null) {
			profile.videoFrameWidth = optimalVideoSize.width;
			profile.videoFrameHeight = optimalVideoSize.height;
		} else {
			Size videoSize = getOptimalPictureSize(supportedVideoSizes);
			if (videoSize != null) {
				profile.videoFrameWidth = videoSize.width;
				profile.videoFrameHeight = videoSize.height;
			}
		}
		int result = TiApplication.getInstance().checkCallingOrSelfPermission(Manifest.permission.RECORD_AUDIO);
		if (result == PackageManager.PERMISSION_GRANTED) {
			recorder.setAudioSource(MediaRecorder.AudioSource.CAMCORDER);
			recorder.setProfile(profile);
		} else {
			// only video - no sound
			Log.w(TAG, "To record audio please request RECORD_AUDIO permission");
			recorder.setOutputFormat(profile.fileFormat);
			recorder.setVideoFrameRate(profile.videoFrameRate);
			recorder.setVideoSize(profile.videoFrameWidth, profile.videoFrameHeight);
			recorder.setVideoEncodingBitRate(profile.videoBitRate);
			recorder.setVideoEncoder(profile.videoCodec);
		}
		recorder.setOrientationHint(cameraRotation);
		if (videoMaximumDuration > 0) {
			recorder.setMaxDuration(videoMaximumDuration);
		}

		// Create a new video file and open it.
		ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();
		videoParcelFileDescriptor = null;
		try {
			videoContentUri = MediaModule.createExternalVideoFileUri(saveToPhotoGallery);
			videoParcelFileDescriptor = contentResolver.openFileDescriptor(videoContentUri, "rw");
		} catch (Exception ex) {
			try {
				if (saveToPhotoGallery) {
					Log.e(TAG, "Failed to open video file in gallery. Creating file in app's sandbox instead.", ex);
					if (videoContentUri != null) {
						contentResolver.delete(videoContentUri, null, null);
					}
					videoContentUri = MediaModule.createExternalVideoFileUri(false);
					videoParcelFileDescriptor = contentResolver.openFileDescriptor(videoContentUri, "rw");
				}
			} catch (Exception ex2) {
			}
		}
		if (videoParcelFileDescriptor == null) {
			onError(MediaModule.UNKNOWN_ERROR, "Failed to create video file.");
			stopVideoCapture(false);
			return;
		}
		recorder.setOutputFile(videoParcelFileDescriptor.getFileDescriptor());

		// Start video recording.
		try {
			recorder.prepare();
			recorder.start();
		} catch (Exception e) {
			onError(MediaModule.UNKNOWN_ERROR, "Unable to start recording: " + e.getMessage());
			stopVideoCapture(false);
		}
	}

	public static void stopVideoCapture()
	{
		stopVideoCapture(true);
	}

	private static void stopVideoCapture(boolean useCallbacks)
	{
		// Do not continue if not started.
		if (recorder == null) {
			return;
		}

		// Determine if the activity is closing/closed.
		boolean isFinishing = (cameraActivity != null) ? cameraActivity.isFinishing() : false;
		if (isFinishing) {
			useCallbacks = false;
		}

		// Stop and release the media recorder.
		boolean wasSuccessful = false;
		try {
			recorder.stop();
			recorder.release();
			wasSuccessful = !isFinishing && (videoContentUri != null);
		} catch (Exception e) {
			onError(MediaModule.UNKNOWN_ERROR, "Unable to stop recording: " + e.getMessage());
			useCallbacks = false;
		} finally {
			recorder = null;
		}

		// Lock camera for preview surface now that we're done recording.
		try {
			if (camera != null) {
				camera.reconnect();
				camera.lock();
			}
		} catch (Exception ex) {
			Log.e(TAG, "Unable to reconnect to camera after recording.", ex);
		}

		// Close the video file. Delete it if failed to record or if we're canceling out of activity.
		if (videoParcelFileDescriptor != null) {
			try {
				videoParcelFileDescriptor.close();
				if (!wasSuccessful && (videoContentUri != null)) {
					ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();
					contentResolver.delete(videoContentUri, null, null);
				}
			} catch (Exception ex) {
				Log.e(TAG, "Failed to close video file.", ex);
			}
			videoParcelFileDescriptor = null;
		}

		// Notify the caller that the recording has stopped.
		if (wasSuccessful) {
			if (useCallbacks && (successCallback != null)) {
				TiBlob blob = TiBlob.blobFromFile(new TiContentFile(videoContentUri));
				KrollDict response = MediaModule.createDictForImage(blob, blob.getMimeType());
				KrollDict previewRect = new KrollDict();
				previewRect.put(TiC.PROPERTY_WIDTH, 0);
				previewRect.put(TiC.PROPERTY_HEIGHT, 0);
				response.put("previewRect", previewRect);
				successCallback.callAsync(callbackContext, response);
			}
		} else if (!isFinishing) {
			String message = "Failed to record video.";
			if (useCallbacks) {
				onError(MediaModule.UNKNOWN_ERROR, message);
			} else {
				Log.e(TAG, message);
			}
		}

		// Close the activity if auto-hide is enabled.
		// Otherwise, restart the camera preview.
		if (autohide) {
			hide();
		} else if (camera != null) {
			camera.startPreview();
		}
	}

	@Override
	public void onInfo(MediaRecorder mr, int what, int extra)
	{
		if (what == MediaRecorder.MEDIA_RECORDER_INFO_MAX_DURATION_REACHED) {
			stopVideoCapture();
		}
	}

	@Override
	public void finish()
	{
		// For API 10 and above, the whole activity gets destroyed during an orientation change. We only want to set
		// overlayProxy to null when we call finish, i.e. when we hide the camera or take a picture. By doing this, the
		// overlay proxy will be available during the recreation of the activity during an orientation change.
		overlayProxy = null;
		super.finish();
	}

	/**
	 * Computes the optimal preview size given the target display size and aspect ratio.
	 * @param sizes A list of preview sizes the camera supports
	 * @param w The pixel width of the view to render the preview in.
	 * @param h The pixel height of the view to render the preview in.
	 * @return the optimal size of the preview
	 */
	private static Size getOptimalPreviewSize(List<Size> sizes, int w, int h)
	{
		final double ASPECT_TOLERANCE = 0.1;
		double targetRatio = (double) w / h;
		if (sizes == null)
			return null;

		Size optimalSize = null;
		double minDiff = Double.MAX_VALUE;

		int targetHeight = h;

		// Try to find an size match aspect ratio and size
		for (Size size : sizes) {
			double ratio = (double) size.width / size.height;
			if (Math.abs(ratio - targetRatio) > ASPECT_TOLERANCE)
				continue;
			if (Math.abs(size.height - targetHeight) < minDiff) {
				optimalSize = size;
				minDiff = Math.abs(size.height - targetHeight);
			}
		}

		// Cannot find the one match the aspect ratio, ignore the requirement
		if (optimalSize == null) {
			minDiff = Double.MAX_VALUE;
			for (Size size : sizes) {
				if (Math.abs(size.height - targetHeight) < minDiff) {
					optimalSize = size;
					minDiff = Math.abs(size.height - targetHeight);
				}
			}
		}
		return optimalSize;
	}

	/**
	 * Computes the optimal picture size given the preview size.
	 * This returns the maximum resolution size.
	 *
	 * @param sizes
	 *            a list of picture sizes the camera supports
	 * @return the optimal size of the picture
	 */
	private static Size getOptimalPictureSize(List<Size> sizes)
	{
		if (sizes == null) {
			return null;
		}
		Size optimalSize = null;

		long resolution = 0;

		for (Size size : sizes) {
			if (size.width * size.height > resolution) {
				optimalSize = size;
				resolution = size.width * size.height;
			}
		}

		return optimalSize;
	}

	private static void onError(int code, String message)
	{
		if (errorCallback == null) {
			Log.e(TAG, message);
			return;
		}

		KrollDict dict = new KrollDict();
		dict.putCodeAndMessage(code, message);
		dict.put(TiC.PROPERTY_MESSAGE, message);
		errorCallback.callAsync(callbackContext, dict);
	}

	public static void takePicture()
	{
		if (!takingPicture) {
			takingPicture = true;
			try {
				String focusMode = camera.getParameters().getFocusMode();
				if (!(focusMode.equals(Parameters.FOCUS_MODE_EDOF) || focusMode.equals(Parameters.FOCUS_MODE_FIXED)
					  || focusMode.equals(Parameters.FOCUS_MODE_INFINITY))
					&& surfaceHolder) {
					AutoFocusCallback focusCallback = new AutoFocusCallback() {
						public void onAutoFocus(boolean success, Camera camera)
						{
							if (takingPicture) {
								if (success) {
									try {
										camera.takePicture(shutterCallback, null, jpegCallback);
									} catch (Exception e) {
										Log.w(TAG, "Could not take picture: " + e.toString());
										takingPicture = false;
									}

									// This is required in order to continue auto-focus after taking a picture.
									// Calling 'cancelAutofocus' may cause issues on Android M. (TIMOB-20260)
									// Which is why this requires an exception handler.
									// NOTE: We should really update to Camera2 API.
									try {
										camera.cancelAutoFocus();
										camera.autoFocus(null);
									} catch (Exception e) {
										Log.w(TAG, "Failed to cancel auto focus: " + e.toString());
									}
								} else {
									Log.w(TAG, "Unable to focus.");
								}
							}
						}
					};
					camera.autoFocus(focusCallback);
				} else {
					camera.takePicture(shutterCallback, null, jpegCallback);
				}
			} catch (Exception e) {
				Log.w(TAG, "Could not take picture: " + e.toString());
				if (camera != null) {
					camera.release();
				}
				takingPicture = false;
			}
		}
	}

	public boolean isPreviewRunning()
	{
		return this.previewRunning;
	}

	public static void hide()
	{
		if (cameraActivity != null) {
			cameraActivity.setResult(Activity.RESULT_OK);
			cameraActivity.finish();
		}
	}

	private static ShutterCallback shutterCallback = new ShutterCallback() {
		// Just the presence of a shutter callback will
		// allow the shutter click sound to occur (at least
		// on Jelly Bean on a stock Google phone, which
		// was remaining silent without this.)
		@Override
		public void onShutter()
		{
			// No-op
		}
	};

	private static PictureCallback jpegCallback = new PictureCallback() {
		@Override
		public void onPictureTaken(byte[] data, Camera camera)
		{
			try {
				// Write the captured image to file.
				ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();
				Uri contentUri = MediaModule.createExternalPictureContentUri(saveToPhotoGallery);
				try (OutputStream stream = new BufferedOutputStream(contentResolver.openOutputStream(contentUri))) {
					stream.write(data);
					stream.flush();
				}

				if (successCallback != null) {
					TiBlob blob = TiBlob.blobFromFile(new TiContentFile(contentUri));
					KrollDict response = MediaModule.createDictForImage(blob, blob.getMimeType());

					// add previewRect to response
					KrollDict previewRect = new KrollDict();
					if (optimalPreviewSize != null) {
						previewRect.put(TiC.PROPERTY_WIDTH, optimalPreviewSize.width);
						previewRect.put(TiC.PROPERTY_HEIGHT, optimalPreviewSize.height);
					} else {
						previewRect.put(TiC.PROPERTY_WIDTH, 0);
						previewRect.put(TiC.PROPERTY_HEIGHT, 0);
					}
					response.put("previewRect", previewRect);

					successCallback.callAsync(callbackContext, response);
				}
			} catch (Throwable t) {
				if (errorCallback != null) {
					KrollDict response = new KrollDict();
					response.putCodeAndMessage(MediaModule.UNKNOWN_ERROR, t.getMessage());
					errorCallback.callAsync(callbackContext, response);
				}
			}

			if (autohide) {
				if (cameraActivity != null) {
					cameraActivity.finish();
				}
			} else if (camera != null) {
				camera.startPreview();
			}
			takingPicture = false;
		}
	};

	private void checkWhichCameraAsDefault()
	{
		// This is to check if device has only front facing camera
		// TIMOB-15812: Fix for Devices like Nexus 7 (2012) that only
		// has front facing camera and no rear camera.
		TiCameraActivity.getFrontCameraId();
		TiCameraActivity.getBackCameraId();
		if (backCameraId == Integer.MIN_VALUE && frontCameraId != Integer.MIN_VALUE) {
			TiCameraActivity.whichCamera = MediaModule.CAMERA_FRONT;
		}
	}

	private static int getFrontCameraId()
	{
		if (frontCameraId == Integer.MIN_VALUE) {
			int count = Camera.getNumberOfCameras();
			for (int i = 0; i < count; i++) {
				CameraInfo info = new CameraInfo();
				Camera.getCameraInfo(i, info);
				if (info.facing == CameraInfo.CAMERA_FACING_FRONT) {
					frontCameraId = i;
					break;
				}
			}
		}

		return frontCameraId;
	}

	private static int getBackCameraId()
	{
		if (backCameraId == Integer.MIN_VALUE) {
			int count = Camera.getNumberOfCameras();
			for (int i = 0; i < count; i++) {
				CameraInfo info = new CameraInfo();
				Camera.getCameraInfo(i, info);
				if (info.facing == CameraInfo.CAMERA_FACING_BACK) {
					backCameraId = i;
					break;
				}
			}
		}

		return backCameraId;
	}

	private void openCamera()
	{
		openCamera(Integer.MIN_VALUE);
	}

	private void openCamera(int cameraId)
	{
		if (previewRunning) {
			stopPreview();
		}

		if (camera != null) {
			camera.release();
			camera = null;
		}

		try {
			if (cameraId == Integer.MIN_VALUE) {
				camera = Camera.open();
			} else {
				camera = Camera.open(cameraId);
			}
		} catch (Exception e) {
			String errorMessage =
				"Could not open camera. "
				+ "Camera may be in use by another process or device policy manager has disabled the camera.";
			Log.e(TAG, errorMessage, e);
		}

		if (camera == null) {
			onError(MediaModule.UNKNOWN_ERROR, "Unable to access the camera.");
			finish();
			return;
		}

		supportedPreviewSizes = camera.getParameters().getSupportedPreviewSizes();
		supportedVideoSizes = camera.getParameters().getSupportedVideoSizes();
		if (supportedVideoSizes == null) {
			supportedVideoSizes = camera.getParameters().getSupportedPreviewSizes();
		}
		optimalPreviewSize = null; // Re-calc'd in PreviewLayout.onMeasure.
		optimalVideoSize = null;   // Re-calc'd in PreviewLayout.onMeasure.
	}

	protected void switchCamera(int whichCamera)
	{
		boolean front = whichCamera == MediaModule.CAMERA_FRONT;
		int frontId = Integer.MIN_VALUE; // no-val

		if (front) {
			frontId = getFrontCameraId();
			if (frontId == Integer.MIN_VALUE) {
				Log.e(TAG, "switchCamera cancelled because this device has no front camera.");
				return;
			}
		}

		TiCameraActivity.whichCamera = whichCamera;

		if (front) {
			openCamera(frontId);
		} else {
			openCamera();
		}

		if (camera == null) {
			return;
		}

		// Force the onMeasure of PreviewLayout, so aspect ratio, best
		// dimensions, etc. can be setup for camera preview. And specify
		// a runnable that will be called after the previewLayout
		// measures. The runnable will start the camera preview.
		// This all guarantees us that the camera preview won't start until
		// after the layout has been measured.
		previewLayout.prepareNewPreview(() -> {
			startPreview(preview.getHolder());
		});
	}

	@Override
	public void onBackPressed()
	{
		if (androidbackCallback != null) {
			KrollDict response = new KrollDict();
			response.putCodeAndMessage(-1, "User pressed androidback");
			androidbackCallback.callAsync(callbackContext, response);
		} else {
			if (cancelCallback != null) {
				KrollDict response = new KrollDict();
				response.putCodeAndMessage(-1, "User cancelled the request");
				cancelCallback.callAsync(callbackContext, response);
			}
			finish();
		}
	}

	@Override
	public boolean onKeyDown(int keyCode, KeyEvent event)
	{
		// Workaround for http://code.google.com/p/android/issues/detail?id=61394
		if (keyCode == KeyEvent.KEYCODE_MENU) {
			return true;
		}

		return super.onKeyDown(keyCode, event);
	}
}
