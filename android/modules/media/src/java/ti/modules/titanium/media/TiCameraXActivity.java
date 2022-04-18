/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012-2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;
import androidx.camera.camera2.Camera2Config;
import androidx.camera.core.Camera;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.CameraXConfig;
import androidx.camera.core.ImageCapture;
import androidx.camera.core.ImageCapture.OnImageSavedCallback;
import androidx.camera.core.ImageCapture.OutputFileOptions;
import androidx.camera.core.ImageCaptureException;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.video.FallbackStrategy;
import androidx.camera.video.FileOutputOptions;
import androidx.camera.video.MediaStoreOutputOptions;
import androidx.camera.video.PendingRecording;
import androidx.camera.video.Quality;
import androidx.camera.video.QualitySelector;
import androidx.camera.video.Recorder;
import androidx.camera.video.Recording;
import androidx.camera.video.RecordingStats;
import androidx.camera.video.VideoCapture;
import androidx.camera.video.VideoRecordEvent;
import androidx.camera.view.PreviewView;
import androidx.core.content.ContextCompat;
import androidx.core.util.Consumer;

import com.google.common.util.concurrent.ListenableFuture;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiRHelper;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

public class TiCameraXActivity extends TiBaseActivity implements CameraXConfig.Provider
{
	private static final String TAG = "TiCameraXActivity";
	private static final Executor executor = Executors.newSingleThreadExecutor();
	private static final Uri videoUri = null;
	public static boolean autohide = true;
	public static int cameraFlashMode = ImageCapture.FLASH_MODE_OFF;
	public static int whichCamera = MediaModule.CAMERA_REAR;
	public static TiViewProxy overlayProxy = null;
	public static TiCameraXActivity cameraActivity = null;
	public static KrollObject callbackContext;
	public static KrollFunction successCallback, errorCallback, cancelCallback, androidbackCallback;
	public static KrollFunction recordingCallback;
	public static String mediaType = MediaModule.MEDIA_TYPE_PHOTO;
	public static boolean saveToPhotoGallery = false;
	public static int videoMaximumDuration = 0;
	public static long videoMaximumSize = 0;
	public static int videoQuality = MediaModule.QUALITY_HD;
	static Recording recording;
	static PendingRecording pendingRecording;
	static String mediaTitle = "";
	static ContentResolver contentResolver = TiApplication.getInstance().getContentResolver();
	private static ImageCapture imageCapture;
	private static VideoCapture videoCapture;
	private static boolean isRecording = false;
	PreviewView viewFinder;
	Preview preview;
	int lensFacing = CameraSelector.LENS_FACING_BACK;
	FrameLayout layout;
	private TiViewProxy localOverlayProxy = null;
	private ProcessCameraProvider cameraProvider;

	public static void takePicture()
	{
		try {
			File file = null;
			String imageName = createExternalMediaName() + ".jpg";
			OutputFileOptions outputFileOptions = null;
			if (saveToPhotoGallery) {
				ContentValues contentValues = new ContentValues();
				contentValues.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
				contentValues.put(MediaStore.Images.Media.DISPLAY_NAME, imageName);
				outputFileOptions = new ImageCapture.OutputFileOptions.Builder(contentResolver,
					MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues).build();

			} else {
				file = TiFileHelper.getInstance().getTempFile(".jpg", true);
				outputFileOptions = new OutputFileOptions.Builder(file).build();
			}

			imageCapture.takePicture(outputFileOptions, executor, new OnImageSavedCallback()
			{
				@Override
				public void onImageSaved(ImageCapture.OutputFileResults outputFileResults)
				{
					if (successCallback != null) {
						Uri outputUri = outputFileResults.getSavedUri();
						if (outputUri.toString().startsWith("content://")) {
							String name = "";
							String path = "";

							Uri mediaUri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
							String[] columns = {
								MediaStore.Images.Media.DISPLAY_NAME,
								MediaStore.Images.Media.DATA
							};
							String[] selectionArgs = { imageName };
							String queryString = MediaStore.Images.ImageColumns.DISPLAY_NAME + " = ? ";
							Cursor cursor = contentResolver.query(mediaUri, columns, queryString, selectionArgs, null);
							if ((cursor != null) && cursor.moveToNext()) {
								name = getStringFrom(cursor, 0);
								path = getStringFrom(cursor, 1);
							}

							if (name != null && !name.equals("")) {
								TiBlob blob = TiBlob.blobFromFile(TiFileFactory.createTitaniumFile(path, false));
								KrollDict response = MediaModule.createDictForImage(blob, blob.getMimeType());
								successCallback.callAsync(callbackContext, response);
							}
						} else {
							// normal file
							File file = new File(outputUri.getPath());
							TiBlob blob = TiBlob.blobFromFile(TiFileFactory.createTitaniumFile(file.getPath(), false));
							KrollDict response = MediaModule.createDictForImage(blob, blob.getMimeType());
							successCallback.callAsync(callbackContext, response);
						}

						if (cameraActivity != null && autohide) {
							cameraActivity.finish();
						}
					}
				}

				@Override
				public void onError(ImageCaptureException error)
				{
					if (errorCallback == null) {
						Log.e(TAG, error.toString());
						return;
					}

					KrollDict dict = new KrollDict();
					dict.putCodeAndMessage(error.getImageCaptureError(), error.toString());
					dict.put(TiC.PROPERTY_MESSAGE, error.toString());
					errorCallback.callAsync(callbackContext, dict);
				}
			});
		} catch (Exception ex) {
			KrollDict dict = new KrollDict();
			dict.put(TiC.PROPERTY_MESSAGE, "Error taking a picture");
			errorCallback.callAsync(callbackContext, dict);
		}
	}

	@SuppressLint("MissingPermission")
	public static void startVideoCapture()
	{
		KrollDict recordingDict = new KrollDict();

		Consumer<VideoRecordEvent> vre = videoRecordEvent -> {
			if (videoRecordEvent instanceof VideoRecordEvent.Start) {
				// Handle the start of a new active recording
			} else if (videoRecordEvent instanceof VideoRecordEvent.Pause) {
				// Handle the case where the active recording is paused
			} else if (videoRecordEvent instanceof VideoRecordEvent.Resume) {
				// Handles the case where the active recording is resumed
			} else if (videoRecordEvent instanceof VideoRecordEvent.Finalize) {
				VideoRecordEvent.Finalize finalizeEvent =
					(VideoRecordEvent.Finalize) videoRecordEvent;
				// Handles a finalize event for the active recording, checking Finalize.getError()
				int error = finalizeEvent.getError();
				if (error != VideoRecordEvent.Finalize.ERROR_NONE) {
					// error
				}
				Uri uri = finalizeEvent.getOutputResults().getOutputUri();

				if (uri.toString().startsWith("content://")) {
					String path = "";
					String name = "";

					Uri mediaUri = MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
					String[] columns = {
						MediaStore.Video.VideoColumns.TITLE,
						MediaStore.Video.VideoColumns.DATA
					};
					String[] selectionArgs = { mediaTitle };
					String queryString = MediaStore.Video.VideoColumns.TITLE + " = ? ";
					Cursor cursor = contentResolver.query(mediaUri, columns, queryString, selectionArgs, null);
					if ((cursor != null) && cursor.moveToNext()) {
						name = getStringFrom(cursor, 0);
						path = getStringFrom(cursor, 1);
					}

					if (path != null && !path.equals("")) {
						TiBlob blob = TiBlob.blobFromFile(TiFileFactory.createTitaniumFile(path, false));
						KrollDict response = MediaModule.createDictForImage(blob, blob.getMimeType());
						successCallback.callAsync(callbackContext, response);
					}
				} else {
					// normal file
					File file = new File(uri.getPath());
					TiBlob blob = TiBlob.blobFromFile(TiFileFactory.createTitaniumFile(file.getPath(), false));
					KrollDict response = MediaModule.createDictForImage(blob, blob.getMimeType());
					successCallback.callAsync(callbackContext, response);
				}

				if (cameraActivity != null && autohide) {
					if (recording != null) {
						recording.close();
						recording = null;
					}
					cameraActivity.finish();
				}
			}
			// All events, including VideoRecordEvent.Status, contain RecordingStats.
			// This can be used to update the UI or track the recording duration.
			RecordingStats recordingStats = videoRecordEvent.getRecordingStats();
			long recordingTime = (recordingStats.getRecordedDurationNanos() / 1000 / 1000);
			if (isRecording && videoMaximumDuration > 0 && recordingTime >= videoMaximumDuration) {
				stopVideoCapture();
			}
			if (isRecording && recordingCallback != null) {
				recordingDict.put("duration", recordingTime);
				recordingDict.put("size", recordingStats.getNumBytesRecorded());
				recordingCallback.callAsync(callbackContext, recordingDict);
			}
		};

		if (cameraActivity.hasAudioRecorderPermissions()) {
			recording = pendingRecording.withAudioEnabled().start(executor, vre);
			isRecording = true;
		} else {
			recording = pendingRecording.start(executor, vre);
			isRecording = true;
		}
	}

	public static void pauseVideoCapture()
	{
		if (recording != null) recording.pause();
		isRecording = false;
	}

	public static void resumeVideoCapture()
	{
		if (recording != null) recording.resume();
		isRecording = true;
	}

	public static void stopVideoCapture()
	{
		if (recording != null) recording.stop();
		isRecording = false;
	}

	public static void setFlashMode(int cameraFlashMode)
	{
	}

	public static void hide()
	{
		if (recording != null) {
			recording.close();
			recording = null;
		}
		if (cameraActivity != null) {
			cameraActivity.finish();
		}
	}

	private static String createExternalMediaName()
	{
		TiApplication app = TiApplication.getInstance();
		String normalizedAppName = app.getAppInfo().getName();
		normalizedAppName = normalizedAppName.replaceAll("[^\\w.-]", "_");
		return normalizedAppName + "_" + (new SimpleDateFormat("yyyyMMdd_HHmmssSSS")).format(new Date());
	}

	private static String getStringFrom(Cursor cursor, int columnIndex)
	{
		String result = null;
		if ((cursor != null) && (columnIndex >= 0)) {
			try {
				if (cursor.getType(columnIndex) == Cursor.FIELD_TYPE_STRING) {
					result = cursor.getString(columnIndex);
				}
			} catch (Exception ex) {
			}
		}
		return result;
	}

	@Override
	protected void onCreate(Bundle savedInstanceState)
	{
		getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
		super.onCreate(savedInstanceState);

		localOverlayProxy = overlayProxy;

		try {
			int idLayout = TiRHelper.getResource("layout.titanium_ui_camera");
			int idPreview = TiRHelper.getResource("id.view_finder");

			layout =
				(FrameLayout) TiApplication.getAppCurrentActivity().getLayoutInflater().inflate(idLayout, null, false);
			viewFinder = layout.findViewById(idPreview);
			setContentView(layout);

			boolean front = whichCamera == MediaModule.CAMERA_FRONT;
			if (front) {
				lensFacing = CameraSelector.LENS_FACING_FRONT;
			} else {
				lensFacing = CameraSelector.LENS_FACING_BACK;
			}

			startCamera();
		} catch (TiRHelper.ResourceNotFoundException e) {
			//
			Log.e(TAG, "Can't create camera.");
		}
	}

	@SuppressLint({ "RestrictedApi", "CheckResult" })
	private void startCamera()
	{
		int rotation = getWindowManager().getDefaultDisplay().getRotation();

		Activity activity = TiApplication.getAppCurrentActivity();
		ListenableFuture cameraProviderFuture = ProcessCameraProvider.getInstance(activity);
		cameraProviderFuture.addListener(() -> {
			try {
				preview = new Preview.Builder().build();
				cameraProvider = (ProcessCameraProvider) cameraProviderFuture.get();
				CameraSelector cameraSelector = new CameraSelector.Builder().requireLensFacing(lensFacing).build();

				if (MediaModule.MEDIA_TYPE_VIDEO.equals(mediaType)) {
					// video

					Quality quality = Quality.HD;
					if (videoQuality == MediaModule.QUALITY_UHD) {
						quality = Quality.UHD;
					} else if (videoQuality == MediaModule.QUALITY_HD || videoQuality == MediaModule.QUALITY_LOW
						|| videoQuality == MediaModule.QUALITY_IFRAME_1280x720) {
						quality = Quality.HD;
					} else if (videoQuality == MediaModule.QUALITY_SD || videoQuality == MediaModule.QUALITY_640x480) {
						quality = Quality.SD;
					} else if (videoQuality == MediaModule.QUALITY_FHD || videoQuality == MediaModule.QUALITY_HIGH) {
						quality = Quality.FHD;
					}
					QualitySelector qualitySelector = QualitySelector.from(quality,
						FallbackStrategy.higherQualityOrLowerThan(Quality.SD));
					Recorder recorder = new Recorder.Builder()
						.setQualitySelector(qualitySelector)
						.build();
					VideoCapture<Recorder> videoCapture;
					if (saveToPhotoGallery) {
						// save to gallery / media storage folder
						ContentValues contentValues = new ContentValues();
						mediaTitle = createExternalMediaName();
						contentValues.put(MediaStore.MediaColumns.TITLE, mediaTitle);
						contentValues.put(MediaStore.MediaColumns.DISPLAY_NAME, mediaTitle);
						contentValues.put(MediaStore.MediaColumns.MIME_TYPE, "video/mp4");
						MediaStoreOutputOptions.Builder mediaStoreOutputOptions;
						mediaStoreOutputOptions =
							new MediaStoreOutputOptions.Builder(TiApplication.getAppRootOrCurrentActivity()
								.getContentResolver(), MediaStore.Video.Media.EXTERNAL_CONTENT_URI)
								.setContentValues(contentValues);
						if (videoMaximumSize > 0) {
							mediaStoreOutputOptions.setFileSizeLimit(videoMaximumSize);
						}
						videoCapture = VideoCapture.withOutput(recorder);
						pendingRecording = videoCapture.getOutput()
							.prepareRecording(activity, mediaStoreOutputOptions.build());
					} else {
						// save to file
						File moviesDir = TiApplication.getAppRootOrCurrentActivity()
							.getExternalFilesDir(Environment.DIRECTORY_MOVIES);
						moviesDir.mkdirs();
						File videoFile = new File(moviesDir, createExternalMediaName() + ".mp4");
						FileOutputOptions.Builder fileOutputOptions = new FileOutputOptions.Builder(videoFile);
						if (videoMaximumSize > 0) {
							fileOutputOptions.setFileSizeLimit(videoMaximumSize);
						}
						videoCapture = VideoCapture.withOutput(recorder);
						pendingRecording = videoCapture.getOutput()
							.prepareRecording(activity, fileOutputOptions.build());
					}

					Camera camera = cameraProvider.bindToLifecycle(this, cameraSelector, videoCapture, preview);
				} else {
					// photo
					imageCapture =
						new ImageCapture.Builder().setFlashMode(cameraFlashMode).setTargetRotation(rotation).build();

					Camera camera = cameraProvider.bindToLifecycle(this, cameraSelector, imageCapture, preview);
				}
				preview.setSurfaceProvider(viewFinder.getSurfaceProvider());
			} catch (InterruptedException | ExecutionException e) {
				// Currently no exceptions thrown. cameraProviderFuture.get()
				// shouldn't block since the listener is being called, so no need to
				// handle InterruptedException.
			}
		}, ContextCompat.getMainExecutor(activity));
	}

	@Override
	protected void onResume()
	{
		super.onResume();
		cameraActivity = this;
		if (localOverlayProxy != null) {
			View overlayView = localOverlayProxy.getOrCreateView().getNativeView();
			ViewGroup parent = (ViewGroup) overlayView.getParent();
			if (parent != null) {
				parent.removeView(overlayView);
			}
			layout.addView(overlayView, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT,
				FrameLayout.LayoutParams.MATCH_PARENT));
		}
	}

	@Override
	protected void onDestroy()
	{
		// Release our camera activity reference.
		if (cameraActivity == this) {
			cameraActivity = null;
		}
		if (recording != null) {
			recording.close();
			recording = null;
		}
		if (pendingRecording != null) {
			pendingRecording = null;
		}
		// Destroy this activity.
		super.onDestroy();
	}

	@Override
	public void finish()
	{
		overlayProxy = null;
		super.finish();
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

	protected void switchCamera(int whichCamera)
	{
		if (isRecording) {
			// don't switch cameras during video recording
			return;
		}

		boolean front = whichCamera == MediaModule.CAMERA_FRONT;
		if (front) {
			lensFacing = CameraSelector.LENS_FACING_FRONT;
		} else {
			lensFacing = CameraSelector.LENS_FACING_BACK;
		}
		cameraProvider.unbindAll();
		startCamera();
	}

	@NonNull
	@Override
	public CameraXConfig getCameraXConfig()
	{
		return Camera2Config.defaultConfig();
	}

	private boolean hasAudioRecorderPermissions()
	{
		if (Build.VERSION.SDK_INT < 23) {
			return true;
		}
		int status = TiApplication.getInstance().checkSelfPermission(Manifest.permission.RECORD_AUDIO);
		return (status == PackageManager.PERMISSION_GRANTED);
	}
}
