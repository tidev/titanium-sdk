package org.appcelerator.kroll;

public class KrollPropertyChange {
	protected String name;
	protected Object oldValue, newValue;
	
	public KrollPropertyChange(String name, Object oldValue, Object newValue) {
		this.name = name;
		this.oldValue = oldValue;
		this.newValue = newValue;
	}
	
	public void fireEvent(KrollProxy proxy, KrollProxyListener listener) {
		if (listener != null) {
			listener.propertyChanged(name, oldValue, newValue, proxy);
		}
	}

	public String getName() {
		return name;
	}

	public Object getOldValue() {
		return oldValue;
	}

	public Object getNewValue() {
		return newValue;
	}
}
