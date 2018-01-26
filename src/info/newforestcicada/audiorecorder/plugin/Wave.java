package info.newforestcicada.audiorecorder.plugin;

import android.os.Environment;
import android.util.Log;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Created by dav on 31/05/15.
 */

public class Wave {

    public static final SimpleDateFormat df = new SimpleDateFormat(
            "yyyyMMdd'T'HHmmss", Locale.UK);

    public static final int mChannelCount = 1;
    private int mSampleRate = 44100;
    private int bitsPerSample = 16;

    public Wave() {

    }


    public File makePath() throws IOException {

        File waveDir = new File(Environment.getExternalStorageDirectory(),
                RecorderPlugin.SUBDIR);
        // waveFile = new File(waveDir, t.format2445().concat(".wav"));

        File wavFile = new File(waveDir, df.format(new Date()).concat(".wav"));

        boolean success = false;
        if (!waveDir.exists()) {
            success = waveDir.mkdir();

            if (!success)
                throw new IOException("Could not create "+ waveDir.getName()+" directory.");
        }
        return wavFile;
    }

    public boolean write(File waveFile, short[] mRecordBuffer, int bufferIndex, int maxIndex, int recLength) {

        try {

            RandomAccessFile ras = new RandomAccessFile(waveFile, "rw");

            /*
             * Wave file format based on specification described here:
             * http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/WAVE/WAVE.html Uses
             * basic chunk format (chunk size 16).
             */

            // RIFF chunk
            ras.writeBytes("RIFF");
            ras.writeInt(Integer
                    .reverseBytes((mRecordBuffer.length * 2) + 36));
            ras.writeBytes("WAVE");

            // Format chunk
            ras.writeBytes("fmt "); // Chunk id
            ras.writeInt(Integer.reverseBytes(16)); // Chunk size
            ras.writeShort(Short.reverseBytes((short) 1)); // Format code (PCM)
            ras.writeShort(Short.reverseBytes((short) mChannelCount)); // Number of channels
            ras.writeInt(Integer.reverseBytes(mSampleRate)); // Sampling
            // rate
            ras.writeInt(Integer.reverseBytes(mSampleRate * mChannelCount
                    * bitsPerSample / 8)); // Data rate, SampleRate*NumberOfChannels*BitsPerSample/8
            ras.writeShort(Short.reverseBytes((short) (mChannelCount
                    * bitsPerSample / 8))); // Block align, NumberOfChannels*BitsPerSample/8
            ras.writeShort(Short.reverseBytes((short) bitsPerSample)); // Bits per sample

            // Data chunk
            ras.writeBytes("data");
            ras.writeInt(Integer.reverseBytes(mRecordBuffer.length * 2));

            // Write data
            byte[] outBuffer;
            short[] tempBuffer;
            int tempBufferIndex;
            int tempMaxIndex;

            synchronized (mRecordBuffer) {

                tempBufferIndex = bufferIndex;
                tempMaxIndex    = maxIndex;

                tempBuffer = new short[mRecordBuffer.length];
                outBuffer = new byte[tempMaxIndex * 2];

                for (int i = 0; i < mRecordBuffer.length; i++) {
                    tempBuffer[i] = mRecordBuffer[i];
                }
            }

            int g = 0;
            int endBuffer;

//            Log.i(TAG, "tempBufferIndex: " + tempBufferIndex + ", "
//                    + "tempMaxIndex: " + tempMaxIndex + ", "
//                    + "outBuffer.length: " + outBuffer.length + ", "
//                    + "mRecordBuffer.length: " + mRecordBuffer.length);
            if (tempMaxIndex == mRecordBuffer.length) {
                for (int i = tempBufferIndex; i < tempBuffer.length; i++) {
                    outBuffer[g] = (byte) (tempBuffer[i] & 0xff);
                    outBuffer[g + 1] = (byte) ((tempBuffer[i] >> 8) & 0xff);
                    g += 2;
                }
                endBuffer = tempBufferIndex;
            } else if (tempMaxIndex < mRecordBuffer.length) {
                endBuffer = tempMaxIndex;
            } else {
                endBuffer = 0;
//                Log.e(TAG,
//                        "Max index cannot be greater than record buffer length.");
                throw new IndexOutOfBoundsException("Max index cannot be greater " +
                        "than record buffer length.");
                //System.exit(1);
            }

            for (int i = 0; i < endBuffer; i++) {
                outBuffer[g] = (byte) (tempBuffer[i] & 0xff);
                outBuffer[g + 1] = (byte) ((tempBuffer[i] >> 8) & 0xff);
                g += 2;
            }

            /** keep only part of the buffer */
            if (recLength < mRecordBuffer.length / mSampleRate) {
                byte[] cutBuffer = new byte[recLength * 2 * mSampleRate];
                for (int i = 0; i < cutBuffer.length; i++) {
                    cutBuffer[i] = outBuffer[i];
                }

                ras.write(cutBuffer);
            } else {
                ras.write(outBuffer);
            }
            ras.close();

            return true;
        } catch (FileNotFoundException e) {
            e.printStackTrace();
            return false;
        } catch (IOException e) {
            e.printStackTrace();
            return false;
        }
    }
}
