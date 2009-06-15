package org.appcelerator.titanium.api;

public interface ITitaniumVideo {

	public void play();
	public void pause();
	public void stop();
	public void reset();
	public void release();
	public boolean isPlaying();
	public boolean isPaused();
	public int addEventListener(String eventName, String listener);
	public void removeEventListener(String eventName, int listenerId);
}
