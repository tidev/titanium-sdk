package org.appcelerator.titanium.config;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Properties;

import javax.xml.parsers.ParserConfigurationException;
import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;

import org.appcelerator.titanium.api.ITitaniumProperties;
import org.appcelerator.titanium.module.app.TitaniumProperties;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;
import org.xml.sax.XMLReader;

import android.content.Context;
import android.util.Config;
import android.util.Log;

public class TitaniumAppInfo
{
	private static final String LCAT = "TiAppInfo";
	private static final boolean DBG = Config.LOGD;

	public static final String TISYS_PREFS = "tisys";

	public static final String PROP_ANDROID_FLUSHJSCACHE = "ti.android.flushjscache";
	public static final String PROP_ANDROID_MINIFYJS = "ti.android.minifyjs";
	public static final String PROP_ANDROID_WATCHLOG = "ti.android.watchlog";

	public static final String NETWORK_USER_AGENT = "Mozilla/5.0 (Linux; U; Android 1.1; en-us; generic) AppleWebKit/525.10+ (KHTML, like Gecko) Version/3.0.4 Mobile Safari/523.12.2";
	public static final String PROP_NETWORK_USER_AGENT = "ti.network.userAgent";

	protected String appId;
	protected String appVersion;
	protected String appIconUrl;
	protected String appName;
	protected String appURL;
	protected String appDescription;
	protected String appCopyright;
	protected String appGUID;
	protected String appPublisher;

	protected HashMap<String, TitaniumWindowInfo> windows;
	protected ArrayList<TitaniumModuleInfo> modules;
	protected TitaniumProperties systemProperties;
	protected TitaniumAppInfo(Context ctx)
	{
		windows = new HashMap<String, TitaniumWindowInfo>();
		modules = new ArrayList<TitaniumModuleInfo>();
		systemProperties = new TitaniumProperties(ctx, TISYS_PREFS, true); // clear on construct

		systemProperties.setBool(PROP_ANDROID_FLUSHJSCACHE, false);
		systemProperties.setBool(PROP_ANDROID_MINIFYJS, true);
		systemProperties.setBool(PROP_ANDROID_WATCHLOG, false);
		systemProperties.setString(PROP_NETWORK_USER_AGENT, NETWORK_USER_AGENT + " Titanium/0.4"); //TODO get from build

		if (DBG) {
			Log.d(LCAT, "Default Titanium system properties loaded.");
		}
	}

	protected Properties getDefaultProperties() {
		Properties p = new Properties();

		return p;
	}
	public static TitaniumAppInfo loadFromXml(InputStream input, Context ctx)
		throws IOException, SAXException
	{
		TitaniumAppInfo tai = null;

		SAXParserFactory spf = SAXParserFactory.newInstance();
		try {
			SAXParser sp = spf.newSAXParser();
			XMLReader xr = sp.getXMLReader();
			TitaniumAppInfo localTai = new TitaniumAppInfo(ctx);
			xr.setContentHandler(new TiAppXmlHandler(localTai));

			xr.parse(new InputSource(input));

			// OK, return configuration
			tai = localTai;
		} catch (ParserConfigurationException e) {
			Log.e(LCAT, "Parser is not configured correctly: ", e);
			// TODO throw new exception for reporting
		}

		return tai;
	}

	public String getAppId() {
		return appId;
	}

	public void setAppId(String appId) {
		this.appId = appId;
	}

	public String getAppVersion() {
		return appVersion;
	}

	public void setAppVersion(String appVersion) {
		this.appVersion = appVersion;
	}

	public String getAppIconUrl() {
		return appIconUrl;
	}

	public void setAppIconUrl(String appIconUrl) {
		this.appIconUrl = appIconUrl;
	}

	public void setAppName (String appName){
		this.appName = appName;
	}

	public String getAppName (){
		return this.appName;
	}

	public void setAppDescription (String appDescription){
		this.appDescription = appDescription;
	}

	public String getAppDescription (){
		return this.appDescription;
	}

	public void setAppCopyright (String appCopyright){
		this.appCopyright = appCopyright;
	}

	public String getAppCopyright (){
		return this.appCopyright;
	}

	public void setAppGUID (String appGUID){
		this.appGUID = appGUID;
	}

	public String getAppGUID (){
		return this.appGUID;
	}

	public void setAppPublisher (String appPublisher){
		this.appPublisher = appPublisher;
	}

	public String getAppPublisher(){
		return this.appPublisher;
	}

	public void setAppURL (String appURL){
		this.appURL = appURL;
	}

	public String getAppURL (){
		return this.appURL;
	}

	public ArrayList<TitaniumWindowInfo> getWindows() {
		ArrayList<TitaniumWindowInfo> ws = new ArrayList<TitaniumWindowInfo>(windows.values());
		Collections.sort(ws);
		return ws;
	}

	public void addWindow(TitaniumWindowInfo window) {
		this.windows.put(window.getWindowId(), window);
	}

	public TitaniumWindowInfo findWindowInfo(String windowId) {
		return this.windows.get(windowId);
	}

	public ArrayList<TitaniumModuleInfo> getModules() {
		return modules;
	}

	public void addModule(TitaniumModuleInfo module) {
		this.modules.add(module);
	}

	public ITitaniumProperties getSystemProperties() {
		return systemProperties;
	}
}
