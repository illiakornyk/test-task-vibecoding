"use client";

import { useState, useRef } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setError(null);
    setTranscript("");
    setAiResponse("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release mic
        stream.getTracks().forEach((t) => t.stop());

        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access error:", err);
      setError("Microphone access denied. Please allow mic permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsProcessing(true);
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      // Step 1: Transcribe via Groq Whisper
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const transcribeRes = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      const transcribeData = await transcribeRes.json();

      if (!transcribeRes.ok) {
        setError(transcribeData.error || "Transcription failed");
        setIsProcessing(false);
        return;
      }

      setTranscript(transcribeData.text);

      // Step 2: Get AI response via Groq Llama
      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcribeData.text }),
      });
      const chatData = await chatRes.json();

      if (!chatRes.ok) {
        setError(chatData.error || "Chat response failed");
        setIsProcessing(false);
        return;
      }

      setAiResponse(chatData.response);
    } catch (err) {
      console.error("Processing error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-xl">
      <CardContent className="p-8 flex flex-col items-center gap-8 relative">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Voice to Text
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Start talking and let AI do the rest
          </p>
        </div>

        <div className="relative group perspective">
          {isRecording && (
            <div className="absolute inset-0 rounded-full animate-ping bg-rose-500/20" />
          )}
          <Button
            size="icon"
            variant={isRecording ? "destructive" : "default"}
            className="w-24 h-24 rounded-full shadow-lg transition-transform duration-300 transform group-hover:scale-105"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-10 w-10 animate-spin text-white" />
            ) : isRecording ? (
              <Square className="h-10 w-10 text-white fill-current" />
            ) : (
              <Mic className="h-10 w-10 text-white" />
            )}
            <span className="sr-only">
              {isRecording ? "Stop Recording" : "Start Recording"}
            </span>
          </Button>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-500 text-center animate-in fade-in">
            {error}
          </p>
        )}

        {/* Transcript */}
        <div
          className={`w-full min-h-[80px] p-5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-zinc-700/50 transition-all duration-300 ${
            transcript ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {transcript && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                You said
              </p>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {transcript}
              </p>
            </>
          )}
        </div>

        {/* AI Response */}
        <div
          className={`w-full min-h-[80px] p-5 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200/50 dark:border-zinc-700/50 transition-all duration-300 ${
            aiResponse
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          {aiResponse && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                AI Response
              </p>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {aiResponse}
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
