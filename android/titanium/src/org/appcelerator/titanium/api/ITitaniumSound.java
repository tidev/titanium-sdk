package org.appcelerator.titanium.api;

public interface ITitaniumSound {

	public void play();
	public void pause();
	public void stop();
	public void reset();
	public void release();
	public void setVolume(float volume);
	public float getVolume(); //TODO real signature
	public void setLooping(boolean loop);
	public boolean isLooping();
	public boolean isPlaying();
	public boolean isPaused();
	public int addEventListener(String eventName, String listener);
	public void removeEventListener(String eventName, int listenerId);
}
