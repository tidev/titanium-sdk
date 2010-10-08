package org.appcelerator.kroll;

import java.util.HashMap;
import java.util.List;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiContext.OnLifecycleEvent;

@Kroll.module
public class KrollModule extends KrollProxy
	implements KrollProxyListener, OnLifecycleEvent
{
	protected static HashMap<String, Object> constants = new HashMap<String, Object>();
	
	public KrollModule(TiContext context) {
		super(context);
		context.addOnLifecycleEventListener(this);
		modelListener = this;
		bindConstants();
	}
	
	protected void bindConstants() {
		for (String name : constants.keySet()) {
			setProperty(name, constants.get(name));
		}
	}
	
	@Override
	public void onResume() {
	}

	@Override
	public void onPause() {
	}
	
	@Override
	public void onDestroy() {
	}
	
	@Override
	public void onStart() {
	}
	
	@Override
	public void onStop() {	
	}
	
	@Override
	public void listenerAdded(String type, int count, KrollProxy proxy) {
	}
	
	@Override
	public void listenerRemoved(String type, int count, KrollProxy proxy) {
	}
	
	@Override
	public void processProperties(KrollDict d) {
	}
	
	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy) {
	}
	
	@Override
	public void propertiesChanged(List<KrollPropertyChange> changes, KrollProxy proxy) {
		for (KrollPropertyChange change : changes) {
			propertyChanged(change.getName(), change.getOldValue(), change.getNewValue(), proxy);
		}
	}
}
