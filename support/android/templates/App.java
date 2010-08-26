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

	@Override
	public final Integer getDrawableID(String key) { return RA.getDrawable(key); }
	
	@Override
	public final Integer getAttrID(String key) { return RA.getAttr(key); }
	
}
