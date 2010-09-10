package ${config['appid']};

import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.kroll.KrollModule;

import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;

public class ${config['classname']}Application extends TiApplication {

	protected HashMap<String, ArrayList<String>> moduleBindings = new HashMap<String, ArrayList<String>>();
	
	@Override
	public void onCreate() {
		super.onCreate();
		
		appInfo = new ${config['classname']}AppInfo(this);
	}
	
	@Override
	public List<KrollModule> bootModules(TiContext context) {
		ArrayList<KrollModule> modules = new ArrayList<KrollModule>();
		%for module in app_modules:
			// ${module['api_name']} module
			ArrayList<String> ${module['api_name']}_bindings = new ArrayList<String>();
			%for binding in module['bindings']:
			${module['api_name']}_bindings.add("${binding}");
			%endfor
			moduleBindings.put("${module['api_name']}", ${module['api_name']}_bindings);
			${module['class_name']} ${module['api_name']}_module = new ${module['class_name']}(context);
			${module['api_name']}_module.bind(context.getScope(), null);
			modules.add(${module['api_name']}_module);
		%endfor
		return modules;
	}
	
	@Override
	public List<String> getFilteredBindings(String moduleName) {
		return moduleBindings.get(moduleName);
	}
}
