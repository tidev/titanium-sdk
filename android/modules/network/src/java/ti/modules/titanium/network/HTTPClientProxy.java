/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.network;

import javax.net.ssl.X509KeyManager;
import javax.net.ssl.X509TrustManager;

import org.apache.http.MethodNotSupportedException;
import org.apache.http.auth.AuthSchemeFactory;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiConvert;

import ti.modules.titanium.xml.DocumentProxy;

@Kroll.proxy(creatableInModule=NetworkModule.class)
public class HTTPClientProxy extends KrollProxy
{
	@Kroll.constant public static final int UNSENT = TiHTTPClient.READY_STATE_UNSENT;
	@Kroll.constant public static final int OPENED = TiHTTPClient.READY_STATE_OPENED;
	@Kroll.constant public static final int HEADERS_RECEIVED = TiHTTPClient.READY_STATE_HEADERS_RECEIVED;
	@Kroll.constant public static final int LOADING = TiHTTPClient.READY_STATE_LOADING;
	@Kroll.constant public static final int DONE = TiHTTPClient.READY_STATE_DONE;

	private TiHTTPClient client;

	public HTTPClientProxy()
	{
		super();
		this.client = new TiHTTPClient(this);
	}

	public HTTPClientProxy(TiContext tiContext)
	{
		this();
	}
	
	public void handleCreationDict(KrollDict dict)
	{
		super.handleCreationDict(dict);
		if (hasProperty(TiC.PROPERTY_TIMEOUT)) {
			client.setTimeout(TiConvert.toInt(getProperty(TiC.PROPERTY_TIMEOUT)));
		}
	}

	@Kroll.method
	public void abort()
	{
		client.abort();
	}

	@Kroll.getProperty @Kroll.method
	public String getAllResponseHeaders()
	{
		return client.getAllResponseHeaders();
	}

	@Kroll.getProperty @Kroll.method
	public int getReadyState()
	{
		return client.getReadyState();
	}

	@Kroll.getProperty @Kroll.method
	public TiBlob getResponseData()
	{
		return client.getResponseData();
	}

	@Kroll.method
	public String getResponseHeader(String header)
	{
		return client.getResponseHeader(header);
	}

	@Kroll.getProperty @Kroll.method
	public String getResponseText()
	{
		return client.getResponseText();
	}
	
	@Kroll.getProperty @Kroll.method
	public DocumentProxy getResponseXML()
	{
		return client.getResponseXML();
	}

	@Kroll.getProperty @Kroll.method
	public int getStatus()
	{
		return client.getStatus();
	}

	@Kroll.getProperty @Kroll.method
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
	public void send(@Kroll.argument(optional=true) Object data) 
		throws MethodNotSupportedException
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
	
	@Kroll.setProperty @Kroll.method
	public void setTimeout(int millis)
	{
		client.setTimeout(millis);
	}
	
	@Kroll.getProperty @Kroll.method
	public String getLocation()
	{
		return client.getLocation();
	}

	@Kroll.getProperty @Kroll.method
	public String getConnectionType()
	{
		return client.getConnectionType();
	}
	
	@Kroll.getProperty @Kroll.method
	public boolean getConnected()
	{
		return client.isConnected();
	}

	@Kroll.getProperty @Kroll.method
	public boolean getAutoEncodeUrl()
	{
		return client.getAutoEncodeUrl();
	}

	@Kroll.setProperty @Kroll.method
	public void setAutoEncodeUrl(boolean value)
	{
		client.setAutoEncodeUrl(value);
	}

	@Kroll.getProperty @Kroll.method
	public boolean getAutoRedirect()
	{
		return client.getAutoRedirect();
	}

	@Kroll.setProperty @Kroll.method
	public void setAutoRedirect(boolean value)
	{
		client.setAutoRedirect(value);
	}

	@Kroll.getProperty @Kroll.method
	public boolean getValidatesSecureCertificate()
	{
		return client.validatesSecureCertificate();
	}

	@Kroll.setProperty @Kroll.method
	public void setValidatesSecureCertificate(boolean value)
	{
		this.setProperty("validatesSecureCertificate", value);
	}

	@Kroll.setProperty @Kroll.method
	public void setUsername(String value)
	{
		this.setProperty(TiC.PROPERTY_USERNAME, value);
	}

	@Kroll.getProperty @Kroll.method
	public String getUsername()
	{
		if (this.hasProperty(TiC.PROPERTY_USERNAME)) {
			return TiConvert.toString(this.getProperty(TiC.PROPERTY_USERNAME));
		}
		return null;
	}

	@Kroll.setProperty @Kroll.method
	public void setPassword(String value)
	{
		this.setProperty(TiC.PROPERTY_PASSWORD, value);
	}

	@Kroll.getProperty @Kroll.method
	public String getPassword()
	{
		if (this.hasProperty(TiC.PROPERTY_PASSWORD)) {
			return TiConvert.toString(this.getProperty(TiC.PROPERTY_PASSWORD));
		}
		return null;
	}

	@Kroll.setProperty @Kroll.method
	public void setDomain(String value)
	{
		this.setProperty(TiC.PROPERTY_DOMAIN, value);
	}

	@Kroll.getProperty @Kroll.method
	public String getDomain()
	{
		if (this.hasProperty(TiC.PROPERTY_DOMAIN)) {
			return TiConvert.toString(this.getProperty(TiC.PROPERTY_DOMAIN));
		}
		return null;
	}
	
	@Kroll.method
	public void addAuthFactory(String scheme, Object factory)
	{
		//Sanity Checks
		if ( (scheme == null) || (scheme.length() == 0) || (! (factory instanceof AuthSchemeFactory) )) {
			return;
		}
		
		client.addAuthFactory(scheme, (AuthSchemeFactory)factory);
	}
	
	@Kroll.method
	public void addTrustManager(Object manager)
	{
		if (manager instanceof X509TrustManager) {
			client.addTrustManager((X509TrustManager)manager);
		}
	}
	
	@Kroll.method
	public void addKeyManager(Object manager)
	{
		if (manager instanceof X509KeyManager) {
			client.addKeyManager((X509KeyManager)manager);
		}
	}
}
