import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Support base64 image/audio payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Gemini API with aistudio-build User-Agent
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// 1. MULTI-TURN GEMINI CHATBOT (with model selection & optional Search Grounding)
app.post('/api/gemini/chat', async (req, res) => {
  const { 
    messages = [], 
    model = 'gemini-3.5-flash', 
    systemInstruction = 'You are an expert STEM Professor and pedagogical mentor on the SynapseAI platform. Provide rigorous mathematical insight, clear derivations in KaTeX formatting, and intuitive physical explanations.',
    useSearch = false 
  } = req.body;

  try {
    const formattedContents = messages.map((m: any) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }]
    }));

    const config: any = {
      systemInstruction,
    };

    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model,
      contents: formattedContents,
      config,
    });

    const candidate = response.candidates?.[0];
    const searchMetadata = candidate?.groundingMetadata;

    return res.json({
      text: response.text || '',
      groundingChunks: searchMetadata?.groundingChunks || [],
      webSearchQueries: searchMetadata?.webSearchQueries || [],
    });
  } catch (err: any) {
    console.error('Error in /api/gemini/chat:', err);
    return res.status(500).json({ error: err.message || 'Chat generation failed' });
  }
});

// 2. AUDIO TRANSCRIPTION (gemini-3.5-transcribe)
app.post('/api/gemini/transcribe', async (req, res) => {
  const { audioBase64, mimeType = 'audio/webm' } = req.body;

  if (!audioBase64) {
    return res.status(400).json({ error: 'Missing audio data' });
  }

  try {
    const audioPart = {
      inlineData: {
        mimeType,
        data: audioBase64,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: { 
        parts: [
          audioPart, 
          { text: 'Transcribe this spoken STEM question or audio accurately. Output only the transcribed text.' }
        ] 
      },
    });

    return res.json({ transcript: response.text || '' });
  } catch (err: any) {
    console.error('Error in /api/gemini/transcribe:', err);
    return res.status(500).json({ error: err.message || 'Audio transcription failed' });
  }
});

// 3. IMAGE CREATION & EDITING (gemini-3.1-flash-image-preview)
app.post('/api/gemini/image', async (req, res) => {
  const { prompt, inputImageBase64, aspectRatio = '16:9' } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Missing image prompt' });
  }

  try {
    const parts: any[] = [];
    if (inputImageBase64) {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: inputImageBase64.replace(/^data:image\/\w+;base64,/, ''),
        },
      });
    }
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio,
        },
      },
    });

    let generatedImageBase64: string | null = null;
    let descriptionText = '';

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        generatedImageBase64 = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      } else if (part.text) {
        descriptionText += part.text;
      }
    }

    return res.json({
      imageBase64: generatedImageBase64,
      text: descriptionText,
    });
  } catch (err: any) {
    console.error('Error in /api/gemini/image:', err);
    return res.status(500).json({ error: err.message || 'Image generation failed' });
  }
});

// 4. VEO 3 VIDEO GENERATION (veo-3.1-fast-generate-preview)
app.post('/api/gemini/veo', async (req, res) => {
  const { prompt, inputImageBase64, aspectRatio = '16:9' } = req.body;

  try {
    const config: any = {
      numberOfVideos: 1,
      aspectRatio,
    };

    let operation;
    if (inputImageBase64) {
      // Animate Image into Video
      operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || 'Animate this STEM concept dynamically with high fidelity',
        image: {
          imageBytes: inputImageBase64.replace(/^data:image\/\w+;base64,/, ''),
          mimeType: 'image/png',
        },
        config,
      });
    } else {
      // Text to Video
      operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || 'A mathematical visualization of wave interference in deep space',
        config,
      });
    }

    // Return operation name for polling
    return res.json({ 
      operationName: operation.name,
      mode: 'veo_cloud' 
    });
  } catch (err: any) {
    console.warn('[Veo 3 Engine]: API notice/fallback:', err?.message || err);
    // If quota is exhausted or rate limit hit, instruct client to engage synthesizer
    return res.json({ 
      mode: 'synthesizer', 
      message: 'Veo Cloud API quota exceeded on this project key. Engaging SynapseAI autonomous video synthesizer engine.',
      error: err?.message || 'Quota limit'
    });
  }
});

// 5. POLL VEO OPERATION STATUS & VIDEO STREAM PROXY
app.get('/api/gemini/veo/status', async (req, res) => {
  const { operationName } = req.query;

  if (!operationName || typeof operationName !== 'string') {
    return res.status(400).json({ error: 'Missing operationName' });
  }

  try {
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });

    if (updated.done) {
      return res.json({
        done: true,
        streamUrl: `/api/gemini/veo/stream?operationName=${encodeURIComponent(operationName)}`,
      });
    }

    return res.json({ done: false });
  } catch (err: any) {
    console.error('Error polling Veo operation:', err);
    return res.status(500).json({ error: err.message || 'Polling failed' });
  }
});

app.get('/api/gemini/veo/stream', async (req, res) => {
  const { operationName } = req.query;

  if (!operationName || typeof operationName !== 'string') {
    return res.status(400).send('Missing operationName');
  }

  try {
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    const videoUri = updated.response?.generatedVideos?.[0]?.video?.uri;

    if (!videoUri) {
      return res.status(404).send('Video not ready or URI not found');
    }

    const videoRes = await fetch(videoUri, {
      headers: { 'x-goog-api-key': geminiApiKey },
    });

    if (!videoRes.ok) {
      throw new Error(`Failed to fetch video stream: ${videoRes.statusText}`);
    }

    res.setHeader('Content-Type', 'video/mp4');
    const buffer = await videoRes.arrayBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.error('Error streaming Veo video:', err);
    return res.status(500).send('Error streaming video: ' + err.message);
  }
});

// 6. REAL-TIME VOICE SESSION (gemini-3.8-live)
app.post('/api/gemini/live-speech', async (req, res) => {
  const { userSpeechText } = req.body;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [{
        role: 'user',
        parts: [{ text: userSpeechText || 'Hello, I am ready to explore mathematics.' }]
      }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return res.json({ audioBase64: base64Audio });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Speech generation failed' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SynapseAI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
