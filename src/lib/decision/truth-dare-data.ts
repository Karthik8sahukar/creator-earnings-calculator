/**
 * Truth or Dare structured data source.
 * Questions and dares organized by category and difficulty.
 */

export type TDMode = "truth" | "dare" | "random";
export type TDDifficulty = "easy" | "medium" | "hard" | "extreme";
export type TDCategory =
  | "friends"
  | "family"
  | "kids"
  | "couples"
  | "party"
  | "office"
  | "school"
  | "funny"
  | "clean";

export interface TDItem {
  id: string;
  type: "truth" | "dare";
  text: string;
  difficulty: TDDifficulty;
  categories: TDCategory[];
}

export const CATEGORIES: { value: TDCategory; label: string }[] = [
  { value: "friends", label: "Friends" },
  { value: "family", label: "Family" },
  { value: "kids", label: "Kids" },
  { value: "couples", label: "Couples" },
  { value: "party", label: "Party" },
  { value: "office", label: "Office" },
  { value: "school", label: "School" },
  { value: "funny", label: "Funny" },
  { value: "clean", label: "Clean" },
];

export const DIFFICULTIES: { value: TDDifficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "extreme", label: "Extreme" },
];

const ALL_ITEMS: TDItem[] = [
  // ─── TRUTHS ─────────────────────────────────────────
  { id: "t1", type: "truth", text: "What is your favorite movie of all time?", difficulty: "easy", categories: ["friends", "family", "clean", "kids"] },
  { id: "t2", type: "truth", text: "What is the last lie you told?", difficulty: "easy", categories: ["friends", "party", "funny"] },
  { id: "t3", type: "truth", text: "What is your biggest pet peeve?", difficulty: "easy", categories: ["friends", "office", "school", "clean"] },
  { id: "t4", type: "truth", text: "What is the most embarrassing song on your playlist?", difficulty: "easy", categories: ["friends", "party", "funny", "school"] },
  { id: "t5", type: "truth", text: "If you could have any superpower, what would it be?", difficulty: "easy", categories: ["kids", "family", "clean", "friends"] },
  { id: "t6", type: "truth", text: "What is your guilty pleasure food?", difficulty: "easy", categories: ["friends", "family", "clean", "office"] },
  { id: "t7", type: "truth", text: "What was the last thing you searched on your phone?", difficulty: "easy", categories: ["friends", "party", "funny"] },
  { id: "t8", type: "truth", text: "What is your hidden talent?", difficulty: "easy", categories: ["friends", "family", "kids", "clean", "school"] },
  { id: "t9", type: "truth", text: "Who is your celebrity crush?", difficulty: "easy", categories: ["friends", "party", "school"] },
  { id: "t10", type: "truth", text: "What is the nicest thing someone has done for you?", difficulty: "easy", categories: ["family", "friends", "clean"] },
  { id: "t11", type: "truth", text: "Have you ever pretended to be sick to skip work or school?", difficulty: "medium", categories: ["friends", "office", "school", "funny"] },
  { id: "t12", type: "truth", text: "What is the most trouble you have ever been in?", difficulty: "medium", categories: ["friends", "party", "school"] },
  { id: "t13", type: "truth", text: "What is your biggest fear that you have never told anyone?", difficulty: "medium", categories: ["friends", "couples", "family"] },
  { id: "t14", type: "truth", text: "Have you ever snooped through someone else's phone?", difficulty: "medium", categories: ["friends", "party", "couples"] },
  { id: "t15", type: "truth", text: "What is the worst date you have ever been on?", difficulty: "medium", categories: ["friends", "party", "couples"] },
  { id: "t16", type: "truth", text: "What is the most childish thing you still do?", difficulty: "medium", categories: ["friends", "family", "funny", "clean"] },
  { id: "t17", type: "truth", text: "Who in this room would you least want to be stranded on an island with?", difficulty: "medium", categories: ["friends", "party", "funny"] },
  { id: "t18", type: "truth", text: "What is the weirdest dream you have ever had?", difficulty: "medium", categories: ["friends", "family", "funny", "clean"] },
  { id: "t19", type: "truth", text: "Have you ever cheated on a test?", difficulty: "medium", categories: ["school", "friends"] },
  { id: "t20", type: "truth", text: "What is the longest you have gone without showering?", difficulty: "medium", categories: ["friends", "party", "funny"] },
  { id: "t21", type: "truth", text: "What is the most embarrassing thing you have done in public?", difficulty: "hard", categories: ["friends", "party", "funny"] },
  { id: "t22", type: "truth", text: "What is a secret you have kept from your best friend?", difficulty: "hard", categories: ["friends", "couples"] },
  { id: "t23", type: "truth", text: "What is the pettiest reason you stopped talking to someone?", difficulty: "hard", categories: ["friends", "party"] },
  { id: "t24", type: "truth", text: "If you could switch lives with someone in this room, who?", difficulty: "hard", categories: ["friends", "office", "party"] },
  { id: "t25", type: "truth", text: "What is one thing about you people would be surprised to learn?", difficulty: "hard", categories: ["friends", "office", "couples"] },
  { id: "t26", type: "truth", text: "Have you ever blamed someone else for something you did?", difficulty: "hard", categories: ["friends", "school", "office"] },
  { id: "t27", type: "truth", text: "What is the craziest thing you have done for love?", difficulty: "extreme", categories: ["couples", "party", "friends"] },
  { id: "t28", type: "truth", text: "What is your most unpopular opinion?", difficulty: "extreme", categories: ["friends", "party", "office"] },
  { id: "t29", type: "truth", text: "What is the biggest mistake you have never apologized for?", difficulty: "extreme", categories: ["friends", "couples"] },
  { id: "t30", type: "truth", text: "If you had to delete all but three apps, which would you keep?", difficulty: "easy", categories: ["friends", "kids", "school", "clean"] },
  // ─── DARES ──────────────────────────────────────────
  { id: "d1", type: "dare", text: "Do your best impression of a celebrity.", difficulty: "easy", categories: ["friends", "family", "kids", "funny", "clean"] },
  { id: "d2", type: "dare", text: "Sing the chorus of your favorite song.", difficulty: "easy", categories: ["friends", "party", "kids", "funny", "clean"] },
  { id: "d3", type: "dare", text: "Show the last photo in your camera roll.", difficulty: "easy", categories: ["friends", "party", "funny"] },
  { id: "d4", type: "dare", text: "Do 10 pushups right now.", difficulty: "easy", categories: ["friends", "family", "kids", "school", "clean"] },
  { id: "d5", type: "dare", text: "Speak in an accent for the next 3 rounds.", difficulty: "easy", categories: ["friends", "party", "funny", "clean"] },
  { id: "d6", type: "dare", text: "Let someone draw on your face with a washable marker.", difficulty: "easy", categories: ["kids", "family", "funny", "clean"] },
  { id: "d7", type: "dare", text: "Do a silly dance for 30 seconds.", difficulty: "easy", categories: ["friends", "party", "kids", "funny", "clean"] },
  { id: "d8", type: "dare", text: "Send a funny selfie to the last person in your chat list.", difficulty: "medium", categories: ["friends", "party", "funny"] },
  { id: "d9", type: "dare", text: "Talk without closing your mouth for one minute.", difficulty: "medium", categories: ["friends", "party", "funny", "school"] },
  { id: "d10", type: "dare", text: "Let the group pick a song and you have to dance to it.", difficulty: "medium", categories: ["friends", "party", "funny"] },
  { id: "d11", type: "dare", text: "Post an embarrassing status on social media (delete after 5 min).", difficulty: "medium", categories: ["friends", "party"] },
  { id: "d12", type: "dare", text: "Call a random contact and sing happy birthday.", difficulty: "medium", categories: ["friends", "party", "funny"] },
  { id: "d13", type: "dare", text: "Act like a robot for the next 5 minutes.", difficulty: "medium", categories: ["friends", "kids", "funny", "school", "clean"] },
  { id: "d14", type: "dare", text: "Let someone style your hair however they want.", difficulty: "medium", categories: ["friends", "party", "funny"] },
  { id: "d15", type: "dare", text: "Do a handstand (or attempt one) against a wall.", difficulty: "hard", categories: ["friends", "party", "school"] },
  { id: "d16", type: "dare", text: "Eat a spoonful of a condiment chosen by the group.", difficulty: "hard", categories: ["friends", "party", "funny"] },
  { id: "d17", type: "dare", text: "Let someone go through your phone for 30 seconds.", difficulty: "hard", categories: ["friends", "party", "couples"] },
  { id: "d18", type: "dare", text: "Do your best catwalk across the room.", difficulty: "hard", categories: ["friends", "party", "funny", "office"] },
  { id: "d19", type: "dare", text: "Say yes to everything for the next 10 minutes.", difficulty: "extreme", categories: ["friends", "party"] },
  { id: "d20", type: "dare", text: "Let the group compose and send a text from your phone.", difficulty: "extreme", categories: ["friends", "party"] },
  { id: "d21", type: "dare", text: "Tell a joke and make everyone laugh within 30 seconds.", difficulty: "easy", categories: ["friends", "family", "kids", "clean", "office"] },
  { id: "d22", type: "dare", text: "Draw a self-portrait blindfolded.", difficulty: "easy", categories: ["kids", "family", "school", "clean", "funny"] },
  { id: "d23", type: "dare", text: "Stack 5 objects on top of each other without them falling.", difficulty: "medium", categories: ["kids", "family", "school", "clean"] },
  { id: "d24", type: "dare", text: "Give a motivational speech about a pencil.", difficulty: "medium", categories: ["office", "school", "funny", "clean"] },
  { id: "d25", type: "dare", text: "Pretend to be a waiter and take everyone's order.", difficulty: "easy", categories: ["kids", "family", "funny", "clean"] },
  { id: "d26", type: "dare", text: "Hold a plank for as long as you can.", difficulty: "hard", categories: ["friends", "school", "office"] },
  { id: "d27", type: "dare", text: "Compliment every person in the room sincerely.", difficulty: "medium", categories: ["friends", "family", "office", "clean", "couples"] },
  { id: "d28", type: "dare", text: "Speak only in questions for the next 3 rounds.", difficulty: "hard", categories: ["friends", "party", "funny", "school"] },
  { id: "d29", type: "dare", text: "Do an interpretive dance of your morning routine.", difficulty: "hard", categories: ["friends", "party", "funny"] },
  { id: "d30", type: "dare", text: "Let someone tickle you for 15 seconds without moving.", difficulty: "extreme", categories: ["friends", "family", "funny"] },
];

/**
 * Get filtered items based on mode, difficulty, and category.
 * Returns items that match ALL specified filters.
 */
export function getFilteredItems(
  mode: TDMode,
  difficulty?: TDDifficulty,
  category?: TDCategory,
): TDItem[] {
  let items = ALL_ITEMS;

  if (mode !== "random") {
    items = items.filter((item) => item.type === mode);
  }

  if (difficulty) {
    items = items.filter((item) => item.difficulty === difficulty);
  }

  if (category) {
    items = items.filter((item) => item.categories.includes(category));
  }

  return items;
}

/** Total count of items available. */
export const TOTAL_ITEMS = ALL_ITEMS.length;
