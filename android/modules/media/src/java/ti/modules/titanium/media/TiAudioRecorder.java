/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;

import org.appcelerator.titanium.util.TiFileHelper;

import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;

public class TiAudioRecorder
{

	//Constant used in the WAV container header corresponding to the 16 bit PCM encoding
	private static final int RECORDER_BPP = 16;
	//Extensions for the temporary file and the result
	private static final String AUDIO_RECORDER_FILE_EXT_WAV = ".wav";
	private static final String AUDIO_RECORDER_TEMP_FILE = ".raw";
	//Parameters for the default recording format
	//TODO:Allow picking up quality for the recording. Although only 44,1Khz is guaranteed to work on all devices
	private static final int RECORDER_SAMPLE_RATE = 44100;
	private static final int RECORDER_CHANNELS = AudioFormat.CHANNEL_IN_STEREO;
	private static final int RECORDER_AUDIO_ENCODING = AudioFormat.ENCODING_PCM_16BIT;

	private boolean paused = false;
	private boolean recording = false;
	private boolean stopped = true;

	//Byte array used for reading from the native buffer to the output stream
	private byte[] audioData;
	private int bufferSize = 0;
	private File tempFileReference;
	private FileOutputStream fileOutputStream = null;
	private AudioRecord audioRecord;

	public TiAudioRecorder()
	{
		//Get the minimum buffer size according to the device recording capabilities
		bufferSize = AudioRecord.getMinBufferSize(RECORDER_SAMPLE_RATE, RECORDER_CHANNELS, RECORDER_AUDIO_ENCODING);
	}

	public boolean isPaused()
	{
		return paused;
	}

	public boolean isRecording()
	{
		return recording;
	}

	public boolean isStopped()
	{
		return stopped;
	}

	public void startRecording()
	{
		try {
			tempFileReference = TiFileHelper.getInstance().getTempFile(AUDIO_RECORDER_TEMP_FILE, true);
			fileOutputStream = new FileOutputStream(tempFileReference);
		} catch (IOException e) {
			e.printStackTrace();
		}

		//Initialize the audio recorded with big enough buffer to ensure smooth reading from it without overlap
		audioRecord = new AudioRecord(MediaRecorder.AudioSource.MIC, RECORDER_SAMPLE_RATE, RECORDER_CHANNELS,
									  RECORDER_AUDIO_ENCODING, bufferSize * 4);

		audioData = new byte[bufferSize];

		if (audioRecord.getState() == 1) {
			audioRecord.setRecordPositionUpdateListener(onRecordPositionUpdateListener);
			audioRecord.setPositionNotificationPeriod(bufferSize / 4);
			audioRecord.startRecording();
			audioRecord.read(audioData, 0, bufferSize);
			recording = true;
		}
	}

	public String stopRecording()
	{
		File resultFile = null;
		//Guard for calling stop before starting the recording
		if (audioRecord != null) {
			int recordState = audioRecord.getState();
			if (recordState == 1) {
				audioRecord.stop();
			}
			audioRecord.setRecordPositionUpdateListener(null);
			audioRecord.release();
			audioRecord = null;
			try {
				resultFile = TiFileHelper.getInstance().getTempFile(AUDIO_RECORDER_FILE_EXT_WAV, true);
				createWaveFile(resultFile.getAbsolutePath());
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
		return resultFile != null ? resultFile.getAbsolutePath() : "";
	}

	public void pauseRecording()
	{
		//Guard for calling pause before starting the recording
		if (audioRecord != null) {
			paused = true;
			audioRecord.stop();
		}
	}

	public void resumeRecording()
	{
		//Guard for calling resume before starting the recording
		if (audioRecord != null) {
			paused = false;
			audioRecord.startRecording();
			audioRecord.read(audioData, 0, bufferSize);
		}
	}

	private void createWaveFile(String outFilename)
	{
		//Input stream from the temporary file with raw audio recording
		FileInputStream in;
		//Output stream to the WAV file
		FileOutputStream out;
		//Length of the audio recording
		long totalAudioLen;
		//Length of the whole file
		long totalDataLen;
		int channels = 2;
		long byteRate = RECORDER_BPP * RECORDER_SAMPLE_RATE * channels / 8;
		byte[] data = new byte[bufferSize];

		try {
			//set the result file output stream
			out = new FileOutputStream(outFilename);
			in = new FileInputStream(tempFileReference);
			totalAudioLen = in.getChannel().size();
			totalDataLen = totalAudioLen + 36;

			//Write the WAV header
			writeWaveFileHeader(out, totalAudioLen, totalDataLen, RECORDER_SAMPLE_RATE, channels, byteRate);

			//Write the audio data
			while (in.read(data) != -1) {
				out.write(data);
			}

			//Close both streams
			in.close();
			out.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	private void writeWaveFileHeader(FileOutputStream out, long totalAudioLen, long totalDataLen, long longSampleRate,
									 int channels, long byteRate) throws IOException
	{
		// clang-format off
		byte[] header = {
			'R', 'I', 'F', 'F', // RIFF/WAVE header
			(byte) (totalDataLen & 0xff),
			(byte) ((totalDataLen >> 8) & 0xff),
			(byte) ((totalDataLen >> 16) & 0xff),
			(byte) ((totalDataLen >> 24) & 0xff),
			'W', 'A', 'V', 'E',
			'f', 'm', 't', ' ', // 'fmt ' chunk
			16, 0, 0, 0, // 4 bytes: size of 'fmt ' chunk
			1, // format = 1
			0,
			(byte) channels, // channels
			0,
			(byte) (longSampleRate & 0xff),
			(byte) ((longSampleRate >> 8) & 0xff),
			(byte) ((longSampleRate >> 16) & 0xff),
			(byte) ((longSampleRate >> 24) & 0xff),
			(byte) (byteRate & 0xff),
			(byte) ((byteRate >> 8) & 0xff),
			(byte) ((byteRate >> 16) & 0xff),
			(byte) ((byteRate >> 24) & 0xff),
			(byte) (2 * 16 / 8), // block align
			0,
			RECORDER_BPP, // bits per sample
			0,
			'd', 'a', 't', 'a',
			(byte) (totalAudioLen & 0xff),
			(byte) ((totalAudioLen >> 8) & 0xff),
			(byte) ((totalAudioLen >> 16) & 0xff),
			(byte) ((totalAudioLen >> 24) & 0xff)
		};
		// clang-format on

		out.write(header, 0, header.length);
	}

	AudioRecord.OnRecordPositionUpdateListener onRecordPositionUpdateListener =
		new AudioRecord.OnRecordPositionUpdateListener() {
			@Override
			public void onMarkerReached(AudioRecord recorder)
			{
			}

			@Override
			public void onPeriodicNotification(AudioRecord recorder)
			{
				try {
					audioRecord.read(audioData, 0, bufferSize);
					fileOutputStream.write(audioData);
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
		};
}
