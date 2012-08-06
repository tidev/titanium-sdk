/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 * 
 * connectSocket partially copied from Apache's HTTPClient implementation (APL2 license):
 *  - org.apache.http.conn.ssl.SSLSocketFactory.connectSocket
 */
package ti.modules.titanium.network;

import java.io.IOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.UnknownHostException;
import java.security.SecureRandom;

import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;

import org.apache.http.conn.ConnectTimeoutException;
import org.apache.http.conn.scheme.LayeredSocketFactory;
import org.apache.http.params.HttpConnectionParams;
import org.apache.http.params.HttpParams;
import org.appcelerator.kroll.common.Log;

public class NonValidatingSSLSocketFactory implements LayeredSocketFactory {
	private SSLSocketFactory sslFactory;
	private static final String TAG = "NVSSLSocketFactory";

	public NonValidatingSSLSocketFactory() {
		try {
			SSLContext context = SSLContext.getInstance("TLS");
			TrustManager managers[] = new TrustManager[] { new NonValidatingTrustManager() };
			context.init(null, managers, new SecureRandom());
			sslFactory = context.getSocketFactory();
		} catch (Exception e) {
			Log.e(TAG, e.getMessage(), e);
		}
		
	}

	@Override
	public Socket connectSocket(Socket sock, String host, int port,
			InetAddress localAddress, int localPort, HttpParams params) throws IOException,
			UnknownHostException, ConnectTimeoutException {
		if (host == null) {
			throw new IllegalArgumentException("Target host may not be null.");
		}
		if (params == null) {
			throw new IllegalArgumentException("Parameters may not be null.");
		}

		SSLSocket sslsock = (SSLSocket) ((sock != null) ? sock : createSocket());

		if ((localAddress != null) || (localPort > 0)) {

			// we need to bind explicitly
			if (localPort < 0)
				localPort = 0; // indicates "any"

			InetSocketAddress isa = new InetSocketAddress(localAddress,
					localPort);
			sslsock.bind(isa);
		}

		int connTimeout = HttpConnectionParams.getConnectionTimeout(params);
		int soTimeout = HttpConnectionParams.getSoTimeout(params);

		InetSocketAddress remoteAddress = new InetSocketAddress(host, port);
		sslsock.connect(remoteAddress, connTimeout);
		sslsock.setSoTimeout(soTimeout);

		return sslsock;
	}

	@Override
	public Socket createSocket() throws IOException {
		return sslFactory.createSocket();
	}

	@Override
	public boolean isSecure(Socket socket) throws IllegalArgumentException {
		return true;
	}

	@Override
	public Socket createSocket(Socket socket, String host, int port, boolean autoClose)
			throws IOException, UnknownHostException {
		return sslFactory.createSocket(socket, host, port, autoClose);
	}
}
