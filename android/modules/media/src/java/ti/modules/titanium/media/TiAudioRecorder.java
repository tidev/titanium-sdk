/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.util.TiFileHelper;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;

public class TiAudioRecorder
{
	private static final String TAG = "TiWindowProxy";

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
		this.bufferSize = AudioRecord.getMinBufferSize(
			RECORDER_SAMPLE_RATE, RECORDER_CHANNELS, RECORDER_AUDIO_ENCODING);
	}

	public boolean isPaused()
	{
		return this.paused;
	}

	public boolean isRecording()
	{
		return this.recording;
	}

	public boolean isStopped()
	{
		return this.stopped;
	}

	public void startRecording()
	{
		// Do not continue if already started recording.
		// Thie member variable will be null when stopped.
		if (this.audioRecord != null) {
			Log.w(TAG, "AudioRecorder has already been started.");
			return;
		}

		// Set up and start audio recording.
		try {
			// Create a temp file to record raw microphone data to.
			tempFileReference = TiFileHelper.getInstance().getTempFile(AUDIO_RECORDER_TEMP_FILE, true);
			fileOutputStream = new FileOutputStream(tempFileReference);

			// Initialize audio recorder with a big enough buffer to ensure smooth reading from it without overlap.
			this.audioRecord = new AudioRecord(
				MediaRecorder.AudioSource.MIC, RECORDER_SAMPLE_RATE, RECORDER_CHANNELS,
				RECORDER_AUDIO_ENCODING, bufferSize * 4);
			this.audioData = new byte[bufferSize];
			if (this.audioRecord.getState() == AudioRecord.STATE_INITIALIZED) {
				this.audioRecord.setRecordPositionUpdateListener(onRecordPositionUpdateListener);
				this.audioRecord.setPositionNotificationPeriod(bufferSize / 4);
				this.audioRecord.startRecording();
				if (this.audioRecord.getRecordingState() == AudioRecord.RECORDSTATE_RECORDING) {
					this.recording = true;
					this.paused = false;
					this.stopped = false;
				} else {
					Log.e(TAG, "AudioRecorder.start() failed to start recording. Reason: Unknown");
				}
			}
		} catch (Exception ex) {
			Log.e(TAG, "AudioRecorder.start() failed to start recording.", ex);
		}

		// If we failed to start recording above, then clean-up any hanging resources.
		if (!this.recording) {
			stopRecording();
		}
	}

	public String stopRecording()
	{
		// Stop recording and produce the WAV file.
		File resultFile = null;
		if (this.audioRecord != null) {
			// Update state.
			this.recording = false;
			this.paused = false;
			this.stopped = true;

			// Stop recording.
			if (this.audioRecord.getState() == AudioRecord.STATE_INITIALIZED) {
				audioRecord.stop();
			}
			this.audioRecord.setRecordPositionUpdateListener(null);
			this.audioRecord.release();
			this.audioRecord = null;

			// Write recording to file.
			try {
				resultFile = TiFileHelper.getInstance().getTempFile(AUDIO_RECORDER_FILE_EXT_WAV, true);
				createWaveFile(resultFile.getAbsolutePath());
			} catch (Exception ex) {
				Log.e(TAG, "AudioRecorder.stop() failed to create audio file.", ex);
			}
		}

		// Close the output file.
		if (this.fileOutputStream != null) {
			try {
				this.fileOutputStream.close();
			} catch (Exception ex) {
				ex.printStackTrace();
			}
			this.fileOutputStream = null;
		}

		// Return the file path if successfully recorded to file.
		return (resultFile != null) ? resultFile.getAbsolutePath() : null;
	}

	public void pauseRecording()
	{
		if (this.audioRecord != null) {
			this.audioRecord.stop();
			this.recording = false;
			this.paused = true;
			this.stopped = false;
		}
	}

	public void resumeRecording()
	{
		if (this.audioRecord != null) {
			this.audioRecord.startRecording();
			this.recording = true;
			this.paused = false;
			this.stopped = false;
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
		} catch (Exception ex) {
			ex.printStackTrace();
		}
	}

	private void writeWaveFileHeader(FileOutputStream out, long totalAudioLen, long totalDataLen, long longSampleRate,
									 int channels, long byteRate) throws IOException
	{
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

		out.write(header, 0, header.length);
	}

	private AudioRecord.OnRecordPositionUpdateListener onRecordPositionUpdateListener =
		new AudioRecord.OnRecordPositionUpdateListener() {
			@Override
			public void onMarkerReached(AudioRecord recorder)
			{
			}

			@Override
			public void onPeriodicNotification(AudioRecord recorder)
			{
				try {
					recorder.read(audioData, 0, bufferSize);
					if (fileOutputStream != null) {
						fileOutputStream.write(audioData);
					}
				} catch (Exception e) {
					e.printStackTrace();
				}
			}
		};
}
