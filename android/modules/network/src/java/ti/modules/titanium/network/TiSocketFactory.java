/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.network;

import java.io.IOException;
import java.net.InetAddress;
import java.net.Socket;
import java.net.UnknownHostException;
import java.security.KeyManagementException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.UnrecoverableKeyException;
import java.util.ArrayList;
import java.util.List;

import javax.net.ssl.KeyManager;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;

import android.os.Build;
import android.util.Log;

public class TiSocketFactory extends SSLSocketFactory
{

	private SSLContext sslContext;
	private String tlsVersion;
	private static final String TAG = "TiSocketFactory";
	private static final boolean JELLYBEAN_OR_GREATER = Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN;
	private static final boolean Q_OR_GREATER = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q;
	private static final String TLS_VERSION_1_3_PROTOCOL = "TLSv1.3";
	private static final String TLS_VERSION_1_2_PROTOCOL = "TLSv1.2";
	private static final String TLS_VERSION_1_1_PROTOCOL = "TLSv1.1";
	private static final String TLS_VERSION_1_0_PROTOCOL = "TLSv1";
	protected String[] enabledProtocols;

	public TiSocketFactory(KeyManager[] keyManagers, TrustManager[] trustManagers, int protocol)
		throws NoSuchAlgorithmException, KeyManagementException, KeyStoreException, UnrecoverableKeyException
	{
		super();

		// Select appropriate default based on Android version.
		if (protocol == NetworkModule.TLS_DEFAULT) {
			if (Q_OR_GREATER) {
				protocol = NetworkModule.TLS_VERSION_1_3;
			} else if (JELLYBEAN_OR_GREATER) {
				protocol = NetworkModule.TLS_VERSION_1_2;
			}
		}

		switch (protocol) {
			case NetworkModule.TLS_VERSION_1_0:
				tlsVersion = TLS_VERSION_1_0_PROTOCOL;
				enabledProtocols = new String[] { TLS_VERSION_1_0_PROTOCOL };
				break;
			case NetworkModule.TLS_VERSION_1_1:
				tlsVersion = TLS_VERSION_1_1_PROTOCOL;
				enabledProtocols = new String[] { TLS_VERSION_1_0_PROTOCOL, TLS_VERSION_1_1_PROTOCOL };
				break;
			case NetworkModule.TLS_VERSION_1_2:
				tlsVersion = TLS_VERSION_1_2_PROTOCOL;
				enabledProtocols = new String[] {
					TLS_VERSION_1_0_PROTOCOL, TLS_VERSION_1_1_PROTOCOL, TLS_VERSION_1_2_PROTOCOL
				};
				break;
			case NetworkModule.TLS_VERSION_1_3:
				tlsVersion = TLS_VERSION_1_3_PROTOCOL;
				enabledProtocols = new String[] {
					TLS_VERSION_1_0_PROTOCOL, TLS_VERSION_1_1_PROTOCOL,
					TLS_VERSION_1_2_PROTOCOL, TLS_VERSION_1_3_PROTOCOL
				};
				break;
			default:
				Log.e(TAG, "Incorrect TLS version was set in HTTPClient. Reverting to default TLS version.");
			case NetworkModule.TLS_DEFAULT:
				tlsVersion = TLS_VERSION_1_0_PROTOCOL;
				enabledProtocols = new String[] { TLS_VERSION_1_0_PROTOCOL };
				Log.i(TAG, tlsVersion + " protocol is being used. It is a less-secure version.");
				break;
		}

		sslContext = SSLContext.getInstance(tlsVersion);
		sslContext.init(keyManagers, trustManagers, new SecureRandom());
	}

	@Override
	public String[] getDefaultCipherSuites()
	{
		return enabledProtocols;
	}

	@Override
	public String[] getSupportedCipherSuites()
	{
		return enabledProtocols;
	}

	@Override
	public Socket createSocket(String host, int port) throws IOException, UnknownHostException
	{
		SSLSocket sslSocket = (SSLSocket) sslContext.getSocketFactory().createSocket(host, port);
		return setSupportedAndEnabledProtocolsInSocket(enabledProtocols, sslSocket);
	}

	@Override
	public Socket createSocket(String host, int port, InetAddress localHost, int localPort)
		throws IOException, UnknownHostException
	{
		SSLSocket sslSocket = (SSLSocket) sslContext.getSocketFactory().createSocket(host, port, localHost, localPort);
		return setSupportedAndEnabledProtocolsInSocket(enabledProtocols, sslSocket);
	}

	@Override
	public Socket createSocket(InetAddress host, int port) throws IOException
	{
		SSLSocket sslSocket = (SSLSocket) sslContext.getSocketFactory().createSocket(host, port);
		return setSupportedAndEnabledProtocolsInSocket(enabledProtocols, sslSocket);
	}

	@Override
	public Socket createSocket(InetAddress address, int port, InetAddress localAddress, int localPort)
		throws IOException
	{
		SSLSocket sslSocket =
			(SSLSocket) sslContext.getSocketFactory().createSocket(address, port, localAddress, localPort);
		return setSupportedAndEnabledProtocolsInSocket(enabledProtocols, sslSocket);
	}

	@Override
	public Socket createSocket() throws IOException
	{
		SSLSocket sslSocket = (SSLSocket) sslContext.getSocketFactory().createSocket();
		return setSupportedAndEnabledProtocolsInSocket(enabledProtocols, sslSocket);
	}

	@Override
	public Socket createSocket(Socket socket, String host, int port, boolean autoClose)
		throws IOException, UnknownHostException
	{
		SSLSocket sslSocket = (SSLSocket) sslContext.getSocketFactory().createSocket(socket, host, port, autoClose);
		return setSupportedAndEnabledProtocolsInSocket(enabledProtocols, sslSocket);
	}

	protected SSLSocket setSupportedAndEnabledProtocolsInSocket(String[] enabledProtocols, SSLSocket sslSocket)
	{
		String[] supportedProtocols = sslSocket.getSupportedProtocols();
		List<String> supportedAndEnabledProtocols = new ArrayList<String>();

		for (String enabledProtocol : enabledProtocols) {
			for (String supportedProtocol : supportedProtocols) {
				if (enabledProtocol.equals(supportedProtocol)) {
					supportedAndEnabledProtocols.add(supportedProtocol);
					break;
				}
			}
		}

		//If there are 0 supported and enabled protocols, it will use the default enabled protocols.
		//Default enabled protocols varies depending on API level.
		if (supportedAndEnabledProtocols.size() > 0) {
			sslSocket.setEnabledProtocols(
				supportedAndEnabledProtocols.toArray(new String[supportedAndEnabledProtocols.size()]));
		}

		return sslSocket;
	}
}
