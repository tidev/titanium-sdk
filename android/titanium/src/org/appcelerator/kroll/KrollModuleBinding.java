package org.appcelerator.kroll;

public abstract class KrollModuleBinding extends KrollProxyBinding {
	public abstract String getId();

	public void bindToParent(KrollProxy parent, KrollProxy proxy) {
		parent.getBinding().bindings.put(getShortAPIName(), proxy);
	}
}
