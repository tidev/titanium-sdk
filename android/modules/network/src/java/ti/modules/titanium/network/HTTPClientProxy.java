/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.network;

import java.io.UnsupportedEncodingException;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

import ti.modules.titanium.xml.DocumentProxy;
import android.os.Build;

@Kroll.proxy(creatableInModule = NetworkModule.class,
	propertyAccessors = {
		TiC.PROPERTY_FILE,
		TiC.PROPERTY_ONSENDSTREAM,
		TiC.PROPERTY_ONLOAD,
		TiC.PROPERTY_ONERROR,
		TiC.PROPERTY_ONREADYSTATECHANGE,
		TiC.PROPERTY_ONDATASTREAM
})
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
						"Invalid argument passed to securityManager property."
						+ " Does not conform to SecurityManagerProtocol");
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

	@Kroll.method
	@Kroll.getProperty
	public String getAllResponseHeaders()
	{
		return client.getAllResponseHeaders();
	}

	@Kroll.getProperty
	public KrollDict getResponseHeaders()
	{
		return client.getResponseHeaders();
	}

	@Kroll.getProperty
	public int getReadyState()
	{
		return client.getReadyState();
	}

	@Kroll.getProperty
	public TiBlob getResponseData()
	{
		return client.getResponseData();
	}

	@Kroll.getProperty
	public KrollDict getResponseDictionary()
	{
		return client.getResponseDict();
	}

	@Kroll.method
	public String getResponseHeader(String header)
	{
		return client.getResponseHeader(header);
	}

	@Kroll.getProperty
	public String getResponseText()
	{
		return client.getResponseText();
	}

	@Kroll.getProperty
	public DocumentProxy getResponseXML()
	{
		return client.getResponseXML();
	}

	@Kroll.getProperty
	public int getStatus()
	{
		return client.getStatus();
	}

	@Kroll.getProperty
	public String getStatusText()
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

	@Kroll.setProperty
	public void setTimeout(int millis)
	{
		client.setTimeout(millis);
	}

	@Kroll.getProperty
	public String getLocation()
	{
		return client.getLocation();
	}

	@Kroll.getProperty
	public String getConnectionType()
	{
		return client.getConnectionType();
	}

	@Kroll.getProperty
	public boolean getConnected()
	{
		return client.isConnected();
	}

	@Kroll.getProperty
	public boolean getAutoEncodeUrl()
	{
		return client.getAutoEncodeUrl();
	}

	@Kroll.setProperty
	public void setAutoEncodeUrl(boolean value)
	{
		client.setAutoEncodeUrl(value);
	}

	@Kroll.getProperty
	public boolean getAutoRedirect()
	{
		return client.getAutoRedirect();
	}

	@Kroll.setProperty
	public void setAutoRedirect(boolean value)
	{
		client.setAutoRedirect(value);
	}

	@Kroll.getProperty
	public boolean getValidatesSecureCertificate()
	{
		return client.validatesSecureCertificate();
	}

	@Kroll.setProperty
	public void setValidatesSecureCertificate(boolean value)
	{
		this.setProperty("validatesSecureCertificate", value);
	}

	@Kroll.setProperty
	public void setUsername(String value)
	{
		this.setProperty(TiC.PROPERTY_USERNAME, value);
	}

	@Kroll.getProperty
	public String getUsername()
	{
		if (this.hasProperty(TiC.PROPERTY_USERNAME)) {
			return TiConvert.toString(this.getProperty(TiC.PROPERTY_USERNAME));
		}
		return null;
	}

	@Kroll.setProperty
	public void setPassword(String value)
	{
		this.setProperty(TiC.PROPERTY_PASSWORD, value);
	}

	@Kroll.getProperty
	public String getPassword()
	{
		if (this.hasProperty(TiC.PROPERTY_PASSWORD)) {
			return TiConvert.toString(this.getProperty(TiC.PROPERTY_PASSWORD));
		}
		return null;
	}

	@Kroll.setProperty
	public void setDomain(String value)
	{
		this.setProperty(TiC.PROPERTY_DOMAIN, value);
	}

	@Kroll.getProperty
	public String getDomain()
	{
		if (this.hasProperty(TiC.PROPERTY_DOMAIN)) {
			return TiConvert.toString(this.getProperty(TiC.PROPERTY_DOMAIN));
		}
		return null;
	}

	@Kroll.setProperty
	public void setTlsVersion(int tlsVersion)
	{
		client.setTlsVersion(tlsVersion);
	}

	@Kroll.getProperty
	public int getTlsVersion()
	{
		int tlsVersion = NetworkModule.TLS_DEFAULT;
		if (this.hasProperty(TiC.PROPERTY_TLS_VERSION)) {
			tlsVersion = TiConvert.toInt(this.getProperty(TiC.PROPERTY_TLS_VERSION));
		}
		if (tlsVersion == NetworkModule.TLS_DEFAULT) {
			if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
				tlsVersion = NetworkModule.TLS_VERSION_1_3;
			} else {
				tlsVersion = NetworkModule.TLS_VERSION_1_2;
			}
		}
		return tlsVersion;
	}

	@Override
	public String getApiName()
	{
		return "Ti.Network.HTTPClient";
	}
}
