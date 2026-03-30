import { VoiceRecorder } from "@/components/voice-recorder";
import { SubscribeButton } from "@/components/subscribe-button";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800">
      <main className="container mx-auto px-4 py-24 sm:px-6 lg:px-8 flex flex-col items-center">
        {/* Hero Section */}
        <div className="text-center space-y-8 mb-16 max-w-2xl mx-auto">
          <div className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1 text-sm font-medium">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
            Try your 1 free record
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
            Speak your mind, we'll
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-zinc-500 to-zinc-900 dark:from-zinc-400 dark:to-zinc-100">
               do the typing.
            </span>
          </h1>
          
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Harness the power of AI to convert your voice into perfect text instantly. 
            Experience an interaction built for speed, accuracy, and flow.
          </p>
        </div>

        {/* Recorder Component */}
        <div className="w-full relative z-10 w-full flex justify-center perspective">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-50 dark:to-zinc-950 -bottom-10 pointer-events-none" />
          <VoiceRecorder />
        </div>

        {/* Upgrade CTA */}
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Want unlimited recordings? Upgrade to Pro.
          </p>
          <SubscribeButton />
        </div>
      </main>
    </div>
  );
}
