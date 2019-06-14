/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.network;

import java.io.UnsupportedEncodingException;

import javax.net.ssl.X509KeyManager;
import javax.net.ssl.X509TrustManager;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

import ti.modules.titanium.xml.DocumentProxy;
import android.os.Build;

// clang-format off
@Kroll.proxy(creatableInModule = NetworkModule.class,
	propertyAccessors = {
		TiC.PROPERTY_FILE,
		TiC.PROPERTY_ONSENDSTREAM,
		TiC.PROPERTY_ONLOAD,
		TiC.PROPERTY_ONERROR,
		TiC.PROPERTY_ONREADYSTATECHANGE,
		TiC.PROPERTY_ONDATASTREAM
})
// clang-format on
public class HTTPClientProxy extends KrollProxy
{
	@Kroll.constant
	public static final int UNSENT = TiHTTPClient.READY_STATE_UNSENT;
	@Kroll.constant
	public static final int OPENED = TiHTTPClient.READY_STATE_OPENED;
	@Kroll.constant
	public static final int HEADERS_RECEIVED = TiHTTPClient.READY_STATE_HEADERS_RECEIVED;
	@Kroll.constant
	public static final int LOADING = TiHTTPClient.READY_STATE_LOADING;
	@Kroll.constant
	public static final int DONE = TiHTTPClient.READY_STATE_DONE;

	private static final String TAG = "TiHTTPClientProxy";
	private static final boolean JELLYBEAN_OR_GREATER = (Build.VERSION.SDK_INT >= 16);
	public static final String PROPERTY_SECURITY_MANAGER = "securityManager";
	private TiHTTPClient client;

	public HTTPClientProxy()
	{
		super();
		this.client = new TiHTTPClient(this);
	}

	@Override
	public void release()
	{
		this.client = null;
		super.release();
	}

	public void handleCreationDict(KrollDict dict)
	{
		super.handleCreationDict(dict);

		if (hasProperty(TiC.PROPERTY_TIMEOUT)) {
			client.setTimeout(TiConvert.toInt(getProperty(TiC.PROPERTY_TIMEOUT), 0));
		}

		if (hasProperty(TiC.PROPERTY_AUTO_REDIRECT)) {
			client.setAutoRedirect(TiConvert.toBoolean((getProperty(TiC.PROPERTY_AUTO_REDIRECT)), true));
		}

		if (hasProperty(TiC.PROPERTY_AUTO_ENCODE_URL)) {
			client.setAutoEncodeUrl(TiConvert.toBoolean((getProperty(TiC.PROPERTY_AUTO_ENCODE_URL)), true));
		}

		//Set the securityManager on the client if it is defined as a valid value
		if (hasProperty(PROPERTY_SECURITY_MANAGER)) {
			Object prop = getProperty(PROPERTY_SECURITY_MANAGER);
			if (prop != null) {
				if (prop instanceof SecurityManagerProtocol) {
					this.client.securityManager = (SecurityManagerProtocol) prop;
				} else {
					throw new IllegalArgumentException(
						"Invalid argument passed to securityManager property. Does not conform to SecurityManagerProtocol");
				}
			}
		}

		client.setTlsVersion(TiConvert.toInt(getProperty(TiC.PROPERTY_TLS_VERSION), NetworkModule.TLS_DEFAULT));
	}

	@Kroll.method
	public void abort()
	{
		client.abort();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getAllResponseHeaders()
	// clang-format on
	{
		return client.getAllResponseHeaders();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getReadyState()
	// clang-format on
	{
		return client.getReadyState();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public TiBlob getResponseData()
	// clang-format on
	{
		return client.getResponseData();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public KrollDict getResponseDictionary()
	// clang-format on
	{
		return client.getResponseDict();
	}

	@Kroll.method
	public String getResponseHeader(String header)
	{
		return client.getResponseHeader(header);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getResponseText()
	// clang-format on
	{
		return client.getResponseText();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public DocumentProxy getResponseXML()
	// clang-format on
	{
		return client.getResponseXML();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getStatus()
	// clang-format on
	{
		return client.getStatus();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getStatusText()
	// clang-format on
	{
		return client.getStatusText();
	}

	@Kroll.method
	public void open(String method, String url)
	{
		client.open(method, url);
	}

	@Kroll.method
	public void send(@Kroll.argument(optional = true) Object data) throws UnsupportedEncodingException
	{
		client.send(data);
	}

	@Kroll.method
	public void clearCookies(String host)
	{
		client.clearCookies(host);
	}

	@Kroll.method
	public void setRequestHeader(String header, String value)
	{
		client.setRequestHeader(header, value);
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setTimeout(int millis)
	// clang-format on
	{
		client.setTimeout(millis);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getLocation()
	// clang-format on
	{
		return client.getLocation();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getConnectionType()
	// clang-format on
	{
		return client.getConnectionType();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean getConnected()
	// clang-format on
	{
		return client.isConnected();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean getAutoEncodeUrl()
	// clang-format on
	{
		return client.getAutoEncodeUrl();
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setAutoEncodeUrl(boolean value)
	// clang-format on
	{
		client.setAutoEncodeUrl(value);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean getAutoRedirect()
	// clang-format on
	{
		return client.getAutoRedirect();
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setAutoRedirect(boolean value)
	// clang-format on
	{
		client.setAutoRedirect(value);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean getValidatesSecureCertificate()
	// clang-format on
	{
		return client.validatesSecureCertificate();
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setValidatesSecureCertificate(boolean value)
	// clang-format on
	{
		this.setProperty("validatesSecureCertificate", value);
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setUsername(String value)
	// clang-format on
	{
		this.setProperty(TiC.PROPERTY_USERNAME, value);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getUsername()
	// clang-format on
	{
		if (this.hasProperty(TiC.PROPERTY_USERNAME)) {
			return TiConvert.toString(this.getProperty(TiC.PROPERTY_USERNAME));
		}
		return null;
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setPassword(String value)
	// clang-format on
	{
		this.setProperty(TiC.PROPERTY_PASSWORD, value);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getPassword()
	// clang-format on
	{
		if (this.hasProperty(TiC.PROPERTY_PASSWORD)) {
			return TiConvert.toString(this.getProperty(TiC.PROPERTY_PASSWORD));
		}
		return null;
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setDomain(String value)
	// clang-format on
	{
		this.setProperty(TiC.PROPERTY_DOMAIN, value);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getDomain()
	// clang-format on
	{
		if (this.hasProperty(TiC.PROPERTY_DOMAIN)) {
			return TiConvert.toString(this.getProperty(TiC.PROPERTY_DOMAIN));
		}
		return null;
	}

	// This uses Apache
	/*
	@Kroll.method
	public void addAuthFactory(String scheme, Object factory)
	{
		//Sanity Checks
		if ( (scheme == null) || (scheme.length() == 0) || (! (factory instanceof AuthSchemeFactory) )) {
			return;
		}

		client.addAuthFactory(scheme, (AuthSchemeFactory)factory);
	}
	*/

	@Kroll.method
	public void addTrustManager(Object manager)
	{
		if (manager instanceof X509TrustManager) {
			client.addTrustManager((X509TrustManager) manager);
		}
	}

	@Kroll.method
	public void addKeyManager(Object manager)
	{
		if (manager instanceof X509KeyManager) {
			client.addKeyManager((X509KeyManager) manager);
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setTlsVersion(int tlsVersion)
	// clang-format on
	{
		client.setTlsVersion(tlsVersion);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getTlsVersion()
	// clang-format on
	{
		int tlsVersion;

		if (this.hasProperty(TiC.PROPERTY_TLS_VERSION)) {
			tlsVersion = TiConvert.toInt(this.getProperty(TiC.PROPERTY_TLS_VERSION));

			if (tlsVersion == NetworkModule.TLS_DEFAULT) {
				if (JELLYBEAN_OR_GREATER) {
					return NetworkModule.TLS_VERSION_1_2;
				}
				return NetworkModule.TLS_VERSION_1_0;
			}
			return tlsVersion;
		}

		return NetworkModule.TLS_DEFAULT;
	}

	@Override
	public String getApiName()
	{
		return "Ti.Network.HTTPClient";
	}
}
