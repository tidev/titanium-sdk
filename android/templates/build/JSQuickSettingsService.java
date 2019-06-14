package <%- appid %>;

import ti.modules.titanium.android.quicksettings.TiJSQuickSettingsService;

public final class <%- service.classname %> extends TiJSQuickSettingsService {
	public <%- service.classname %>() {
		super("<%- service.url %>");
	}
}
