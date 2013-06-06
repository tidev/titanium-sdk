/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.List;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.hardware.Camera;
import android.hardware.Camera.AutoFocusCallback;
import android.hardware.Camera.Parameters;
import android.hardware.Camera.PictureCallback;
import android.hardware.Camera.Size;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.Surface;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.ViewGroup.LayoutParams;
import android.widget.FrameLayout;

public class TiCameraActivity extends TiBaseActivity implements SurfaceHolder.Callback
{
	private static final String TAG = "TiCameraActivity";
	private static Camera camera;
	private static Size optimalPreviewSize;
	private static List<Size> supportedPreviewSizes;

	private TiViewProxy localOverlayProxy = null;
	private SurfaceView preview;
	private PreviewLayout previewLayout;
	private FrameLayout cameraLayout;
	private boolean previewRunning = false;
	private int currentRotation;

	public static TiViewProxy overlayProxy = null;
	public static TiCameraActivity cameraActivity = null;

	public static KrollObject callbackContext;
	public static KrollFunction successCallback, errorCallback, cancelCallback;
	public static boolean saveToPhotoGallery = false;

	private static class PreviewLayout extends FrameLayout
	{
		private double aspectRatio = 1;

		public PreviewLayout(Context context)
		{
			super(context);
		}

		@Override
		protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
		{
			int previewWidth = MeasureSpec.getSize(widthMeasureSpec);
			int previewHeight = MeasureSpec.getSize(heightMeasureSpec);

			// Set the preview size to the most optimal given the target size
			optimalPreviewSize = getOptimalPreviewSize(supportedPreviewSizes, previewWidth, previewHeight);
			if (optimalPreviewSize != null) {
				if (previewWidth > previewHeight) {
					aspectRatio = (double) optimalPreviewSize.width / optimalPreviewSize.height;
				} else {
					aspectRatio = (double) optimalPreviewSize.height / optimalPreviewSize.width;
				}
			}

			// Resize the preview frame with correct aspect ratio.
			if (previewWidth > previewHeight * aspectRatio) {
				previewWidth = (int) (previewHeight * aspectRatio + .5);

			} else {
				previewHeight = (int) (previewWidth / aspectRatio + .5);
			}

			super.onMeasure(MeasureSpec.makeMeasureSpec(previewWidth, MeasureSpec.EXACTLY),
				MeasureSpec.makeMeasureSpec(previewHeight, MeasureSpec.EXACTLY));
		}
	}

	@Override
	public void onCreate(Bundle savedInstanceState)
	{
		super.onCreate(savedInstanceState);

		// create camera preview
		preview = new SurfaceView(this);
		SurfaceHolder previewHolder = preview.getHolder();
		previewHolder.addCallback(this);
		previewHolder.setType(SurfaceHolder.SURFACE_TYPE_PUSH_BUFFERS);

		// set preview overlay
		localOverlayProxy = overlayProxy;
		overlayProxy = null; // clear the static object once we have a local reference

		// set overall layout - will populate in onResume
		previewLayout = new PreviewLayout(this);
		cameraLayout = new FrameLayout(this);
		cameraLayout.setBackgroundColor(Color.BLACK);
		cameraLayout.addView(previewLayout, new FrameLayout.LayoutParams(LayoutParams.MATCH_PARENT,
			LayoutParams.MATCH_PARENT, Gravity.CENTER));

		setContentView(cameraLayout);

		camera = Camera.open();
		if (camera != null) {
			supportedPreviewSizes = camera.getParameters().getSupportedPreviewSizes();
		} else {
			onError(MediaModule.UNKNOWN_ERROR, "Unable to access the first back-facing camera.");
			finish();
		}
	}

	public void surfaceChanged(SurfaceHolder previewHolder, int format, int width, int height)
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

		currentRotation = rotation;
		Parameters param = camera.getParameters();
		int orientation = TiApplication.getInstance().getResources().getConfiguration().orientation;
		// The camera preview is always displayed in landscape mode. Need to rotate the preview according to
		// the current orientation of the device.
		switch (rotation) {
			case Surface.ROTATION_0:
				if (orientation == Configuration.ORIENTATION_PORTRAIT) {
					// The "natural" orientation of the device is a portrait orientation, eg. phones.
					// Need to rotate 90 degrees.
					camera.setDisplayOrientation(90);
				} else {
					// The "natural" orientation of the device is a landscape orientation, eg. tablets.
					// Set the camera to the starting position (0 degree).
					camera.setDisplayOrientation(0);
				}
				break;
			case Surface.ROTATION_90:
				if (orientation == Configuration.ORIENTATION_LANDSCAPE) {
					camera.setDisplayOrientation(0);
				} else {
					camera.setDisplayOrientation(270);
				}
				break;
			case Surface.ROTATION_180:
				if (orientation == Configuration.ORIENTATION_PORTRAIT) {
					camera.setDisplayOrientation(270);
				} else {
					camera.setDisplayOrientation(180);
				}
				break;
			case Surface.ROTATION_270:
				if (orientation == Configuration.ORIENTATION_LANDSCAPE) {
					camera.setDisplayOrientation(180);
				} else {
					camera.setDisplayOrientation(90);
				}
				break;
		}

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
			camera.setParameters(param);
		}

		try {
			camera.setPreviewDisplay(previewHolder);
			previewRunning = true;
			camera.startPreview();
		} catch (Exception e) {
			onError(MediaModule.UNKNOWN_ERROR, "Unable to setup preview surface: " + e.getMessage());
			finish();
			return;
		}
	}

	public void surfaceCreated(SurfaceHolder previewHolder)
	{
		try {
			camera.setPreviewDisplay(previewHolder);
		} catch (Exception e) {
			onError(MediaModule.UNKNOWN_ERROR, "Unable to setup preview surface: " + e.getMessage());
			cancelCallback = null;
			finish();
			return;
		}
		currentRotation = getWindowManager().getDefaultDisplay().getRotation();
	}

	// make sure to call release() otherwise you will have to force kill the app before
	// the built in camera will open
	public void surfaceDestroyed(SurfaceHolder previewHolder)
	{
		stopPreview();
		if (camera != null) {
			camera.release();
			camera = null;
		}
	}

	@Override
	protected void onResume()
	{
		super.onResume();

		cameraActivity = this;
		previewLayout.addView(preview, new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT));
		cameraLayout.addView(localOverlayProxy.getOrCreateView().getNativeView(), new FrameLayout.LayoutParams(
			LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT));
	}

	@Override
	protected void onPause()
	{
		super.onPause();

		stopPreview();
		previewLayout.removeView(preview);
		cameraLayout.removeView(localOverlayProxy.getOrCreateView().getNativeView());

		try {
			camera.release();
			camera = null;
		} catch (Throwable t) {
			Log.d(TAG, "Camera is not open, unable to release", Log.DEBUG_MODE);
		}

		cameraActivity = null;
	}

	private void stopPreview()
	{
		if (camera == null || !previewRunning) {
			return;
		}

		camera.stopPreview();
		previewRunning = false;
	}

	/**
	 * Computes the optimal preview size given the target display size and aspect ratio.
	 * 
	 * @param supportPreviewSizes
	 *            a list of preview sizes the camera supports
	 * @param targetSize
	 *            the target display size that will render the preview
	 * @return the optimal size of the preview
	 */
	private static Size getOptimalPreviewSize(List<Size> sizes, int w, int h)
	{
		final double ASPECT_TOLERANCE = 0.01;
		double targetRatio = (double) w / h;
		if (sizes == null) {
			return null;
		}
		Size optimalSize = null;
		double minDiff = Double.MAX_VALUE;

		int targetHeight = h;

		// Try to find an size match aspect ratio and size
		for (Size size : sizes) {
			double ratio = (double) size.width / size.height;
			if (Math.abs(ratio - targetRatio) > ASPECT_TOLERANCE) {
				continue;
			}
			if (Math.abs(size.height - targetHeight) < minDiff) {
				optimalSize = size;
				minDiff = Math.abs(size.height - targetHeight);
			}
		}

		// Cannot find the one match the aspect ratio, ignore the requirement
		if (optimalSize == null) {
			Log.w(TAG, "No preview size found that matches the aspect ratio.", Log.DEBUG_MODE);
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

	private static void saveToPhotoGallery(byte[] data)
	{
		File imageFile = MediaModule.createGalleryImageFile();
		try {
			FileOutputStream imageOut = new FileOutputStream(imageFile);
			imageOut.write(data);
			imageOut.close();

		} catch (FileNotFoundException e) {
			Log.e(TAG, "Failed to open gallery image file: " + e.getMessage());

		} catch (IOException e) {
			Log.e(TAG, "Failed to write image to gallery file: " + e.getMessage());
		}

		// Notify media scanner to add image to gallery.
		Intent mediaScanIntent = new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE);
		Uri contentUri = Uri.fromFile(imageFile);
		mediaScanIntent.setData(contentUri);
		Activity activity = TiApplication.getAppCurrentActivity();
		activity.sendBroadcast(mediaScanIntent);
	}

	static public void takePicture()
	{
		String focusMode = camera.getParameters().getFocusMode();
		if (!(focusMode.equals(Parameters.FOCUS_MODE_EDOF) || focusMode.equals(Parameters.FOCUS_MODE_FIXED) || focusMode
			.equals(Parameters.FOCUS_MODE_INFINITY))) {
			AutoFocusCallback focusCallback = new AutoFocusCallback()
			{
				public void onAutoFocus(boolean success, Camera camera)
				{
					// Take the picture when the camera auto focus completes.
					camera.takePicture(null, null, jpegCallback);
				}
			};
			camera.autoFocus(focusCallback);
		} else {
			camera.takePicture(null, null, jpegCallback);
		}
	}

	static PictureCallback jpegCallback = new PictureCallback()
	{
		public void onPictureTaken(byte[] data, Camera camera)
		{
			if (saveToPhotoGallery) {
				saveToPhotoGallery(data);
			}

			if (successCallback != null) {
				TiBlob imageData = TiBlob.blobFromData(data);
				KrollDict dict = MediaModule.createDictForImage(imageData, "image/jpeg");
				successCallback.callAsync(callbackContext, dict);
			}

			cancelCallback = null;
			cameraActivity.finish();
		}
	};
}
