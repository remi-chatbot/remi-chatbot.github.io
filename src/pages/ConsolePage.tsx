import { useEffect, useRef, useCallback, useState } from 'react';

import { RealtimeClient } from '@openai/realtime-api-beta';
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import { WavRecorder, WavStreamPlayer } from '../lib/wavtools/index.js';
import { instructions } from '../utils/conversation_config.js';
import { WavRenderer } from '../utils/wav_renderer';

import { X, LogOut, Zap, ArrowUp, ArrowDown, FileText, Download, ChevronUp, ChevronDown, MessageSquare, Mic, Play, Pause, Menu, ExternalLink, MessageCircle } from 'react-feather';
import { Button } from '../components/button/Button';
import { Toggle } from '../components/toggle/Toggle';
import { Map } from '../components/Map';
import { TopicImageView } from '../components/TopicImageView';

import './ConsolePage.scss';
import { isJsxOpeningLikeElement } from 'typescript';

import apiService from '../lib/apiServer';

import { getInitialSystemPrompt, SysPromptOpt, updatePromptAfterFiveMinutes } from '../agent/systemMessages';
import { envConfig } from "../utils/env.config";
import { SummaryModal } from '../components/SummaryModal/index';
import ImageUpload from '../components/ImageUpload';

import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';


/**
 * Type for result from get_weather() function call
 */
interface Coordinates {
  lat: number;
  lng: number;
  location?: string;
  temperature?: {
    value: number;
    units: string;
  };
  wind_speed?: {
    value: number;
    units: string;
  };
}

/**
 * Type for all event logs
 */
interface RealtimeEvent {
  time: string;
  source: 'client' | 'server';
  count?: number;
  event: { [key: string]: any };
}

const generateRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

interface ConsolePageProps {
  onLogout: () => void;
  apiKey: string;
}

// Add these interface definitions near the top of your file with other interfaces
interface EndConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Update the EndConfirmationModal component with proper TypeScript typing
const EndConfirmationModal: React.FC<EndConfirmationModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="confirmation-overlay" />
      <div className="confirmation-modal">
        <h3 className="text-xl mb-4">End Conversation</h3>
        <p>Are you sure you want to end this conversation? A summary will be generated.</p>
        <div className="confirmation-buttons">
          <button 
            className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
            onClick={onConfirm}
          >
            End Conversation
          </button>
        </div>
      </div>
    </>
  );
};

// export function ConsolePage() {
const ConsolePage: React.FC<ConsolePageProps> = ({ onLogout, apiKey }) => {
  // Add user state
  const [user] = useAuthState(auth);
  
  /**
   * Instantiate:
   * - WavRecorder (speech input)
   * - WavStreamPlayer (speech output)
   * - RealtimeClient (API client)
   */
  const wavRecorderRef = useRef<WavRecorder>(
    new WavRecorder({ sampleRate: 24000 })
  );
  const wavStreamPlayerRef = useRef<WavStreamPlayer>(
    new WavStreamPlayer({ sampleRate: 24000 })
  );
  const clientRef = useRef<RealtimeClient>(
    new RealtimeClient({
            apiKey: apiKey,  // Ensure apiKey is always a string
            dangerouslyAllowAPIKeyInBrowser: true,
          }
    )
  );

  /**
   * References for
   * - Rendering audio visualization (canvas)
   * - Autoscrolling event logs
   * - Timing delta for event log displays
   */
  const clientCanvasRef = useRef<HTMLCanvasElement>(null);
  const serverCanvasRef = useRef<HTMLCanvasElement>(null);
  const eventsScrollHeightRef = useRef(0);
  const eventsScrollRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<string>(new Date().toISOString());

  /**
   * All of our variables for displaying application state
   * - items are all conversation items (dialog)
   * - realtimeEvents are event logs, which can be expanded
   * - memoryKv is for set_memory() function
   * - coords, marker are for get_weather() function
   */
  const [items, setItems] = useState<ItemType[]>([]);
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);
  const [expandedEvents, setExpandedEvents] = useState<{
    [key: string]: boolean;
  }>({});
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [canPushToTalk, setCanPushToTalk] = useState(false);
  const [voiceMode, setVoiceMode] = useState<'none' | 'server_vad'>('server_vad');
  const [memoryKv, setMemoryKv] = useState<{ [key: string]: any }>(() => {
    const storedMemoryKv = localStorage.getItem('acnt::memoryKv');
    return storedMemoryKv ? JSON.parse(storedMemoryKv) : {};
  });
  // const [coords, setCoords] = useState<Coordinates | null>({
  //   lat: 37.775593,
  //   lng: -122.418137,
  // });
  // const [marker, setMarker] = useState<Coordinates | null>(null);

  // topic IDs to display
  const [topicIdList, setTopicIdList] = useState<string[]>([]);

  const botName = "Remi";

  // show conversation panel
  const [showConversation, setShowConversation] = useState(false);

  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summaryContent, setSummaryContent] = useState('');

  const [isTopicVisible, setIsTopicVisible] = useState(true);

  // Save memoryKv to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('acnt::memoryKv', JSON.stringify(memoryKv));
  }, [memoryKv]);

  /**
   * Utility for formatting the timing of logs
   */
  const formatTime = useCallback((timestamp: string) => {
    const startTime = startTimeRef.current;
    const t0 = new Date(startTime).valueOf();
    const t1 = new Date(timestamp).valueOf();
    const delta = t1 - t0;
    const hs = Math.floor(delta / 10) % 100;
    const s = Math.floor(delta / 1000) % 60;
    const m = Math.floor(delta / 60_000) % 60;
    const pad = (n: number) => {
      let s = n + '';
      while (s.length < 2) {
        s = '0' + s;
      }
      return s;
    };
    return `${pad(m)}:${pad(s)}.${pad(hs)}`;
  }, []);

  /**
   * When you click the API key
   */
  const resetAPIKey = useCallback(() => {
    const apiKey = prompt('OpenAI API Key');
    if (apiKey !== null) {
      localStorage.clear();
      localStorage.setItem('acnt::voice_api_key', apiKey);
      window.location.reload();
    }
  }, []);

  /**
   * Connect to conversation:
   * WavRecorder taks speech input, WavStreamPlayer output, client is API client
   */
  const connectConversation = useCallback(async () => {
    try {
      console.log('Connecting conversation with initial prompt (Phase 1)...');
      const client = clientRef.current;
      const wavRecorder = wavRecorderRef.current;
      const wavStreamPlayer = wavStreamPlayerRef.current;

      await client.connect();
      
      startTimeRef.current = new Date().toISOString();
      setIsConnected(true);
      setPromptTimerStarted(true);
      console.log('Connection successful, 5-minute timer started');

      await wavRecorder.begin();
      await wavStreamPlayer.connect();

      // Make sure we have the latest previous summaries
      let currentPreviousSummaries = '';
      if (user) {
        currentPreviousSummaries = await fetchPreviousSummaries(user.uid);
        setPreviousSummaries(currentPreviousSummaries);
      }

      await client.updateSession({
        instructions: getInitialSystemPrompt(
          SysPromptOpt.DEFAULT, 
          JSON.stringify(memoryKv), 
          botName,
          currentPreviousSummaries // Use the fetched summaries
        ),
        input_audio_transcription: { model: 'whisper-1' },
        turn_detection: { type: 'server_vad' }
      });

      if (voiceMode === 'server_vad' && !isPaused) {
        await wavRecorder.record((data) => client.appendInputAudio(data.mono));
      }

      setCanPushToTalk(true);
      setItems(client.conversation.getItems());

    } catch (error) {
      console.error('Connection failed:', error);
      setIsConnected(false);
      setPromptTimerStarted(false);
      throw error;
    }
  }, [voiceMode, isPaused, user, memoryKv, botName]);

  /**
   * Disconnect and reset conversation state
   */
  const disconnectConversation = useCallback(async () => {
    console.log('Disconnecting conversation, resetting prompt timer...');
    setIsConnected(false);
    setPromptTimerStarted(false);

    const client = clientRef.current;
    client.disconnect();

    const wavRecorder = wavRecorderRef.current;
    await wavRecorder.end();

    const wavStreamPlayer = wavStreamPlayerRef.current;
    await wavStreamPlayer.interrupt();
  }, []);

  const deleteConversationItem = useCallback(async (id: string) => {
    const client = clientRef.current;
    client.deleteItem(id);
  }, []);

  /**
   * In push-to-talk mode, start recording
   * .appendInputAudio() for each sample
   */
  const startRecording = async () => {
    try {
      if (isRecording) return; // Prevent multiple starts
      
      setIsRecording(true);
      const client = clientRef.current;
      const wavRecorder = wavRecorderRef.current;
      const wavStreamPlayer = wavStreamPlayerRef.current;
      
      // Interrupt any ongoing playback
      const trackSampleOffset = await wavStreamPlayer.interrupt();
      if (trackSampleOffset?.trackId) {
        const { trackId, offset } = trackSampleOffset;
        await client.cancelResponse(trackId, offset);
      }

      // Start recording
      await wavRecorder.record((data) => {
        if (client.isConnected()) {
          client.appendInputAudio(data.mono);
        }
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  };

  /**
   * In push-to-talk mode, stop recording
   */
  const stopRecording = async () => {
    try {
      if (!isRecording) return; // Prevent stopping if not recording
      
      const client = clientRef.current;
      const wavRecorder = wavRecorderRef.current;
      
      await wavRecorder.pause();
      setIsRecording(false);
      
      if (client.isConnected()) {
        await client.createResponse();
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
    }
  };

  /**
   * Switch between Manual <> VAD mode for communication
   */
  const changeTurnEndType = async (value: string) => {
    try {
      const client = clientRef.current;
      const wavRecorder = wavRecorderRef.current;
      
      // Stop any ongoing recording
      if (wavRecorder.getStatus() === 'recording') {
        await wavRecorder.pause();
        setIsRecording(false);
      }
      
      // Update session settings
      await client.updateSession({
        turn_detection: value === 'none' ? null : { type: 'server_vad' },
      });
      
      // Start recording if switching to Auto mode and not paused
      if (value === 'server_vad' && client.isConnected() && !isPaused) {
        await wavRecorder.record((data) => client.appendInputAudio(data.mono));
      }
      
      setVoiceMode(value as 'none' | 'server_vad');
    } catch (error) {
      console.error('Failed to change turn end type:', error);
    }
  };

  /**
   * Auto-scroll the event logs
   */
  useEffect(() => {
    if (eventsScrollRef.current) {
      const eventsEl = eventsScrollRef.current;
      const scrollHeight = eventsEl.scrollHeight;
      // Only scroll if height has just changed
      if (scrollHeight !== eventsScrollHeightRef.current) {
        eventsEl.scrollTop = scrollHeight;
        eventsScrollHeightRef.current = scrollHeight;
      }
    }
  }, [realtimeEvents]);

  /**
   * Auto-scroll the conversation logs
   */
  useEffect(() => {
    const conversationEls = [].slice.call(
      document.body.querySelectorAll('[data-conversation-content]')
    );
    for (const el of conversationEls) {
      const conversationEl = el as HTMLDivElement;
      conversationEl.scrollTop = conversationEl.scrollHeight;
    }
  }, [items]);

  /**
   * Set up render loops for the visualization canvas
   */
  useEffect(() => {
    let isLoaded = true;

    const wavRecorder = wavRecorderRef.current;
    const clientCanvas = clientCanvasRef.current;
    let clientCtx: CanvasRenderingContext2D | null = null;

    const wavStreamPlayer = wavStreamPlayerRef.current;
    const serverCanvas = serverCanvasRef.current;
    let serverCtx: CanvasRenderingContext2D | null = null;

    const render = () => {
      if (isLoaded) {
        if (clientCanvas) {
          if (!clientCanvas.width || !clientCanvas.height) {
            clientCanvas.width = clientCanvas.offsetWidth;
            clientCanvas.height = clientCanvas.offsetHeight;
          }
          clientCtx = clientCtx || clientCanvas.getContext('2d');
          if (clientCtx) {
            clientCtx.clearRect(0, 0, clientCanvas.width, clientCanvas.height);
            const result = wavRecorder.recording
              ? wavRecorder.getFrequencies('voice')
              : { values: new Float32Array([0]) };
            WavRenderer.drawBars(
              clientCanvas,
              clientCtx,
              result.values,
              '#0099ff',
              10,
              0,
              8
            );
          }
        }
        if (serverCanvas) {
          if (!serverCanvas.width || !serverCanvas.height) {
            serverCanvas.width = serverCanvas.offsetWidth;
            serverCanvas.height = serverCanvas.offsetHeight;
          }
          serverCtx = serverCtx || serverCanvas.getContext('2d');
          if (serverCtx) {
            serverCtx.clearRect(0, 0, serverCanvas.width, serverCanvas.height);
            const result = wavStreamPlayer.analyser
              ? wavStreamPlayer.getFrequencies('voice')
              : { values: new Float32Array([0]) };
            WavRenderer.drawBars(
              serverCanvas,
              serverCtx,
              result.values,
              '#009900',
              10,
              0,
              8
            );
          }
        }
        window.requestAnimationFrame(render);
      }
    };
    render();

    return () => {
      isLoaded = false;
    };
  }, []);

  /**
   * Core RealtimeClient and audio capture setup
   * Set all of our instructions, tools, events and more
   */
  useEffect(() => {
    // Get refs
    const wavStreamPlayer = wavStreamPlayerRef.current;
    const client = clientRef.current;

    // Set instructions
    client.updateSession({ instructions: getInitialSystemPrompt(SysPromptOpt.DEFAULT, JSON.stringify(memoryKv), botName) });
    // Set transcription, otherwise we don't get user transcriptions back
    client.updateSession({ input_audio_transcription: { model: 'whisper-1' } });
    client.updateSession({ voice: 'shimmer' });

    // set initial turn change type
    client.updateSession({turn_detection: { type: 'server_vad' }});
    setCanPushToTalk(false);

    // Add tools
    client.addTool(
      {
        name: 'set_memory',
        description: 'Saves important data about the user into memory.',
        parameters: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description:
                'The key of the memory value. Always use lowercase and underscores, no other characters.',
            },
            value: {
              type: 'string',
              description: 'Value can be anything represented as a string',
            },
          },
          required: ['key', 'value'],
        },
      },
      async ({ key, value }: { [key: string]: any }) => {
        setMemoryKv((memoryKv) => {
          const newKv = { ...memoryKv };
          newKv[key] = value;
          return newKv;
        });
        return { ok: true };
      }
    );
    client.addTool(
      {
        name: 'display_topic_images',
        description: 'Display all three topic images on the screen',
        parameters: {
        },
      },
      async () => {
        setTopicIdList(['1', '2', '3'])
      }
    );
    client.addTool(
      {
        name: 'set_topic',
        description: 'Specify a topic to talk',
        parameters: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              enum: ['1', '2', '3'],
              description: 'topic ID',
            },
          },
          required: ['id'],
        },
      },
      async ({ id }: { [key: string]: any }) => {
        setTopicIdList([id]);
      }
    );

    client.on('error', (event: any) => console.error(event));
    client.on('conversation.interrupted', async () => {
      const trackSampleOffset = await wavStreamPlayer.interrupt();
      if (trackSampleOffset?.trackId) {
        const { trackId, offset } = trackSampleOffset;
        await client.cancelResponse(trackId, offset);
      }
    });
    client.on('conversation.updated', async ({ item, delta }: any) => {
      const items = client.conversation.getItems();
      if (delta?.audio) {
        wavStreamPlayer.add16BitPCM(delta.audio, item.id);
      }
      if (item.status === 'completed' && item.formatted.audio?.length) {
        const wavFile = await WavRecorder.decode(
          item.formatted.audio,
          24000,
          24000
        );
        item.formatted.file = wavFile;
      }
      setItems(items);
    });

    setItems(client.conversation.getItems());

    return () => {
      // cleanup; resets to defaults
      client.reset();
    };
  }, []);

  const generateSummary = async () => {
    try {
      // Show loading state
      setSummaryModalOpen(true);
      setSummaryContent('Generating summary...');

      // Filter and format conversation data
      const conversationData = items
        .filter(item => {
          // Filter out empty or irrelevant messages
          if (item.type === 'function_call_output' && !item.formatted.output) return false;
          if (!item.formatted.text && !item.formatted.transcript && !item.formatted.output) return false;
          return true;
        })
        .map(item => {
          let role = item.role || 'system';
          let content = '';

          // Format content based on item type
          if (item.type === 'function_call_output') {
            content = item.formatted.output || '';
            role = 'assistant';
          } else if (item.formatted.tool) {
            content = `${item.formatted.tool.name}(${JSON.stringify(item.formatted.tool.arguments)})`;
            role = 'assistant';
          } else {
            content = item.formatted.text || item.formatted.transcript || '';
            role = item.role === 'assistant' ? 'assistant' : 'user';
          }
          
          return { role, content };
        });

      // Only proceed if we have conversation data
      if (conversationData.length === 0) {
        setSummaryContent('No conversation to summarize yet.');
        return;
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that generates concise summaries of conversations. Focus on the main points, key decisions, and outcomes. Format the summary with bullet points for better readability."
            },
            {
              role: "user",
              content: `Please summarize this conversation in a clear, organized way:\n\n${JSON.stringify(conversationData, null, 2)}`
            }
          ],
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        setSummaryContent(data.choices[0].message.content);
      } else {
        throw new Error('Unexpected API response format');
      }

    } catch (error) {
      console.error('Error generating summary:', error);
      setSummaryContent('Failed to generate summary. Please try again.');
    }
  };

  // Add this function for downloading logs
  const downloadLogs = () => {
    try {
      const conversationData = items.map(item => {
        let content = '';
        if (item.type === 'function_call_output') {
          content = item.formatted.output || '';
        } else if (item.formatted.tool) {
          content = `${item.formatted.tool.name}(${item.formatted.tool.arguments})`;
        } else {
          content = item.formatted.text || item.formatted.transcript || '';
        }
        
        return {
          role: item.role || item.type,
          content: content,
          timestamp: new Date().toISOString()
        };
      });

      const blob = new Blob([JSON.stringify(conversationData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-log-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading logs:', error);
      alert('Failed to download logs. Please try again.');
    }
  };

  const styles = `
  .modern-layout {
    background: #1a1a1a;
    min-height: 100vh;
    color: #ffffff;
  }

  .main-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 2rem;
  }

  .chat-section {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;
    margin: 0;
    padding: 0;
    background: #2d2d2d;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .messages-section {
      flex: 1;
      width: 100%;
      height: calc(100vh - 120px);
      overflow-y: auto;
      padding: 1.5rem;
      margin: 0;
      box-sizing: border-box;
      background: #2d2d2d;
    }

    .input-section {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      padding: 1rem;
      background: #363636;
      border-top: 1px solid #4a4a4a;
      box-sizing: border-box;
    }
  }

  .topic-section {
    padding: 1.5rem;
    background: #363636;
    border-radius: 16px 16px 0 0;
  }

  .messages-section::-webkit-scrollbar {
    width: 8px;
  }

  .messages-section::-webkit-scrollbar-track {
    background: #363636;
    border-radius: 4px;
  }

  .messages-section::-webkit-scrollbar-thumb {
    background: #4a4a4a;
    border-radius: 4px;
  }

  .messages-section {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    scroll-behavior: smooth;
    height: calc(100vh - 400px);
    background: #2d2d2d;
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .message-user {
      align-self: flex-start;
      max-width: 85%;
      margin-bottom: 1rem;
      
      .message-content {
        background: transparent;
        padding: 1rem;
        color: #e2d9f3;
        font-size: 14px;
        line-height: 1.5;
        white-space: pre-wrap;
        
        div {
          background: transparent;
        }
      }
    }

    .message-assistant {
      align-self: flex-start;
      max-width: 85%;
      margin-bottom: 1rem;

      .assistant-message-container {
        display: flex;
        gap: 1rem;
        align-items: flex-start;

        .message-content {
          background: #363636;
          border-radius: 12px;
          padding: 1rem;
          color: white;
          font-size: 14px;
          line-height: 1.5;
        }
      }
    }
  }

  .audio-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    font-size: 0.9rem;
    color: #a0a0a0;
  }

  .tool-message {
    font-size: 0.9rem;
    color: #a0a0a0;
    margin-top: 0.5rem;
  }

  .input-container {
    display: flex;
    gap: 1rem;
    align-items: flex-end;
  }

  .input-wrapper {
    flex: 1;
    background: #2d2d2d;
    border-radius: 12px;
    padding: 0.75rem;
    display: flex;
    align-items: flex-end;
    gap: 0.75rem;
    border: 1px solid #4a4a4a;
  }

  .chat-input {
    flex: 1;
    background: transparent;
    border: none;
    color: #ffffff;
    font-size: 1rem;
    resize: none;
    min-height: 24px;
    max-height: 120px;
    padding: 0;
    line-height: 1.5;
  }

  .chat-input:focus {
    outline: none;
  }

  .chat-input::placeholder {
    color: #808080;
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .controls-section {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #4a4a4a;
  }

  .avatar-section {
    background: #2d2d2d;
    border-radius: 16px;
    padding: 1.5rem;
    text-align: center;
    position: relative;
  }

  .avatar-container {
    position: relative;
    width: 200px;
    height: 200px;
    margin: 2rem auto;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .avatar-image {
    width: 120px;
    height: 120px;
    border-radius: 60px;
    border: 3px solid #0099ff;
    position: relative;
    z-index: 2;
  }

  .wave-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  .speaking-indicator {
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    background: #0099ff;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.3s;
  }

  .speaking-indicator.active {
    opacity: 1;
  }

  .message-image.loading {
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  }
  `;

  // Add these additional styles
  const additionalStyles = `
  .top-controls {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 0.5rem 1.5rem;
    background: #363636;
    border-bottom: 1px solid #4a4a4a;
  }

  .bottom-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #4a4a4a;
  }

  .control-group {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .vad-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #363636;
    border-radius: 8px;
    font-size: 0.9rem;
    color: #0099ff;
  }

  .vad-indicator::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #0099ff;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.4; }
    100% { opacity: 1; }
  }

  .voice-mode-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    width: 100%;
    padding-top: 60px; /* Account for header */
  }

  .remi-interface-section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    max-width: 800px; /* Optional: limit maximum width */
    margin: 0 auto;
  }

  .centered-avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    width: 100%;
  }

  .avatar-container {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .buttons-container {
    display: flex;
    gap: 1rem;
    justify-content: center;
    align-items: center;
    margin-top: 2rem;
  }

  /* Ensure the main container takes full height */
  .main-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .mode-toggle-button {
    background: #363636;
    border: none;
    color: #ffffff;
    padding: 0.75rem;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .mode-toggle-button:hover {
    background: #4a4a4a;
  }

  .control-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }

  .pause-button {
    background: #4a4a4a;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background: #5a5a5a;
    }

    &.paused {
      background: #0099ff;
    }
  }

  .end-button {
    background: #dc3545;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background: #c82333;
    }
  }

  .confirmation-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #2d2d2d;
    padding: 2rem;
    border-radius: 12px;
    z-index: 1000;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }

  .confirmation-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 999;
  }

  .confirmation-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
    justify-content: flex-end;
  }

  .start-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    align-items: center;
  }

  .halo-glow {
    position: absolute;
    width: 140px;
    height: 140px;
    border-radius: 50%;
    background: rgba(0, 153, 255, 0.1);
    filter: blur(10px);
    transition: all 0.3s ease;
    opacity: 0;
    transform: scale(0.9);
  }

  .halo-glow.speaking {
    opacity: 1;
    transform: scale(1.2);
    animation: pulse-glow 2s infinite;
  }

  @keyframes pulse-glow {
    0% {
      transform: scale(1.2);
      background: rgba(0, 153, 255, 0.1);
    }
    50% {
      transform: scale(1.4);
      background: rgba(0, 153, 255, 0.2);
    }
    100% {
      transform: scale(1.2);
      background: rgba(0, 153, 255, 0.1);
    }
  }

  .avatar-image {
    width: 120px;
    height: 120px;
    border-radius: 60px;
    border: 3px solid #0099ff;
    position: relative;
    z-index: 2;
  }

  .messages-section {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    scroll-behavior: smooth;
    height: calc(100vh - 400px);
    background: #2d2d2d;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .message {
    display: flex;
    width: 100%;
    margin-bottom: 1rem;
  }

  .message-user {
    align-self: flex-start;
    max-width: 70%;
    margin-right: auto;
    
    .message-content {
      background: #363636;
      padding: 1rem;
      border-radius: 12px 12px 12px 0;
      color: #ffffff;
      font-size: 14px;
      line-height: 1.5;
      white-space: pre-wrap;
    }
  }

  .message-assistant {
    align-self: flex-end;
    max-width: 70%;
    margin-left: auto;

    .assistant-message-container {
      display: flex;
      gap: 1rem;
      align-items: flex-start;

      .message-content {
        background: #0099ff;
        border-radius: 12px 12px 0 12px;
        padding: 1rem;
        color: white;
        font-size: 14px;
        line-height: 1.5;
      }
    }
  }

  .mobile-menu-toggle {
    display: none;
  }

  .mobile-menu {
    display: none;
  }

  @media screen and (max-width: 768px) {
    .chat-section {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100vh;
      margin: 0;
      padding: 0;
      overflow-x: hidden;
      background: #2d2d2d;

      .messages-section {
        width: 100%;
        height: calc(100vh - 120px);
        margin: 0;
        padding: 0.75rem;
        box-sizing: border-box;
        background: #2d2d2d;
        
        .message {
          max-width: 90%;
        }
      }

      .input-section {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        width: 100%;
        padding: 1rem;
        background: #363636;
        border-top: 1px solid #4a4a4a;
        box-sizing: border-box;
      }
    }

    // Adjust main container for mobile
    .main-container {
      max-width: none;
      margin: 0;
      padding: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: #2d2d2d;
    }
  }
  `;

  // Add this state for mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Add this function to handle menu toggle
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Update the speaking state when audio starts/stops
  useEffect(() => {
    const wavStreamPlayer = wavStreamPlayerRef.current;
    
    const checkSpeaking = () => {
      setIsSpeaking(!!wavStreamPlayer.analyser);
    };

    const interval = setInterval(checkSpeaking, 100);
    return () => clearInterval(interval);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [items]);

  // Add this state for storing pending image
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  // Add this console log to verify the message structure
  const sendImageMessage = async (imageDataUrl: string, text: string = '') => {
    try {
      if (!isConnected) {
        await connectConversation();
      }

      const messageContent = {
        type: 'image_message',
        image: imageDataUrl,
        text: text || '[Image uploaded]'
      };

      console.log('Sending image message:', messageContent); // Debug log

      await clientRef.current.sendUserMessageContent([
        { 
          type: 'input_text',
          text: JSON.stringify(messageContent)
        }
      ]);

      // Clear states after successful send
      setPendingImage(null);
    } catch (error) {
      console.error('Failed to send image:', error);
      throw error;
    }
  };

  // Add new state for mode
  const [interactionMode, setInteractionMode] = useState<'voice' | 'chat'>('voice'); // Default to voice

  // Add connection status button to voice mode and handle mode-specific behaviors
  const handleModeChange = async (newMode: 'voice' | 'chat') => {
    setInteractionMode(newMode);
    
    // Stop any ongoing speech when switching to chat mode
    if (newMode === 'chat') {
      // Instead of trying to stop the player directly, 
      // we can disconnect the conversation which will stop any ongoing audio
      if (isConnected) {
        await disconnectConversation();
      }
      if (isRecording) {
        await stopRecording();
      }
    }
  };

  // Add these new state variables near your other state declarations
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);

  // Add these new functions with your other function declarations
  const handlePause = async () => {
    try {
      if (isPaused) {
        // Resuming conversation
        if (!isConnected) {
          await connectConversation();
        } else {
          const client = clientRef.current;
          const wavRecorder = wavRecorderRef.current;
          
          // If in VAD mode, restart recording
          if (voiceMode === 'server_vad') {
            await wavRecorder.begin(); // Make sure recorder is initialized
            await wavRecorder.record((data) => {
              if (client.isConnected()) {
                client.appendInputAudio(data.mono);
              }
            });
          }
        }
        setIsPaused(false);
      } else {
        // Pausing conversation
        const wavRecorder = wavRecorderRef.current;
        const wavStreamPlayer = wavStreamPlayerRef.current;
        const client = clientRef.current;

        // Stop recording if active
        if (isRecording || wavRecorder.getStatus() === 'recording') {
          await wavRecorder.pause();
          setIsRecording(false);
        }

        // Interrupt any ongoing playback
        const trackSampleOffset = await wavStreamPlayer.interrupt();
        if (trackSampleOffset?.trackId) {
          const { trackId, offset } = trackSampleOffset;
          await client.cancelResponse(trackId, offset);
        }

        // Stop VAD mode recording if active
        if (voiceMode === 'server_vad') {
          await wavRecorder.end();
        }

        setIsPaused(true);
      }
    } catch (error) {
      console.error('Error handling pause/resume:', error);
      // Reset state if there's an error
      setIsPaused(false);
      setIsRecording(false);
    }
  };

  // Add the saveNewSummary function here, near other utility functions
  const saveNewSummary = async (userId: string, summaryContent: string) => {
    try {
      // Get the count of existing sessions for this user
      const q = query(
        collection(db, 'conversation_summaries'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const sessionNumber = querySnapshot.size + 1;
      // Add new summary with session number
      await addDoc(collection(db, 'conversation_summaries'), {
        userId,
        summary: summaryContent,
        timestamp: serverTimestamp(),
        sessionNumber
      });
    } catch (error) {
      console.error('Error saving summary:', error);
      throw error;
    }
  };
  // Then modify handleEndConversation to use the new function

  const handleEndConversation = async () => {
    try {
      // First disconnect everything
      await disconnectConversation();
      
      // Generate summary
      setShowEndConfirmation(false);
      
      // Show loading state in modal
      setSummaryModalOpen(true);
      setSummaryContent('Generating summary...');

      // Generate summary content
      const summaryContent = await generateSummaryContent();

      // Save to Firebase if user is logged in
      if (user && summaryContent) {
        try {
          // Get the existing summary document if it exists
          await saveNewSummary(user.uid, summaryContent);
        } catch (error) {
          console.error('Error saving summary to Firebase:', error);
        }
      }
      // Update modal with summary
      setSummaryContent(summaryContent);
    } catch (error) {
      console.error('Error handling end conversation:', error);
      setSummaryContent('Failed to generate summary. Please try again.');
    }
  };

  // Modify generateSummary to return the content
  const generateSummaryContent = async (): Promise<string> => {
    try {
      const conversationData = items
        .filter(item => {
          if (item.type === 'function_call_output' && !item.formatted.output) return false;
          if (!item.formatted.text && !item.formatted.transcript && !item.formatted.output) return false;
          return true;
        })
        .map(item => {
          let role = item.role || 'system';
          let content = '';

          if (item.type === 'function_call_output') {
            content = item.formatted.output || '';
            role = 'assistant';
          } else if (item.formatted.tool) {
            content = `${item.formatted.tool.name}(${JSON.stringify(item.formatted.tool.arguments)})`;
            role = 'assistant';
          } else {
            content = item.formatted.text || item.formatted.transcript || '';
            role = item.role === 'assistant' ? 'assistant' : 'user';
          }
          
          return { role, content };
        });

      if (conversationData.length === 0) {
        return 'No conversation to summarize yet.';
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant that generates concise summaries of therapy sessions. 
              Focus on:
              - Key topics discussed
              - Main emotions expressed
              - Important insights or breakthroughs
              - Any action items or goals set
              Format the summary with clear sections and bullet points for better readability.`
            },
            {
              role: "user",
              content: `Please summarize this therapy session in a structured way:\n\n${JSON.stringify(conversationData, null, 2)}`
            }
          ],
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      }
      
      throw new Error('Unexpected API response format');

    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    }
  };

  // Add this function inside ConsolePage component
  const fetchPreviousSummaries = async (userId: string): Promise<string> => {
    try {
      // Query all summaries for the user, ordered by sessionNumber
      const q = query(
        collection(db, 'conversation_summaries'),
        where('userId', '==', userId),
        orderBy('sessionNumber', 'asc')
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return '';

      const summaries = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate?.() || new Date();
        const formattedDate = timestamp.toLocaleDateString();
        
        return `Session ${data.sessionNumber} (${formattedDate}):
${data.summary}`;
      });

      // Format the context for the AI model
      return `Previous Sessions History:

${summaries.join('\n\n---\n\n')}

Context Instructions:
- Session numbers indicate chronological order (1 is first, ${summaries.length} is most recent)
- Use this context to:
  1. Maintain continuity between sessions
  2. Reference specific past sessions when relevant
  3. Track progress across sessions
  4. Avoid repeating previously covered topics
  5. Build upon insights from earlier sessions
- When referencing previous sessions, specify the session number (e.g., "As we discussed in Session 2...")`;

    } catch (error) {
      console.error('Error fetching summaries:', error);
      return '';
    }
  };

  // Add this state for the prompt timer
  const [promptTimerStarted, setPromptTimerStarted] = useState(false);

  // Add this state for storing previous summaries
  const [previousSummaries, setPreviousSummaries] = useState<string>('');

  // Fetch previous summaries when component mounts
  useEffect(() => {
    const loadPreviousSummaries = async () => {
      if (user) {
        try {
          const summaries = await fetchPreviousSummaries(user.uid);
          setPreviousSummaries(summaries);
          console.log('Loaded previous summaries:', summaries || 'None');
        } catch (error) {
          console.error('Error loading previous summaries:', error);
        }
      }
    };
    
    loadPreviousSummaries();
  }, [user]);

  // Add timer effect
  useEffect(() => {
    let promptTimer: NodeJS.Timeout;
    
    if (promptTimerStarted && isConnected) {
      console.log('Starting 5-minute timer for prompt update...');
      
      promptTimer = setTimeout(async () => {
        try {
          console.log('5 minutes elapsed, updating prompt...');
          const client = clientRef.current;
          await updatePromptAfterFiveMinutes(client);
        } catch (error) {
          console.error('Failed to update prompt after 5 minutes:', error);
        }
      }, 5 * 60 * 1000);
    }
    
    return () => {
      if (promptTimer) {
        console.log('Cleaning up prompt timer');
        clearTimeout(promptTimer);
      }
    };
  }, [promptTimerStarted, isConnected]);

  /**
   * Render the application
   */
  return (
    <div className="modern-layout">
      <style>{styles}</style>
      <style>{additionalStyles}</style>
      
      {/* Mobile Menu Toggle Button */}
      <button 
        className="mobile-menu-toggle"
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="menu-items">
          <Button
            icon={FileText}
            buttonStyle="action"
            label="Summary"
            onClick={generateSummary}
          />
          <Button
            icon={Download}
            buttonStyle="action"
            label="Download"
            onClick={downloadLogs}
          />
          <a 
            href="https://aihealth.ischool.utexas.edu/research/Chatbot/research_chatbot.html" 
            className="research-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Research
          </a>
          <a 
            href="https://www.surveymonkey.com/r/VNKG3NS" 
            className="feedback-link"
          >
            Feedback
          </a>
          <Button 
            icon={LogOut} 
            buttonStyle="action" 
            label="Log Out" 
            onClick={onLogout} 
          />
        </div>
      </div>

      {/* Header */}
      <header className="p-4 bg-[#2d2d2d]">
        <div className="header-container max-w-[1400px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="header-buttons flex items-center gap-4">
            <img src="/openai-logomark.svg" alt="Logo" className="h-8" />
            <h1 className="text-xl font-semibold">Remi</h1>
          </div>
          <div className="header-buttons flex flex-wrap items-center justify-center gap-4">
            <Button
              icon={FileText}
              buttonStyle="action"
              label="Summary"
              onClick={generateSummary}
            />
            <Button
              icon={Download}
              buttonStyle="action"
              label="Download"
              onClick={downloadLogs}
            />
            <Button
              icon={() => <ExternalLink size={20} />}
              buttonStyle="action"
              label="Research"
              onClick={() => window.open('https://aihealth.ischool.utexas.edu/research/Chatbot/research_chatbot.html', '_blank')}
            />
            <Button
              icon={() => <MessageCircle size={20} />}
              buttonStyle="action"
              label="Feedback"
              onClick={() => window.open('https://www.surveymonkey.com/r/VNKG3NS', '_blank')}
            />
            <Button 
              icon={LogOut} 
              buttonStyle="action" 
              label="Log Out" 
              onClick={onLogout} 
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-container">
        {interactionMode === 'chat' ? (
          // Chat Mode Layout
          <div className="chat-section">
            {/* Top Controls - Make sure it's above other elements */}
            <div className="top-controls fixed top-[60px] left-0 right-0 z-[100] bg-[#2d2d2d] flex justify-between items-center p-4 sm:px-6">
              <Button
                icon={Mic}
                buttonStyle="action"
                label="Return to Voice Mode"
                onClick={() => handleModeChange('voice')}
                className="voice-return-button"
              />
            </div>

            {/* Topic View */}
            <div className={`topic-section ${isTopicVisible ? 'expanded' : 'collapsed'}`}>
              <button 
                className="topic-toggle"
                onClick={() => setIsTopicVisible(!isTopicVisible)}
                title={isTopicVisible ? "Hide emotion wheel" : "Show emotion wheel"}
              >
                {isTopicVisible ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {isTopicVisible && (
                <TopicImageView
                  topicIdList={topicIdList}
                  topics={['Topic 1', 'Topic 2', 'Topic 3']}
                  themeId="default"
                />
              )}
            </div>

            {/* Messages */}
            <div 
              className="messages-section" 
              data-conversation-content
              ref={messagesEndRef}
              style={{ paddingTop: '60px' }}  // Add padding to prevent content from going under the button
            >
              {showConversation && items.map((item) => {
                console.log('Rendering message item:', item); // Debug log
                return (
                <div
                  key={item.id}
                  className={`message ${
                    item.role === 'assistant' ? 'message-assistant' : 'message-user'
                  }`}
                >
                  {/* User messages */}
                  {item.role === 'user' && (
                    <div className="message-user">
                      <div className="message-content">
                        <div>{item.formatted?.text || item.formatted?.transcript}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Assistant messages */}
                  {item.role === 'assistant' && (
                    <div className="message-assistant">
                      <div className="assistant-message-container">
                        <div className="message-content">
                          <div>{item.formatted?.text || item.formatted?.transcript}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )})}
            </div>

            {/* Summary Modal */}
            <SummaryModal
              isOpen={summaryModalOpen}
              onClose={() => setSummaryModalOpen(false)}
              summary={summaryContent}
            />
          </div>
        ) : (
          // Voice Mode Layout
          <div className="voice-mode-container">
            {/* Removed emotion-wheel-section */}
            <div className="remi-interface-section">
              <div className="centered-avatar-section">
                <div className="avatar-container">
                  <div className={`halo-glow ${isSpeaking ? 'speaking' : ''}`}></div>
                  <img src="/avatar.png" alt="Avatar" className="avatar-image" />
                </div>
                
                <div className="buttons-container">
                  {isConnected ? (
                    <>
                      <button 
                        className={`pause-button ${isPaused ? 'paused' : ''}`}
                        onClick={handlePause}
                      >
                        {isPaused ? (
                          <>
                            <Play size={20} />
                            Resume
                          </>
                        ) : (
                          <>
                            <Pause size={20} />
                            Pause
                          </>
                        )}
                      </button>
                      
                      <button 
                        className="end-button"
                        onClick={() => setShowEndConfirmation(true)}
                      >
                        <X size={20} />
                        End
                      </button>
                    </>
                  ) : (
                    <div className="start-buttons">
                      <Button
                        label="Start Conversation"
                        icon={Play}
                        buttonStyle="action"
                        onClick={connectConversation}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Add this outside of your main layout */}
      <SummaryModal
        isOpen={summaryModalOpen}
        onClose={() => {
          setSummaryModalOpen(false);
          setSummaryContent('');
        }}
        summary={summaryContent}
      />

      <EndConfirmationModal
        isOpen={showEndConfirmation}
        onConfirm={handleEndConversation}
        onCancel={() => setShowEndConfirmation(false)}
      />
    </div>
  );
}

export default ConsolePage;
