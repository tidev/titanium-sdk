/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.facebook;

import java.util.HashMap;
import java.util.Map;

import android.app.Activity;
import org.appcelerator.titanium.util.Log;

/**
 * Dialog for handling stream posts
 * 
 */
public class FBStreamDialog extends FBDialog {
	private static final String LOG = FBPermissionDialog.class.getSimpleName();
	private static final String FB_STREAM_URL = "http://www.facebook.com/connect/prompt_feed.php";

	private final String attachment;
	private final String actionLinks;
	private final String targetId;
	private final String userMessagePrompt;

	/**
	 * @param context
	 * @param session
	 */
	public FBStreamDialog(Activity context, FBSession session,
			FacebookModule tb, String attachment, String actionLinks,
			String targetId, String userMessagePrompt) {
		super(context, session);
		this.attachment = attachment;
		this.actionLinks = actionLinks;
		this.targetId = targetId;
		this.userMessagePrompt = userMessagePrompt;
	}

	@Override
	protected void load() {
		Map<String, String> params = new HashMap<String, String>(1);
		params.put("display", "touch");

		try {
			Map<String, String> postParams = new HashMap<String, String>(8);
			postParams.put("api_key", mSession.getApiKey());
			postParams.put("session_key", mSession.getSessionKey());
			postParams.put("preview", "1");
			postParams.put("callback", "fbconnect:success");
			postParams.put("cancel", "fbconnect:cancel");
			postParams.put("attachment", attachment);
			postParams.put("action_links", actionLinks);
			postParams.put("target_id", targetId);
			postParams.put("user_message_prompt", userMessagePrompt);

			this.loadURL(FB_STREAM_URL, "post", params, postParams);
		} catch (Exception e) {
			Log.e(LOG, "Error loading URL: " + FB_STREAM_URL, e);
		}
	}

}
