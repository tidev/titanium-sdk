package org.appcelerator.tidev;

import org.appcelerator.tidev.module.TiDevLauncher;
import org.appcelerator.titanium.TitaniumApplication;
import org.appcelerator.titanium.TitaniumModuleManager;

public class TitaniumDeveloperApplication extends TitaniumApplication {

	public TitaniumDeveloperApplication() {
		// TODO Auto-generated constructor stub
	}

	@Override
	public void addModule(TitaniumModuleManager moduleMgr) {
		super.addModule(moduleMgr);

		new TiDevLauncher(moduleMgr, "TiDevLauncher");
	}

}
