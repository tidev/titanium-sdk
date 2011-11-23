/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.ant;

import java.io.File;
import java.util.List;

import org.apache.tools.ant.BuildException;
import org.apache.tools.ant.Task;
import org.apache.tools.ant.types.FileSet;
import org.apache.tools.ant.types.Path;

public class ModulePathTask extends Task {

	protected String json, module, modulesDir, pathid;
	
	@Override
	public void execute() throws BuildException {
		if (json == null) {
			throw new BuildException("No JSON file specified for " + getTaskName());
		}
		if (module == null) {
			throw new BuildException("No module specified for " + getTaskName());
		}
		if (modulesDir == null) {
			throw new BuildException("No modules dir specified for " + getTaskName());
		}
		if (pathid == null) {
			throw new BuildException("No path id specified for " + getTaskName());
		}

		Path moduleDepsPath = new Path(getProject());
		
		TiModuleDependencies deps = new TiModuleDependencies(json);
		List<String> moduleDeps = deps.getModuleDependencies(module);
		if (moduleDeps != null) {
			for (String dep : moduleDeps) {
				moduleDepsPath.add(new Path(getProject(), String.format("%s/%s", modulesDir, dep)));
				File libDir = new File(String.format("%s/%s/lib", modulesDir, dep));
				if (libDir.exists()) {
					FileSet libFileset = new FileSet();
					libFileset.setDir(libDir);
					libFileset.setIncludes("**/*.jar");
					moduleDepsPath.addFileset(libFileset);
				}
			}
		}

		getProject().addReference(pathid, moduleDepsPath);
	}

	public String getJson() {
		return json;
	}

	public void setJson(String json) {
		this.json = json;
	}

	public String getModule() {
		return module;
	}

	public void setModule(String module) {
		this.module = module;
	}
	
	public String getPathid() {
		return pathid;
	}

	public void setPathid(String pathid) {
		this.pathid = pathid;
	}

	public String getModulesDir() {
		return modulesDir;
	}

	public void setModulesDir(String modulesDir) {
		this.modulesDir = modulesDir;
	}
}
