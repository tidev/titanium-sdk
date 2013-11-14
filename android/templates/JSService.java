package ${config['appid']};

import ti.modules.titanium.android.TiJSService;

public final class ${service['classname']} extends TiJSService {
	public ${service['classname']}() {
		super("${service['url']}");
	}
}
