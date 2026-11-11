/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
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

	//Parameters for the compressed recording formats
	//Note: The AMR encoders only support mono with one fixed sample rate.
	private static final int RECORDER_AAC_CHANNEL_COUNT = 2;
	private static final int RECORDER_AAC_BIT_RATE = 128000;
	private static final int RECORDER_AMR_NB_SAMPLE_RATE = 8000;
	private static final int RECORDER_AMR_NB_BIT_RATE = 12200;
	private static final int RECORDER_AMR_WB_SAMPLE_RATE = 16000;
	private static final int RECORDER_AMR_WB_BIT_RATE = 23850;

	//Byte array used for reading from the native buffer to the output stream
	private byte[] audioData;
	private int bufferSize = 0;
	private File tempFileReference;
	private RandomAccessFile randomAccessFile;
	private AudioRecord audioRecord;

	//Used instead of "audioRecord" for all formats other than WAVE
	private MediaRecorder mediaRecorder;
	private boolean mediaRecorderIsRecording = false;
	private boolean mediaRecorderIsPaused = false;

	int format = MediaModule.AUDIO_FILEFORMAT_WAVE;
	int compression = MediaModule.AUDIO_FORMAT_LINEAR_PCM;

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
		if (this.mediaRecorder != null) {
			return this.mediaRecorderIsPaused;
		}
		return false;
	}

	public boolean isRecording()
	{
		if (this.audioRecord != null) {
			return (this.audioRecord.getRecordingState() == AudioRecord.RECORDSTATE_RECORDING);
		}
		if (this.mediaRecorder != null) {
			return this.mediaRecorderIsRecording;
		}
		return false;
	}

	public boolean isStopped()
	{
		return (this.audioRecord == null) && (this.mediaRecorder == null);
	}

	public void startRecording()
	{
		// Do not continue if already started recording.
		// Note: If currently paused, then you must resume or stop then start.
		if (!isStopped()) {
			Log.w(TAG, "AudioRecorder has already been started.");
			return;
		}

		// Set up and start audio recording.
		try {
			if (this.format == MediaModule.AUDIO_FILEFORMAT_WAVE) {
				if (this.compression != MediaModule.AUDIO_FORMAT_LINEAR_PCM) {
					Log.w(TAG, "AUDIO_FILEFORMAT_WAVE only supports AUDIO_FORMAT_LINEAR_PCM."
						+ " Ignoring the 'compression' property.");
				}
				startWaveRecording();
			} else {
				startCompressedRecording();
			}
		} catch (Exception ex) {
			Log.e(TAG, "AudioRecorder.start() failed to start recording.", ex);
		}

		// If we failed to start recording above, then clean-up any hanging resources.
		if (!isRecording()) {
			stopRecording();
		}
	}

	private void startWaveRecording() throws IOException
	{
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

	private void startCompressedRecording() throws IOException
	{
		// Fetch the container format to write to.
		int outputFormat;
		String suffix;
		if (this.format == MediaModule.AUDIO_FILEFORMAT_MP4) {
			outputFormat = MediaRecorder.OutputFormat.MPEG_4;
			suffix = ".mp4";
		} else if (this.format == MediaModule.AUDIO_FILEFORMAT_AAC) {
			outputFormat = MediaRecorder.OutputFormat.AAC_ADTS;
			suffix = ".aac";
		} else if (this.format == MediaModule.AUDIO_FILEFORMAT_3GPP) {
			outputFormat = MediaRecorder.OutputFormat.THREE_GPP;
			suffix = ".3gp";
		} else {
			Log.e(TAG, "AudioRecorder.start() failed to start recording. Reason: Unsupported format " + this.format);
			return;
		}

		// Fetch the audio encoder to use.
		// Note: MediaRecorder cannot write linear PCM. So, we use AAC for the default compression.
		int audioEncoder = MediaRecorder.AudioEncoder.AAC;
		int sampleRate = RECORDER_SAMPLE_RATE;
		int channelCount = RECORDER_AAC_CHANNEL_COUNT;
		int bitRate = RECORDER_AAC_BIT_RATE;
		boolean isAmr = false;
		if (this.compression == MediaModule.AUDIO_FORMAT_HE_AAC) {
			audioEncoder = MediaRecorder.AudioEncoder.HE_AAC;
		} else if (this.compression == MediaModule.AUDIO_FORMAT_AAC_ELD) {
			audioEncoder = MediaRecorder.AudioEncoder.AAC_ELD;
		} else if (this.compression == MediaModule.AUDIO_FORMAT_AMR_NB) {
			audioEncoder = MediaRecorder.AudioEncoder.AMR_NB;
			sampleRate = RECORDER_AMR_NB_SAMPLE_RATE;
			bitRate = RECORDER_AMR_NB_BIT_RATE;
			isAmr = true;
		} else if (this.compression == MediaModule.AUDIO_FORMAT_AMR_WB) {
			audioEncoder = MediaRecorder.AudioEncoder.AMR_WB;
			sampleRate = RECORDER_AMR_WB_SAMPLE_RATE;
			bitRate = RECORDER_AMR_WB_BIT_RATE;
			isAmr = true;
		} else if ((this.compression != MediaModule.AUDIO_FORMAT_AAC)
			&& (this.compression != MediaModule.AUDIO_FORMAT_LINEAR_PCM)) {
			Log.e(TAG, "AudioRecorder.start() failed to start recording. Reason: Unsupported compression "
				+ this.compression);
			return;
		}
		if (isAmr) {
			channelCount = 1;
			if (outputFormat == MediaRecorder.OutputFormat.AAC_ADTS) {
				Log.e(TAG, "AudioRecorder.start() failed to start recording."
					+ " Reason: AUDIO_FILEFORMAT_AAC does not support AMR compression.");
				return;
			}
		}

		// Start recording. Not all devices support all encoders, in which case the below will throw an exception.
		this.tempFileReference = TiFileHelper.getInstance().getTempFile(suffix, true);
		this.mediaRecorder = new MediaRecorder();
		this.mediaRecorder.setAudioSource(MediaRecorder.AudioSource.MIC);
		this.mediaRecorder.setOutputFormat(outputFormat);
		this.mediaRecorder.setAudioEncoder(audioEncoder);
		this.mediaRecorder.setAudioSamplingRate(sampleRate);
		this.mediaRecorder.setAudioChannels(channelCount);
		this.mediaRecorder.setAudioEncodingBitRate(bitRate);
		this.mediaRecorder.setOutputFile(this.tempFileReference.getAbsolutePath());
		this.mediaRecorder.prepare();
		this.mediaRecorder.start();
		this.mediaRecorderIsRecording = true;
	}

	public String stopRecording()
	{
		// Stop recording and produce the audio file.
		File resultFile = null;
		if (this.mediaRecorder != null) {
			try {
				// Stop recording. Must only be done if recording was successfully started.
				// Note: This throws an exception if no audio data was received, such as when stopping right after start.
				if (this.mediaRecorderIsRecording || this.mediaRecorderIsPaused) {
					this.mediaRecorder.stop();
					resultFile = this.tempFileReference;
				}
			} catch (Exception ex) {
				Log.e(TAG, "AudioRecorder.stop() failed to write audio file.", ex);
			}
			this.mediaRecorder.release();
			this.mediaRecorder = null;
			this.mediaRecorderIsRecording = false;
			this.mediaRecorderIsPaused = false;

			// Delete the file if we've failed to record to it.
			if ((resultFile == null) && (this.tempFileReference != null)) {
				this.tempFileReference.delete();
			}
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
						(long) RECORDER_BPP * RECORDER_SAMPLE_RATE * channelCount / 8);
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
			if (this.audioRecord != null) {
				this.audioRecord.stop();
			} else if (this.mediaRecorder != null) {
				try {
					this.mediaRecorder.pause();
					this.mediaRecorderIsRecording = false;
					this.mediaRecorderIsPaused = true;
				} catch (Exception ex) {
					Log.e(TAG, "AudioRecorder.pause() failed to pause recording.", ex);
				}
			}
		}
	}

	public void resumeRecording()
	{
		if (isPaused()) {
			if (this.audioRecord != null) {
				this.audioRecord.startRecording();
			} else if (this.mediaRecorder != null) {
				try {
					this.mediaRecorder.resume();
					this.mediaRecorderIsRecording = true;
					this.mediaRecorderIsPaused = false;
				} catch (Exception ex) {
					Log.e(TAG, "AudioRecorder.resume() failed to resume recording.", ex);
				}
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
