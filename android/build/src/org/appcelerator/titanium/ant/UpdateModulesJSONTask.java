package org.appcelerator.titanium.ant;

import java.io.File;
import java.io.FileWriter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import org.apache.tools.ant.BuildException;
import org.apache.tools.ant.Task;
import org.json.simple.JSONValue;

public class UpdateModulesJSONTask extends Task {

	protected String jarname, moduleJSON, modulesJSON;
	
	@Override
	public void execute() throws BuildException {
		try {
			ArrayList<String> moduleNames = new ArrayList<String>();
			File modulesJSONFile = new File(modulesJSON);
			Map<String, Object> modulesJSON;
			if (modulesJSONFile.exists()) {
				modulesJSON = TiAntUtil.parseJSON(this.modulesJSON);
			} else {
				modulesJSON = new HashMap<String, Object>();
			}
			
			Map<String, Object> json = TiAntUtil.parseJSON(moduleJSON);
			if (!json.containsKey("proxies")) {
				return;
			}
			
			Map<String, Object> modules = TiAntUtil.getJSONMap(json, "modules");
			Map<String, Object> proxies = TiAntUtil.getJSONMap(json, "proxies");
			for (String moduleClass : modules.keySet()) {
				if (proxies.containsKey(moduleClass)) {
					moduleNames.add(TiAntUtil.getJSONMap(proxies, moduleClass, "proxyAttrs").get("fullAPIName").toString());
				}
			}
			
			modulesJSON.put(jarname, moduleNames);
			
			FileWriter writer = new FileWriter(this.modulesJSON);
			JSONValue.writeJSONString(modulesJSON, writer);
			writer.close();
			
		} catch (Exception e) {
			e.printStackTrace();
			throw new BuildException(e);
		}
	}

	public String getJarname() {
		return jarname;
	}

	public void setJarname(String jarname) {
		this.jarname = jarname;
	}

	public String getModuleJSON() {
		return moduleJSON;
	}

	public void setModuleJSON(String moduleJSON) {
		this.moduleJSON = moduleJSON;
	}

	public String getModulesJSON() {
		return modulesJSON;
	}

	public void setModulesJSON(String modulesJSON) {
		this.modulesJSON = modulesJSON;
	}
}
