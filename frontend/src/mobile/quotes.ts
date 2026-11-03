export type DisciplineQuote = {
  text: string;
  author: string;
  why: string;
};

export const DISCIPLINE_QUOTES: DisciplineQuote[] = [
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn", why: "It turns a plan you like into a life you live." },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln", why: "Every small no protects a bigger yes." },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear", why: "Routine beats motivation on hard days." },
  { text: "Every action you take is a vote for the person you wish to become.", author: "James Clear", why: "Identity is built one check-in at a time." },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant", why: "Repeatable effort beats rare brilliance." },
  { text: "Discipline equals freedom.", author: "Jocko Willink", why: "Structure removes the daily negotiation with yourself." },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle", why: "Standards live in your routine, not your intentions." },
  { text: "Mastering others is strength. Mastering yourself is true power.", author: "Lao Tzu", why: "Self-control is the skill behind every other skill." },
  { text: "He who conquers himself is the mightiest warrior.", author: "Confucius", why: "The hardest opponent is the one who wants to skip today." },
  { text: "Rule your mind or it will rule you.", author: "Horace", why: "Attention follows whatever you train it to." },
  { text: "The first and greatest victory is to conquer yourself.", author: "Plato", why: "Discipline is a private win before it is a public one." },
  { text: "It's not what we do once in a while that shapes our lives. It's what we do consistently.", author: "Tony Robbins", why: "Consistency compounds; intensity fades." },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier", why: "Tiny actions stack into visible change." },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain", why: "Momentum begins with the first block, not the perfect plan." },
  { text: "Nothing will work unless you do.", author: "Maya Angelou", why: "Tools only amplify the effort you bring." },
  { text: "Don't count the days. Make the days count.", author: "Muhammad Ali", why: "A tracked day is a day you can improve." },
  { text: "Great things are done by a series of small things brought together.", author: "Vincent van Gogh", why: "Big goals are assembled from ordinary days." },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese proverb", why: "Starting late beats never starting." },
  { text: "Fall seven times, stand up eight.", author: "Japanese proverb", why: "Resilience is discipline's second half." },
  { text: "A river cuts through rock not because of its power but because of its persistence.", author: "James N. Watkins", why: "Steady repetition outlasts bursts of effort." },
  { text: "There are no shortcuts to any place worth going.", author: "Beverly Sills", why: "Shortcuts trade today's comfort for tomorrow's regret." },
  { text: "Do the hard jobs first. The easy jobs will take care of themselves.", author: "Dale Carnegie", why: "Front-loading hard work protects your evening." },
  { text: "The successful warrior is the average person with laser-like focus.", author: "Bruce Lee", why: "Focus is discipline aimed at one target." },
  { text: "You can't build a reputation on what you are going to do.", author: "Henry Ford", why: "Proof comes from finished blocks, not intentions." },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe", why: "Imperfect action still builds a streak." },
  { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery", why: "Today's choices are a gift to next month's you." },
  { text: "The difference between who you are and who you want to be is what you do.", author: "Bill Phillips", why: "Behaviour is the bridge between self and goal." },
  { text: "What we do every day matters more than what we do once in a while.", author: "Gretchen Rubin", why: "Daily rituals shape identity faster than rare wins." },
  { text: "Motivation gets you going, but discipline keeps you growing.", author: "John C. Maxwell", why: "Feelings start the engine; habits steer it." },
  { text: "Suffer the pain of discipline or suffer the pain of regret.", author: "Jim Rohn", why: "One pain is chosen; the other is assigned." },
  { text: "You will never always be motivated. You must learn to be disciplined.", author: "Anonymous", why: "Systems work on days when enthusiasm doesn't." },
  { text: "Consistency is what transforms average into excellence.", author: "Anonymous", why: "The ordinary, repeated, becomes exceptional." },
  { text: "Discipline is doing what needs to be done, even if you don't want to do it.", author: "Anonymous", why: "Action first; motivation catches up later." },
  { text: "Self-discipline is the magic power that makes you virtually unstoppable.", author: "Dan Kennedy", why: "It removes the need to feel ready." },
  { text: "Discipline is the soul of an army.", author: "George Washington", why: "Order turns scattered effort into progress." },
  { text: "Small deeds done are better than great deeds planned.", author: "Peter Marshall", why: "Completed beats ambitious on paper." },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki", why: "Tomorrow is a promise; today is a ledger." },
  { text: "Motivation may start the journey, but discipline carries you to the finish.", author: "Anonymous", why: "Finish lines are reached by routine." },
  { text: "If you don't make time for your wellness, you will be forced to make time for your illness.", author: "Anonymous", why: "Health routines are preventive discipline." },
  { text: "Well done is better than well said.", author: "Benjamin Franklin", why: "Results speak louder than plans." },
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca", why: "Protecting time is protecting your future." },
  { text: "You have power over your mind, not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius", why: "Focus on the next rep, not the noise." },
  { text: "No man is free who is not master of himself.", author: "Epictetus", why: "Self-command is the first freedom." },
];

const dayNumber = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
};

export const quoteForDay = (iso: string, offset = 0): DisciplineQuote => {
  const size = DISCIPLINE_QUOTES.length;
  const index = (((dayNumber(iso) + offset) % size) + size) % size;
  return DISCIPLINE_QUOTES[index];
};
