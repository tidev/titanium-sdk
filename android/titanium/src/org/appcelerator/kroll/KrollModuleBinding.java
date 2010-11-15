package org.appcelerator.kroll;

import org.appcelerator.titanium.TiContext;

public abstract class KrollModuleBinding extends KrollProxyBinding {
	public abstract String getId();
	public abstract KrollModule newInstance(TiContext context);
	
	public void bindToParent(KrollProxy parent, KrollProxy proxy) {
		parent.getBinding().bindings.put(getShortAPIName(), proxy);
	}
	
	@SuppressWarnings("unchecked")
	protected KrollModule getExternalChildModule(String name) {
		return KrollModule.getExternalChildModule(this, (Class<? extends KrollModule>)getProxyClass(), name);
	}
	
	@Override
	public boolean hasBinding(String name) {
		if (bindings.containsKey(name)) {
			return true;
		}
		if (isModule()) {
			return getExternalChildModule(name) != null;
		}
		return false;
	}
	
	@Override
	public Object getBinding(String name) {
		if (isModule()) {
			return getExternalChildModule(name);
		}
		
		return null;
	}
}
