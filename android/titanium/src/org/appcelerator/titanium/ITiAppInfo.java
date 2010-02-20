package org.appcelerator.titanium;

public interface ITiAppInfo {
	public String getId();
	public String getName();
	public String getVersion();
	public String getPublisher();
	public String getUrl();
	public String getCopyright();
	public String getDescription();
	public String getIcon();
	public boolean isAnalyticsEnabled();
	public String getGUID();
}
