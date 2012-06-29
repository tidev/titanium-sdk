package ti.modules.titanium.media;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.hardware.Camera;
import android.hardware.Camera.PictureCallback;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.ViewGroup.LayoutParams;
import android.widget.FrameLayout;

public class TiCameraActivity extends TiBaseActivity implements SurfaceHolder.Callback {
	private static final String LCAT = "TiCameraActivity";
	private static Camera camera;

	private TiViewProxy localOverlayProxy = null;
	private SurfaceView preview;
	private FrameLayout previewLayout;

	public static TiViewProxy overlayProxy = null;
	public static TiCameraActivity cameraActivity = null;

	public static KrollObject callbackContext;
	public static KrollFunction successCallback, errorCallback, cancelCallback;
	public static boolean saveToPhotoGallery = false;

	@Override
	public void onCreate(Bundle savedInstanceState) {
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
		previewLayout = new FrameLayout(this);

		setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
		setContentView(previewLayout);
	}

	public void surfaceChanged(SurfaceHolder previewHolder, int format, int width, int height) {
		camera.startPreview();  // make sure setPreviewDisplay is called before this
	}

	public void surfaceCreated(SurfaceHolder previewHolder) {
		camera = Camera.open();

		/*
		 * Disabling this since it can end up picking a bad preview
		 * size which can create stretching issues (TIMOB-8151).
		 * Original words of wisdom left by some unknown person:
		 * "using default preview size may be causing problem on some devices, setting dimensions manually"
		 * We may want to expose camera parameters to the developer for extra control.
		Parameters cameraParams = camera.getParameters();
		Camera.Size previewSize = cameraParams.getSupportedPreviewSizes().get((cameraParams.getSupportedPreviewSizes().size()) - 1);
		cameraParams.setPreviewSize(previewSize.width, previewSize.height );
		camera.setParameters(cameraParams);
		*/

		try {
			camera.setPreviewDisplay(previewHolder);

		} catch(IOException e) {
			onError(MediaModule.UNKNOWN_ERROR, "Unable to setup preview surface: " + e.getMessage());
			cancelCallback = null;
			finish();
			return;
		}
	}

	// make sure to call release() otherwise you will have to force kill the app before 
	// the built in camera will open
	public void surfaceDestroyed(SurfaceHolder previewHolder) {
		camera.release();
		camera = null;
	}

	@Override
	protected void onResume() {
		super.onResume();

		cameraActivity = this;
		previewLayout.addView(preview);
		previewLayout.addView(localOverlayProxy.getOrCreateView().getNativeView(), new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT));
	}

	@Override
	protected void onPause() {
		super.onPause();

		previewLayout.removeView(preview);
		previewLayout.removeView(localOverlayProxy.getOrCreateView().getNativeView());

		try {
			camera.release();
			camera = null;
		} catch (Throwable t) {
			Log.d(LCAT, "Camera is not open, unable to release");
		}

		cameraActivity = null;
	}

	@Override
	protected void onDestroy() {
		super.onDestroy();

		if (cancelCallback != null) {
			cancelCallback.callAsync(callbackContext, new Object[] { });
		}
	}

	private static void onError(int code, String message) {
		if (errorCallback == null) {
			Log.e(LCAT, message);
			return;
		}

		KrollDict dict = new KrollDict();
		dict.put(TiC.PROPERTY_CODE, code);
		dict.put(TiC.PROPERTY_MESSAGE, message);

		errorCallback.callAsync(callbackContext, dict);
	}

	private static void saveToPhotoGallery(byte[] data) {
		File imageFile = MediaModule.createGalleryImageFile();
		try {
			FileOutputStream imageOut = new FileOutputStream(imageFile);
			imageOut.write(data);
			imageOut.close();

		} catch (FileNotFoundException e) {
			Log.e(LCAT, "Failed to open gallery image file: " + e.getMessage());

		} catch (IOException e) {
			Log.e(LCAT, "Failed to write image to gallery file: " + e.getMessage());
		}

		// Notify media scanner to add image to gallery.
		Intent mediaScanIntent = new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE);
		Uri contentUri = Uri.fromFile(imageFile);
		mediaScanIntent.setData(contentUri);
		Activity activity = TiApplication.getAppCurrentActivity();
		activity.sendBroadcast(mediaScanIntent);
	}

	static public void takePicture() {
		camera.takePicture(null, null, jpegCallback);
	}

	static PictureCallback jpegCallback = new PictureCallback() {
		public void onPictureTaken(byte[] data, Camera camera) {
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
