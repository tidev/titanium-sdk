/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.network;

import javax.net.ssl.X509KeyManager;
import javax.net.ssl.X509TrustManager;

import android.net.Uri;

public interface SecurityManagerProtocol {
	/**
	 * Defines if the SecurityManager will provide TrustManagers and KeyManagers for SSL Context given a Uri
	 * @param uri - The end point for the network connection
	 * @return true if SecurityManagers will define SSL Context, false otherwise.
	 */
	boolean willHandleURL(Uri uri);

	/**
	 * Returns the X509TrustManager array for SSL Context.
	 * @param uri - The end point of the network connection
	 * @return Return array of X509TrustManager for custom server validation. Null otherwise.
	 */
	X509TrustManager[] getTrustManagers(HTTPClientProxy proxy);

	/**
	 * Returns the X509KeyManager array for the SSL Context.
	 * @param uri - The end point of the network connection
	 * @return Return array of X509KeyManager for custom client certificate management. Null otherwise.
	 */
	X509KeyManager[] getKeyManagers(HTTPClientProxy proxy);
}
