/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.facebook;

import java.util.HashMap;
import java.util.Map;

import org.appcelerator.titanium.util.Log;
import org.json.JSONObject;

import android.app.Activity;

/**
 * Facebook Feed Dialog
 */
public class FBFeedDialog extends FBDialog {
	private static final String LOG = FBFeedDialog.class.getSimpleName();

	private static final String FB_FEED_URL = "http://www.facebook.com/connect/prompt_feed.php";

	private final Long templateId;
	private final String templateData;
	private final String bodyGeneral;
	private final String userMessagePrompt;

	/**
	 * @param context
	 * @param session
	 */
	public FBFeedDialog(Activity context, FBSession session,
			Long templateId, String templateData, String bodyGeneral,
			String userMessagePrompt) {
		super(context, session);
		this.templateId = templateId;
		this.templateData = templateData;
		this.bodyGeneral = bodyGeneral;
		this.userMessagePrompt = userMessagePrompt;
	}

	@Override
	protected void load() {
		Map<String, String> params = new HashMap<String, String>(1);
		params.put("display", "touch");
		params.put("callback", "fbconnect://success");
		params.put("cancel", "fbconnect:cancel");
		// See http://github.com/facebook/facebook-android-sdk/blob/ef53183c59dac75cda7b6787a7fcb6f4bcd35b7b/facebook/src/com/facebook/android/Facebook.java#L42
		// for those urls.

		try {
			JSONObject obj = new JSONObject();
			if (templateId != null) {
				obj.put("template_id", templateId);
			}
			if (templateData != null) {
				// it comes in as JSON, we need to make sure it's not a string
				// but a JSON encoded value
				obj.put("template_data", new JSONObject(templateData));
			}
			if (bodyGeneral != null) {
				obj.put("body_general", bodyGeneral);
			}

			Map<String, String> postParams = new HashMap<String, String>(8);
			postParams.put("api_key", mSession.getApiKey());
			if (FacebookModule.usingOauth) {
				postParams.put("access_token", mSession.getAccessToken());
			} else {
				postParams.put("session_key", mSession.getSessionKey());
			}
			postParams.put("preview", "1");
			postParams.put("feed_info", obj.toString());
			postParams.put("feed_target_type", "self_feed");
			postParams.put("user_message_prompt", userMessagePrompt);

			this.loadURL(FB_FEED_URL, "post", params, postParams);
		} catch (Exception e) {
			Log.e(LOG, "Error loading URL: " + FB_FEED_URL, e);
		}
	}

}
