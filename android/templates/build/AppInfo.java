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
	<% if (Object.keys(tiapp.properties).length) { %>
		TiProperties properties = app.getSystemProperties();
		TiProperties appProperties = app.getAppProperties();

		<% for (var prop in tiapp.properties) {
			var value = tiapp.properties[prop].value,
				type = tiapp.properties[prop].type,
				setter = 'set' + type.substring(0, 1).toUpperCase() + type.substring(1);
			type == 'string' && (value = '"' + value.replace(/"/g, '\\"') + '"');
		%>
			properties.<%- setter %>("<%- prop %>", <%- value %>);
			appProperties.<%- setter %>("<%- prop %>", <%- value %>);
		<% } %>
	<% } %>
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
