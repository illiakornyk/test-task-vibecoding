"use client";

import { useState, useRef } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = async () => {
    setIsRecording(true);
    setTranscript("");
    // TODO: implement actual recording logic with MediaRecorder
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);
    
    // Mock processing timeout
    setTimeout(() => {
      setIsProcessing(false);
      setTranscript("This is a mock transcribed text to show the UI.");
    }, 2000);
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-xl">
      <CardContent className="p-8 flex flex-col items-center gap-8 relative">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-锌-100">
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

        <div
          className={`w-full min-h-[100px] p-6 rounded-2xl bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-zinc-700/50 transition-all duration-300 ${
            transcript ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {transcript ? (
            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-center">
              {transcript}
            </p>
          ) : (
            <p className="text-zinc-400 dark:text-zinc-500 text-center italic">
              Transcription will appear here...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
