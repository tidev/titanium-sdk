/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.facebook;


import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

import org.apache.http.impl.cookie.BasicClientCookie;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiFile;
import org.appcelerator.titanium.util.Log;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.graphics.Bitmap;
import android.webkit.CookieManager;
import android.webkit.CookieSyncManager;


public class FBRequest
{
    private static final String LOG = FBRequest.class.getSimpleName();
    private static final boolean DBG = TiConfig.LOGD;

    public static String API_VERSION = "1.0";
    public static String API_FORMAT = "JSON";
    public static String STRING_BOUNDARY = "3i2ndDfv2rTHiSisAbouNdArYfORhtTPEefj3q2f";
    public static String ENCODING = "UTF-8";
    public static final long TIMEOUT_INTERVAL_IN_SEC = 180;
	public static final String NETWORK_USER_AGENT = System.getProperties().getProperty("http.agent") ;

    private FBSession session;
    private FBRequestDelegate delegate;
    private String url;
    private String method;
    private Object userInfo;
    private Map<String, String> params;
    private Object data;
    private Date timestamp;
    private HttpURLConnection connection;
    private String responseText;

    private FBRequest() {
    }

    public FBRequestDelegate getDelegate() {
        return delegate;
    }

    /**
     * The URL which will be contacted to execute the request.
     */
    public String getUrl() {
        return url;
    }

    /**
     * The API method which will be called.
     */
    public String getMethod() {
        return method;
    }

    /**
     * An object used by the user of the request to help identify the meaning of the request.
     */
    public Object getUserInfo() {
        return userInfo;
    }

    /**
     * The dictionary of parameters to pass to the method.
     *
     * These values in the dictionary will be converted to strings using the standard Objective-C object-to-string
     * conversion facilities.
     */
    public Map<String, String> getParams() {
        return params;
    }

    /**
     * The timestamp of when the request was sent to the server.
     */
    public Date getTimestamp() {
        return timestamp;
    }

    // /////////////////////////////////////////////////////////////////////////////////////////////////
    // class public

    /**
     * Creates a new API request for the global session.
     */
    public static FBRequest request() {
        return requestWithSession(FBSession.getSession());
    }

    /**
     * Creates a new API request for the global session with a delegate.
     */
    public static FBRequest requestWithDelegate(FBRequestDelegate delegate) {
        return requestWithSession(FBSession.getSession(), delegate);
    }

    /**
     * Creates a new API request for a particular session.
     */
    public static FBRequest requestWithSession(FBSession session) {
        return new FBRequest().initWithSession(session);
    }

    /**
     * Creates a new API request for the global session with a delegate.
     */
    public static FBRequest requestWithSession(FBSession session, FBRequestDelegate delegate) {
        FBRequest request = requestWithSession(session);
        request.delegate = delegate;
        return request;
    }

    private String md5HexDigest(String input)
    {
        return FBUtil.generateMD5(input);
    }

    public boolean isSpecialMethod()
    {
        return method.equals("facebook.auth.getSession") || method.equals("facebook.auth.createToken");
    }

	 public boolean isLoggingInRequest()
	 {
		return isSpecialMethod() || url.indexOf(FBLoginDialog.FB_LOGIN_URL)!=-1;
	 }

    private String urlForMethod(String method)
    {
        return session.getApiURL();
    }

    private String generateGetURL()
    {
        try
        {
            URL parsedURL = new URL(url);
            String queryPrefix = parsedURL.getPath().contains("?") ? "&" : "?";

            List<String> pairs = new ArrayList<String>();
            for (Entry<String, String> entry : params.entrySet()) {
                pairs.add(entry.getKey() + "=" + entry.getValue());
            }
            String params = FBUtil.componentsJoinedByString(pairs, "&");

            return url + queryPrefix + params;
        }
        catch (MalformedURLException e)
        {
            e.printStackTrace();
        }
        return null;
    }

    private String generateCallId()
    {
        return String.format(Long.toString(System.currentTimeMillis()));
    }

    private String generateSig()
    {
        StringBuilder joined = new StringBuilder();

        List<String> keys = new ArrayList<String>(params.keySet());
        Collections.sort(keys, FBUtil.CASE_INSENSITIVE_COMPARATOR);
        for (String obj : keys) {
            joined.append(obj);
            joined.append("=");
            Object value = params.get(obj);
            if (value instanceof String) {
                joined.append(value);
            }
        }

        if (isSpecialMethod())
        {
            if (session.getApiSecret() != null)
            {
                joined.append(session.getApiSecret());
            }
        }
        else if (session.getSessionSecret() != null)
        {
            joined.append(session.getSessionSecret());
        }
        else if (session.getApiSecret() != null)
        {
            joined.append(session.getApiSecret());
        }

        return md5HexDigest(joined.toString());
    }

    private byte[] generatePostBody() throws UnsupportedEncodingException, IOException
    {
        ByteArrayOutputStream os = new ByteArrayOutputStream();

        String bodyString = "--" + STRING_BOUNDARY + "\r\n";
        String endLine = "\r\n--" + STRING_BOUNDARY + "\r\n";

        os.write(bodyString.getBytes(ENCODING));

        // write all string parameters from the parameter map
        for (Entry<String, String> entry : params.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();

            if (value==null) value = "";

            String cd = "Content-Disposition: form-data; name=\"" + key + "\"\r\n\r\n";

            os.write(cd.getBytes(ENCODING));
            os.write(value.getBytes(ENCODING));
            os.write(endLine.getBytes(ENCODING));
        }

        // write a bitmap value, if one exists
        if (data != null) {
            if (data instanceof Bitmap) 
			{
                String cd = "Content-Disposition: form-data; filename=\"photo\"\r\n";
                String ct = "Content-Type: image/png\r\n\r\n";
                Bitmap image = (Bitmap)data;

                os.write(cd.getBytes(ENCODING));
                os.write(ct.getBytes(ENCODING));
                image.compress(Bitmap.CompressFormat.PNG, 0, os);
                os.write(endLine.getBytes(ENCODING));

            } 
			else if (data instanceof byte[]) 
			{
                String cd = "Content-Disposition: form-data; filename=\"data\"\r\n";
                String ct = "Content-Type: content/unknown\r\n\r\n";
                byte[] thedata = (byte[])this.data;

                os.write(cd.getBytes(ENCODING));
                os.write(ct.getBytes(ENCODING));
                os.write(thedata);
                os.write(endLine.getBytes(ENCODING));
 			} 
			else if (data instanceof TiBlob) 
			{
				TiBlob blob = (TiBlob)data;
				String cd = "Content-Disposition: form-data; filename=\"data\"\r\n";
				String ct = "Content-Type: "+ blob.getMimeType() + "\r\n\r\n";

				os.write(cd.getBytes(ENCODING));
				os.write(ct.getBytes(ENCODING));
				FBUtil.copy(blob.getInputStream(),os);
				os.write(endLine.getBytes(ENCODING));

			} 
			else if (data instanceof TiFile) 
			{
				TiFile file = (TiFile)data;
				String cd = "Content-Disposition: form-data; filename=\"data\"\r\n";
				String ct = "Content-Type: content/unknown\r\n\r\n";

				os.write(cd.getBytes(ENCODING));
				os.write(ct.getBytes(ENCODING));
				FBUtil.copy(file.getInputStream(),os);
				os.write(endLine.getBytes(ENCODING));
			}
        }
        return os.toByteArray();
    }

    private Object parseJSONResponse(String data) throws JSONException {

        // TODO find some reliable way of creating appropriate JSON API class
        if (data.startsWith("[")) {
            return new JSONArray(data);
        } else {
            return new JSONObject(data);
        }
    }

    private void succeedWithResult(String contentType, Object result) {
		
		 Log.d(LOG,"succeedWithResult - contentType = "+contentType+", delegate = "+delegate);
		 if (DBG) Log.d(LOG,"succeedWithResult - result = "+result);
		
        if (delegate != null) {
			 Log.d(LOG,"succeedWithResult - calling "+delegate);
            delegate.request_didLoad(this, contentType, result);
        }
    }

    private void failWithError(Throwable error) {
        if (delegate != null) {
            delegate.request_didFailWithError(this, error);
        }
    }

    private void handleResponseData(String contentType, String data)
    {
    	  if (DBG) Log.d(LOG,"FBRequest: "+this+", Data: " + data+", content-type: "+contentType);
        try
        {
            Object result = null;

            if (contentType!=null && contentType.indexOf("/json")!=-1)
            {
                result = parseJSONResponse(data);
                // check whether the result is an error
                if (result instanceof JSONObject) {
                    JSONObject jso = (JSONObject)result;
                    if (jso.has("error_code")) {
                        int errorCode = jso.getInt("error_code");
                        String errorMessage = jso.getString("error_msg");
                        JSONArray args = jso.getJSONArray("request_args");
                        Map<String, String> map = new HashMap<String, String>();
                        for (int i = 0; i < args.length(); i++) {
                            JSONObject arg = args.getJSONObject(i);
                            map.put(arg.getString("key"), arg.getString("value"));
                        }
                        failWithError(new FBRequestError(errorCode, errorMessage, map));
                        return;
                    }
                }
            }
            else
            {
                result = data;
            }

            // not an error, so call delegate
            succeedWithResult(contentType,result);

        }
        catch (JSONException e)
        {
            failWithError(e);
        }
    }

    public void connect() throws IOException
    {
		if (connection!=null)
		{
			this.cancel();
		}

        delegate.requestLoading(this);

        String url = (method != null ? this.url : generateGetURL());

        URL serverUrl = new URL(url);

        Log.d(LOG,"sending url request "+serverUrl);

        OutputStream out = null;
        InputStream in = null;
        String returnedContentType = null;

        try 
		{
            connection = (HttpURLConnection) serverUrl.openConnection();
            connection.setConnectTimeout(30000);
            connection.setRequestProperty("User-Agent", NETWORK_USER_AGENT + " Titanium/"+session.getFacebookModule().getBuildVersion());

            Log.d(LOG,"USER AGENT = "+ NETWORK_USER_AGENT + " Titanium/"+session.getFacebookModule().getBuildVersion());

				
            String cookie = CookieManager.getInstance().getCookie(url);
            if (cookie!=null && cookie.indexOf("test_cookie=")==-1)
            {
                cookie+="; test_cookie=1";
            }
            else if (cookie==null)
            {
                cookie = "test_cookie=1";
            }

			Log.d(LOG,">>>> facebook cookie = "+cookie);

            connection.setRequestProperty("Cookie", cookie);

            byte[] body = null;
            if (method != null) // not HTTP method but API method 
			{
                connection.setRequestMethod("POST");

                String contentType = "multipart/form-data; boundary=" + STRING_BOUNDARY;
                connection.setRequestProperty("Content-Type", contentType);

                body = generatePostBody();
            }

			connection.setInstanceFollowRedirects(false);
            connection.setDoOutput(true);
            connection.connect();
            if (body != null) 
            {
                out = connection.getOutputStream();
                out.write(body);
				out.flush();
            }

            in = connection.getInputStream();
         	StringBuilder sb = new StringBuilder(4096);
         	FBUtil.getResponse(sb, in);
			int responseCode = connection.getResponseCode();
			if (responseCode == 301 || responseCode == 302)
			{
				String location = connection.getHeaderField("Location");
				int i = location.indexOf("fbconnect:");
				if (i!=-1)
				{
					// this happens since Facebook will append your base domain in cases where
					// you're using both Facebook Connect for web and desktop
					location = location.substring(i);
				}
				Log.d(LOG,"REDIRECT FOUND TO: "+location);
				responseText = "<script>document.location.href = '"+location+"';</script>";
				returnedContentType = "text/html";
			}
			else
			{
         		responseText = sb.toString();
            	returnedContentType = connection.getHeaderField("Content-Type");
			}

			for (int i = 0; true; i++)
			{
                String hdrKey = connection.getHeaderFieldKey(i);
                String hdrVal = connection.getHeaderField(i);
                if (hdrKey == null) break; // no more headers
                if (hdrVal == null) continue; // in some implementations, first header has no value
                if (DBG) Log.d(LOG, "url header: " + hdrKey + "=" + hdrVal);
                if (hdrKey.equalsIgnoreCase("set-cookie"))
				{
                    // Parse cookie
                    String[] fields = hdrVal.split(";\\s*");

                    String cookieValue = fields[0];
                    String expires = null;
                    String path = null;
                    String domain = null;
                    boolean secure = false;

                    String[] keyAndVal = cookieValue.split("=");
                    String key = keyAndVal[0];
                    String val = keyAndVal[1];

                    // Parse each field
                    for (int j = 1; j < fields.length; j++)
					{
                        if ("secure".equalsIgnoreCase(fields[j])) {
                            secure = true;
                        }
						else if (fields[j].indexOf('=') > 0)
						{
                            String[] f = fields[j].split("=");
                            if ("expires".equalsIgnoreCase(f[0])) {
                                expires = f[1];
                            } else if ("domain".equalsIgnoreCase(f[0])) {
                                domain = f[1];
                            } else if ("path".equalsIgnoreCase(f[0])) {
                                path = f[1];
                            }
                        }
                    }
                    BasicClientCookie _cookie = new BasicClientCookie(key, val);
                    // TODO parse expiration date into Date object
                    //if (expires != null) { cookie.setExpiryDate(expires); }
                    if (path != null) { _cookie.setPath(path); }
                    if (domain != null) { _cookie.setDomain(domain); }
                    _cookie.setSecure(secure);
			        CookieSyncManager sm = CookieSyncManager.createInstance(session.getContext());
					CookieManager cookieManager = CookieManager.getInstance();
					cookieManager.setAcceptCookie(true);
                    cookieManager.setCookie(url, _cookie.toString());
					sm.sync();
                }

			}
        }
        finally
        {
            FBUtil.close(in);
            FBUtil.close(out);
            FBUtil.disconnect(connection);
        }

        connectionDidFinishLoading(returnedContentType);
		connection = null;
        timestamp = new Date();
    }

    /**
     * Creates a new request paired to a session.
     */
    FBRequest initWithSession(FBSession session) {
        this.session = session;
        this.delegate = null;
        this.url = null;
        this.method = null;
        this.params = null;
        this.userInfo = null;
        this.timestamp = null;
        this.connection = null;
        this.responseText = null;
        return this;
    }

    public String toString() {
        return "<FBRequest " + (method != null ? method : url) + "," + this.hashCode() + ">";
    }

    private void connectionDidFinishLoading(String contentType) {
        handleResponseData(contentType,responseText);
        responseText = null;
        connection = null;
    }

    /**
     * Indicates if the request has been sent and is awaiting a response.
     */
    public boolean loading() {
        return connection != null;
    }

    /**
     * Calls a method on the server asynchronously.
     *
     * Use this form for API calls with no data parameter.
     * The delegate will be called for each stage of the loading process.
     */
    public void call(String method_, Map<String, String> params_) {
        callWithAnyData(method_, params_, null);
    }

    /**
     * Calls a method on the server asynchronously.
     *
     * This version include an arbitrary byte array of data.
     * The delegate will be called for each stage of the loading process.
     */
    public void call(String method_, Map<String, String> params_, byte[] data_) {
        callWithAnyData(method_, params_, data_);
    }

    /**
     * Calls a method on the server asynchronously.
     *
     * Include a Bitmap as a data parameter for photo uploads.
     * The delegate will be called for each stage of the loading process.
     */
    public void call(String method_, Map<String, String> params_, Bitmap data_) {
        callWithAnyData(method_, params_, data_);
    }

    /**
     * Calls a method on the server asynchronously.
     *
     * The delegate will be called for each stage of the loading process.
     */
    public void callWithAnyData(String method_, Map<String, String> params_, Object data_) {
        this.url = urlForMethod(method_);
        this.method = method_;
        this.params = params_ != null ? new HashMap<String, String>(params_) : new HashMap<String, String>();
        this.data = data_;

        params.put("method", method);
        params.put("api_key", session.getApiKey());
        params.put("v", API_VERSION);
        params.put("format", API_FORMAT);

        if (!isSpecialMethod())
        {
            params.put("session_key", session.getSessionKey());
            params.put("call_id", generateCallId());

            if (session.getSessionSecret() != null) {
                params.put("ss", "1");
            }
        }

        params.put("sig", generateSig());

        session.send(this);
    }

    /**
     * Calls a URL on the server asynchronously.
     *
     * The delegate will be called for each stage of the loading process.
     */
    public void post(String url, Map<String, String> params_) {
	
		if (url == null) 
		{
			throw new IllegalArgumentException("invalid url passed to POST");
		}
        this.url = url;
        this.method = "post";
        this.params = params_ != null ? new HashMap<String, String>(params_) : new HashMap<String, String>();

        Log.d(LOG,"sending post request to "+url+" with "+this.params);

        session.send(this);
    }

    public void get(String url)
    {
		if (url == null) 
		{
			throw new IllegalArgumentException("invalid url passed to GET");
		}
        this.url = url;
        this.method = "get";
        this.params = new HashMap<String, String>();

        Log.d(LOG,"sending get request to "+url);

        session.send(this);
    }


    /**
     * Stops an active request before the response has returned.
     */
    public void cancel()
    {
        if (connection != null)
        {
			   Log.d(LOG,"cancelling");

            try
            {
                connection.disconnect();
            }
            catch(Exception ig)
            {
            }
            connection = null;

            delegate.requestWasCancelled(this);
        }
    }

    public static abstract class FBRequestDelegate {

        /**
         * Called just before the request is sent to the server.
         */
        protected void requestLoading(FBRequest request) {
        }

        /**
         * Called when an error prevents the request from completing successfully.
         */
        protected void request_didFailWithError(FBRequest request, Throwable error) {
        }

        /**
         * Called when a request returns and its response has been parsed into an object.
         *
         * The resulting object may be a dictionary, an array, a string, or a number, depending on the format of the
         * API response.
         */
        protected void request_didLoad(FBRequest request, String contentType, Object result) {
        }

        /**
         * Called when the request was cancelled.
         */
        protected void requestWasCancelled(FBRequest request) {
        }

    }

}
