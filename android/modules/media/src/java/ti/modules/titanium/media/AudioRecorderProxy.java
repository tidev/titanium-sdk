/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.titanium.TiFileProxy;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;

@Kroll.proxy(creatableInModule = MediaModule.class)
public class AudioRecorderProxy extends KrollProxy
{
	TiAudioRecorder tiAudioRecorder;
	KrollRuntime.OnDisposingListener runtimeOnDisposingListener;

	public AudioRecorderProxy()
	{
		// Create the microphone handler.
		this.tiAudioRecorder = new TiAudioRecorder();

		// Stop recording when the JavaScript runtime is being terminated.
		// This releases the microphone to be used by another audio recorder instance.
		this.runtimeOnDisposingListener = new KrollRuntime.OnDisposingListener() {
			@Override
			public void onDisposing(KrollRuntime runtime)
			{
				stop();
			}
		};
	}

	@Kroll.setProperty
	public void setCompression(int value)
	{
	}

	@Kroll.setProperty
	public void setFormat(int value)
	{
	}

	@Kroll.getProperty
	public int getFormat()
	{
		return 0;
	}

	@Kroll.getProperty
	public int getCompression()
	{
		return 0;
	}

	@Kroll.getProperty
	public boolean getPaused()
	{
		return tiAudioRecorder.isPaused();
	}

	@Kroll.getProperty
	public boolean getRecording()
	{
		return tiAudioRecorder.isRecording();
	}

	@Kroll.getProperty
	public boolean getStopped()
	{
		return tiAudioRecorder.isStopped();
	}

	@Kroll.method
	public void start()
	{
		this.tiAudioRecorder.startRecording();
		KrollRuntime.addOnDisposingListener(this.runtimeOnDisposingListener);
	}

	@Kroll.method
	public TiFileProxy stop()
	{
		KrollRuntime.removeOnDisposingListener(this.runtimeOnDisposingListener);
		String filePath = this.tiAudioRecorder.stopRecording();
		if (filePath != null) {
			TiBaseFile tiBaseFile = TiFileFactory.createTitaniumFile(filePath, false);
			if (tiBaseFile != null) {
				return new TiFileProxy(tiBaseFile);
			}
		}
		return null;
	}

	@Kroll.method
	public void resume()
	{
		tiAudioRecorder.resumeRecording();
	}

	@Kroll.method
	public void pause()
	{
		tiAudioRecorder.pauseRecording();
	}

	@Override
	public void release()
	{
		stop();
		super.release();
	}

	@Override
	public String getApiName()
	{
		return "Ti.Media.AudioRecorder";
	}
}
