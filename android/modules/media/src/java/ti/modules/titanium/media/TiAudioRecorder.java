package ti.modules.titanium.media;

import android.app.Application;
import android.content.Context;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.os.Environment;
import android.support.v4.content.ContextCompat;
import org.appcelerator.titanium.TiActivity;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.io.TiFile;
import org.appcelerator.titanium.util.TiFileHelper;

import java.io.*;

public class TiAudioRecorder {

	private static final int MY_PERMISSIONS_REQUEST = 1010;
	private static final int RECORDER_BPP = 16;
	private static final String AUDIO_RECORDER_FILE_EXT_WAV = ".wav";
	private static final String AUDIO_RECORDER_TEMP_FILE = ".raw";
	private static final int RECORDER_SAMPLE_RATE = 44100;
	private static final int RECORDER_CHANNELS = AudioFormat.CHANNEL_IN_STEREO;
	private static final int RECORDER_AUDIO_ENCODING = AudioFormat.ENCODING_PCM_16BIT;

	private boolean paused = false;
	private boolean recording = false;
	private boolean stopped = true;

	private byte[] audioData;
	private int bufferSize = 0;
	private File tempFileReference;
	private FileOutputStream fileOutputStream = null;
	private AudioRecord audioRecord;

	public TiAudioRecorder() {
		bufferSize = AudioRecord.getMinBufferSize(RECORDER_SAMPLE_RATE,RECORDER_CHANNELS,RECORDER_AUDIO_ENCODING);
	}

	public boolean isPaused() {
		return paused;
	}

	public boolean isRecording() {
		return recording;
	}

	public boolean isStopped() {
		return stopped;
	}

	public void startRecording() {

		try {
			tempFileReference =  TiFileHelper.getInstance().getTempFile(AUDIO_RECORDER_TEMP_FILE,true);
			fileOutputStream = new FileOutputStream(tempFileReference);
		} catch (IOException e) {
			e.printStackTrace();
		}

		audioRecord = new AudioRecord(MediaRecorder.AudioSource.MIC,RECORDER_SAMPLE_RATE, RECORDER_CHANNELS,RECORDER_AUDIO_ENCODING, bufferSize*4);

		audioData = new byte[bufferSize];
		int recorderState = audioRecord.getState();

		if(recorderState == 1) {
			audioRecord.setRecordPositionUpdateListener(onRecordPositionUpdateListener);
			audioRecord.setPositionNotificationPeriod(bufferSize/4);
			audioRecord.startRecording();
			audioRecord.read(audioData,0,bufferSize);
			recording = true;
		}
	}

	public String stopRecording() {
		if (audioRecord != null) {

			int recordState = audioRecord.getState();
			if (recordState == 1) {
				audioRecord.stop();
			}
			audioRecord.setRecordPositionUpdateListener(null);
			audioRecord.release();
			audioRecord = null;
		}
		File resultFile = null;
		try {
			resultFile = TiFileHelper.getInstance().getTempFile(AUDIO_RECORDER_FILE_EXT_WAV,true);
			createWaveFile(resultFile.getAbsolutePath());
		} catch (IOException e) {
			e.printStackTrace();
		}
		return resultFile != null ? resultFile.getAbsolutePath():null;
	}

	public void pauseRecording() {
		//Guard for calling pause before starting the recording
		if (audioRecord != null) {
			paused = true;
			audioRecord.stop();
		}
	}

	public void resumeRecording() {
		//Guard for calling resume before starting the recording
		if (audioRecord != null) {
			paused = false;
			audioRecord.startRecording();
			audioRecord.read(audioData,0,bufferSize);
		}
	}

	private void createWaveFile(String outFilename){
		FileInputStream in;
		FileOutputStream out;
		long totalAudioLen;
		long totalDataLen;
		long longSampleRate = RECORDER_SAMPLE_RATE;
		int channels = 2;
		long byteRate = RECORDER_BPP * RECORDER_SAMPLE_RATE * channels/8;
		byte[] data = new byte[bufferSize];

		try {
			//set the result file output stream
			out = new FileOutputStream(outFilename);
			in = new FileInputStream(tempFileReference);
			totalAudioLen = in.getChannel().size();
			totalDataLen = totalAudioLen + 36;

			writeWaveFileHeader(out, totalAudioLen, totalDataLen,longSampleRate, channels, byteRate);

			while(in.read(data) != -1){
				out.write(data);
			}
			in.close();

			out.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	private void writeWaveFileHeader(
			FileOutputStream out, long totalAudioLen,
			long totalDataLen, long longSampleRate, int channels,
			long byteRate) throws IOException {

		byte[] header = new byte[44];

		header[0] = 'R'; // RIFF/WAVE header
		header[1] = 'I';
		header[2] = 'F';
		header[3] = 'F';
		header[4] = (byte) (totalDataLen & 0xff);
		header[5] = (byte) ((totalDataLen >> 8) & 0xff);
		header[6] = (byte) ((totalDataLen >> 16) & 0xff);
		header[7] = (byte) ((totalDataLen >> 24) & 0xff);
		header[8] = 'W';
		header[9] = 'A';
		header[10] = 'V';
		header[11] = 'E';
		header[12] = 'f'; // 'fmt ' chunk
		header[13] = 'm';
		header[14] = 't';
		header[15] = ' ';
		header[16] = 16; // 4 bytes: size of 'fmt ' chunk
		header[17] = 0;
		header[18] = 0;
		header[19] = 0;
		header[20] = 1; // format = 1
		header[21] = 0;
		header[22] = (byte) channels;
		header[23] = 0;
		header[24] = (byte) (longSampleRate & 0xff);
		header[25] = (byte) ((longSampleRate >> 8) & 0xff);
		header[26] = (byte) ((longSampleRate >> 16) & 0xff);
		header[27] = (byte) ((longSampleRate >> 24) & 0xff);
		header[28] = (byte) (byteRate & 0xff);
		header[29] = (byte) ((byteRate >> 8) & 0xff);
		header[30] = (byte) ((byteRate >> 16) & 0xff);
		header[31] = (byte) ((byteRate >> 24) & 0xff);
		header[32] = (byte) (2 * 16 / 8); // block align
		header[33] = 0;
		header[34] = RECORDER_BPP; // bits per sample
		header[35] = 0;
		header[36] = 'd';
		header[37] = 'a';
		header[38] = 't';
		header[39] = 'a';
		header[40] = (byte) (totalAudioLen & 0xff);
		header[41] = (byte) ((totalAudioLen >> 8) & 0xff);
		header[42] = (byte) ((totalAudioLen >> 16) & 0xff);
		header[43] = (byte) ((totalAudioLen >> 24) & 0xff);

		out.write(header, 0, 44);
	}


	AudioRecord.OnRecordPositionUpdateListener onRecordPositionUpdateListener = new AudioRecord.OnRecordPositionUpdateListener() {

		@Override
		public void onMarkerReached(AudioRecord recorder) {

		}

		@Override
		public void onPeriodicNotification(AudioRecord recorder) {
			try {
				audioRecord.read(audioData,0,bufferSize);
				fileOutputStream.write(audioData);
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
	};
}
