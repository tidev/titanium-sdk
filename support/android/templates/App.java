package ${config['appid']};

import org.appcelerator.titanium.TiApplication;

public class ${config['classname']}Application extends TiApplication {

	@Override
	public void onCreate() {
		super.onCreate();
		
		appInfo = new ${config['classname']}AppInfo(this);
		onAfterCreate();
	}
}
