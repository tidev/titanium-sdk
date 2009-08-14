package org.appcelerator.titanium.module.ui;

import java.util.ArrayList;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumEmailDialog;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumUrlHelper;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Intent;
import android.net.Uri;
import android.webkit.MimeTypeMap;
import android.webkit.URLUtil;

public class TitaniumEmailDialog implements ITitaniumEmailDialog
{
	private static final String LCAT = "TiEmailDialog";

	private TitaniumModuleManager tmm;
	private Intent emailIntent;
	private ArrayList<String> to;
	private ArrayList<String>  cc;
	private ArrayList<String>  bcc;
	private JSONObject attachment;


	public TitaniumEmailDialog(TitaniumModuleManager tmm)
	{
		this.tmm = tmm;
		to = new ArrayList<String>();
		cc = new ArrayList<String>();
		bcc = new ArrayList<String>();

		emailIntent = new Intent(Intent.ACTION_SEND);
		emailIntent.setType("message/rfc822");
	}

	public void setMessage(String msg) {
		emailIntent.putExtra(Intent.EXTRA_TEXT, msg);
	}

	public void setSubject(String subject) {
		emailIntent.putExtra(Intent.EXTRA_SUBJECT, subject);
	}

	public void addAttachment(String json)
	{
		try {
			attachment = new JSONObject(json);
		} catch (JSONException e) {
			Log.e(LCAT, "Error parsing json: " + json);
		}
	}

	public void addBcc(String addr) {
		bcc.add(addr);
	}

	public void addCc(String addr) {
		cc.add(addr);
	}

	public void addTo(String addr) {
		Log.e("TO: ", addr);
		to.add(addr);
	}

	public void open()
	{
		if (to.size() > 0) {
			emailIntent.putExtra(Intent.EXTRA_EMAIL, to.toArray(new String[0]));
		}
		if (cc.size() > 0) {
			emailIntent.putExtra(Intent.EXTRA_CC, cc.toArray(new String[0]));
		}
		if (bcc.size() > 0) {
			emailIntent.putExtra(Intent.EXTRA_BCC, bcc.toArray(new String[0]));
		}
		if (attachment != null) {
			try {
				String mimeType = "*/*";
				if (attachment.has("file")) {
					String path = attachment.getString("file");
					Uri uri = Uri.parse(path);
					emailIntent.putExtra(Intent.EXTRA_STREAM, uri);

					if (attachment.has("mimeType")) {
						mimeType = attachment.getString("mimeType");
					} else {
						if (URLUtil.isContentUrl(path)) {
							mimeType = tmm.getAppContext().getContentResolver().getType(uri);
						} else {
							String extension = MimeTypeMap.getFileExtensionFromUrl(uri.getPath());
							if (extension != null && extension.length() > 0) {
								String type = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
								if (type != null) {
									mimeType = type;
								}
							}
						}
					}
					emailIntent.setType(mimeType);
				}
			} catch (JSONException e) {
				Log.e(LCAT, "Error adding attachment: ", e);
			}
		}

		tmm.getActivity().startActivity(Intent.createChooser(emailIntent, "Send:"));
	}
}
