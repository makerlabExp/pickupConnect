
/**
 * Decodes a Base64 string into a byte array.
 */
function decodeBase64(base64: string) {
  // Clean the base64 string
  const cleanBase64 = base64.replace(/[^A-Za-z0-9+/=]/g, "");
  const binaryString = atob(cleanBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM data (or other formats) into an AudioBuffer.
 * Gemini 2.5 TTS typically returns 24kHz, 16-bit Mono PCM.
 */
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000
): Promise<AudioBuffer> {
  // 1. Try native browser decoding first (supports WAV, MP3 containers)
  try {
    // We must copy the buffer because decodeAudioData detaches/consumes it
    // Using slice(0) on Uint8Array creates a deep copy of the data
    const bufferCopy = data.slice(0);
    return await ctx.decodeAudioData(bufferCopy.buffer);
  } catch (e) {
    // Continue to fallback
    // console.debug("Native decode failed, trying raw PCM fallback");
  }

  // 2. Fallback: Manual Raw PCM Decoding
  // Assumes 16-bit signed integer, Little Endian
  const numChannels = 1;
  
  // Ensure data length is even for Int16Array (2 bytes per sample)
  let pcmData = data;
  if (data.length % 2 !== 0) {
      const aligned = new Uint8Array(data.length + 1);
      aligned.set(data);
      pcmData = aligned;
  }
  
  // Create Int16 view. 
  const dataInt16 = new Int16Array(pcmData.buffer, pcmData.byteOffset, pcmData.length / 2);
  const frameCount = dataInt16.length / numChannels;
  
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0)
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  
  return buffer;
}

let audioContext: AudioContext | null = null;

/**
 * Initializes or resumes the AudioContext.
 * Should be called during a user interaction event (click) to unlock audio.
 */
export const initAudioContext = async () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    return audioContext;
};

export const playGeminiAudio = async (base64Audio: string) => {
  if (!base64Audio) return;

  try {
    const ctx = await initAudioContext();

    const byteArray = decodeBase64(base64Audio);
    const audioBuffer = await decodeAudioData(byteArray, ctx, 24000);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start(0);
    
  } catch (error) {
    console.error("Error playing audio:", error);
  }
};
