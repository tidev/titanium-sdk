package org.appcelerator.titanium.ant;

import java.util.Map;

import org.apache.tools.ant.BuildException;
import org.apache.tools.ant.Task;

public class ModulePackageTask extends Task {
	
	protected String json,module,property;
	
	@Override
	public void execute() throws BuildException {
		if (json == null) {
			throw new BuildException("No JSON file specified for " + getTaskName());
		}
		if (module == null) {
			throw new BuildException("No module specified for " + getTaskName());
		}

		if (property == null) {
			throw new BuildException("No property specified for " + getTaskName());
		}
		
		
		TiModuleDependencies deps = new TiModuleDependencies(json);
		Map<String,String> theMaps = deps.getModulePackages();
		if(theMaps.containsKey(module)) {
			String theVal = theMaps.get(module);
			if(theVal != null && theVal.length() > 0) {
				getProject().setProperty(property, theVal);
			} else {
				System.out.println("No valid path defined for module "+module);
			}
		}
	}
	
	public String getJson() {
		return json;
	}

	public void setJson(String json) {
		this.json = json;
	}

	public String getProperty() {
		return property;
	}

	public void setProperty(String property) {
		this.property = property;
	}

	public String getModule() {
		return module;
	}

	public void setModule(String module) {
		this.module = module;
	}
}
