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
import java.net.Socket;
import java.net.UnknownHostException;
import java.security.SecureRandom;

import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;

import org.appcelerator.kroll.common.Log;

public class NonValidatingSSLSocketFactory extends SSLSocketFactory
{
	private SSLSocketFactory sslFactory;
	private static final String TAG = "NVSSLSocketFactory";

	public NonValidatingSSLSocketFactory()
	{
		try {
			SSLContext context = SSLContext.getInstance("TLS");
			TrustManager[] managers = new TrustManager[] { new NonValidatingTrustManager() };
			context.init(null, managers, new SecureRandom());
			sslFactory = context.getSocketFactory();
		} catch (Exception e) {
			Log.e(TAG, e.getMessage(), e);
		}
	}

	@Override
	public Socket createSocket() throws IOException
	{
		return sslFactory.createSocket();
	}

	@Override
	public Socket createSocket(String host, int port) throws IOException, UnknownHostException
	{
		return sslFactory.createSocket(host, port);
	}

	@Override
	public Socket createSocket(String host, int port, InetAddress localHost, int localPort)
		throws IOException, UnknownHostException
	{
		return sslFactory.createSocket(host, port, localHost, localPort);
	}

	@Override
	public Socket createSocket(InetAddress host, int port) throws IOException
	{
		return sslFactory.createSocket(host, port);
	}

	@Override
	public Socket createSocket(InetAddress address, int port, InetAddress localAddress, int localPort)
		throws IOException
	{
		return sslFactory.createSocket(address, port, localAddress, localPort);
	}

	@Override
	public String[] getDefaultCipherSuites()
	{
		return null;
	}

	@Override
	public String[] getSupportedCipherSuites()
	{
		return null;
	}

	@Override
	public Socket createSocket(Socket s, String host, int port, boolean autoClose) throws IOException
	{
		return sslFactory.createSocket(s, host, port, autoClose);
	}
}
