package org.appcelerator.titanium;

/**
 * Supporting base class for modules.
 *
 */
public abstract class TiModuleInfo {
	
    abstract public String name();
    abstract public String dependsUponTitanium();
    abstract public String version();
    
}
