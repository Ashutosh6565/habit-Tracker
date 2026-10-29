import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Flame, Zap, Star, Shield, Crown, Award, Target,
  Gamepad2, Dice1, Swords, Heart, Timer, Brain, Puzzle,
  Rocket, Medal, Gift, Lock, Unlock, ChevronRight, Sparkles,
  Mountain, Compass, Gem, Clock, Eye, Dumbbell
} from "lucide-react";
import Navbar from "@/components/Navbar";
import ProgressBar from "@/components/ProgressBar";
import AchievementBadge from "@/components/AchievementBadge";
import {
  api,
  getApiErrorMessage,
  type GamificationOverviewDto,
  type LeaderboardEntryDto,
} from "@/lib/api";
import { LEVEL_MILESTONES, levelName } from "@/lib/gamification";

const achievementIcons: Record<string, typeof Target> = {
  first_step: Target,
  week_warrior: Flame,
  month_master: Shield,
  century_club: Star,
  early_bird: Award,
  champion: Crown,
  night_owl: Eye,
  iron_will: Dumbbell,
  explorer: Compass,
  diamond_habit: Gem,
  speed_demon: Clock,
  summit: Mountain,
};

const challengeIcons: Record<string, typeof Target> = {
  habits_5: Target,
  keep_streak: Flame,
  games_2: Gamepad2,
  note_today: Heart,
};

interface MiniGame {
  id: string;
  name: string;
  description: string;
  icon: typeof Gamepad2;
  xpReward: number;
  difficulty: "Easy" | "Medium" | "Hard";
  color: string;
  type: "click" | "memory" | "quiz" | "reflex" | "streak" | "count" | "pattern" | "speed" | "focus" | "balance";
}

const miniGames: MiniGame[] = [
  { id: "tap_frenzy", name: "Tap Frenzy", description: "Tap as fast as you can in 10 seconds", icon: Zap, xpReward: 15, difficulty: "Easy", color: "from-yellow-500 to-orange-500", type: "click" },
  { id: "memory_match", name: "Memory Match", description: "Match habit icons from memory", icon: Brain, xpReward: 30, difficulty: "Medium", color: "from-purple-500 to-pink-500", type: "memory" },
  { id: "habit_quiz", name: "Habit Quiz", description: "Answer questions about good habits", icon: Puzzle, xpReward: 25, difficulty: "Medium", color: "from-blue-500 to-cyan-500", type: "quiz" },
  { id: "reflex_rush", name: "Reflex Rush", description: "Click the target when it appears", icon: Target, xpReward: 20, difficulty: "Easy", color: "from-green-500 to-emerald-500", type: "reflex" },
  { id: "streak_saver", name: "Streak Saver", description: "Keep your streak alive by clicking in time", icon: Flame, xpReward: 35, difficulty: "Hard", color: "from-red-500 to-orange-500", type: "streak" },
  { id: "count_master", name: "Count Master", description: "Count items accurately under pressure", icon: Dice1, xpReward: 20, difficulty: "Medium", color: "from-indigo-500 to-blue-500", type: "count" },
  { id: "pattern_pro", name: "Pattern Pro", description: "Repeat the pattern sequence correctly", icon: Sparkles, xpReward: 40, difficulty: "Hard", color: "from-pink-500 to-rose-500", type: "pattern" },
  { id: "speed_sort", name: "Speed Sort", description: "Sort habits into categories quickly", icon: Rocket, xpReward: 25, difficulty: "Medium", color: "from-teal-500 to-green-500", type: "speed" },
  { id: "focus_zone", name: "Focus Zone", description: "Stay focused and avoid distractions", icon: Eye, xpReward: 30, difficulty: "Hard", color: "from-amber-500 to-yellow-500", type: "focus" },
  { id: "balance_beam", name: "Balance Beam", description: "Balance your habits for maximum XP", icon: Swords, xpReward: 45, difficulty: "Hard", color: "from-violet-500 to-purple-500", type: "balance" },
];

// Mini game components
const TapFrenzyGame = ({ onComplete }: { onComplete: (xp: number) => void }) => {
  const [taps, setTaps] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const startGame = () => {
    setStarted(true);
    setTaps(0);
    setFinished(false);
    setTimeLeft(10);
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  return (
    <div className="text-center space-y-4">
      {!started ? (
        <button onClick={startGame} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-colors">
          Start Tapping!
        </button>
      ) : finished ? (
        <div>
          <div className="text-4xl font-display font-bold text-foreground mb-2">{taps} Taps!</div>
          <p className="text-muted-foreground mb-4">{taps >= 30 ? "🔥 Amazing!" : taps >= 20 ? "👏 Great job!" : "Keep practicing!"}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { onComplete(taps >= 30 ? 15 : taps >= 20 ? 10 : 5); }} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold">
              Claim {taps >= 30 ? 15 : taps >= 20 ? 10 : 5} XP
            </button>
            <button onClick={startGame} className="px-4 py-2 rounded-lg bg-secondary text-foreground font-semibold">
              Retry
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="text-5xl font-display font-bold text-primary mb-2">{timeLeft}s</div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setTaps((t) => t + 1)}
            className="w-32 h-32 rounded-full bg-primary text-primary-foreground font-bold text-2xl mx-auto shadow-lg hover:shadow-xl transition-shadow"
          >
            {taps}
          </motion.button>
        </div>
      )}
    </div>
  );
};

const QuizGame = ({ onComplete }: { onComplete: (xp: number) => void }) => {
  const questions = [
    { q: "How many days make a habit?", options: ["7", "21", "30", "90"], answer: 1 },
    { q: "Best time for morning habits?", options: ["5 AM", "6 AM", "8 AM", "10 AM"], answer: 1 },
    { q: "What breaks a streak?", options: ["Resting", "Skipping a day", "Sleeping late", "Exercise"], answer: 1 },
  ];
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const handleAnswer = (i: number) => {
    const correct = i === questions[qi].answer;
    if (correct) setScore((s) => s + 1);
    if (qi + 1 >= questions.length) {
      setDone(true);
    } else {
      setQi((q) => q + 1);
    }
  };

  if (done) {
    const xp = score * 10;
    return (
      <div className="text-center space-y-4">
        <div className="text-3xl font-display font-bold text-foreground">{score}/{questions.length} Correct!</div>
        <button onClick={() => onComplete(xp)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold">
          Claim {xp} XP
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Question {qi + 1}/{questions.length}</p>
      <h4 className="font-display font-bold text-lg text-foreground">{questions[qi].q}</h4>
      <div className="grid grid-cols-2 gap-3">
        {questions[qi].options.map((opt, i) => (
          <button key={i} onClick={() => handleAnswer(i)} className="px-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground font-medium hover:bg-primary/10 hover:border-primary/30 transition-all">
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

const ReflexGame = ({ onComplete }: { onComplete: (xp: number) => void }) => {
  const [phase, setPhase] = useState<"wait" | "ready" | "go" | "done">("wait");
  const [reactionTime, setReactionTime] = useState(0);
  const [startTime, setStartTime] = useState(0);

  const start = () => {
    setPhase("ready");
    const delay = 1500 + Math.random() * 3000;
    setTimeout(() => {
      setPhase("go");
      setStartTime(Date.now());
    }, delay);
  };

  const click = () => {
    if (phase === "go") {
      const rt = Date.now() - startTime;
      setReactionTime(rt);
      setPhase("done");
    }
  };

  return (
    <div className="text-center space-y-4">
      {phase === "wait" && (
        <button onClick={start} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold">Start</button>
      )}
      {phase === "ready" && (
        <div className="w-32 h-32 rounded-full bg-destructive/20 mx-auto flex items-center justify-center">
          <span className="text-destructive font-bold">Wait...</span>
        </div>
      )}
      {phase === "go" && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-32 h-32 rounded-full bg-green-500 mx-auto flex items-center justify-center cursor-pointer"
          onClick={click}
        >
          <span className="text-white font-bold text-lg">TAP!</span>
        </motion.div>
      )}
      {phase === "done" && (
        <div>
          <div className="text-3xl font-display font-bold text-foreground">{reactionTime}ms</div>
          <p className="text-muted-foreground">{reactionTime < 300 ? "⚡ Lightning fast!" : reactionTime < 500 ? "👍 Nice!" : "Keep practicing!"}</p>
          <div className="flex gap-3 justify-center mt-4">
            <button onClick={() => onComplete(reactionTime < 300 ? 20 : 10)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold">
              Claim {reactionTime < 300 ? 20 : 10} XP
            </button>
            <button onClick={() => { setPhase("wait"); }} className="px-4 py-2 rounded-lg bg-secondary text-foreground font-semibold">Retry</button>
          </div>
        </div>
      )}
    </div>
  );
};

const GenericGame = ({ game, onComplete }: { game: MiniGame; onComplete: (xp: number) => void }) => {
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [done, setDone] = useState(false);

  const play = () => {
    setPlaying(true);
    setScore(0);
    setClicks(0);
    setDone(false);
    setTimeout(() => {
      setDone(true);
      setScore(Math.floor(Math.random() * 3) + 1);
    }, 5000);
  };

  if (done) {
    const xp = score * Math.floor(game.xpReward / 3);
    return (
      <div className="text-center space-y-4">
        <div className="text-3xl font-display font-bold text-foreground">Score: {score + clicks}</div>
        <p className="text-muted-foreground">
          {score + clicks >= 5 ? "🏆 Excellent!" : "Good effort!"}
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => onComplete(xp)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold">
            Claim {xp} XP
          </button>
          <button onClick={play} className="px-4 py-2 rounded-lg bg-secondary text-foreground font-semibold">Retry</button>
        </div>
      </div>
    );
  }

  if (!playing) {
    return (
      <div className="text-center">
        <button onClick={play} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold">Play Now</button>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <div className="text-sm text-muted-foreground">Playing... tap the targets!</div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.8 }}
            onClick={() => setClicks((c) => c + 1)}
            className="w-16 h-16 rounded-xl bg-primary/10 hover:bg-primary/30 border border-border mx-auto flex items-center justify-center transition-colors"
          >
            <Sparkles className="w-5 h-5 text-primary" />
          </motion.button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Taps: {clicks}</p>
    </div>
  );
};

const Gamification = () => {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "games" | "achievements" | "leaderboard">("overview");
  const [overview, setOverview] = useState<GamificationOverviewDto | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryDto[]>([]);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      setOverview(await api.gamification.overview());
    } catch (error) {
      setClaimMessage(getApiErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (activeTab !== "leaderboard") return;
    let cancelled = false;
    api.gamification
      .leaderboard()
      .then(({ entries }) => {
        if (!cancelled) setLeaderboard(entries);
      })
      .catch(() => {
        if (!cancelled) setLeaderboard([]);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const handleGameComplete = async () => {
    if (!activeGame) return;
    try {
      const result = await api.gamification.claimGame(activeGame);
      setClaimMessage(`+${result.xpEarned} XP claimed!`);
      await loadOverview();
    } catch (error) {
      setClaimMessage(getApiErrorMessage(error));
    } finally {
      setActiveGame(null);
    }
  };

  const stats = overview?.stats;
  const achievements = overview?.achievements ?? [];
  const dailyChallenges = overview?.challenges ?? [];
  const gameStatus = new Map((overview?.games ?? []).map((game) => [game.id, game]));
  const totalXP = stats?.totalXP ?? 0;
  const currentLevel = stats?.level ?? 1;
  const xpIntoLevel = stats?.xpIntoLevel ?? 0;
  const xpForNextLevel = stats?.xpForNextLevel ?? 100;
  const bestStreak = stats?.bestStreak ?? 0;
  const weeklyCompleted = stats?.weeklyCompleted ?? 0;
  const unlockedBadges = achievements.filter((a) => a.unlocked).length;

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: Zap },
    { id: "games" as const, label: "Mini Games", icon: Gamepad2 },
    { id: "achievements" as const, label: "Achievements", icon: Award },
    { id: "leaderboard" as const, label: "Leaderboard", icon: Trophy },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">Gamification</h1>
            <p className="text-muted-foreground">Earn XP, play games, level up, and unlock achievements.</p>
            {claimMessage && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                {claimMessage}
              </motion.div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {/* Current Status */}
                <div className="bg-card border border-border rounded-2xl p-8 mb-8 text-center">
                  <div className="w-20 h-20 rounded-2xl gradient-xp mx-auto mb-4 flex items-center justify-center">
                    <Zap className="w-10 h-10 text-xp-foreground" />
                  </div>
                  <h2 className="font-display font-bold text-2xl text-foreground">Level {currentLevel}</h2>
                  <p className="text-muted-foreground mb-4">{levelName(currentLevel)}</p>
                  <div className="max-w-md mx-auto">
                    <ProgressBar
                      value={xpIntoLevel}
                      max={xpForNextLevel}
                      label={`Level ${currentLevel} · ${xpIntoLevel}/${xpForNextLevel} XP`}
                      variant="xp"
                    />
                  </div>
                  <div className="mt-6 flex justify-center gap-8 flex-wrap">
                    <div>
                      <div className="text-2xl font-display font-bold text-foreground">{totalXP}</div>
                      <div className="text-xs text-muted-foreground">Total XP</div>
                    </div>
                    <div>
                      <div className="text-2xl font-display font-bold text-streak">{bestStreak}</div>
                      <div className="text-xs text-muted-foreground">Day Streak</div>
                    </div>
                    <div>
                      <div className="text-2xl font-display font-bold text-foreground">{weeklyCompleted}</div>
                      <div className="text-xs text-muted-foreground">Habits Done</div>
                    </div>
                    <div>
                      <div className="text-2xl font-display font-bold text-primary">{unlockedBadges}</div>
                      <div className="text-xs text-muted-foreground">Badges</div>
                    </div>
                  </div>
                </div>

                {/* Daily Challenges */}
                <div className="bg-card border border-border rounded-2xl p-6 mb-8">
                  <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Timer className="w-5 h-5 text-primary" /> Daily Challenges
                  </h3>
                  <div className="space-y-3">
                    {dailyChallenges.map((c) => {
                      const ChallengeIcon = challengeIcons[c.id] ?? Target;
                      return (
                        <div key={c.id} className="flex items-center gap-4 py-3 px-4 rounded-xl bg-secondary/30 border border-border">
                          <ChallengeIcon className="w-5 h-5 text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{c.title}</p>
                            <div className="h-1.5 rounded-full bg-secondary mt-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${Math.min(100, (c.progress / c.target) * 100)}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-muted-foreground">
                            {c.progress}/{c.target}
                          </span>
                          <span className="text-xs font-semibold text-xp">
                            {c.claimed ? "Claimed" : `+${c.xpReward} XP`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* XP Rewards & Levels side by side */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-xp" /> XP Rewards
                    </h3>
                    <div className="space-y-2">
                      {[
                        { action: "Complete a habit", xp: "+10 XP" },
                        { action: "7-Day Streak", xp: "+50 XP" },
                        { action: "14-Day Streak", xp: "+100 XP" },
                        { action: "30-Day Streak", xp: "+200 XP" },
                        { action: "Complete all daily habits", xp: "+25 XP" },
                        { action: "Win a mini game", xp: "+15-45 XP" },
                        { action: "Complete daily challenge", xp: "+10-30 XP" },
                        { action: "Invite a friend", xp: "+100 XP" },
                      ].map((r) => (
                        <div key={r.action} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <span className="text-sm text-muted-foreground">{r.action}</span>
                          <span className="text-sm font-semibold text-xp">{r.xp}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-streak" /> Levels
                    </h3>
                    <div className="space-y-2">
                      {LEVEL_MILESTONES.map((l) => (
                        <div key={l.level} className={`flex items-center justify-between py-2 px-3 rounded-lg ${l.level <= currentLevel ? "bg-primary/5" : ""}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${l.level <= currentLevel ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                              {l.level}
                            </div>
                            <span className={`text-sm font-medium ${l.level <= currentLevel ? "text-foreground" : "text-muted-foreground"}`}>{l.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {l.level <= currentLevel ? "Unlocked" : "Locked"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* GAMES TAB */}
            {activeTab === "games" && (
              <motion.div key="games" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {activeGame ? (
                  <div className="bg-card border border-border rounded-2xl p-8 mb-8">
                    <button onClick={() => setActiveGame(null)} className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">
                      ← Back to games
                    </button>
                    <h3 className="font-display font-bold text-xl text-foreground mb-6 text-center">
                      {miniGames.find((g) => g.id === activeGame)?.name}
                    </h3>
                    {activeGame === "tap_frenzy" && <TapFrenzyGame onComplete={handleGameComplete} />}
                    {activeGame === "habit_quiz" && <QuizGame onComplete={handleGameComplete} />}
                    {activeGame === "reflex_rush" && <ReflexGame onComplete={handleGameComplete} />}
                    {!["tap_frenzy", "habit_quiz", "reflex_rush"].includes(activeGame) && (
                      <GenericGame game={miniGames.find((g) => g.id === activeGame)!} onComplete={handleGameComplete} />
                    )}
                  </div>
                ) : (
                  <>
                    <h3 className="font-display font-semibold text-foreground mb-6 flex items-center gap-2 text-lg">
                      <Gamepad2 className="w-6 h-6 text-primary" /> Mini Games — Earn XP while having fun!
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {miniGames.map((game, i) => (
                        <motion.div
                          key={game.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          whileHover={{ scale: 1.03, y: -4 }}
                          onClick={() => setActiveGame(game.id)}
                          className="bg-card border border-border rounded-2xl p-5 cursor-pointer hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all"
                        >
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-3`}>
                            <game.icon className="w-6 h-6 text-white" />
                          </div>
                          <h4 className="font-display font-semibold text-foreground text-sm">{game.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{game.description}</p>
                          <div className="flex items-center justify-between mt-3">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              game.difficulty === "Easy" ? "bg-green-500/10 text-green-500" :
                              game.difficulty === "Medium" ? "bg-yellow-500/10 text-yellow-500" :
                              "bg-red-500/10 text-red-500"
                            }`}>{game.difficulty}</span>
                            <span className="text-xs font-semibold text-xp">
                              {gameStatus.get(game.id)?.claimedToday
                                ? "Claimed today"
                                : `+${gameStatus.get(game.id)?.xpReward ?? game.xpReward} XP`}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ACHIEVEMENTS TAB */}
            {activeTab === "achievements" && (
              <motion.div key="achievements" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h3 className="font-display font-semibold text-foreground mb-6 flex items-center gap-2 text-lg">
                  <Award className="w-6 h-6 text-primary" /> Achievements ({unlockedBadges}/{achievements.length} Unlocked)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {achievements.map((a) => (
                    <AchievementBadge
                      key={a.id}
                      title={a.title}
                      description={a.description}
                      icon={achievementIcons[a.id] ?? Award}
                      unlocked={a.unlocked}
                      xpReward={a.xpReward}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* LEADERBOARD TAB */}
            {activeTab === "leaderboard" && (
              <motion.div key="leaderboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="font-display font-semibold text-foreground mb-6 flex items-center gap-2 text-lg">
                    <Trophy className="w-6 h-6 text-streak" /> Global Leaderboard
                  </h3>
                  <div className="space-y-2">
                    {leaderboard.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No XP on the board yet. Complete habits to claim the first spot.
                      </p>
                    ) : (
                      leaderboard.map((p) => (
                        <div key={p.userId} className={`flex items-center gap-4 py-3 px-4 rounded-xl transition-all ${
                          p.isCurrentUser ? "bg-primary/10 border border-primary/30" : "bg-secondary/30"
                        }`}>
                          <span className="text-lg font-bold text-muted-foreground w-8">
                            {p.rank === 1 ? "👑" : p.rank === 2 ? "🥈" : p.rank === 3 ? "🥉" : `#${p.rank}`}
                          </span>
                          <div className="flex-1">
                            <span className={`font-semibold text-sm ${p.isCurrentUser ? "text-primary" : "text-foreground"}`}>
                              {p.isCurrentUser ? "You" : p.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Flame className="w-3.5 h-3.5 text-streak" /> {p.streak}d
                          </div>
                          <span className="text-sm font-bold text-xp">{p.xp.toLocaleString()} XP</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Gamification;
