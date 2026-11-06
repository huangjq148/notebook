import { useEffect, useRef, useState } from 'react';
import { message } from 'antd';

type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { resultIndex: number; results: ArrayLike<RecognitionResult> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

export function useVoiceRecognition(onTranscript: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const callbackRef = useRef(onTranscript);
  callbackRef.current = onTranscript;
  const recognitionRef = useRef<Recognition | null>(null);
  const activeRef = useRef(false);
  const restartTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const stop = () => {
    activeRef.current = false;
    clearTimeout(restartTimer.current);
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setListening(false);
  };

  const toggle = () => {
    if (activeRef.current) {
      stop();
      return;
    }
    const speechWindow = window as SpeechWindow;
    const Constructor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Constructor) {
      message.warning('当前浏览器不支持语音识别，请使用支持语音识别的浏览器');
      return;
    }
    const recognition = new Constructor();
    recognitionRef.current = recognition;
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;
    activeRef.current = true;
    setListening(true);
    setTranscript('');
    recognition.onresult = (event) => {
      if (!activeRef.current || recognitionRef.current !== recognition) return;
      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index];
        setTranscript(result[0].transcript);
        // 中间结果只展示，避免重复执行新增或反复覆盖输入。
        if (result.isFinal) callbackRef.current(result[0].transcript);
      }
    };
    recognition.onerror = ({ error }) => {
      if (!activeRef.current || recognitionRef.current !== recognition || error === 'no-speech') return;
      stop();
      const errors: Record<string, string> = {
        'not-allowed': '无法使用麦克风，请允许麦克风权限并通过 HTTPS 或本机地址打开页面',
        'service-not-allowed': '浏览器未允许使用语音识别服务',
        'audio-capture': '未检测到可用的麦克风',
        network: '语音识别网络异常，请检查网络后重试',
      };
      message.error(errors[error] ?? '语音识别已中断，请重新开始');
    };
    recognition.onend = () => {
      if (!activeRef.current || recognitionRef.current !== recognition) return;
      restartTimer.current = setTimeout(() => {
        if (!activeRef.current || recognitionRef.current !== recognition) return;
        try {
          recognition.start();
        } catch {
          stop();
          message.error('语音识别已停止，请重新开始');
        }
      }, 300);
    };
    try {
      recognition.start();
    } catch {
      stop();
      message.error('无法启动语音识别，请检查浏览器和麦克风权限');
    }
  };

  useEffect(
    () => () => {
      activeRef.current = false;
      clearTimeout(restartTimer.current);
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.abort();
      }
    },
    [],
  );

  return { listening, transcript, toggle };
}
