/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiFileProxy;
import org.appcelerator.titanium.io.TiFileFactory;

@Kroll.proxy(creatableInModule = MediaModule.class)
public class AudioRecorderProxy extends KrollProxy
{

	TiAudioRecorder tiAudioRecorder = new TiAudioRecorder();

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setCompression(int value)
	// clang-format on
	{
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setFormat(int value)
	// clang-format on
	{
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getFormat()
	// clang-format on
	{
		return 0;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getCompression()
	// clang-format on
	{
		return 0;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean getPaused()
	// clang-format on
	{
		return tiAudioRecorder.isPaused();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean getRecording()
	// clang-format on
	{
		return tiAudioRecorder.isRecording();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean getStopped()
	// clang-format on
	{
		return tiAudioRecorder.isStopped();
	}

	@Kroll.method
	public void start()
	{
		tiAudioRecorder.startRecording();
	}

	@Kroll.method
	public TiFileProxy stop()
	{
		return new TiFileProxy(TiFileFactory.createTitaniumFile(tiAudioRecorder.stopRecording(), false));
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
}
