package ${config['appid']};

import ti.modules.titanium.android.TiJSIntervalService;

public final class ${service['classname']} extends TiJSIntervalService {
	public ${service['classname']}() {
		super("${service['url']}");
	}
}
