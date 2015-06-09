/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import org.appcelerator.titanium.ITiAppInfo;
import org.appcelerator.titanium.TiProperties;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.kroll.util.KrollAssetHelper;
import org.appcelerator.kroll.common.Log;

import java.util.HashMap;
import java.util.regex.Pattern;
import java.util.regex.Matcher;
import android.os.Environment;


public class TiResourceUtils implements KrollAssetHelper.TiResourceUtils
{
	private static final String TAG = "TiResourceUtils";
	
	private static boolean isInit;
	private static boolean useAsset;
	private static boolean useCustomDir;
	private static String sourcePathString;
	private static String baseDirectory;
	private static String pathString;
	
	protected static TiFileFactory tiFileFactory;
	protected static TiApplication tiApp = TiApplication.getInstance();
	protected static TiProperties tiProp =  tiApp.getAppProperties();
	
	public TiResourceUtils()
	{
		
	}
	
	private void init (){
		sourcePathString = tiProp.getString("dataDirectory", "");
		if(sourcePathString != ""){
			useCustomDir = true;
			baseDirectory = getBaseDirectory(sourcePathString);
			pathString = parsePathString(sourcePathString);
		}
		isInit = true;
	}
	
	private boolean isExternalStoragePresent()
	{
		return Environment.getExternalStorageState().equals(Environment.MEDIA_MOUNTED);
	}
	
	private HashMap getValues(){
		ITiAppInfo appInfo = tiApp.getAppInfo();
		
		HashMap<String, String> values = new HashMap<String, String>();
		values.put("deploytype", appInfo.getDeployType());
		values.put("id", appInfo.getId());
		values.put("publisher", appInfo.getPublisher());
		values.put("url", appInfo.getUrl());
		values.put("name", appInfo.getName());
		values.put("version", appInfo.getVersion());
		values.put("description", appInfo.getDescription());
		values.put("copyright", appInfo.getCopyright());
		values.put("guid", appInfo.getGUID());
		values.put("familyTarget", "android");
		values.put("platform", "android");
		values.put("family", "android");
		values.put("undName", appInfo.getName().replaceAll(" ", "_"));
		
		return values;
	}
	
	private String parsePathString(String path){
		HashMap values = getValues();
		
		Pattern dirPattern = Pattern.compile("(.*Directory):/");
		Pattern valuePattern = Pattern.compile("\\{ *(.*?) *\\}");
		
		Matcher dirRegex = dirPattern.matcher(path);
		
		if(dirRegex.find()){
			path = dirRegex.replaceFirst("");
		}
		
		Matcher valueRegex = valuePattern.matcher(path);
		
		while(valueRegex.find()){
			String matchText = valueRegex.group(0);
			String matchValue = valueRegex.group(1);
			String value = (String) values.get(matchValue);
			if(value != null){
				path = path.replace(matchText, value);
			}
		}
		if(!path.equals("") && !path.endsWith("/")){
			path += "/";
		}
		return path;
	}
	
	private String getBaseDirectory(String path)
	{
		Pattern dirPattern = Pattern.compile("(.*Directory):/");
		Matcher dirRegex = dirPattern.matcher(path);
		
		String basePath = "";
		
		while (dirRegex.find()) {
			String matchText = dirRegex.group(1);
			
			if(matchText.equals("resourcesDirectory")){
				useAsset = true;
				//Use default path
			}else if(matchText.equals("applicationDataDirectory")){
				basePath = tiFileFactory.getDataDirectory(true).toString();
			}else if(matchText.equals("tempDirectory")){
				basePath = tiApp.getTempFileHelper().getTempDirectory().getAbsolutePath();
			}else if(matchText.equals("applicationCacheDirectory")){
				basePath = tiApp.getCacheDir().toString();
			}else if(matchText.equals("externalStorageDirectory") && isExternalStoragePresent()){
				basePath = tiFileFactory.getDataDirectory(false).toString();
			}else{
				useAsset = true;
				//Use default path
			}
		}
		if(!basePath.equals("") && !basePath.endsWith("/")){
			basePath += "/";
		}
		return basePath;
	}
	
	public boolean isExist(String path){
		String basePath = getPath(path);
		if(useAsset) basePath = "app://"+basePath;
		TiBaseFile file = tiFileFactory.createTitaniumFile(basePath, false);
		return file.exists();
	}
	
	public boolean useCustomResourceDirectory()
	{
		if(!isInit){
			init();
		}
		return useCustomDir;
	}
	
	public boolean useAssetDirectory(){
		return useAsset;
	}
	
	public String getBaseDir(){
		return baseDirectory;
	}
	
	public String getBasePath(){
		return baseDirectory+pathString;
	}
	
	public String getPath(String path){
		if(path.startsWith("/")){
			path = path.substring(1);
		}
		return getBasePath()+path;
	}
}