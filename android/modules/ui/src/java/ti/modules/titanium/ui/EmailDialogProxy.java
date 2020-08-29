/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiApplication.ActivityTransitionListener;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.io.TiFileProvider;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiActivityResultHandler;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiMimeTypeHelper;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.filesystem.FileProxy;
import android.app.Activity;
import android.content.ClipData;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.text.Html;

@Kroll.proxy(creatableInModule = UIModule.class,
	propertyAccessors = {
		"bccRecipients",
		"ccRecipients",
		"html",
		"messageBody",
		"subject",
		"toRecipients"
})
public class EmailDialogProxy extends TiViewProxy implements ActivityTransitionListener
{

	private static final String TAG = "EmailDialogProxy";

	@Kroll.constant
	public static final int CANCELLED = 0;
	@Kroll.constant
	public static final int SAVED = 1;
	@Kroll.constant
	public static final int SENT = 2;
	@Kroll.constant
	public static final int FAILED = 3;

	private ArrayList<Object> attachments;
	private String privateDataDirectoryPath = null;

	public EmailDialogProxy()
	{
		super();

		TiBaseFile privateDataDirectory = TiFileFactory.createTitaniumFile("appdata-private:///", false);
		privateDataDirectoryPath = privateDataDirectory.getNativeFile().getAbsolutePath();
	}

	@Kroll.method
	public boolean isSupported()
	{
		boolean supported = false;
		Activity activity = TiApplication.getAppRootOrCurrentActivity();
		if (activity != null) {
			PackageManager pm = activity.getPackageManager();
			if (pm != null) {
				Intent intent = buildIntent();
				List<ResolveInfo> activities = pm.queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY);
				if (activities != null && activities.size() > 0) {
					supported = true;
					Log.d(TAG, "Number of activities that support ACTION_SEND: " + activities.size(), Log.DEBUG_MODE);
				}
			}
		}

		return supported;
	}

	@Kroll.method
	public void addAttachment(Object attachment)
	{
		if (attachment instanceof FileProxy || attachment instanceof TiBlob) {
			if (attachments == null) {
				attachments = new ArrayList<Object>();
			}
			attachments.add(attachment);
		} else {
			// silently ignore?
			Log.d(TAG,
				  "addAttachment for type " + attachment.getClass().getName()
					  + " ignored. Only files and blobs may be attached.",
				  Log.DEBUG_MODE);
		}
	}

	private Intent buildIntent()
	{
		ArrayList<Uri> uris = getAttachmentUris();
		boolean isHtml = TiConvert.toBoolean(getProperty("html"), false);
		Intent sendIntent =
			new Intent((uris != null && uris.size() > 1) ? Intent.ACTION_SEND_MULTIPLE : Intent.ACTION_SEND);
		sendIntent.setType("message/rfc822");
		putAddressExtra(sendIntent, Intent.EXTRA_EMAIL, "toRecipients");
		putAddressExtra(sendIntent, Intent.EXTRA_CC, "ccRecipients");
		putAddressExtra(sendIntent, Intent.EXTRA_BCC, "bccRecipients");
		putStringExtra(sendIntent, Intent.EXTRA_SUBJECT, "subject");
		putStringExtra(sendIntent, Intent.EXTRA_TEXT, "messageBody", isHtml);
		prepareAttachments(sendIntent, uris);

		Log.d(TAG, "Choosing for mime type " + sendIntent.getType(), Log.DEBUG_MODE);

		return sendIntent;
	}

	@Kroll.method
	public void open()
	{
		if (TiApplication.isActivityTransition.get()) {
			TiApplication.addActivityTransitionListener(this);

		} else {
			doOpen();
		}
	}

	public void doOpen()
	{
		Intent sendIntent = buildIntent();
		Intent choosingIntent = Intent.createChooser(sendIntent, "Send");

		Activity activity = TiApplication.getAppCurrentActivity();
		if (activity != null) {
			TiActivitySupport activitySupport = (TiActivitySupport) activity;
			final int code = activitySupport.getUniqueResultCode();

			activitySupport.launchActivityForResult(choosingIntent, code, new TiActivityResultHandler() {
				@Override
				public void onResult(Activity activity, int requestCode, int resultCode, Intent data)
				{
					// ACTION_SEND does not set a result code (so the default of 0
					// is always returned. We'll neither confirm nor deny -- assume SENT
					// see http://code.google.com/p/android/issues/detail?id=5512
					KrollDict result = new KrollDict();
					result.put("result", SENT); // TODO fix this when figure out above
					result.putCodeAndMessage(TiC.ERROR_CODE_NO_ERROR, null);
					fireEvent("complete", result);
				}

				@Override
				public void onError(Activity activity, int requestCode, Exception e)
				{
					KrollDict result = new KrollDict();
					result.put("result", FAILED);
					result.putCodeAndMessage(TiC.ERROR_CODE_UNKNOWN, e.getMessage());
					fireEvent("complete", result);
				}
			});

		} else {
			Log.e(TAG, "Could not open email dialog, current activity is null.");
		}
	}

	private File blobToTemp(TiBlob blob, String fileName) throws Exception
	{
		Exception exception = null;
		File tempFile = null;

		// First, attempt to copy blob to a temp file under external storage.
		// Note: Read permission flags set on intent's attachments are temporary and will be lost
		//       when device is rebooted. So, external storage is preferred for continued access.
		try {
			boolean usePrivateDirectory = false;
			tempFile = blobToTemp(blob, fileName, usePrivateDirectory);
		} catch (Exception ex) {
			exception = ex;
		}

		// Fall-back to using app's sandboxed temp folder if unable to write to external storage.
		// This can happen if:
		// - External storage is not mounted. (ie: Doesn't exist or SD card was ejected.)
		// - App does not have write permission to external storage.
		// - External storage is full.
		if (tempFile == null) {
			try {
				boolean usePrivateDirectory = true;
				tempFile = blobToTemp(blob, fileName, usePrivateDirectory);
			} catch (Exception ex) {
				exception = ex;
			}
		}

		// Throw an exception if we've failed to write to temp file.
		if (tempFile == null) {
			if (exception == null) {
				exception = new Exception("Unknown error occurred.");
			}
			throw exception;
		}

		// We've successfully written the blob to temp directory. Return its file path.
		return tempFile;
	}

	private File blobToTemp(TiBlob blob, String fileName, boolean usePrivateDirectory) throws Exception
	{
		// Fetch a path to a temp directory that we have write access to.
		TiFileHelper fileHelper = TiFileHelper.getInstance();
		File tempFolder = new File(fileHelper.getDataDirectory(usePrivateDirectory), "temp");
		tempFolder.mkdirs();

		// Create temp file destination path.
		File tempfilej = new File(tempFolder, fileName);
		TiFile tempfile = new TiFile(tempfilej, tempfilej.getPath(), false);

		// Delete previous temp file, if it exists.
		if (tempfile.exists()) {
			tempfile.deleteFile();
		}

		// Copy given blob's contents to temp file.
		tempfile.write(blob, false);
		return tempfile.getNativeFile();
	}

	private File getAttachableFileFrom(FileProxy fileProxy)
	{
		Exception exception = null;
		File file = null;

		// First, attempt to copy the file to a public temp directory.
		// We only need to do this with sandboxed files.
		if (isPrivateData(fileProxy)) {
			try {
				file = blobToTemp(fileProxy.read(), fileProxy.getName());
			} catch (Exception ex) {
				exception = ex;
			}
		}

		// Use the given file path if we haven't copied it to a temp directory up above.
		// Note: Our content provider an provide access to sandboxed files too, but copying them to
		//       external storage is preferred since permission set by provider is temporary.
		if (file == null) {
			try {
				file = fileProxy.getBaseFile().getNativeFile();
			} catch (Exception ex) {
				exception = ex;
			}
		}

		// Log an error if failed to acquire an attachable file path.
		if (file == null) {
			if (exception == null) {
				exception = new Exception("Unknown error occurred.");
			}
			Log.e(TAG, "Unable to attach file " + fileProxy.getName() + ": " + exception.getMessage(), exception);
		}

		// Returns an attachable file path or null if failed.
		return file;
	}

	private File blobToFile(TiBlob blob)
	{
		// Some blobs refer to files (TYPE_FILE), such as a selection from
		// the photo gallery . If that's the case with this
		// blob, then just attach the file and be done with it.
		if (blob.getType() == TiBlob.TYPE_FILE) {
			return ((TiBaseFile) blob.getData()).getNativeFile();
		}

		// For non-file blobs, make a temp file and attach.
		File tempFile = null;
		try {
			String fileName = "attachment";
			String extension = TiMimeTypeHelper.getFileExtensionFromMimeType(blob.getMimeType(), "");
			if (extension.length() > 0) {
				fileName += "." + extension;
			}
			tempFile = blobToTemp(blob, fileName);
		} catch (Exception e) {
			Log.e(TAG, "Unable to attach blob: " + e.getMessage(), e);
		}
		return tempFile;
	}

	private Uri getAttachmentUri(Object attachment)
	{
		if (attachment instanceof FileProxy) {
			FileProxy fileProxy = (FileProxy) attachment;
			if (fileProxy.isFile()) {
				File file = getAttachableFileFrom(fileProxy);
				if (file != null) {
					return TiFileProvider.createUriFrom(file);
				}
			}
		} else if (attachment instanceof TiBlob) {
			File file = blobToFile((TiBlob) attachment);
			if (file != null) {
				return TiFileProvider.createUriFrom(file);
			}
		}
		return null;
	}

	private ArrayList<Uri> getAttachmentUris()
	{
		if (attachments == null) {
			return null;
		}
		ArrayList<Uri> uris = new ArrayList<Uri>();
		for (Object attachment : attachments) {
			Uri uri = getAttachmentUri(attachment);
			if (uri != null) {
				uris.add(uri);
			}
		}
		return uris;
	}

	private void prepareAttachments(Intent sendIntent, ArrayList<Uri> uris)
	{
		// Validate arguments.
		if ((sendIntent == null) || (uris == null) || (uris.size() <= 0)) {
			return;
		}

		// Attach files via the following intent extras. (This is always required.)
		if (uris.size() == 1) {
			sendIntent.putExtra(Intent.EXTRA_STREAM, uris.get(0));
		} else {
			sendIntent.putExtra(Intent.EXTRA_STREAM, uris);
		}

		// We must also copy the given file URIs to the intent's clip data as well.
		// Note: This is needed so that we can grant read-only access permissions below.
		ClipData clipData = null;
		for (Uri nextUri : uris) {
			if (nextUri != null) {
				if (clipData == null) {
					clipData = ClipData.newRawUri("", nextUri);
				} else {
					clipData.addItem(new ClipData.Item(nextUri));
				}
			}
		}
		if (clipData != null) {
			sendIntent.setClipData(clipData);
		}

		// Enable read-only access to the attached files to the app that consumes the intent.
		// Note: These flags only apply to intent's main data URI and clip data, not the EXTRA_STREAM.
		sendIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
	}

	private void putStringExtra(Intent intent, String extraType, String ourKey)
	{
		putStringExtra(intent, extraType, ourKey, false);
	}

	private void putStringExtra(Intent intent, String extraType, String ourkey, boolean encodeHtml)
	{
		if (this.hasProperty(ourkey)) {
			String text = TiConvert.toString(this.getProperty(ourkey));
			if (encodeHtml) {
				intent.putExtra(extraType, Html.fromHtml(text));
			} else {
				intent.putExtra(extraType, text);
			}
		}
	}

	private void putAddressExtra(Intent intent, String extraType, String ourkey)
	{
		Object testprop = this.getProperty(ourkey);
		if (testprop instanceof Object[]) {
			Object[] oaddrs = (Object[]) testprop;
			int len = oaddrs.length;
			String[] addrs = new String[len];
			for (int i = 0; i < len; i++) {
				addrs[i] = TiConvert.toString(oaddrs[i]);
			}
			intent.putExtra(extraType, addrs);
		}
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return null;
	}

	private boolean isPrivateData(FileProxy file)
	{
		if (file.isFile()) {
			if (file.getNativePath().contains("android_asset")) {
				return true;
			}
			if (file.getNativePath().contains(privateDataDirectoryPath)) {
				return true;
			}
		}
		return false;
	}

	public void onActivityTransition(boolean state)
	{
		if (!state) {
			doOpen();
			TiApplication.removeActivityTransitionListener(this);
		}
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.EmailDialog";
	}
}
