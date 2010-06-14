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

import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiFile;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import temporary.CcUtil;
import android.graphics.Bitmap;
import android.util.Log;

public class FBRequest {
    private static final String LOG = FBRequest.class.getSimpleName();
    
    // /////////////////////////////////////////////////////////////////////////////////////////////////
    // global

    static final String API_VERSION = "1.0";
    static final String API_FORMAT = "JSON";
    static final String USER_AGENT = FacebookModule.USER_AGENT + " FacebookConnect";
    static final String STRING_BOUNDARY = "3i2ndDfv2rTHiSisAbouNdArYfORhtTPEefj3q2f";
    static final String ENCODING = "UTF-8";

    static final long TIMEOUT_INTERVAL = 180;

    // /////////////////////////////////////////////////////////////////////////////////////////////////

    private FBSession mSession;
    private FBRequestDelegate mDelegate;
    private String mUrl = null;
    private String mMethod = null;
    private Map<String, String> mParams = null;
    private Object mData = null;
    private Date mTimestamp = null;
    private boolean mLoading = false;
    
    private FBRequest(FBSession session, FBRequestDelegate delegate) {
        mSession = session;
        mDelegate = delegate;
    }

    /**
     * The delegate that will be notified of changes of state for this request.
     * @return
     */
    public FBRequestDelegate getDelegate() {
        return mDelegate;
    }

    /**
     * The URL which will be contacted to execute the request.
     */
    public String getUrl() {
        return mUrl;
    }

    /**
     * The API method which will be called.
     */
    public String getMethod() {
        return mMethod;
    }

    /**
     * The dictionary of parameters to pass to the method.
     * 
     * These values in the dictionary will be converted to strings using the standard Objective-C object-to-string
     * conversion facilities.
     */
    public Map<String, String> getParams() {
        return mParams;
    }

    /**
     * The timestamp of when the request was sent to the server.
     */
    public Date getTimestamp() {
        return mTimestamp;
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
        return requestWithSession(session, null);
    }

    /**
     * Creates a new API request for the global session with a delegate.
     */
    public static FBRequest requestWithSession(FBSession session, FBRequestDelegate delegate) {
        return new FBRequest(session, delegate);
    }

    // /////////////////////////////////////////////////////////////////////////////////////////////////
    // private

    private boolean isSpecialMethod() {
        return mMethod.equals("facebook.auth.getSession") || mMethod.equals("facebook.auth.createToken");
    }

    private String urlForMethod(String method) {
        return mSession.getApiURL();
    }

    private String generateGetUrl() {
        try {
            URL parsedURL = new URL(mUrl);
            String queryPrefix = parsedURL.getPath().contains("?") ? "&" : "?";

            List<String> pairs = new ArrayList<String>();
            for (Entry<String, String> entry : mParams.entrySet()) {
                pairs.add(entry.getKey() + "=" + entry.getValue());
            }
            String params = CcUtil.componentsJoinedByString(pairs, "&");

            return mUrl + queryPrefix + params;
        } catch (MalformedURLException e) {
            Log.e(LOG, "Invalid URL", e);
        }
        return null;
    }

    private String generateCallId() {
        return String.format(Long.toString(System.currentTimeMillis()));
    }

    private String generateSig() {
        StringBuilder joined = new StringBuilder();

        List<String> keys = new ArrayList<String>(mParams.keySet());
        Collections.sort(keys, CcUtil.CASE_INSENSITIVE_COMPARATOR);
        for (String obj : keys) {
            joined.append(obj);
            joined.append("=");
            Object value = mParams.get(obj);
            if (value instanceof String) {
                joined.append(value);
            }
        }

        if (isSpecialMethod()) {
            if (mSession.getApiSecret() != null) {
                joined.append(mSession.getApiSecret());
            }
        } else if (mSession.getSessionSecret() != null) {
            joined.append(mSession.getSessionSecret());
        } else if (mSession.getApiSecret() != null) {
            joined.append(mSession.getApiSecret());
        }

        return CcUtil.generateMD5(joined.toString());
    }

    private byte[] generatePostBody() throws UnsupportedEncodingException, IOException {
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        
        String bodyString = "--" + STRING_BOUNDARY + "\r\n";
        String endLine = "\r\n--" + STRING_BOUNDARY + "\r\n";
  
        os.write(bodyString.getBytes(ENCODING));
        
        // write all string parameters from the parameter map
        for (Entry<String, String> entry : mParams.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            
            String cd = "Content-Disposition: form-data; name=\"" + key + "\"\r\n\r\n";
            
            os.write(cd.getBytes(ENCODING));
            os.write(value.getBytes(ENCODING));
            os.write(endLine.getBytes(ENCODING));
        }
  
        // write a bitmap value, if one exists
        if (mData != null) {
            if (mData instanceof Bitmap) {
                String cd = "Content-Disposition: form-data; filename=\"photo\"\r\n";
                String ct = "Content-Type: image/png\r\n\r\n";
                Bitmap image = (Bitmap) mData;
  
                os.write(cd.getBytes(ENCODING));
                os.write(ct.getBytes(ENCODING));
                image.compress(Bitmap.CompressFormat.PNG, 0, os);
                os.write(endLine.getBytes(ENCODING));
                
            } else if (mData instanceof byte[]) {
                String cd = "Content-Disposition: form-data; filename=\"data\"\r\n";
                String ct = "Content-Type: content/unknown\r\n\r\n";
                byte[] data = (byte[]) mData;
  
                os.write(cd.getBytes(ENCODING));
                os.write(ct.getBytes(ENCODING));
                os.write(data);
                os.write(endLine.getBytes(ENCODING));
            }
            else if (mData instanceof TiBlob) 
			{
				TiBlob blob = (TiBlob)mData;
				String cd = "Content-Disposition: form-data; filename=\"data\"\r\n";
				String ct = "Content-Type: "+ blob.getMimeType() + "\r\n\r\n";

				os.write(cd.getBytes(ENCODING));
				os.write(ct.getBytes(ENCODING));
				FBUtil.copy(blob.getInputStream(),os);
				os.write(endLine.getBytes(ENCODING));

			} 
			else if (mData instanceof TiFile) 
			{
				TiFile file = (TiFile)mData;
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

    private void handleResponseData(String data, String contentType) {
        try {
            Object result = parseJsonResponse(data);
  
            // check whether the result is an error
            if (result instanceof JSONObject) {
                JSONObject jso = (JSONObject) result;
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
            
            // not an error, so call delegate
            succeedWithResult(result,contentType);
            
        } catch (JSONException e) {
            failWithError(e);
        }
    }

    private Object parseJsonResponse(String data) throws JSONException {
        // TODO find some reliable way of creating appropriate JSON API class
        if (data.startsWith("[")) {
            return new JSONArray(data);
        } else if (data.startsWith("{")){
            return new JSONObject(data);
        } else {
            return data;
        }
    }

    private void succeedWithResult(Object result, String contentType) {
        if (mDelegate != null) {
            mDelegate.requestDidLoad(this, contentType, result);
        }
    }

    private void failWithError(Throwable error) {
        if (mDelegate != null) {
            mDelegate.requestDidFailWithError(this, error);
        }
    }

    public void connect() throws IOException {
        mLoading = true;
        try {
            if (mDelegate != null) {
                mDelegate.requestLoading(this);
            }
    
            String url = (mMethod != null ? mUrl : generateGetUrl());
            URL serverUrl = new URL(url);
            
            HttpURLConnection conn = null;
            OutputStream out = null;
            InputStream in = null;
            String response = null;
            String contentType = null;
            try {
                conn = (HttpURLConnection)serverUrl.openConnection();
                conn.setRequestProperty("User-Agent", USER_AGENT);
    
                byte[] body = null;
                if (mMethod != null) {
                    conn.setRequestMethod("POST");
    
                    conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + STRING_BOUNDARY);
    
                    body = generatePostBody();
                }
    
                conn.setDoOutput(true);
                conn.connect();
                if (body != null) {
                    out = conn.getOutputStream();
                    out.write(body);
                }
    
                in = conn.getInputStream();
                response = CcUtil.getResponse(in).toString();
                contentType = conn.getHeaderField("Content-Type");
            } finally {
                CcUtil.close(in);
                CcUtil.close(out);
                CcUtil.disconnect(conn);
            }
            mTimestamp = new Date();
            
            handleResponseData(response,contentType);
        } finally {
            mLoading = false;
        }
    }

    // /////////////////////////////////////////////////////////////////////////////////////////////////
    // NSObject

    public String toString() {
        return "<FBRequest " + (mMethod != null ? mMethod : mUrl) + ">";
    }

    /**
     * Calls a method on the server asynchronously.
     * 
     * Use this form for API calls with no data parameter.
     * The delegate will be called for each stage of the loading process.
     */
    public void call(String method, Map<String, String> params) {
        callWithAnyData(method, params, null);
    }

    /**
     * Calls a method on the server asynchronously.
     * 
     * This version include an arbitrary byte array of data.
     * The delegate will be called for each stage of the loading process.
     */
    public void call(String method, Map<String, String> params, byte[] data) {
        callWithAnyData(method, params, data);
    }
    
    /**
     * Calls a method on the server asynchronously.
     * 
     * Include a Bitmap as a data parameter for photo uploads.
     * The delegate will be called for each stage of the loading process.
     */
    public void call(String method, Map<String, String> params, Bitmap data) {
        callWithAnyData(method, params, data);
    }
    
    /**
     * Calls a method on the server asynchronously.
     * 
     * The delegate will be called for each stage of the loading process.
     */
    public void callWithAnyData(String method, Map<String, String> params, Object data) {
        mUrl = urlForMethod(method);
        mMethod = method;
        mParams = params != null ? new HashMap<String, String>(params) : new HashMap<String, String>();
        mData = data;

        mParams.put("method", mMethod);
        mParams.put("api_key", mSession.getApiKey());
        mParams.put("v", API_VERSION);
        mParams.put("format", API_FORMAT);

        if (!isSpecialMethod()) {
            mParams.put("session_key", mSession.getSessionKey());
            mParams.put("call_id", generateCallId());

            if (mSession.getSessionSecret() != null) {
                mParams.put("ss", "1");
            }
        }

        mParams.put("sig", generateSig());

        mSession.send(this);
    }

    /**
     * Calls a URL on the server asynchronously.
     * 
     * The delegate will be called for each stage of the loading process.
     */
    public void post(String url, Map<String, String> params) {
        mUrl = url;
        mParams = params != null ? new HashMap<String, String>(params) : new HashMap<String, String>();

        mSession.send(this);
    }
    
    public void get(String url) {
		if (url == null) {
			throw new IllegalArgumentException("invalid url passed to GET");
		}
		this.mUrl = url;
		this.mMethod = "get";
		this.mParams = new HashMap<String, String>();

		Log.d(LOG, "sending get request to " + url);

		mSession.send(this);
	}

    // ////////////////////////////////////////////////////////////////////////////////////////////////
    // public
    
    /**
     * Indicates if the request has been sent and is awaiting a response.
     */
    public boolean loading() {
        return mLoading;
    }

    /**
     * Stops an active request before the response has returned.
     */
    public void cancel() {
        // TODO: implement cancellation
        if (loading()) {
            if (mDelegate != null) {
                mDelegate.requestWasCancelled(this);
            }
        }
    }

    public static abstract class FBRequestDelegate implements IRequestDelegate {

        /**
         * Called just before the request is sent to the server.
         */
        public void requestLoading(FBRequest request) {
        }

        /**
         * Called when an error prevents the request from completing successfully.
         */
        public void requestDidFailWithError(FBRequest request, Throwable error) {
        }

        /**
         * Called when a request returns and its response has been parsed into an object.
         * 
         * The resulting object may be a dictionary, an array, a string, or a number,
         * depending on the format of the API response.
         */
        public void requestDidLoad(FBRequest request, String contentType, Object result) {
        }

        /**
         * Called when the request was cancelled.
         */
        public void requestWasCancelled(FBRequest request) {
        }

    }

}
