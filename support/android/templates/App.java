package ${config['appid']};

import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiContext;

import java.util.List;
import java.util.ArrayList;

public class ${config['classname']}Application extends TiApplication {

	protected HashMap<String, ArrayList<String>> moduleBindings = new HashMap<String, ArrayList<String>>();
	
	@Override
	public void onCreate() {
		super.onCreate();
		
		appInfo = new ${config['classname']}AppInfo(this);
	}
	
	@Override
	public void bootModules(TiContext context) {
		%for module in app_modules:
			// ${module['api_name']} module
			ArrayList<String> ${module['api_name']}_bindings = new ArrayList<String>();
			%for binding in module['bindings']:
			${module['api_name']}_bindings.add("${binding}");
			%endfor
			moduleBindings.put("${module['api_name']}", ${module['api_name']}_bindings);
			new ${module['class_name']}(context);

		%endfor
	}
	
	@Override
	public List<String> getFilteredBindings(String moduleName) {
		return moduleBindings.get(moduleName);
	}
}
