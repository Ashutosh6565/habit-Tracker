import { FormEvent, useState } from "react";
import { Bot, Lightbulb, MessageCircle, Send, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

type Message = {
  author: "coach" | "user";
  text: string;
};

const starterPrompts = ["Build a morning routine", "Help me focus", "Create a workout habit"];

const getCoachReply = (prompt: string) => {
  const message = prompt.toLowerCase();

  if (message.includes("sleep") || message.includes("bed")) {
    return "Start with one anchor: set a reminder 30 minutes before bed, then spend those 30 minutes away from your phone. Track it for seven days before changing anything else.";
  }
  if (message.includes("workout") || message.includes("exercise") || message.includes("fitness")) {
    return "Make the first version very small: choose a 10-minute workout at the same time on three days this week. Prepare your clothes the night before so starting takes no effort.";
  }
  if (message.includes("study") || message.includes("learn") || message.includes("exam")) {
    return "Try a daily 25-minute study block. Decide the exact topic before you begin, put your phone out of reach, and finish by writing one sentence about what you learned.";
  }
  if (message.includes("focus") || message.includes("procrastin") || message.includes("productive")) {
    return "Pick the single task that would make today feel successful. Work on it for 15 minutes with notifications off, then take a short break. Momentum matters more than a perfect plan.";
  }
  if (message.includes("morning") || message.includes("routine")) {
    return "Build your routine around something you already do: after brushing your teeth, drink a glass of water and write your top priority. Keep it under five minutes for the first week.";
  }

  return "Choose one habit you can complete in under two minutes, attach it to a daily cue, and track it for the next seven days. What part of your routine would you like to improve first?";
};

const HabitCoach = () => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      author: "coach",
      text: "Hi! I’m your Habit Coach. Tell me what you want to improve, and I’ll help you turn it into a small, realistic next step.",
    },
  ]);

  const sendMessage = (text: string) => {
    const trimmedPrompt = text.trim();
    if (!trimmedPrompt) return;

    setMessages((current) => [
      ...current,
      { author: "user", text: trimmedPrompt },
      { author: "coach", text: getCoachReply(trimmedPrompt) },
    ]);
    setPrompt("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(prompt);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 native-float inline-flex items-center gap-2 rounded-full gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/25 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="Open Habit Coach"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden sm:inline">Ask Habit Coach</span>
      </button>

      <SheetContent side="right" className="flex h-dvh w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border bg-card px-6 py-5 pr-12 text-left">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <SheetTitle className="font-display">Habit Coach</SheetTitle>
          <SheetDescription>Practical, small steps for the habit you want to build.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 px-5 py-6">
          <div className="space-y-4 pr-3">
            {messages.map((message, index) => (
              <div key={`${message.author}-${index}`} className={`flex gap-3 ${message.author === "user" ? "justify-end" : "justify-start"}`}>
                {message.author === "coach" && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <p
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.author === "user" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-secondary text-secondary-foreground"
                  }`}
                >
                  {message.text}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t border-border bg-card px-5 py-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {starterPrompts.map((starterPrompt) => (
              <button
                key={starterPrompt}
                type="button"
                onClick={() => sendMessage(starterPrompt)}
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Lightbulb className="h-3 w-3" />
                {starterPrompt}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ask for a habit suggestion..."
              className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={!prompt.trim()}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl gradient-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HabitCoach;
