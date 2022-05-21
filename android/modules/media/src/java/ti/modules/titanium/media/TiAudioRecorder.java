/**
 * TiDev Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.os.Build;

import androidx.annotation.RequiresApi;

import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.util.TiFileHelper;

public class TiAudioRecorder
{
	private static final String TAG = "TiAudioRecorder";

	private static final int WAV_FILE_HEADER_RIFF_SUBCHUNK_BYTE_COUNT = 8;
	private static final int WAV_FILE_HEADER_FORMAT_SUBCHUNK_BYTE_COUNT = 28;
	private static final int WAV_FILE_HEADER_DATA_SUBCHUNK_BYTE_COUNT = 8;
	private static final int WAV_FILE_HEADER_TOTAL_BYTE_COUNT
		= WAV_FILE_HEADER_RIFF_SUBCHUNK_BYTE_COUNT
		+ WAV_FILE_HEADER_FORMAT_SUBCHUNK_BYTE_COUNT
		+ WAV_FILE_HEADER_DATA_SUBCHUNK_BYTE_COUNT;

	//Constant used in the WAV container header corresponding to the 16 bit PCM encoding
	private static final int RECORDER_BPP = 16;

	//Parameters for the default recording format
	//TODO:Allow picking up quality for the recording. Although only 44,1Khz is guaranteed to work on all devices
	private static final int RECORDER_SAMPLE_RATE = 44100;
	private static final int RECORDER_CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_STEREO;
	private static final int RECORDER_AUDIO_ENCODING = AudioFormat.ENCODING_PCM_16BIT;

	//Byte array used for reading from the native buffer to the output stream
	private byte[] audioData;
	private int bufferSize = 0;
	private File tempFileReference;
	private RandomAccessFile randomAccessFile;
	private AudioRecord audioRecord;
	int format = MediaModule.AUDIO_FILEFORMAT_WAVE;
	int compression = MediaModule.AUDIO_FORMAT_LINEAR_PCM;
	MediaRecorder recorder;
	boolean recorderIsRunning = false;

	public TiAudioRecorder()
	{
		//Get the minimum buffer size according to the device recording capabilities
		this.bufferSize = AudioRecord.getMinBufferSize(
			RECORDER_SAMPLE_RATE, RECORDER_CHANNEL_CONFIG, RECORDER_AUDIO_ENCODING);
	}

	public boolean isPaused()
	{
		if (this.audioRecord != null) {
			return (this.audioRecord.getRecordingState() != AudioRecord.RECORDSTATE_RECORDING);
		}
		if (this.recorder != null) {
			return recorderIsRunning;
		}
		return false;
	}

	public boolean isRecording()
	{
		if (this.audioRecord != null) {
			return (this.audioRecord.getRecordingState() == AudioRecord.RECORDSTATE_RECORDING);
		}
		if (this.recorder != null) {
			return recorderIsRunning;
		}
		return false;
	}

	public boolean isStopped()
	{
		return (this.audioRecord == null);
	}

	@RequiresApi(api = Build.VERSION_CODES.O)
	public void startRecording()
	{
		// Do not continue if already started recording.
		// Note: If currently paused, then you must resume or stop then start.
		if (!isStopped()) {
			Log.w(TAG, "AudioRecorder has already been started.");
			return;
		}
		try {
			if (format != MediaModule.AUDIO_FILEFORMAT_WAVE) {
				// use MediaRecorder to record with compression
				int localFormat = MediaRecorder.OutputFormat.MPEG_4;
				int localCompression = MediaRecorder.AudioEncoder.DEFAULT;
				String suffix = ".mp4";

				if (format == MediaModule.AUDIO_FILEFORMAT_AAC) {
					localFormat = MediaRecorder.OutputFormat.AAC_ADTS;
					suffix = ".aac";
				} else if (format == MediaModule.AUDIO_FILEFORMAT_3GPP) {
					localFormat = MediaRecorder.OutputFormat.THREE_GPP;
					suffix = ".3gp";
				}

				if (compression == MediaModule.AUDIO_FORMAT_AAC) {
					localCompression = MediaRecorder.AudioEncoder.AAC;
				} else if (compression == MediaModule.AUDIO_FORMAT_VORBIS) {
					localCompression = MediaRecorder.AudioEncoder.VORBIS;
				} else if (compression == MediaModule.AUDIO_FORMAT_HE_AAC) {
					localCompression = MediaRecorder.AudioEncoder.HE_AAC;
				} else if (compression == MediaModule.AUDIO_FORMAT_AMR_NB) {
					localCompression = MediaRecorder.AudioEncoder.AMR_NB;
				} else if (compression == MediaModule.AUDIO_FORMAT_AMR_WB) {
					localCompression = MediaRecorder.AudioEncoder.AMR_WB;
				} else if (compression == MediaModule.AUDIO_FORMAT_AAC_ELD) {
					localCompression = MediaRecorder.AudioEncoder.AAC_ELD;
				}

				this.recorder = new MediaRecorder();
				this.recorder.setAudioSource(MediaRecorder.AudioSource.MIC);
				this.recorder.setOutputFormat(localFormat);
				this.tempFileReference = TiFileHelper.getInstance().getTempFile(suffix, true);
				this.recorder.setOutputFile(this.tempFileReference);
				this.recorder.setAudioSamplingRate(RECORDER_SAMPLE_RATE);
				this.recorder.setAudioEncoder(localCompression);
				this.recorder.prepare();
				this.recorder.start();
				recorderIsRunning = true;
			} else {
				// Set up and start audio recording.

				// Create a WAV file to write microphone data to.
				// We'll update the WAV file's header with the correct info when we stop recording.
				this.tempFileReference = TiFileHelper.getInstance().getTempFile(".wav", true);
				this.randomAccessFile = new RandomAccessFile(this.tempFileReference, "rw");
				this.randomAccessFile.setLength(0);
				writeWaveFileHeader(this.randomAccessFile, 0, 0, 0, 0, 0);

				// Initialize audio recorder with a big enough buffer to ensure smooth reading from it without overlap.
				this.audioRecord = new AudioRecord(
					MediaRecorder.AudioSource.MIC, RECORDER_SAMPLE_RATE, RECORDER_CHANNEL_CONFIG,
					RECORDER_AUDIO_ENCODING, bufferSize * 4);
				this.audioData = new byte[bufferSize];

				if (this.audioRecord.getState() == AudioRecord.STATE_INITIALIZED) {
					this.audioRecord.setRecordPositionUpdateListener(onRecordPositionUpdateListener);
					this.audioRecord.setPositionNotificationPeriod(bufferSize / 4);
					this.audioRecord.startRecording();
					if (!isRecording()) {
						Log.e(TAG, "AudioRecorder.start() failed to start recording. Reason: Unknown");
					}
				}
			}
		} catch (Exception ex) {
			Log.e(TAG, "AudioRecorder.start() failed to start recording.", ex);
		}
		// If we failed to start recording above, then clean-up any hanging resources.
		if (!isRecording()) {
			stopRecording();
		}
	}

	public String stopRecording()
	{
		// Stop recording and produce the WAV file.
		File resultFile = null;
		if (this.recorder != null) {
			this.recorder.stop();
			resultFile = this.tempFileReference;
			recorderIsRunning = false;
		}
		if (this.audioRecord != null) {
			try {
				// Stop recording.
				int channelCount = this.audioRecord.getChannelCount();
				if (this.audioRecord.getState() == AudioRecord.STATE_INITIALIZED) {
					audioRecord.stop();
				}
				this.audioRecord.setRecordPositionUpdateListener(null);
				this.audioRecord.release();

				// Update recorded WAV file's header info.
				if (this.randomAccessFile != null) {
					this.randomAccessFile.seek(0);
					long totalFileBytes = this.randomAccessFile.length();
					writeWaveFileHeader(
						this.randomAccessFile,
						totalFileBytes - WAV_FILE_HEADER_TOTAL_BYTE_COUNT,
						totalFileBytes - WAV_FILE_HEADER_RIFF_SUBCHUNK_BYTE_COUNT,
						RECORDER_SAMPLE_RATE,
						channelCount,
						RECORDER_BPP * RECORDER_SAMPLE_RATE * channelCount / 8);
					resultFile = this.tempFileReference;
				}
			} catch (Exception ex) {
				Log.e(TAG, "AudioRecorder.stop() failed to write audio file.", ex);
			}
			this.audioRecord = null;
		}

		// Close the output file.
		if (this.randomAccessFile != null) {
			try {
				this.randomAccessFile.close();
			} catch (Exception ex) {
				ex.printStackTrace();
			}
			this.randomAccessFile = null;
		}

		// Return the file path if successfully recorded to file.
		return (resultFile != null) ? resultFile.getAbsolutePath() : null;
	}

	public void pauseRecording()
	{
		if (isRecording()) {
			if (this.audioRecord != null) this.audioRecord.stop();
			if (this.recorder != null) {
				this.recorder.pause();
				recorderIsRunning = false;
			}
		}
	}

	public void resumeRecording()
	{
		if (isPaused()) {
			if (this.audioRecord != null) this.audioRecord.startRecording();
			if (this.recorder != null) {
				this.recorder.resume();
				recorderIsRunning = true;
			}
		}
	}

	private static void writeWaveFileHeader(
		RandomAccessFile out, long totalAudioLen, long totalDataLen, long longSampleRate,
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

	private final AudioRecord.OnRecordPositionUpdateListener onRecordPositionUpdateListener =
		new AudioRecord.OnRecordPositionUpdateListener() {
			@Override
			public void onMarkerReached(AudioRecord recorder)
			{
			}

			@Override
			public void onPeriodicNotification(AudioRecord recorder)
			{
				try {
					int bytesRead = recorder.read(audioData, 0, bufferSize);
					if ((randomAccessFile != null) && (bytesRead > 0)) {
						randomAccessFile.write(audioData, 0, bytesRead);
					}
				} catch (Exception e) {
					e.printStackTrace();
				}
			}
		};
}
