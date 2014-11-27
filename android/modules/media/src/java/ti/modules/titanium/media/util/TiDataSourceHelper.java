package ti.modules.titanium.media.util;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;

import org.appcelerator.titanium.TiC;

import android.net.Uri;
import android.os.Build;

public class TiDataSourceHelper {

	public static Uri getRedirectUri(Uri mUri) throws MalformedURLException, IOException{
		if (Build.VERSION.SDK_INT < TiC.API_LEVEL_HONEYCOMB &&
				("http".equals(mUri.getScheme()) || "https".equals(mUri.getScheme()))) {
			// Media player doesn't handle redirects, try to follow them
			// here. (Redirects work fine without this in ICS.)
			while (true) {
				// java.net.URL doesn't handle rtsp
				if (mUri.getScheme() != null && mUri.getScheme().equals("rtsp"))
					break;

				URL url = new URL(mUri.toString());
				HttpURLConnection cn = (HttpURLConnection) url.openConnection();
				cn.setInstanceFollowRedirects(false);
				String location = cn.getHeaderField("Location");
				if (location != null) {
					String host = mUri.getHost();
					int port = mUri.getPort();
					String scheme = mUri.getScheme();
					mUri = Uri.parse(location);
					if (mUri.getScheme() == null) {
						// Absolute URL on existing host/port/scheme
						if (scheme == null) {
							scheme = "http";
						}
						String authority = port == -1 ? host : host + ":" + port;
						mUri = mUri.buildUpon().scheme(scheme).encodedAuthority(authority).build();
					}
				} else {
					break;
				}
			}
		}
		return mUri;
	}
}
