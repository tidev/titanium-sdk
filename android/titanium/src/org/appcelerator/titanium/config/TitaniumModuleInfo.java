package org.appcelerator.titanium.config;

public class TitaniumModuleInfo
{
	protected String moduleId;
	protected String moduleVersion;

	TitaniumModuleInfo() {

	}
	public String getModuleId() {
		return moduleId;
	}
	public void setModuleId(String moduleId) {
		this.moduleId = moduleId;
	}
	public String getModuleVersion() {
		return moduleVersion;
	}
	public void setModuleVersion(String moduleVersion) {
		this.moduleVersion = moduleVersion;
	}
}
