package {{=builder.appid}};

import org.appcelerator.titanium.ITiAppInfo;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiProperties;
import org.appcelerator.kroll.common.Log;

/* GENERATED CODE
 * Warning - this class was generated from your application's tiapp.xml
 * Any changes you make here will be overwritten
 */
public final class {{=builder.classname}}AppInfo implements ITiAppInfo
{
	private static final String LCAT = "AppInfo";

	public {{=builder.classname}}AppInfo(TiApplication app) {
		{{? Object.keys(builder.tiapp.properties).length}}
		TiProperties properties = app.getSystemProperties();
		TiProperties appProperties = app.getAppProperties();

			{{ for (var prop in builder.tiapp.properties) { }}
				{{
					var value = builder.tiapp.properties[prop].value,
						type = builder.tiapp.properties[prop].type,
						setter = 'set' + type.substring(0, 1).toUpperCase() + type.substring(1);
					type == 'string' && (value = '"' + value.replace(/"/g, '\\"') + '"');
				}}
				properties.{{=setter}}("{{=prop}}", {{=value}});
				appProperties.{{=setter}}("{{=prop}}", {{=value}});
			{{ } }}
		{{?}}
	}

	{{
		function X(s) { return s.replace(/"/g, '\\"'); }
	}}

	public String getId() {
		return "{{=X(builder.tiapp.id)}}";
	}

	public String getName() {
		return "{{=X(builder.tiapp.name)}}";
	}

	public String getVersion() {
		return "{{=X(builder.tiapp.version)}}";
	}

	public String getPublisher() {
		return "{{=X(builder.tiapp.publisher)}}";
	}

	public String getUrl() {
		return "{{=X(builder.tiapp.url)}}";
	}

	public String getCopyright() {
		return "{{=X(builder.tiapp.copyright)}}";
	}

	public String getDescription() {
		return "{{=X(builder.tiapp.description)}}";
	}

	public String getIcon() {
		return "{{=X(builder.tiapp.icon)}}";
	}

	public boolean isAnalyticsEnabled() {
		return {{=!!builder.tiapp.analytics}};
	}

	public String getGUID() {
		return "{{=X(builder.tiapp.guid)}}";
	}

	public boolean isFullscreen() {
		return {{=!!builder.tiapp.fullscreen}};
	}

	public boolean isNavBarHidden() {
		return {{=!!builder.tiapp['navbar-hidden']}};
	}
}
