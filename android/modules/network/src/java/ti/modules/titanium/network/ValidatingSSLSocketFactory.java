/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.network;

import java.io.IOException;
import java.net.Socket;
import java.security.KeyManagementException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.UnrecoverableKeyException;

import javax.net.ssl.KeyManager;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;

import org.apache.http.conn.ssl.SSLSocketFactory;

public class ValidatingSSLSocketFactory extends SSLSocketFactory
{
	private SSLContext sslContext = SSLContext.getInstance("TLS");

	public ValidatingSSLSocketFactory(TrustManager[] trustManager, KeyManager[] keyManager) throws NoSuchAlgorithmException,
		KeyManagementException, KeyStoreException, UnrecoverableKeyException
	{
		super(null, null, null, null, null, null);
		sslContext.init(keyManager, trustManager, null);
	}

	@Override
	public Socket createSocket(Socket socket, String host, int port, boolean autoClose) throws IOException
	{
		return sslContext.getSocketFactory().createSocket(socket, host, port, autoClose);
	}

	@Override
	public Socket createSocket() throws IOException
	{
		return sslContext.getSocketFactory().createSocket();
	}

}
