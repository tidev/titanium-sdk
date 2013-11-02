package <%- appid %>;

import org.appcelerator.titanium.ITiAppInfo;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiProperties;
import org.appcelerator.kroll.common.Log;

/* GENERATED CODE
 * Warning - this class was generated from your application's tiapp.xml
 * Any changes you make here will be overwritten
 */
public final class <%- classname %>AppInfo implements ITiAppInfo
{
	private static final String LCAT = "AppInfo";

	public <%- classname %>AppInfo(TiApplication app) {
	}

	public String getDeployType() {
		return "<%- deployType %>";
	}

	public String getId() {
		return "<%- tiapp.id %>";
	}

	public String getName() {
		return "<%- tiapp.name %>";
	}

	public String getVersion() {
		return "<%- tiapp.version %>";
	}

	public String getPublisher() {
		return "<%- tiapp.publisher %>";
	}

	public String getUrl() {
		return "<%- tiapp.url %>";
	}

	public String getCopyright() {
		return "<%- tiapp.copyright %>";
	}

	public String getDescription() {
		return "<%- tiapp.description %>";
	}

	public String getIcon() {
		return "<%- tiapp.icon %>";
	}

	public boolean isAnalyticsEnabled() {
		return <%- !!tiapp.analytics %>;
	}

	public String getGUID() {
		return "<%- tiapp.guid %>";
	}

	public boolean isFullscreen() {
		return <%- !!tiapp.fullscreen %>;
	}

	public boolean isNavBarHidden() {
		return <%- !!tiapp['navbar-hidden'] %>;
	}
}
