package ti.modules.titanium.media;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.json.JSONException;
import org.json.JSONObject;

public class VideoPlayerProxy extends TiProxy
{
	private static final String LCAT = "VideoPlayerProxy";
	private static final boolean DBG = TiConfig.LOGD;

	public VideoPlayerProxy(TiContext tiContext, Object[] args)
	{
		super(tiContext);

		JSONObject options = (JSONObject) args[0];

		try {
			if (options.has("contentURL")) {
				setDynamicValue("contentURL", options.getString("contentURL"));
			}
			if (options.has("backgroundColor")) {
				setDynamicValue("backgroundColor", options.getString("backgroundColor"));
			}
		} catch (JSONException e) {
			Log.e(LCAT, "Error accessing json object: " + e.getMessage(), e);
		}



/*		String errorCallback = null;
		try {
			JSONObject options = new JSONObject(jsonOptions);
			try {
				errorCallback = options.getString("error"); //callbacks will be added on JS side. to track
			} catch (JSONException e2) {
				Log.d(LCAT, "error callback not available");
			}

			String url = null;
			try {
				url = options.getString("contentURL");
				Uri uri = Uri.parse(url);
				String scheme = uri.getScheme();
				if (scheme == null || scheme.length() == 0 || (scheme == null && !(new File(url).exists()))) {
					uri = Uri.parse(TitaniumUrlHelper.buildAssetUrlFromResourcesRoot(getActivity(), url));
				}
				Intent intent = new Intent(getActivity(), TitaniumVideoActivity.class);
				intent.setData(uri);
				TitaniumIntentWrapper videoIntent = new TitaniumIntentWrapper(intent);
				videoIntent.setWindowId(TitaniumIntentWrapper.createActivityName("VIDEO"));
				result = new TitaniumVideo(this, videoIntent);
			} catch (JSONException e2) {
				String msg = "contentURL is required.";
				Log.e(LCAT, msg);
				if (errorCallback != null) {
					invokeUserCallback(errorCallback, createJSONError(0, msg));
				}
			}

		} catch (JSONException e) {
			Log.e(LCAT, "Could not reconstruct options from JSON: ", e);
		}

		return result;
*/
	}
}
