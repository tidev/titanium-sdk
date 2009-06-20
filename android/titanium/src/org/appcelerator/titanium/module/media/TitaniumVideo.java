package org.appcelerator.titanium.module.media;

import java.lang.ref.SoftReference;

import org.appcelerator.titanium.api.ITitaniumVideo;
import org.appcelerator.titanium.module.TitaniumMedia;
import org.appcelerator.titanium.util.TitaniumIntentWrapper;

public class TitaniumVideo implements ITitaniumVideo
{
	SoftReference<TitaniumMedia> softMediaModule;
	TitaniumIntentWrapper intent;

	public TitaniumVideo(TitaniumMedia mediaModule, TitaniumIntentWrapper intent) {
		this.softMediaModule = new SoftReference<TitaniumMedia>(mediaModule);
		this.intent = intent;
	}

	public int addEventListener(String eventName, String listener) {
		// TODO Auto-generated method stub
		return 0;
	}

	public boolean isPaused() {
		// TODO Auto-generated method stub
		return false;
	}

	public boolean isPlaying() {
		// TODO Auto-generated method stub
		return false;
	}

	public void pause() {
		// TODO Auto-generated method stub

	}

	public void play() {
		TitaniumMedia m = softMediaModule.get();
		if (m != null) {
			//m.getActivity().launchTitaniumActivity(intent);
			m.getActivity().startActivity(intent.getIntent());
		}
	}

	public void release() {
		// TODO Auto-generated method stub

	}

	public void removeEventListener(String eventName, int listenerId) {
		// TODO Auto-generated method stub

	}

	public void reset() {
		// TODO Auto-generated method stub

	}

	public void stop() {
		// TODO Auto-generated method stub

	}

}
