package ${config['appid']};

import org.appcelerator.titanium.TiApplication;

public final class ${config['classname']}Application extends TiApplication {

	@Override
	public void onCreate() {
		super.onCreate();
		
		appInfo = new ${config['classname']}AppInfo(this);
		stylesheet = new ApplicationStylesheet();
		
		onAfterCreate();
	}
}
