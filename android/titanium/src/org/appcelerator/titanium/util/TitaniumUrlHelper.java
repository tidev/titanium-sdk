/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.util;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.StringWriter;

import org.appcelerator.titanium.TitaniumApplication;
import org.appcelerator.titanium.config.TitaniumAppInfo;
import org.appcelerator.titanium.config.TitaniumConfig;

import android.content.Context;
import android.net.Uri;
import android.util.Log;
import android.webkit.MimeTypeMap;
import android.webkit.URLUtil;

public class TitaniumUrlHelper
{
	private static final String LCAT = "TiUrlHlpr";
	private static final boolean DBG = TitaniumConfig.LOGD;

	public static final String ASSET_PATH = "file:///android_asset/";

	public static final String[] DEFAULT_JS_FILES = {
		"ti.js",
		"tijson.js", // From json.org injected into Titanium namespace
		"tiapp.js",
		"tiui.js",
		"tifs.js",
		"timedia.js",
		"tinetwork.js",
		"tiplatform.js",
		"tianalytics.js",
		"tidb.js",
		"tiaccelerometer.js",
		"tigesture.js",
		"tigeo.js"
	};

	public static String getSource(TitaniumApplication app, Context context, String url, String[] files)
		throws IOException
	{
		String source = app.getSourceFor(url);

		if (source == null) {
	 		MimeTypeMap mtm = MimeTypeMap.getSingleton();
			String extension = MimeTypeMap.getFileExtensionFromUrl(url);
			String mimetype = "application/octet-stream";

			if (files == null) {
				files = DEFAULT_JS_FILES;
				Log.i(LCAT, "Using default javascript files.");
			}

			if (extension != null) {
				String type = mtm.getMimeTypeFromExtension(extension);
				if (type != null) {
					mimetype = type;
				} else {
					mimetype = "text/html";
				}

				if("text/html".equals(mimetype)) {

					StringWriter bos = new StringWriter(16192);
					boolean haveSource = false;

					InputStreamReader br = null;
					try {
						if (app.getAppInfo().getSystemProperties().getBool(TitaniumAppInfo.PROP_ANDROID_DEBUG, false)) {
							Log.i(LCAT, "Loading Titanium JS from debug");
							for(int i = 0; i < files.length; i++) {
								bos.write("<script type='text/javascript' src='file:///android_asset/ti/debug/" + files[i] + "'></script>\n");
							}
						} else {
							bos.write("<script type='text/javascript' src='file:///android_asset/ti/release/tiall.js'></script>\n");
						}
						if (URLUtil.isAssetUrl(url)) {
							String path = url.substring(ASSET_PATH.length());
							if (DBG) {
								Log.d(LCAT, "Loading file from assets: " + path);
							}

							br = new InputStreamReader(context.getAssets().open(path));

						} else if (URLUtil.isContentUrl(url)) {
							br = new InputStreamReader(context.getContentResolver().openInputStream(Uri.parse(url)));
						} else {
							Log.e(LCAT, "HANDLE URL! " + url); //TODO implement for content, sdcard, etc
						}

						if (br != null) {
							char[] buf = new char[16192];
							int len = 0;
							while((len = br.read(buf)) != -1) {
								bos.write(buf, 0, len);
							}

							bos.write("<script>Titanium.doPostProcessing()</script>\n");
							haveSource = true;
						}
					} catch (IOException e) {
						Log.e(LCAT, "XError loading file: " + url, e);
						throw e;
					} finally {
						if (br != null) {
							try {
								br.close();
							} catch (IOException e) {
								// Ignore
							}
						}
						if (bos != null) {
							try {
								bos.close();
							} catch (IOException e) {
								// Ignore
							}
						}
					}

					if (haveSource) {
						source = bos.toString();
					}
				}
			}
		} else {
			Log.i(LCAT, "Source from cache for " + url);
		}
		return source;
	}

    public static String getUrlForCachedJavascript(Context context, String file)
    {
//    	StringBuilder sb = new StringBuilder();
//    	sb.append("content://")
//    		.append(context.getPackageName())
//    		.append(".titanium.js/")
//    		.append(file);
//    	return sb.toString();
    	return ASSET_PATH + "ti/debug/" + file;
    }

    public static String getContentUrlRoot(Context context) {
    	StringBuilder sb = new StringBuilder();
    	sb.append("content://")
    		.append(context.getPackageName())
    		.append(".titanium/")
    		;
    	return sb.toString();
    }

    public static String getContentUrlResourcesRoot(Context context) {
    	StringBuilder sb = new StringBuilder();
    	sb.append("content://")
    		.append(context.getPackageName())
    		.append(".titanium/Resources/")
    		;
    	return sb.toString();
    }

    public static String buildAssetUrlFromResourcesRoot(Context context, String path) {
    	return joinUrls(ASSET_PATH + "Resources", path);
    }
    public static String buildContentUrlFromResourcesRoot(Context context, String path) {
    	return joinUrls(getContentUrlResourcesRoot(context), path);
    }

    public static String joinUrls(String s1, String s2) {
		boolean s1slash = s1.endsWith("/");
		boolean s2slash = s2.startsWith("/");

    	StringBuilder sb = new StringBuilder();

    	if (!s1slash && !s2slash) {
    		sb.append(s1).append("/").append(s2);
    	} else if (s1slash && s2slash) {
    		sb.append(s1).append(s2.substring(1));
    	} else {
    		sb.append(s1).append(s2);
    	}

    	return sb.toString();
    }
	public static String getTitaniumJavascript(String file) {
		String result = null;

		StringBuilder sb = new StringBuilder(8096);
		BufferedReader br = null;

		try {
			br = new BufferedReader(new InputStreamReader(TitaniumUrlHelper.class.getResourceAsStream("/org/appcelerator/titanium/js/" + file)),8096);
			String line = null;
			while((line = br.readLine()) != null) {
				sb.append(line).append("\n");
			}
			result = sb.toString();
		} catch (IOException e) {
			Log.e(LCAT, "Unable to load javascript", e);
		} finally {
			if (br != null) {
				try {
					br.close();
				} catch (IOException e) {
					// Ignore
				}
			}
		}

		return result;
	}
}
