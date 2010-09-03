/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFile;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiActivityResultHandler;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiMimeTypeHelper;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.filesystem.FileProxy;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;

@Kroll.proxy(creatableInModule="UI")
public class EmailDialogProxy extends TiViewProxy {
	
	private static final String LCAT = "EmailDialogProxy";
	private static final boolean DBG = TiConfig.LOGD;	
	
	@Kroll.constant
	public static final int CANCELLED = 0;
	@Kroll.constant
	public static final int SAVED = 1;
	@Kroll.constant
	public static final int SENT = 2;
	@Kroll.constant
	public static final int FAILED = 3;
	
	private ArrayList<Object> attachments;
	
	public EmailDialogProxy(TiContext tiContext) {
		super(tiContext);
	}
	
	@Kroll.method
	public void addAttachment(Object attachment) {
		if (attachment instanceof FileProxy || attachment instanceof TiBlob) {
			if (attachments == null) {
				attachments = new ArrayList<Object>();
			}			
			attachments.add(attachment);
		} else {
			// silently ignore?
			if (DBG) {
				Log.d(LCAT, "addAttachment for type " + attachment.getClass().getName() + " ignored. Only files and blobs may be attached.");
			}
		}
	}
	
	private String baseMimeType() {
		String result = "text/plain";
		if (android.os.Build.VERSION.SDK_INT > android.os.Build.VERSION_CODES.DONUT) {
			result = "message/rfc822";
		}
		return result;
	}
	
	@Kroll.method
	public void open(){
		Intent sendIntent = new Intent(Intent.ACTION_SEND);
		
		String intentType = baseMimeType();
		/*
		if (hasDynamicValue("html")) {
			if (TiConvert.toBoolean(getDynamicValue("html"))) {
				intentType = "text/html";
			}			
		}*/ 
		// seems to be no benefit to setting it to html. 
		// keeping it at message/rfc822 will help force e-mail dialog as opposed 
		// to another activity the "chooser" may find.
		
		sendIntent.setType(intentType);
		putAddressExtra(sendIntent, Intent.EXTRA_EMAIL, "toRecipients");
		putAddressExtra(sendIntent, Intent.EXTRA_CC, "ccRecipients");
		putAddressExtra(sendIntent, Intent.EXTRA_BCC, "bccRecipients");
		
		putStringExtra(sendIntent, Intent.EXTRA_SUBJECT, "subject");
		putStringExtra(sendIntent, Intent.EXTRA_TEXT , "messageBody");
		
		prepareAttachments(sendIntent);
		
		if (DBG) {
			Log.d(LCAT, "Choosing for mime type " + sendIntent.getType());
		}
		Intent choosingIntent = Intent.createChooser(sendIntent, "Send");
	
		Activity activity = getTiContext().getActivity();
		TiActivitySupport activitySupport = (TiActivitySupport) activity;
		final int code = activitySupport.getUniqueResultCode();
		
		activitySupport.launchActivityForResult(choosingIntent, code, 
			new TiActivityResultHandler() {
				
				@Override
				public void onResult(Activity activity, int requestCode, int resultCode,
						Intent data) {					
					// ACTION_SEND does not set a result code (so the default of 0
					// is always returned. We'll neither confirm nor deny -- assume SENT
					// see http://code.google.com/p/android/issues/detail?id=5512
					KrollDict result = new KrollDict();
					result.put("result", SENT); // TODO fix this when figure out above
					result.put("success", true);
					fireEvent("complete", result);					
				}
				
				@Override
				public void onError(Activity activity, int requestCode, Exception e) {
					KrollDict result = new KrollDict();
					result.put("result", FAILED);
					result.put("error", e.getMessage());
					result.put("success", false);
					fireEvent("complete", result);					
				}
			});
			
	}
	
	private File blobToTemp(TiBlob blob, String fileName) {
		
		File tempFolder = new File (getTiContext().getTiFileHelper().getDataDirectory(false), "temp");
		tempFolder.mkdirs();
		
		File tempfilej = new File(tempFolder, fileName);
		TiFile tempfile = new TiFile(getTiContext(),tempfilej, tempfilej.getPath(), false);
		
		if (tempfile.exists()) {
			tempfile.deleteFile();
		}
					
		try {
			tempfile.write(blob, false);
			return tempfile.getNativeFile();
		} catch (IOException e) {
			Log.e(LCAT, "Unable to attach file " + fileName + ": " + e.getMessage(), e);
		}
		
		return null;
	}
	
	private void attachAssetFile(Intent sendIntent, FileProxy file) {
		File tempfile = null;
		try {			
			tempfile = blobToTemp(file.read(), file.getName()); 
		} catch(IOException e) {
			Log.e(LCAT, "Unable to attach file " + file.getName() + ": " + e.getMessage(), e);
		}
		if (tempfile != null) {
			attachStandardFile(sendIntent, Uri.fromFile(tempfile));	
		}
	}
	
	private void attachStandardFile(Intent sendIntent, Uri uri) {
		attachStandardFile(sendIntent, uri, TiMimeTypeHelper.getMimeType(uri.toString()));		
	}
	
	private void attachStandardFile(Intent sendIntent, Uri uri, String mimeType) {
		if (DBG) {
			Log.d(LCAT, "Attaching standard file " + uri.toString() + " with mimetype " + mimeType);
		}
		sendIntent.putExtra(Intent.EXTRA_STREAM, uri);
		// Only set SEND intent's type to attachment's type
		// if API level 4, because in later API levels
		// we want to force a true e-mail dialog instead
		// of a chooser. Someday we'll have an intents module
		// to make choice/choosers easier!
		if (android.os.Build.VERSION.SDK_INT == android.os.Build.VERSION_CODES.DONUT) {
			sendIntent.setType(mimeType);
		}
		
	}
	
	private void attachBlob(Intent sendIntent, TiBlob blob) {
		if (DBG) {
			Log.d(LCAT, "Attaching blob of type " + blob.getMimeType());
		}
		
		// Some blobs refer to files (TYPE_FILE), such as a selection from
		// the photo gallery . If that's the case with this
		// blob, then just attach the file and be done with it.
		if (blob.getType() == TiBlob.TYPE_FILE) {
			TiBaseFile baseFile =  (TiBaseFile) blob.getData();
			attachStandardFile(sendIntent, Uri.fromFile(baseFile.getNativeFile()), blob.getMimeType());
			return;
		}
		
		// For non-file blobs, make a temp file and attach.
		String fileName ="attachment";
		String extension = TiMimeTypeHelper.getFileExtensionFromMimeType(blob.getMimeType(), "");
		if (extension.length() > 0 ) {
			fileName += "." + extension;
		}
		File f = blobToTemp(blob, fileName);
		if (f != null) {
			attachStandardFile(sendIntent, Uri.fromFile(f), blob.getMimeType());
		}
			
	}
	
	private void prepareAttachments(Intent sendIntent) {
		// sending multiple attachments in Android not yet supported		
		// 
		if (attachments == null) {
			return;
		}		
		
		for (Object attachment : attachments) {			
			if (attachment instanceof FileProxy) {				
				FileProxy fileProxy = (FileProxy) attachment;
				if (fileProxy.isFile()) {	
					if (fileProxy.getNativePath().contains("android_asset")) {
						attachAssetFile(sendIntent, fileProxy);
					} else {
						attachStandardFile(sendIntent, Uri.fromFile(fileProxy.getBaseFile().getNativeFile()));						
					}					
				}				
			} else if (attachment instanceof TiBlob) {
				TiBlob blob = (TiBlob) attachment;
				attachBlob(sendIntent, blob);				
			}
			break; // just sending one attachment for now
		}
	}
	
	
	private void putStringExtra(Intent intent, String extraType, String ourkey) {		
		if (this.hasProperty(ourkey)) {
			intent.putExtra(extraType, TiConvert.toString(this.getProperty(ourkey)) );
		}
	}
	
	private void putAddressExtra(Intent intent, String extraType, String ourkey) {
		Object testprop = this.getProperty(ourkey);
		if (testprop instanceof String[]) {
			intent.putExtra(extraType, (String[])testprop);
		}		
	}

	@Override
	public TiUIView createView(Activity activity) {
		return null;
	}
}
