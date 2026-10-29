export default function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div className="animate-blob absolute -left-40 -top-48 h-[38rem] w-[38rem] rounded-full bg-primary/10 blur-3xl dark:bg-primary/10" />
      <div
        className="animate-blob absolute -right-52 top-24 h-[34rem] w-[34rem] rounded-full bg-streak/10 blur-3xl dark:bg-streak/10"
        style={{ animationDelay: "-7s" }}
      />
      <div
        className="animate-blob absolute -bottom-56 left-1/3 h-[30rem] w-[30rem] rounded-full bg-xp/10 blur-3xl dark:bg-xp/10"
        style={{ animationDelay: "-13s" }}
      />
      <div className="mesh-grid absolute inset-0 opacity-70" />
      <div className="grain absolute inset-0" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
