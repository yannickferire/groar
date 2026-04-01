import type { MetricType } from "@/components/editor/types";

// ─── Types ──────────────────────────────────────────────────────────

export type MilestoneCategory = "followers" | "mrr" | "revenue" | "github-stars" | "customers";

export type MilestonePageData = {
  slug: string;
  category: MilestoneCategory;
  metricType: MetricType;
  value: number;
  displayValue: string;
  shortValue: string;

  // SEO
  title: string;
  description: string;
  keywords: string[];

  // Content
  headline: string;
  intro: string;
  whatItMeans: string;
  tips: string[];
  captionIdeas: string[];
  faqs: { question: string; answer: string }[];

  // Card styling per category
  cardParams: { bg: string; color: string; font: string; emoji: string; emojiCount: number };

  // Internal linking
  relatedSlugs: string[];
};

// ─── Helpers ────────────────────────────────────────────────────────

// Background rotation: each milestone gets a unique bg + matching text color
const BG_STYLES: { bg: string; color: string }[] = [
  { bg: "noisy-lights", color: "#f0e6ff" },
  { bg: "northern-lights", color: "#d4ffd6" },
  { bg: "tokyo-streets", color: "#ffd6e8" },
  { bg: "bled-lakes", color: "#d6ecff" },
  { bg: "orangeblue", color: "#ffe0c2" },
  { bg: "premium-darkbg-01", color: "#e0e0e0" },
  { bg: "premium-darkbg-02", color: "#d6ecff" },
  { bg: "premium-darkbg-03", color: "#f0e6ff" },
  { bg: "premium-darkbg-04", color: "#ffd6e8" },
  { bg: "premium-darkbg-05", color: "#d4ffd6" },
  { bg: "premium-darkbg-06", color: "#ffe0c2" },
  { bg: "premium-darkbg-07", color: "#e0e0e0" },
  { bg: "premium-darkbg-08", color: "#d6ecff" },
  { bg: "premium-darkbg-09", color: "#f0e6ff" },
  { bg: "premium-fractal-background", color: "#ffd6e8" },
  { bg: "premium-lightblue", color: "#1a1a2e" },
  { bg: "premium-dark", color: "#d4ffd6" },
  { bg: "premium-pink", color: "#1a1a2e" },
];

const CATEGORY_FONTS: Record<MilestoneCategory, string> = {
  followers: "bricolage",
  mrr: "space-grotesk",
  revenue: "bricolage",
  "github-stars": "inter",
  customers: "bricolage",
};

const CATEGORY_EMOJIS: Record<MilestoneCategory, string> = {
  followers: "🚀",
  mrr: "🔥",
  revenue: "🎉",
  "github-stars": "✨",
  customers: "🎯",
};

// Deterministic bg assignment per milestone index
let _bgIndex = 0;
export function nextCardParams(category: MilestoneCategory): { bg: string; color: string; font: string; emoji: string; emojiCount: number } {
  const style = BG_STYLES[_bgIndex % BG_STYLES.length];
  _bgIndex++;
  return { bg: style.bg, color: style.color, font: CATEGORY_FONTS[category], emoji: CATEGORY_EMOJIS[category], emojiCount: 5 };
}

const CATEGORY_LABELS: Record<MilestoneCategory, string> = {
  followers: "Followers",
  mrr: "MRR",
  revenue: "Revenue",
  "github-stars": "GitHub Stars",
  customers: "Customers",
};

export { CATEGORY_LABELS };

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function short(n: number, prefix = ""): string {
  if (n >= 1_000_000) return `${prefix}${n / 1_000_000}M`;
  if (n >= 1_000) return `${prefix}${n / 1_000}K`;
  return `${prefix}${n}`;
}

// ─── Page definitions ───────────────────────────────────────────────

const FOLLOWERS: MilestonePageData[] = [
  {
    slug: "100-followers",
    category: "followers",
    metricType: "followers",
    value: 100,
    displayValue: "100",
    shortValue: "100",
    title: "100 Followers Milestone — Celebrate & Share with GROAR",
    description: "You just hit 100 followers on X! Learn how to celebrate this milestone and create a stunning visual to share with your audience.",
    keywords: ["100 followers milestone", "100 followers celebration", "100 followers post", "celebrate 100 followers on x"],
    headline: "You just hit 100 followers!",
    intro: "100 followers is where it all begins. You've moved past the noise — real people are choosing to follow your journey. This is the proof that your voice resonates.",
    whatItMeans: "Reaching 100 followers means you've built your first real audience. These aren't random accounts — they're people who saw something in your content worth following. For many creators and founders, 100 is the hardest milestone because it requires consistency without much validation. If you're here, you've already beaten the odds.",
    tips: [
      "Thank your followers publicly — a simple 'thank you' post goes a long way",
      "Share what you've learned so far in your journey",
      "Pin your best-performing post to your profile",
      "Engage with every reply — at this stage, relationships compound fast",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "100 real followers showed up on their own.\n\nNo hacks. No follow-for-follow.\n\nJust sharing what I'm learning every day.\n\nSmall audience, big gratitude 🙏\n\nWhat made YOU decide to follow?",
      "0 → 100 followers.\n\nTook me longer than most people admit.\n\n1 post/day, genuine replies, zero viral tricks.\n\n87% of my growth came from conversations, not content.\n\nThe first 100 are the hardest.\n\nHow long did it take you?",
      "Day 1: zero likes. Zero followers.\n\nDay 30: still talking to myself.\n\nDay 90: something clicked.\n\nPeople started replying. Then following.\n\nToday: 100 followers. Each one earned, not bought.\n\nThank you for being here early 🚀",
    ],
    faqs: [
      { question: "How long does it take to get 100 followers on X?", answer: "It varies widely — some accounts reach 100 followers in a week, others in months. The key factors are consistency (posting daily), engaging with others in your niche, and sharing genuinely useful or interesting content." },
      { question: "How do I celebrate reaching 100 followers?", answer: "Create a milestone visual that shows your achievement, thank your community, and share what you've learned. Tools like GROAR let you turn your 100-follower milestone into a beautiful shareable image in seconds." },
      { question: "Is 100 followers a lot on X?", answer: "100 followers is a meaningful milestone — it means real people chose to follow you. Most X accounts never reach 100 engaged followers, so this puts you ahead of the majority." },
    ],
    cardParams: nextCardParams("followers"),
    relatedSlugs: ["500-followers", "1k-followers", "100-github-stars", "10-customers"],
  },
  {
    slug: "500-followers",
    category: "followers",
    metricType: "followers",
    value: 500,
    displayValue: "500",
    shortValue: "500",
    title: "500 Followers Milestone — Create Your Milestone Visual",
    description: "Celebrate hitting 500 followers on X. Create a beautiful milestone card and share it with your growing audience.",
    keywords: ["500 followers milestone", "500 followers on x", "500 followers celebration post", "half thousand followers"],
    headline: "500 followers — halfway to your first thousand!",
    intro: "500 followers is a turning point. Your content is reaching beyond your immediate network, and the algorithm is starting to notice you. This is momentum.",
    whatItMeans: "At 500 followers, you're no longer just talking to friends — you have a genuine audience. This is often where the snowball effect begins. Your posts get more impressions, your engagement rate stabilizes, and new followers start finding you organically. Many successful creators point to the 500-mark as when things started clicking.",
    tips: [
      "Look at your analytics — which posts performed best? Double down on that format",
      "Start a recurring content series (daily tips, weekly threads, etc.)",
      "Engage with accounts slightly bigger than yours — quality interactions drive growth",
      "Share your milestone — people love rooting for creators who celebrate transparently",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "500 followers.\n\nEvery one of them came from showing up, being honest, and helping people.\n\nNot a single hack. Not a single follow-for-follow.\n\nHalfway to 1K and I'm just getting started 🚀\n\nWhat do you wish you knew before growing an audience?",
      "100 → 500 in half the time it took to get to 100.\n\nThe compound effect is real.\n\n40% from replies\n35% from threads\n25% from reposts\n\nThe algorithm rewards conversations, not broadcasts.\n\nNext stop: 1K.",
      "3 months ago I almost stopped posting.\n\n200 followers. Felt like shouting into a void.\n\nThen one thread got 50 reposts. Then another. Then the DMs started.\n\nToday: 500 followers.\n\nQuitting is the only way to fail 💪",
    ],
    faqs: [
      { question: "How do I go from 500 to 1,000 followers on X?", answer: "Focus on consistency and engagement. Post daily, reply to accounts in your niche, create threads that provide value, and share your journey authentically. The jump from 500 to 1K often happens faster than 0 to 500." },
      { question: "What should I post for my 500 followers milestone?", answer: "Share a milestone visual showing your achievement, reflect on what you've learned, and thank your community. A visual post with your milestone number gets significantly more engagement than text alone." },
      { question: "How do I create a 500 followers milestone image?", answer: "Use GROAR to create a professional milestone card in seconds. Connect your X account, select the milestone template, and your follower count is automatically imported. Export and share directly to X." },
    ],
    cardParams: nextCardParams("followers"),
    relatedSlugs: ["100-followers", "1k-followers", "500-mrr", "500-github-stars"],
  },
  {
    slug: "1k-followers",
    category: "followers",
    metricType: "followers",
    value: 1000,
    displayValue: "1,000",
    shortValue: "1K",
    title: "1,000 Followers Milestone — Share Your 1K Achievement",
    description: "You reached 1,000 followers on X! Create a stunning milestone visual and celebrate this major achievement with your community.",
    keywords: ["1000 followers milestone", "1k followers celebration", "1000 followers post", "first thousand followers", "1k followers on x"],
    headline: "1,000 followers — you've entered a new league!",
    intro: "1K followers is the milestone everyone remembers. It's the moment your account goes from 'just starting out' to 'this person is building something real.' Congratulations — you earned this.",
    whatItMeans: "Reaching 1,000 followers is one of the most celebrated milestones on X for good reason. It signals that your content consistently provides enough value for a thousand people to want more. At this level, your posts start getting meaningful impressions, brands begin to notice you, and collaboration opportunities open up. You're officially a creator.",
    tips: [
      "Create a milestone post — 1K celebrations consistently go viral",
      "Share your growth story: what worked, what didn't, and what surprised you",
      "Consider launching something (newsletter, product, community) — you have the audience now",
      "Set your next goal publicly — transparency drives accountability and engagement",
      "Thank specific people who helped you along the way",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "1,000 people chose to follow my journey.\n\nNot because of tricks or thread hacks.\n\nBecause I shared the real stuff. The wins, the failures, the ugly truths.\n\nThis milestone means more to me than I can express 🙏\n\nWhat moment made you start sharing online?",
      "0 → 1,000 followers.\n\nThe first 100 took 80% of the effort.\nThe next 900 came from compounding.\n\nMy top 3 posts drove 40% of all follower growth.\n\nConsistency > virality. Every single time.\n\n1K down. Time to level up 🚀",
      "6 months ago I tweeted into the void.\n\nNo followers. No strategy. No clue.\n\nI just kept posting. Every day.\n\nThrough zero-like posts. Through crickets in my replies.\n\nToday: 1,000 followers.\n\nShowing up beats talent.",
    ],
    faqs: [
      { question: "How long does it take to get 1,000 followers on X?", answer: "Most active creators reach 1K followers within 3-12 months of consistent posting. Accounts that post daily, engage meaningfully, and share valuable content in a specific niche tend to reach this milestone faster." },
      { question: "What happens when you reach 1,000 followers on X?", answer: "At 1K followers, you unlock more visibility from the algorithm, your posts get more impressions, and you start getting noticed by bigger accounts and brands. It's a psychological milestone too — it changes how others perceive your account." },
      { question: "How do I make a 1K followers milestone post?", answer: "Use GROAR to create a polished milestone card with your follower count. It auto-imports your metrics from X, so you just pick a template, customize the look, and export. The whole process takes under 10 seconds." },
      { question: "Is 1,000 followers good on X?", answer: "Yes — 1,000 followers puts you in the top tier of active X accounts. Most accounts never reach this milestone. It's a strong foundation for building influence, launching products, or growing a community." },
    ],
    cardParams: nextCardParams("followers"),
    relatedSlugs: ["500-followers", "2k-followers", "1k-mrr", "1k-github-stars"],
  },
  {
    slug: "2k-followers",
    category: "followers",
    metricType: "followers",
    value: 2000,
    displayValue: "2,000",
    shortValue: "2K",
    title: "2,000 Followers Milestone — Celebrate Your Growth",
    description: "Hit 2,000 followers on X? Create a milestone visual to celebrate and share your achievement with your audience.",
    keywords: ["2000 followers milestone", "2k followers celebration", "2000 followers x"],
    headline: "2,000 followers — the growth is compounding!",
    intro: "2K followers means the compound effect is kicking in. Your content is being amplified by your existing audience, bringing in new followers you never directly reached.",
    whatItMeans: "At 2,000 followers, you've proven that 1K wasn't a fluke. Your audience is growing because your content delivers consistent value. This is where many creators start monetizing — through sponsorships, product launches, or consulting. The foundation is solid.",
    tips: [
      "Analyze your top 10 posts — patterns will emerge that guide your content strategy",
      "Start building an email list or community outside X to own your audience",
      "Experiment with new formats (polls, images, short threads) to find what scales",
      "Collaborate with other creators at your level — cross-pollination accelerates growth",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "The compound effect is not a myth.\n\nMonths to hit 1K.\nWeeks to double it.\n\n2,000 people following this journey.\n\nMomentum is a powerful thing 🔥\n\nWhat milestone did you hit faster than expected?",
      "1K → 2K.\n\nBest format: threads.\nWorst: polls (surprisingly).\n\nEngagement rate actually went UP as I grew.\n\nThe snowball is rolling.\n\nWhat content format works best for you?",
      "A year ago I was mass-following people hoping they'd follow back.\n\nGot me nowhere.\n\nThen I shifted. Less broadcasting, more conversations. Less self-promotion, more genuine help.\n\nToday: 2,000 followers. All from building in public.\n\nWhat growth tactic flopped for you?",
    ],
    faqs: [
      { question: "How do I grow from 2K to 5K followers?", answer: "At 2K, focus on creating shareable content — threads, insights, and visual posts that your followers want to repost. Engage strategically with larger accounts, and post consistently at times when your audience is most active." },
      { question: "Should I celebrate 2,000 followers?", answer: "Absolutely! Every milestone is worth celebrating. Sharing your growth transparently builds trust with your audience and often brings in new followers who want to follow your journey." },
    ],
    cardParams: nextCardParams("followers"),
    relatedSlugs: ["1k-followers", "5k-followers", "1k-mrr", "100-customers"],
  },
  {
    slug: "5k-followers",
    category: "followers",
    metricType: "followers",
    value: 5000,
    displayValue: "5,000",
    shortValue: "5K",
    title: "5,000 Followers Milestone — You're a Micro-Influencer",
    description: "5K followers on X makes you a micro-influencer. Celebrate with a professional milestone visual and share your journey.",
    keywords: ["5000 followers milestone", "5k followers x", "5000 followers celebration", "micro influencer milestone"],
    headline: "5,000 followers — micro-influencer unlocked!",
    intro: "At 5K, you're officially a micro-influencer. Brands want to work with you, your DMs are busier, and your content consistently reaches thousands. This is where influence becomes tangible.",
    whatItMeans: "5,000 followers is a significant threshold in the creator economy. Micro-influencers (1K-10K) often have higher engagement rates than mega-influencers, making this a sweet spot for brand deals and product launches. Your reach is substantial — each post can potentially reach 10-50K people through impressions and reposts.",
    tips: [
      "Create a media kit if you want brand partnerships",
      "Launch or promote a product — you have a real distribution channel now",
      "Start documenting your growth data — it becomes social proof for future opportunities",
      "Build deeper with your top fans — they'll be your biggest amplifiers to 10K",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "5,000 people trust what I share.\n\nThat trust took months of showing up, being wrong publicly, and learning in the open.\n\nMicro-influencer unlocked.\n\nBut I'm just getting started 🚀\n\nWhat milestone felt impossible until it happened?",
      "0 → 5,000.\n\nBest month: +1,200 followers (one thread went semi-viral)\nWorst month: +43\nAverage: ~400/month\n\n70% of my growth came from 10% of my posts.\n\nYou only need a few great posts to change everything.\n\nWhat's your best-performing post about?",
      "Two years ago I posted my first tweet into silence.\n\nNo likes. No replies.\n\nI kept going. Through 50-follower months. Through imposter syndrome. Through almost deleting my account.\n\n5,000 followers later.\n\nBuilding in public changed my life 💪",
    ],
    faqs: [
      { question: "Is 5,000 followers enough to make money on X?", answer: "Yes — many creators start earning through sponsorships, affiliates, and product sales at 5K followers. Brands often prefer micro-influencers because of their higher engagement rates and more authentic audience relationships." },
      { question: "How do I create a milestone post for 5K followers?", answer: "Use GROAR to create a professional-looking milestone card. Connect your X account, pick the milestone template, and your metrics are imported automatically. Customize the design and export — it takes under 10 seconds." },
    ],
    cardParams: nextCardParams("followers"),
    relatedSlugs: ["2k-followers", "10k-followers", "5k-mrr", "5k-github-stars"],
  },
  {
    slug: "10k-followers",
    category: "followers",
    metricType: "followers",
    value: 10000,
    displayValue: "10,000",
    shortValue: "10K",
    title: "10,000 Followers Milestone — Celebrate 10K on X",
    description: "10K followers on X is massive. Create a beautiful milestone visual to celebrate this achievement and inspire your audience.",
    keywords: ["10000 followers milestone", "10k followers x", "10k followers celebration", "10000 followers post"],
    headline: "10,000 followers — you're in the top 1%!",
    intro: "10K followers is elite. You've built a real audience that trusts your voice, and your content reaches tens of thousands with every post. This is the milestone that changes everything.",
    whatItMeans: "At 10,000 followers, you're in the top 1% of active X accounts. Your posts regularly reach 50K+ impressions, brand deals are substantial, and your influence is undeniable. This is the threshold where many creators go full-time, launch premium products, or build companies around their audience.",
    tips: [
      "Celebrate loudly — 10K milestones consistently go viral and attract even more followers",
      "Diversify your platforms — bring your audience to a newsletter, podcast, or YouTube",
      "Create premium content or offers — your audience is large enough to support products",
      "Give back — shout out smaller creators and help them grow",
      "Document your journey from 0 to 10K — this content is gold for others aspiring to grow",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "10,000 people hit follow.\n\nI still remember celebrating 100. Back then, 10K felt like a fantasy.\n\nToday it's real. And honestly, I'm emotional.\n\nThis community changed my life 🙏\n\nWhat dream are you chasing that still feels unreachable?",
      "0 → 10,000 followers.\n\nYear 1: 0-2K (the grind)\nYear 2: 2K-10K (the compound)\n\nBest tactic: genuine replies\nWorst: engagement bait\n\nTop 1% of X accounts. Built without ads, bots, or shortcuts.\n\nThe algorithm rewards authenticity. Period.",
      "100 followers: screenshot.\n500: screenshot.\n1K: cried a little.\n\nToday: 10,000. Five digits.\n\nEach milestone taught me something.\n\nBut the biggest lesson? The people who followed at 100 are still here at 10K 🚀\n\nWho's been on your journey since day one?",
    ],
    faqs: [
      { question: "How long does it take to get 10K followers on X?", answer: "For consistently active creators, reaching 10K typically takes 6-18 months. The key accelerators are daily posting, engaging content threads, visual posts, and genuine community engagement." },
      { question: "What percentage of X users have 10K followers?", answer: "Less than 1% of active X accounts have 10,000 or more followers. Reaching this milestone puts you in an elite group of creators on the platform." },
      { question: "How should I celebrate 10K followers?", answer: "Create a milestone visual with GROAR, share your growth story, thank your community, and set your next public goal. A 10K celebration post often goes viral and accelerates your growth even further." },
    ],
    cardParams: nextCardParams("followers"),
    relatedSlugs: ["5k-followers", "25k-followers", "10k-mrr", "10k-github-stars"],
  },
  {
    slug: "25k-followers",
    category: "followers",
    metricType: "followers",
    value: 25000,
    displayValue: "25,000",
    shortValue: "25K",
    title: "25,000 Followers Milestone — Share Your 25K Achievement",
    description: "25K followers on X! You've built a powerful audience. Create a milestone visual and celebrate this achievement.",
    keywords: ["25000 followers milestone", "25k followers x", "25k followers celebration"],
    headline: "25,000 followers — serious influence!",
    intro: "25K followers means you're not just creating content — you're shaping conversations. Your voice carries weight, and your audience is a real distribution moat.",
    whatItMeans: "At 25,000 followers, you have the reach of a small media outlet. Brands pay premium rates for partnerships, your launches get immediate traction, and you can meaningfully move the needle on any topic you care about. This is a level most creators dream of reaching.",
    tips: [
      "Consider building a team or using tools to manage your growing audience",
      "Launch a paid offering — course, community, SaaS, consulting — your audience is ready",
      "Be strategic about brand partnerships — only work with products you genuinely use",
      "Give back to the community that built you — mentor, share resources, amplify others",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "25,000 followers. And I still reply to my DMs.\n\nThe conversations. The friendships. The community.\n\nNone of this was supposed to happen.\n\nI started posting because I had something to say. 25K of you decided to listen 🙏\n\nWhat would you tell yourself when you started?",
      "0 → 25K. The real numbers:\n\nPosts: 2,000+\nReplies sent: 5,000+\nBest month: +4K followers\nWorst month: -200 (yes, negative)\n\nEach post now reaches 100K+ impressions.\n\nConsistency wins every single time 🔥",
      "Nobody knew my name 18 months ago.\n\n200 followers and a dream.\n\nI posted every day. Some days it felt pointless. Most days, actually.\n\nBut I kept going.\n\n25,000 followers later.\n\nThe power of not quitting.\n\nWhat kept you going when nobody was watching?",
    ],
    faqs: [
      { question: "How much can you earn with 25K followers on X?", answer: "Creators with 25K followers can earn $500-5,000+ per sponsored post, plus significant revenue from their own products. The actual amount depends on your niche, engagement rate, and monetization strategy." },
      { question: "What's a good engagement rate at 25K followers?", answer: "A 2-5% engagement rate at 25K followers is considered good. This means each post should get 500-1,250 engagements (likes, replies, reposts). Use GROAR's analytics integration to track your metrics." },
    ],
    cardParams: nextCardParams("followers"),
    relatedSlugs: ["10k-followers", "50k-followers", "10k-mrr", "1k-customers"],
  },
  {
    slug: "50k-followers",
    category: "followers",
    metricType: "followers",
    value: 50000,
    displayValue: "50,000",
    shortValue: "50K",
    title: "50,000 Followers Milestone — Half Way to 100K",
    description: "50K followers on X! You're halfway to 100K. Celebrate this incredible milestone with a professional visual.",
    keywords: ["50000 followers milestone", "50k followers x", "50k followers celebration", "halfway to 100k followers"],
    headline: "50,000 followers — halfway to 100K!",
    intro: "50K is rarefied air. You're a thought leader in your space, and your content shapes the conversation. The 100K milestone is in sight.",
    whatItMeans: "50,000 followers puts you among the most influential voices in your niche. Your posts reach hundreds of thousands of people, your endorsements carry significant weight, and you have a platform that most businesses would pay millions to build. This is real influence.",
    tips: [
      "Start thinking about your legacy — what do you want to be known for?",
      "Build systems for content creation — at this scale, burnout is a real risk",
      "Invest in your best-performing content types",
      "Consider writing a book, launching a podcast, or creating a course",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "50,000 followers and I still get nervous before posting.\n\nImposter syndrome never fully goes away.\n\nBut authenticity scales better than perfection. The posts where I was most vulnerable got the most reach.\n\nHalfway to 100K 🚀\n\nDo you still get nervous before hitting post?",
      "0 → 50,000.\n\n0-1K: 6 months of grinding\n1K-10K: 8 months of compounding\n10K-50K: 10 months of systems\n\nTotal posts: 3,500+\n\nEach one now reaches 200K+ people.\n\nThe view from here is unreal. But I'm not done.\n\nWhat's your next big milestone?",
      "There's a screenshot on my phone from 2 years ago.\n\nIt says \"47 followers.\"\n\nI kept it as motivation. Every time I wanted to quit, I'd look at it and think: just one more week.\n\nThat screenshot now sits next to this one: 50,000 followers 💪\n\nWhat's your motivation screenshot?",
    ],
    faqs: [
      { question: "How rare is 50K followers on X?", answer: "Extremely rare — less than 0.1% of all X accounts have 50,000+ followers. At this level, you have more reach than many traditional media outlets." },
      { question: "How do I go from 50K to 100K followers?", answer: "At 50K, growth comes from viral content, strategic collaborations, and expanding to new audiences. Focus on creating content that gets shared beyond your existing followers — threads, insights, and visual posts tend to perform best." },
    ],
    cardParams: nextCardParams("followers"),
    relatedSlugs: ["25k-followers", "100k-followers", "50k-mrr", "1k-customers"],
  },
  {
    slug: "100k-followers",
    category: "followers",
    metricType: "followers",
    value: 100000,
    displayValue: "100,000",
    shortValue: "100K",
    title: "100,000 Followers Milestone — 100K on X!",
    description: "100K followers on X is legendary. Celebrate this massive milestone with a visual worthy of the achievement.",
    keywords: ["100000 followers milestone", "100k followers x", "100k followers celebration", "six figures followers"],
    headline: "100,000 followers — legendary status!",
    intro: "100K followers. Six figures. You've built something that most people can only dream of. Your audience is a powerful community, and your voice reaches millions.",
    whatItMeans: "100,000 followers is the milestone that defines you as a major creator or thought leader. At this level, your influence extends far beyond X — you're invited to speak, your opinions shape industries, and your platform is a significant business asset worth six or seven figures.",
    tips: [
      "Celebrate big — 100K is a once-in-a-lifetime milestone that deserves a moment",
      "Reflect on and share your journey — this content inspires thousands",
      "Build a moat beyond followers — email lists, communities, and products are what last",
      "Stay authentic — it's what got you here and what will keep you here",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "100,000 followers.\n\nI'm not going to pretend I'm not emotional right now.\n\nThis started with a single tweet and zero followers. No audience, no connections, no plan.\n\nJust a voice and the courage to use it.\n\n100K of you chose to listen 🙏\n\nI will never take that for granted.",
      "0 → 100,000.\n\nFirst follower: Day 3\nFirst 1K: Month 6\nFirst 10K: Month 14\n100K: today\n\nPosts: 5,000+\nReplies sent: 15,000+\n\nSix-figure audience. Built one post at a time.\n\nWhat number are you chasing right now?",
      "My first tweet got 0 likes. Literally zero.\n\nI posted 100 more. Then 1,000. Then I lost count.\n\nSome flopped. Some went viral. Most landed somewhere in between.\n\nBut I never stopped.\n\n100,000 followers 🔥\n\nAnyone can do this.",
    ],
    faqs: [
      { question: "How long does it take to reach 100K followers on X?", answer: "For the most dedicated creators, reaching 100K typically takes 1-3 years of consistent, high-quality content creation and community building. Some accounts grow faster through viral moments, but sustained growth usually requires long-term commitment." },
      { question: "How much is a 100K followers account worth?", answer: "An active X account with 100K engaged followers is worth significant revenue potential — $5K-50K+ per month through sponsorships, products, and services. The actual value depends on your niche, engagement rate, and monetization strategy." },
    ],
    cardParams: nextCardParams("followers"),
    relatedSlugs: ["50k-followers", "100k-mrr", "1k-customers", "10k-github-stars"],
  },
];

const MRR: MilestonePageData[] = [
  {
    slug: "100-mrr",
    category: "mrr",
    metricType: "mrr",
    value: 100,
    displayValue: "$100",
    shortValue: "$100",
    title: "$100 MRR Milestone — Your First Revenue",
    description: "You hit $100 MRR! Celebrate your first recurring revenue milestone and share it with the indie hacker community.",
    keywords: ["100 mrr milestone", "$100 mrr", "first mrr milestone", "saas first revenue", "indie hacker first revenue"],
    headline: "$100 MRR — your first recurring revenue!",
    intro: "$100 MRR is the milestone that proves people will actually pay for what you've built. It's not about the money — it's validation that your product solves a real problem.",
    whatItMeans: "Your first $100 in monthly recurring revenue is arguably the most important SaaS milestone. It proves product-market fit at a micro level — real people are pulling out their credit cards every month for your product. Many successful SaaS companies took months to reach this point. You've crossed the chasm from 'side project' to 'business.'",
    tips: [
      "Talk to every single customer — understand exactly why they're paying",
      "Share your milestone publicly — the indie hacker community loves celebrating firsts",
      "Focus on retention before acquisition — keep these customers happy",
      "Document everything — your journey from $0 to $100 MRR is content gold",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "This number used to be $0.\n\nToday: $100 MRR.\n\nPeople are actually paying for something I built.\n\nNot life-changing money. But life-changing validation.\n\nEvery dollar feels like proof that this can work 🔥\n\nWhat was your first dollar earned online?",
      "$0 → $100 MRR.\n\nWeek 1: launched to crickets\nWeek 3: first free user\nWeek 6: first $9 payment\nToday: $100/month recurring\n\n12 customers. $0 in ads.\n\nSmall revenue. Massive signal.\n\nHow long did it take you to earn your first recurring dollar?",
      "I stared at my Stripe dashboard for 10 minutes.\n\n$9. That's all it was.\n\nBut it meant everything. Someone I'd never met believed my product was worth paying for.\n\n$100 MRR. 12 customers.\n\nThe SaaS journey begins 🚀",
    ],
    faqs: [
      { question: "How long does it take to reach $100 MRR?", answer: "It varies enormously — some SaaS products reach $100 MRR within weeks of launch, while others take months. The key factors are solving a clear pain point, reaching the right audience, and pricing appropriately." },
      { question: "Is $100 MRR good for a SaaS?", answer: "Yes! $100 MRR is a meaningful validation milestone. It proves people will pay for your product. Many successful SaaS companies (including ones worth millions today) started at exactly this point." },
      { question: "How do I share my MRR milestone?", answer: "Use GROAR to create a professional milestone card showing your $100 MRR achievement. It connects to revenue tracking tools and generates beautiful visuals you can share on X and other platforms." },
    ],
    cardParams: nextCardParams("mrr"),
    relatedSlugs: ["500-mrr", "1k-mrr", "100-followers", "10-customers"],
  },
  {
    slug: "500-mrr",
    category: "mrr",
    metricType: "mrr",
    value: 500,
    displayValue: "$500",
    shortValue: "$500",
    title: "$500 MRR Milestone — Real Traction",
    description: "Hit $500 MRR? That's real traction. Create a milestone visual and share your SaaS growth with the community.",
    keywords: ["500 mrr milestone", "$500 mrr", "saas traction", "indie hacker revenue milestone"],
    headline: "$500 MRR — real traction!",
    intro: "$500 MRR means your product has real traction. You're not relying on a single customer — you have a growing base of paying users who find consistent value in what you've built.",
    whatItMeans: "At $500 MRR, you've moved beyond early validation into real traction territory. You likely have 10-50 paying customers, which means your product is solving a problem for a real market segment. This is the milestone where many founders start taking their SaaS more seriously — considering going full-time or investing more heavily in growth.",
    tips: [
      "Start tracking churn — at $500 MRR, every lost customer is noticeable",
      "Implement basic analytics to understand your funnel",
      "Ask for testimonials — social proof becomes critical for the next growth phase",
      "Consider raising prices — most indie hackers undercharge at this stage",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "I almost shut this project down at $50 MRR.\n\nThen one customer emailed: \"Your tool saved me 5 hours this week.\"\n\nI kept going.\n\nToday: $500 MRR.\n\nQuitting would have been the only failure 💪\n\nWhat almost made you give up on your project?",
      "$100 → $500 MRR.\n\nCustomers: ~30\nChurn: 4%\nBest channel: X (building in public)\nCAC: $0\nARPU: $17\n\nA weekend project is becoming a real business.\n\nWhat metric do you obsess over most?",
      "The first time a stranger paid for my product, I didn't believe it.\n\nChecked Stripe three times.\nChecked my email.\nChecked Stripe again.\n\nThat was at $9 MRR.\n\nToday: $500 MRR. From disbelief to momentum 🔥\n\nDo you remember your first paying customer?",
    ],
    faqs: [
      { question: "How do I grow from $500 to $1,000 MRR?", answer: "Focus on three things: reduce churn (talk to churned customers), optimize your conversion funnel, and double down on your best acquisition channel. Many SaaS founders double their MRR by simply improving onboarding and reducing churn." },
      { question: "What should I share when I hit $500 MRR?", answer: "Create a milestone visual with GROAR showing your $500 MRR achievement. Share what worked, what didn't, and your key learnings. The indie hacker community values transparency and real numbers." },
    ],
    cardParams: nextCardParams("mrr"),
    relatedSlugs: ["100-mrr", "1k-mrr", "500-followers", "50-customers"],
  },
  {
    slug: "1k-mrr",
    category: "mrr",
    metricType: "mrr",
    value: 1000,
    displayValue: "$1,000",
    shortValue: "$1K",
    title: "$1K MRR Milestone — Four Figures!",
    description: "$1,000 MRR is a major SaaS milestone. Celebrate your four-figure monthly revenue with a professional visual.",
    keywords: ["1000 mrr milestone", "1k mrr", "$1000 mrr celebration", "four figure mrr", "saas 1k mrr"],
    headline: "$1,000 MRR — four-figure recurring revenue!",
    intro: "$1K MRR is the milestone every indie hacker dreams about. Four figures in monthly recurring revenue means your SaaS is a real business generating real income.",
    whatItMeans: "$1,000 MRR is one of the most celebrated milestones in the indie hacker community. It's the point where your SaaS goes from 'experiment' to 'viable business.' At this level, you're generating $12,000/year — enough to cover significant costs or serve as meaningful side income. Many founders use this milestone to justify going full-time.",
    tips: [
      "Celebrate publicly — $1K MRR posts are some of the most engaging content in the indie hacker space",
      "Start building systems: automated onboarding, help docs, and monitoring",
      "Think about your path to $5K MRR — is it more customers, higher prices, or upsells?",
      "Consider writing a detailed breakdown of your journey to $1K MRR",
      "Invest in the product — this is the time to fix tech debt and improve UX",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "A year ago this was a side project.\n\nToday it makes $1,000 every single month.\n\n$1K MRR. Four figures. Built by one person with an idea and the courage to ship it.\n\nEvery dollar earned, every lesson learned 🚀\n\nWhat side project are you working on right now?",
      "$0 → $1,000 MRR.\n\nMonth 1: $0 (building)\nMonth 3: $47 (first customers)\nMonth 6: $280 (slow growth)\nMonth 9: $650 (something clicked)\nToday: $1K\n\nRevenue doubled in the last 3 months.\n\n$12K/year from a \"silly idea.\"\n\nWhat's your current MRR?",
      "My co-worker laughed when I told him I was building a SaaS on weekends.\n\n\"Most side projects die in a month.\"\n\nHe wasn't wrong. Most do.\n\nBut this one didn't.\n\n$1,000 MRR. Four figures. Every customer a lesson, every month a new record 🔥\n\nHave you been doubted on something that ended up working?",
    ],
    faqs: [
      { question: "How long does it take to reach $1K MRR?", answer: "The median time to $1K MRR for indie hackers is 6-12 months from launch. However, this varies significantly based on your market, pricing, and distribution strategy. Some reach it in weeks, others in years." },
      { question: "Should I quit my job at $1K MRR?", answer: "Most experts recommend waiting until at least $3-5K MRR (depending on your expenses and location) before going full-time. $1K MRR shows strong validation, but you'll want more runway and stability before making the leap." },
      { question: "How do I make a $1K MRR milestone post?", answer: "Use GROAR to create a polished milestone card showing your $1K MRR. Share it alongside your story — what you built, how long it took, and what you learned. These posts consistently get high engagement in the indie hacker community." },
    ],
    cardParams: nextCardParams("mrr"),
    relatedSlugs: ["500-mrr", "5k-mrr", "1k-followers", "100-customers"],
  },
  {
    slug: "5k-mrr",
    category: "mrr",
    metricType: "mrr",
    value: 5000,
    displayValue: "$5,000",
    shortValue: "$5K",
    title: "$5K MRR Milestone — Ramen Profitable",
    description: "$5,000 MRR means you could go full-time. Celebrate being ramen profitable with a milestone visual.",
    keywords: ["5000 mrr milestone", "5k mrr", "$5000 mrr", "ramen profitable", "saas ramen profitability"],
    headline: "$5,000 MRR — ramen profitable!",
    intro: "$5K MRR is the 'ramen profitable' milestone. For many founders, this is enough to quit the day job and go all-in on their product. The dream is becoming reality.",
    whatItMeans: "At $5,000 MRR ($60K/year), you have a legitimate business that can support a founder in most cities around the world. This is the level where indie hackers typically go full-time. Your product has proven product-market fit, your customer base is substantial, and the path to $10K+ MRR is often just about execution.",
    tips: [
      "Seriously evaluate going full-time — the opportunity cost of not doing so increases every month",
      "Hire or outsource your weaknesses — you can afford to invest in growth now",
      "Build for retention — the difference between $5K and $10K MRR is often just reducing churn",
      "Start planning for scale — processes, documentation, and systems matter more now",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "I quit my job last month.\n\n$5,000 MRR. Ramen profitable.\n\nThe side project officially became my main project.\n\nScariest and best decision I've ever made.\n\n$60K/year from software I built alone 🔥\n\nHave you made the leap to full-time?",
      "$1K → $5K MRR. What actually worked:\n\n1. Raised prices 40% (zero churn increase)\n2. Added annual plans (+20% cash flow)\n3. Built one feature customers begged for (+30% upgrades)\n\nTotal time: 8 months.\n\nRamen profitable. Best two words in SaaS.\n\nWhat change moved your revenue most?",
      "18 months ago I wrote my first line of code for this project.\n\nAt a coffee shop. On a Saturday.\n\nNo audience, no customers, no clue.\n\nJust a problem I wanted to solve.\n\nToday: $5K MRR. $60K/year.\n\nStarting is the hardest part 💪",
    ],
    faqs: [
      { question: "Is $5K MRR enough to go full-time?", answer: "For many indie hackers, yes — $5K MRR ($60K/year) is enough to cover living expenses in most cities, especially if you have savings as a runway buffer. Consider your expenses, location, and growth trajectory before making the leap." },
      { question: "How do I grow from $5K to $10K MRR?", answer: "Focus on reducing churn, increasing average revenue per user (through pricing tiers or upsells), and scaling your best acquisition channel. Many founders double from $5K to $10K by improving their product rather than increasing marketing." },
    ],
    cardParams: nextCardParams("mrr"),
    relatedSlugs: ["1k-mrr", "10k-mrr", "5k-followers", "500-customers"],
  },
  {
    slug: "10k-mrr",
    category: "mrr",
    metricType: "mrr",
    value: 10000,
    displayValue: "$10,000",
    shortValue: "$10K",
    title: "$10K MRR Milestone — Six-Figure ARR!",
    description: "$10K MRR means $120K ARR — a six-figure business. Celebrate this major SaaS milestone with a professional visual.",
    keywords: ["10000 mrr milestone", "10k mrr", "$10k mrr celebration", "six figure arr", "saas 10k mrr", "120k arr"],
    headline: "$10,000 MRR — six-figure annual revenue!",
    intro: "$10K MRR is $120K ARR. You've built a six-figure business. This isn't a side project anymore — this is a company that outearns most traditional jobs.",
    whatItMeans: "At $10,000 MRR, you're running a legitimate six-figure business. You likely have 100+ customers, a solid product, and a proven growth engine. This milestone opens doors to everything — hiring your first employee, raising funding (if you want), or simply enjoying the financial freedom of a profitable solo business.",
    tips: [
      "Consider hiring — even one person can 2-3x your output and growth rate",
      "Invest in customer success — at this scale, churn becomes your biggest enemy",
      "Build public case studies — your customers' success stories are your best marketing",
      "Set a 12-month goal — $25K MRR? $50K? Write it down and work backwards",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "Six-figure ARR. Let that sink in.\n\n$10,000 MRR. $120K/year.\n\nFrom a solo founder's weekend project to a business that outearns my old salary.\n\nBuilt with code, shipped with courage, grown with community 🙏\n\nWhat income milestone would change your life?",
      "$0 → $10K MRR.\n\nCustomers: 200+\nChurn: 3.2%\nLTV: $340\nCAC: $12\nRevenue last month: $10,247\n\nZero VC dollars. Six-figure ARR. 100% bootstrapped.\n\nWhat SaaS metric do you wish you'd tracked from day one?",
      "Two years ago I shipped the first version.\n\nIt was ugly. It barely worked. Three people signed up.\n\nI almost pivoted. Twice.\nI almost quit. Once.\n\nBut I kept talking to customers. Kept shipping. Kept believing.\n\n$10K MRR 🔥\n\nBuilt one decision at a time.",
    ],
    faqs: [
      { question: "How rare is $10K MRR for an indie SaaS?", answer: "Very rare — the vast majority of SaaS products never reach $10K MRR. Among indie hackers who build and launch products, less than 5% reach this milestone. It represents a significant achievement and a sustainable business." },
      { question: "Should I raise funding at $10K MRR?", answer: "It depends on your goals. At $10K MRR, you have a profitable business that proves demand. You could raise to accelerate growth, but many indie hackers choose to stay bootstrapped and enjoy the freedom. There's no wrong answer." },
    ],
    cardParams: nextCardParams("mrr"),
    relatedSlugs: ["5k-mrr", "50k-mrr", "10k-followers", "1k-customers"],
  },
  {
    slug: "50k-mrr",
    category: "mrr",
    metricType: "mrr",
    value: 50000,
    displayValue: "$50,000",
    shortValue: "$50K",
    title: "$50K MRR Milestone — Half-Million ARR",
    description: "$50K MRR means you're approaching $600K ARR. Celebrate this incredible SaaS achievement.",
    keywords: ["50000 mrr milestone", "50k mrr", "$50k mrr", "half million arr", "saas scale"],
    headline: "$50,000 MRR — approaching half a million ARR!",
    intro: "$50K MRR is $600K ARR. You've built something that generates more revenue than most small businesses. This is exceptional, and the world should know about it.",
    whatItMeans: "At $50,000 MRR, you're running a company that most founders only dream about. Whether you're solo or have a small team, this level of recurring revenue provides incredible freedom and opportunity. You're in the top 0.1% of all SaaS companies by revenue.",
    tips: [
      "Build a team if you haven't already — you can't (and shouldn't) do everything alone at this scale",
      "Invest in infrastructure — reliability, monitoring, and support become critical",
      "Think about your long-term vision — where does this go in 5 years?",
      "Continue sharing your journey — at this level, your story inspires thousands",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "$50,000 MRR.\n\nI never thought I'd type those words.\n\n$600K ARR. Still bootstrapped. Still a small team. Still building every single day.\n\nThis is what happens when you solve a real problem and refuse to stop 🔥\n\nWhat would $50K/month mean for your life?",
      "$0 → $50K MRR.\n\nYear 1: $0-$2K (survival mode)\nYear 2: $2K-$15K (product-market fit)\nYear 3: $15K-$50K (scaling)\n\nTeam: 3 people\nFunding raised: $0\nCustomers: 800+\n\nHalf a million ARR. Built one customer at a time.\n\nWhat year of your business was the hardest?",
      "3 years ago I showed my wife a Stripe notification.\n\n\"$9. New subscription.\"\n\nShe smiled politely. She didn't get it yet.\n\nYesterday I showed her another Stripe screen: $50,000 MRR.\n\nThis time, she got it 🙏\n\nWhen did someone close to you finally \"get it\"?",
    ],
    faqs: [
      { question: "How many SaaS companies reach $50K MRR?", answer: "Less than 1% of all SaaS companies reach $50K MRR. For bootstrapped/indie products, it's even rarer. This milestone puts you among the most successful independent software businesses in the world." },
    ],
    cardParams: nextCardParams("mrr"),
    relatedSlugs: ["10k-mrr", "100k-mrr", "50k-followers", "1k-customers"],
  },
  {
    slug: "100k-mrr",
    category: "mrr",
    metricType: "mrr",
    value: 100000,
    displayValue: "$100,000",
    shortValue: "$100K",
    title: "$100K MRR Milestone — Million-Dollar ARR!",
    description: "$100K MRR is $1.2M ARR — a million-dollar business. Celebrate this legendary milestone.",
    keywords: ["100k mrr milestone", "$100k mrr", "million dollar arr", "saas million", "1m arr"],
    headline: "$100,000 MRR — you've built a million-dollar business!",
    intro: "$100K MRR is $1.2M ARR. You've officially built a million-dollar recurring revenue business. This is the top of the mountain for most founders.",
    whatItMeans: "Seven-figure ARR is the milestone that defines SaaS success. Whether bootstrapped or funded, reaching $100K MRR means you've built a company that generates real wealth, supports a team, and serves thousands of customers. You've joined an elite club of founders who've turned code into a million-dollar business.",
    tips: [
      "Celebrate massively — this deserves it",
      "Write your story — a detailed account of your journey to $1M ARR will become legendary content",
      "Think about what's next — continue growing, sell, or enjoy the passive income?",
      "Give back to the community that supported you along the way",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "$100,000 MRR.\n\nOne million dollars in annual recurring revenue.\n\nNo co-founder. No VC.\n\nJust code, customers, and an unreasonable belief that it would work.\n\nThis is the milestone I dreamed about. It's real 🔥\n\nWhat unreasonable belief are you betting on?",
      "$0 → $100K MRR.\n\nYear 1: $800 MRR\nYear 2: $8K MRR\nYear 3: $35K MRR\nYear 4: $100K MRR\n\nCustomers: 2,000+\nTeam: 5 people\nFunded: never\n\n$1.2M ARR. Seven figures. Built from scratch.\n\nWhat milestone are you working toward?",
      "4 years ago I almost took a job at a big tech company.\n\nThe offer was good. Really good.\n\nBut something nagged me: what if this idea actually works?\n\nI turned it down. My family thought I was crazy.\n\n$100K MRR later.\n\nThe biggest bet of my life paid off 💪",
    ],
    faqs: [
      { question: "How long does it take to reach $100K MRR?", answer: "For bootstrapped SaaS companies, reaching $100K MRR typically takes 3-7 years. Funded companies can sometimes reach this milestone faster, but the timeline depends heavily on market, pricing, and execution." },
      { question: "What comes after $100K MRR?", answer: "At $100K MRR, founders typically face three paths: continue scaling toward $500K+ MRR, explore acquisition offers, or optimize for profitability and lifestyle. There's no wrong answer — you've already won." },
    ],
    cardParams: nextCardParams("mrr"),
    relatedSlugs: ["50k-mrr", "100k-followers", "1m-revenue", "1k-customers"],
  },
];

const REVENUE: MilestonePageData[] = [
  {
    slug: "1k-revenue",
    category: "revenue",
    metricType: "revenue",
    value: 1000,
    displayValue: "$1,000",
    shortValue: "$1K",
    title: "$1K Total Revenue — Your First $1,000",
    description: "You earned your first $1,000 in total revenue! Celebrate this milestone and share it with your community.",
    keywords: ["first 1000 dollars revenue", "1k revenue milestone", "first thousand dollars", "saas first revenue milestone"],
    headline: "$1,000 in total revenue — your first grand!",
    intro: "Your first $1,000 in revenue is the proof that your product creates real value. Someone — many someones — decided your work was worth paying for.",
    whatItMeans: "The first $1,000 in total revenue is a psychological milestone that validates your entire effort. It doesn't matter if it took a week or a year — you've proven that people will pay for what you build. This is the foundation everything else is built on.",
    tips: [
      "Screenshot this moment — you'll want to remember it when you hit $100K",
      "Analyze where these dollars came from — which channel, which messaging, which customers",
      "Reinvest in what's working — double down on your best acquisition channel",
      "Share the milestone — transparency attracts customers and supporters",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "This number used to be $0.\n\nNow it's $1,000.\n\nNot from a salary. Not from a client.\n\nFrom a product that people chose to pay for.\n\nThis is just the beginning 🔥\n\nWhat was your first revenue milestone?",
      "$0 → $1,000 in total revenue.\n\nTime to first dollar: 47 days\nTime to $100: 2 more weeks\nTime to $1K: 3 months total\nCustomers: 28\nAverage order: $36\n\nEvery dollar is proof that this works.\n\nHow long did it take you to make your first $1K?",
      "Sitting in a coffee shop when my phone buzzed.\n\nStripe notification. $29. From a stranger in another country.\n\nI stared at it for five minutes.\n\nThen I kept building.\n\nToday: $1,000 in total revenue. 28 customers 🚀\n\nDo you remember where you were for your first sale?",
    ],
    faqs: [
      { question: "How long does it take to make your first $1,000?", answer: "It depends on your product and market. Some products earn $1K in their first week, while others take months. Focus on solving a real problem and reaching the right audience." },
    ],
    cardParams: nextCardParams("revenue"),
    relatedSlugs: ["10k-revenue", "100-mrr", "1k-followers", "10-customers"],
  },
  {
    slug: "10k-revenue",
    category: "revenue",
    metricType: "revenue",
    value: 10000,
    displayValue: "$10,000",
    shortValue: "$10K",
    title: "$10K Total Revenue — Five Figures Earned",
    description: "$10,000 in total revenue is a massive achievement. Celebrate five figures earned from your product.",
    keywords: ["10k revenue milestone", "$10000 total revenue", "five figure revenue", "saas 10k revenue"],
    headline: "$10,000 in total revenue — five figures!",
    intro: "Five figures in total revenue. $10K earned from a product you built. This is the level where the numbers start to feel very real.",
    whatItMeans: "At $10,000 in total revenue, your product has generated meaningful income. This milestone shows sustained demand — it's not just one big sale, it's a pattern of people finding and paying for your product over time.",
    tips: [
      "Break down the numbers — revenue per customer, acquisition cost, lifetime value",
      "Build a revenue dashboard to track growth publicly (GROAR can help!)",
      "Start thinking about scalable growth channels",
      "Celebrate and share — your transparency inspires others to build",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "$10,000 earned.\n\nNot from a job. Not from freelancing.\n\nFrom a product I created from scratch.\n\nStill blows my mind every time I check the dashboard.\n\nBuilding in public works. Transparency works. Showing up works 🔥\n\nWhat revenue milestone are you working toward?",
      "$1K → $10K revenue.\n\nCustomers: 180+\nRevenue per customer: $56 avg\nBest month: $2,400\nWorst month: $320\nRefund rate: 2.1%\n\nTime from $1K to $10K: 5 months.\n\nFive figures from code I wrote. Still surreal.\n\nWhat metric surprised you most about your business?",
      "6 months ago I celebrated $1K in revenue like I'd won the lottery.\n\nMy friends didn't get it. \"$1K? That's barely rent.\"\n\nRight about the math. Wrong about the meaning.\n\nToday: $10,000 in total revenue.\n\nSame product. Same builder. 10x the proof 💪",
    ],
    faqs: [
      { question: "Is $10K in total revenue good?", answer: "Absolutely. $10K in total revenue means your product has real market demand. Most products never earn their first dollar — you've earned ten thousand of them." },
    ],
    cardParams: nextCardParams("revenue"),
    relatedSlugs: ["1k-revenue", "100k-revenue", "1k-mrr", "100-customers"],
  },
  {
    slug: "100k-revenue",
    category: "revenue",
    metricType: "revenue",
    value: 100000,
    displayValue: "$100,000",
    shortValue: "$100K",
    title: "$100K Total Revenue — Six Figures!",
    description: "Your product has earned $100,000 in total revenue. Celebrate six figures with a stunning milestone visual.",
    keywords: ["100k revenue milestone", "$100000 revenue", "six figure revenue", "saas six figures"],
    headline: "$100,000 in total revenue — six figures earned!",
    intro: "Six figures in total revenue. $100K from a product you built. This is a life-changing number that puts you in elite company.",
    whatItMeans: "Earning $100,000 in total revenue is an extraordinary achievement. It means your product has provided enough value for thousands of transactions. Whether it took months or years, you've built something that generates real wealth.",
    tips: [
      "Write a detailed post-mortem of your journey to $100K — it will be your most valuable content ever",
      "Evaluate your business model — is there a path to $100K/year instead of $100K total?",
      "Thank your customers publicly — they made this possible",
      "Set bigger goals — if you can do $100K, you can do $1M",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "Six figures. $100,000 in total revenue.\n\nFrom a product I built with my own hands.\n\nThis was once a dream I was embarrassed to say out loud.\n\nNow it's a screenshot on my dashboard 🔥\n\nTo everyone who paid for this product: you changed my life.\n\nWhat goal are you afraid to say out loud?",
      "$0 → $100K revenue.\n\n$1K: 3 months\n$10K: 8 months\n$50K: 14 months\n$100K: 20 months\n\nCustomers: 1,200+\nRefund rate: 1.8%\nBest decision: raising prices early\n\nSix figures earned. Every dollar tells a story.\n\nWhat was your best business decision?",
      "I told my partner \"I think I can make $1,000 from this app.\"\n\nThey supported me. Quietly. Patiently.\n\nThrough the late nights. The zero-revenue months. The moments of doubt.\n\n$100,000 later.\n\nI owe this milestone to the people who believed before the numbers did 🙏\n\nWho believed in you before you had proof?",
    ],
    faqs: [
      { question: "How long does it take to earn $100K from a SaaS?", answer: "It varies widely — from 6 months to several years. The timeline depends on your pricing, market size, and growth rate. A product with $10K MRR reaches $100K total revenue in about 10 months." },
    ],
    cardParams: nextCardParams("revenue"),
    relatedSlugs: ["10k-revenue", "1m-revenue", "10k-mrr", "1k-customers"],
  },
  {
    slug: "1m-revenue",
    category: "revenue",
    metricType: "revenue",
    value: 1000000,
    displayValue: "$1,000,000",
    shortValue: "$1M",
    title: "$1M Total Revenue — You're a Millionaire Maker",
    description: "Your product has generated $1,000,000 in total revenue. Celebrate this legendary million-dollar milestone.",
    keywords: ["1m revenue milestone", "million dollar revenue", "$1000000 revenue", "saas million revenue"],
    headline: "$1,000,000 in total revenue — the million dollar milestone!",
    intro: "One million dollars. $1M in total revenue from a product you built. This is the kind of milestone that changes your life and inspires an entire generation of builders.",
    whatItMeans: "Generating $1,000,000 in total revenue means you've built something truly impactful. Millions of dollars flowed through your product because it solved real problems for real people. You're in the rarest air of software entrepreneurship.",
    tips: [
      "This deserves the biggest celebration — share your full story",
      "Create a detailed breakdown of how you got here — this is legendary content",
      "Mentor others — you have knowledge that's worth more than money",
      "Think about your next chapter — what do you want to build next?",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "One million dollars.\n\n$1,000,000 in total revenue.\n\nIf someone told me this was possible when I started, I would have laughed.\n\nA product I built from scratch generated seven figures.\n\nThis isn't just a milestone. It's proof that builders can win 🔥\n\nWhat would you build if you knew you couldn't fail?",
      "$0 → $1,000,000.\n\n$1K: Month 3\n$10K: Month 8\n$100K: Month 20\n$500K: Month 34\n$1M: today\n\nCustomers: 8,000+\nCountries: 60+\nTeam: still small\n\nSeven figures. One product. Zero regrets.\n\nWhat's the longest you've worked on a single project?",
      "Day 1: my \"office\" was a kitchen table. My \"team\" was just me.\n\nNo investors. No connections. No MBA.\n\nJust a laptop and a problem I wanted to solve.\n\n$1,000,000 in revenue.\n\nA million dollars from an idea that started on a napkin 🚀\n\nWhat idea are you sitting on right now?",
    ],
    faqs: [
      { question: "How rare is $1M in total revenue?", answer: "Extremely rare. Less than 1% of all software products ever generate $1M in total revenue. For bootstrapped products, the number is even smaller. This is an extraordinary achievement by any measure." },
    ],
    cardParams: nextCardParams("revenue"),
    relatedSlugs: ["100k-revenue", "100k-mrr", "100k-followers", "1k-customers"],
  },
];

const GITHUB_STARS: MilestonePageData[] = [
  {
    slug: "100-github-stars",
    category: "github-stars",
    metricType: "githubStars",
    value: 100,
    displayValue: "100",
    shortValue: "100",
    title: "100 GitHub Stars — Your Project Is Getting Noticed",
    description: "Your open source project just hit 100 stars on GitHub! Celebrate this milestone and share it with the developer community.",
    keywords: ["100 github stars", "github stars milestone", "open source 100 stars", "github project milestone"],
    headline: "100 GitHub stars — your project is getting noticed!",
    intro: "100 stars on GitHub means developers are discovering and appreciating your work. Your open source project has crossed from 'personal project' to 'community project.'",
    whatItMeans: "Getting 100 stars on GitHub is a significant milestone for any open source project. It means developers have found your project, evaluated it, and decided it's worth bookmarking. At this level, you'll start appearing in GitHub's recommendation algorithms and trending lists for your language/topic.",
    tips: [
      "Add a great README with clear installation instructions and examples",
      "Create a CONTRIBUTING guide to welcome new contributors",
      "Share your milestone on X and developer communities",
      "Respond to issues quickly — community trust is built through responsiveness",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "I pushed my first commit expecting nothing.\n\n100 developers said otherwise.\n\nReal devs found my project, used it, and starred it.\n\nNot because I asked. Because it solved their problem.\n\nOpen source is magic ✨\n\nWhat open source project changed your workflow?",
      "0 → 100 GitHub stars.\n\nDay 1: 0 stars (obviously)\nWeek 2: shared on HN, got 12\nMonth 1: 40 from organic search\nMonth 3: 100 stars\n\nTop traffic source: README quality.\n\nA personal project just became a community project.\n\nWhat's the most underrated open source tool you use?",
      "Built a tool to scratch my own itch.\n\nAlmost kept it private.\n\n\"Who would even use this?\"\n\nThen I open-sourced it anyway.\n\n100 stars later: developers I've never met are using it, filing issues, and thanking me in PRs 🙏\n\nHave you ever hesitated to open-source something?",
    ],
    faqs: [
      { question: "How do I get more GitHub stars?", answer: "Share your project on relevant communities (Hacker News, Reddit, X), write blog posts about how it solves problems, maintain great documentation, and engage with issues and PRs promptly." },
      { question: "Is 100 GitHub stars good?", answer: "Yes! Most GitHub repositories never reach 100 stars. It means your project provides genuine value to the developer community." },
    ],
    cardParams: nextCardParams("github-stars"),
    relatedSlugs: ["500-github-stars", "1k-github-stars", "100-followers"],
  },
  {
    slug: "500-github-stars",
    category: "github-stars",
    metricType: "githubStars",
    value: 500,
    displayValue: "500",
    shortValue: "500",
    title: "500 GitHub Stars — Growing Open Source Project",
    description: "500 GitHub stars! Your open source project is gaining serious traction in the developer community.",
    keywords: ["500 github stars", "github stars milestone", "open source traction", "popular github project"],
    headline: "500 GitHub stars — serious traction!",
    intro: "500 stars means your project is gaining real traction. Developers are not just finding it — they're using it, sharing it, and recommending it to others.",
    whatItMeans: "At 500 stars, your project is well-known in its niche. You're likely getting regular issues, pull requests, and community contributions. This is the level where companies start considering your project for production use.",
    tips: [
      "Set up automated CI/CD to maintain project quality",
      "Create clear release notes and versioning",
      "Consider writing blog posts or tutorials about your project",
      "Add a 'Star History' badge to your README for social proof",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "500 developers don't star a repo by accident.\n\nHalfway to 1K.\n\nWhat started as a weekend experiment is now a tool developers rely on in production.\n\nGrateful for every star, issue, and PR ✨\n\nWhat GitHub repo deserves more stars?",
      "100 → 500 stars. What drove growth:\n\nHacker News post: +120 in 24h\nDev.to article: +80\nReddit thread: +45\nOrganic (README + search): +255\n\nLesson: great docs > great marketing.\n\nHalfway to 1K.\n\nWhat's your go-to way to discover new dev tools?",
      "Built this in a weekend.\n\n\"Probably nobody will use it.\"\n\nThen someone shared it on Hacker News. My phone blew up with GitHub notifications.\n\n500 stars later: a weekend project became infrastructure others depend on 🔥\n\nWhat's the coolest thing you've built in a weekend?",
    ],
    faqs: [
      { question: "What happens at 500 GitHub stars?", answer: "At 500 stars, your project is well-established in its niche. You'll get more issues, PRs, and community contributions. Companies may start evaluating your project for production use." },
    ],
    cardParams: nextCardParams("github-stars"),
    relatedSlugs: ["100-github-stars", "1k-github-stars", "500-followers", "500-mrr"],
  },
  {
    slug: "1k-github-stars",
    category: "github-stars",
    metricType: "githubStars",
    value: 1000,
    displayValue: "1,000",
    shortValue: "1K",
    title: "1,000 GitHub Stars — Popular Open Source Project",
    description: "1K GitHub stars! Your project is officially popular. Celebrate with a milestone visual and share your achievement.",
    keywords: ["1000 github stars", "1k github stars milestone", "popular open source project", "github 1k stars"],
    headline: "1,000 GitHub stars — your project is popular!",
    intro: "1K stars on GitHub is a major milestone. Your project is now officially popular — it's used by developers worldwide and recognized as a valuable tool in the ecosystem.",
    whatItMeans: "At 1,000 stars, your GitHub project is in the top tier of open source projects. Most repositories never reach this milestone. You've built something that resonates with the developer community at scale, and your project likely has a thriving community of users and contributors.",
    tips: [
      "Create comprehensive documentation and a project website",
      "Consider getting sponsorships through GitHub Sponsors",
      "Build a Discord or community for users of your project",
      "Share your 1K milestone — it's a great way to attract even more users",
      "Think about sustainability — how will the project be maintained long-term?",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "1,000 developers said \"this is useful.\"\n\nThat hits different.\n\nFrom my first commit to a project developers worldwide depend on.\n\nOpen source changed my career. This milestone proves it ✨\n\nTo every contributor and user: thank you.\n\nWhat open source project had the biggest impact on your career?",
      "0 → 1,000 GitHub stars.\n\nCommits: 800+\nContributors: 24\nIssues resolved: 150+\nCountries: 30+\nTime to 1K: 14 months\nMost stars in one day: 87 (HN front page)\n\nFour digits. Built by a community.\n\nWhat feature do you wish more open source projects had?",
      "My first commit message was \"initial commit.\"\n\nOriginal, I know.\n\n800 commits later. 24 contributors later. 150 issues resolved later.\n\n1,000 GitHub stars.\n\nOpen source taught me more about software than any job ever did 🙏\n\nWhat's the most valuable thing open source taught you?",
    ],
    faqs: [
      { question: "How rare is 1,000 GitHub stars?", answer: "Very rare — less than 0.5% of all GitHub repositories reach 1,000 stars. It's a significant achievement that marks your project as genuinely valuable to the developer community." },
      { question: "Can I make money from a 1K-star GitHub project?", answer: "Yes! Options include GitHub Sponsors, offering a paid hosted version, consulting, or creating a commercial product based on your open source work. Many successful companies started as popular open source projects." },
    ],
    cardParams: nextCardParams("github-stars"),
    relatedSlugs: ["500-github-stars", "5k-github-stars", "1k-followers", "1k-mrr"],
  },
  {
    slug: "5k-github-stars",
    category: "github-stars",
    metricType: "githubStars",
    value: 5000,
    displayValue: "5,000",
    shortValue: "5K",
    title: "5,000 GitHub Stars — Top-Tier Open Source",
    description: "5K GitHub stars puts your project in the top tier. Celebrate this massive open source achievement.",
    keywords: ["5000 github stars", "5k github stars", "top github project", "popular open source"],
    headline: "5,000 GitHub stars — top-tier open source!",
    intro: "5K stars puts your project among the most recognized tools in the open source ecosystem. You're not just a project — you're an institution.",
    whatItMeans: "At 5,000 stars, your project is used by thousands of developers and companies worldwide. You've built critical infrastructure that people depend on. This level of recognition often leads to conference speaking invitations, job offers, and acquisition interest.",
    tips: [
      "Consider setting up a foundation or governance model for the project",
      "Create a roadmap and involve the community in planning",
      "Explore commercial opportunities — open core, hosted versions, enterprise features",
      "Write about your journey — the dev community wants to learn from your experience",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "5,000 developers starred this project.\n\nI still can't believe it.\n\nCompanies I admire use it. Developers I look up to are filing PRs. Conference organizers are reaching out.\n\nOpen source gave me more than I ever gave it ✨\n\nWhat project are you most proud of building?",
      "100 → 1K → 5K stars.\n\n0-100: pure hustle (posting everywhere)\n100-1K: organic growth (good docs + word of mouth)\n1K-5K: ecosystem effect (integrations + community)\n\nKey insight: after 1K, the community grows the project. Not you.\n\nWhat's the best developer community you've been part of?",
      "Two years ago I pushed code I was afraid to show anyone.\n\nThe API was rough. The docs were barely there. The tests were... aspirational.\n\nBut I shipped anyway.\n\nThen the community showed up. Filed issues. Sent PRs. Wrote docs. Made it better.\n\n5,000 stars later: this is their project as much as mine 🙏",
    ],
    faqs: [
      { question: "What does 5,000 GitHub stars mean?", answer: "5K stars puts your project in the top 0.01% of all GitHub repositories. It's a world-class open source project with a large, active community. Companies regularly evaluate projects at this level for production use." },
    ],
    cardParams: nextCardParams("github-stars"),
    relatedSlugs: ["1k-github-stars", "10k-github-stars", "5k-followers", "5k-mrr"],
  },
  {
    slug: "10k-github-stars",
    category: "github-stars",
    metricType: "githubStars",
    value: 10000,
    displayValue: "10,000",
    shortValue: "10K",
    title: "10,000 GitHub Stars — Legendary Open Source Project",
    description: "10K GitHub stars is legendary. Your open source project is world-class. Celebrate this incredible achievement.",
    keywords: ["10000 github stars", "10k github stars", "legendary github project", "famous open source"],
    headline: "10,000 GitHub stars — legendary!",
    intro: "10K stars. Your project is legendary. It's a household name in the developer community and a testament to what open source can achieve.",
    whatItMeans: "Projects with 10,000+ stars are the tools that define the developer ecosystem. Think of the projects you use daily — many of them are in this range. You've built something at that level. This is a career-defining achievement.",
    tips: [
      "Your project is your resume — leverage it for career and business opportunities",
      "Build a sustainable model — sponsorship, commercial offerings, or foundation support",
      "Continue nurturing the community — it's what made the project great",
      "Share detailed technical posts about your architecture and decisions",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "10,000 GitHub stars.\n\nFive digits.\n\nA project used by developers all over the world, in companies I use every day.\n\nThis is the kind of impact I dreamed about when I wrote my first line of code.\n\nOpen source is the greatest thing in software ✨\n\nWhat open source tool couldn't you live without?",
      "0 → 10,000 stars.\n\nFirst star: Day 1 (it was me lol)\n100 stars: Month 2\n1K stars: Month 8\n5K stars: Month 18\n10K stars: today\n\nContributors: 100+\nUsed by: thousands of companies\n\nTop 0.01% of all GitHub repos. Still open source. Still free.\n\nWhat metric makes you proud of your work?",
      "My first GitHub repo had 0 stars for 6 months.\n\nI almost deleted it.\n\nThen one developer shared it in a Slack group. Then another mentioned it in a blog post.\n\nSnowball effect.\n\n10,000 stars 🔥\n\nBuild something useful, and the world finds you.\n\nWhat project are you working on that the world hasn't found yet?",
    ],
    faqs: [
      { question: "How many GitHub repos have 10K stars?", answer: "Only about 5,000-6,000 repositories on all of GitHub have 10K+ stars. Reaching this milestone puts your project among the most influential open source tools ever created." },
    ],
    cardParams: nextCardParams("github-stars"),
    relatedSlugs: ["5k-github-stars", "10k-followers", "10k-mrr", "1k-customers"],
  },
];

const CUSTOMERS: MilestonePageData[] = [
  {
    slug: "10-customers",
    category: "customers",
    metricType: "totalCustomers",
    value: 10,
    displayValue: "10",
    shortValue: "10",
    title: "10 Customers Milestone — Your First 10 Paying Users",
    description: "You got your first 10 paying customers! Celebrate this early-stage milestone and share it with the community.",
    keywords: ["first 10 customers", "10 customers milestone", "first paying customers", "saas first customers"],
    headline: "10 customers — your first 10 paying users!",
    intro: "10 customers means 10 people believed in your product enough to pay for it. At this stage, each customer is a goldmine of insights.",
    whatItMeans: "Your first 10 customers are the most important customers you'll ever have. They chose your product when it was brand new, unproven, and probably rough around the edges. These early adopters are your co-creators — their feedback will shape everything that comes next.",
    tips: [
      "Have a personal conversation with every single customer",
      "Ask them: 'What made you decide to pay?' — the answer will shape your marketing",
      "Ask: 'What almost stopped you from buying?' — the answer will improve your product",
      "Treat each one like a VIP — early customers become your biggest advocates",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "10 strangers decided my product was worth paying for.\n\nNot friends doing me a favor.\n\nPeople who found my product, saw value, and pulled out their credit card.\n\n10 customers. 10 reasons to keep building 🎯\n\nHow did you get your very first customer?",
      "0 → 10 customers.\n\nCustomer 1: validated the idea\nCustomer 5: revealed a use case I never imagined\nCustomer 10: proved I can do this repeatedly\n\nBest channel: cold DMs\nConversion rate: 8%\n\nThe hardest part is done. Now: 50.\n\nWhat did your first customers teach you?",
      "3 months building before anyone paid me a dollar.\n\nThen I sent 50 cold DMs.\n\n47 rejections. 2 \"maybe laters.\" And 1 \"yes.\"\n\nThat first \"yes\" changed everything.\n\n10 customers later: from 0 to double digits 🔥\n\nWhat's the best cold DM you ever sent?",
    ],
    faqs: [
      { question: "How do I get my first 10 customers?", answer: "Focus on personal outreach — DMs, emails, communities. Your first 10 customers rarely come from marketing. They come from genuine conversations with people who have the problem you're solving." },
      { question: "What should I do after getting 10 customers?", answer: "Talk to all of them. Understand their experience deeply. Fix the biggest pain points. Then focus on getting to 50 — usually by refining your messaging based on what your first 10 customers told you." },
    ],
    cardParams: nextCardParams("customers"),
    relatedSlugs: ["50-customers", "100-customers", "100-mrr", "100-followers"],
  },
  {
    slug: "50-customers",
    category: "customers",
    metricType: "totalCustomers",
    value: 50,
    displayValue: "50",
    shortValue: "50",
    title: "50 Customers Milestone — Growing Customer Base",
    description: "50 paying customers! Your product is resonating with a real market. Celebrate this growth milestone.",
    keywords: ["50 customers milestone", "50 paying customers", "saas customer growth", "growing customer base"],
    headline: "50 customers — your product resonates!",
    intro: "50 customers means your product isn't just for early adopters anymore. People who never heard of you are finding and paying for your product. That's real traction.",
    whatItMeans: "At 50 customers, you've moved beyond friends and early adopters. Your product is attracting strangers who find it through search, word of mouth, or content. This validates that your product solves a real problem for a real market.",
    tips: [
      "Set up customer surveys to gather feedback at scale",
      "Identify your best customers — what do they have in common?",
      "Create a referral program — happy customers are your best marketing",
      "Start building documentation and self-serve onboarding",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "50 people I've never met are paying for my product.\n\nEvery single month.\n\nThis isn't friends doing favors. This is product-market fit.\n\nStrangers finding my product, seeing value, and choosing to pay.\n\n50 customers 🎯\n\nAt what customer count did you feel \"this is real\"?",
      "10 → 50 customers.\n\nFirst 10: all from cold outreach\nNext 40: 60% organic, 25% referrals, 15% content\n\nConversion rate improved from 3% to 9% after fixing onboarding.\n\nYour first 10 customers teach you how to get the next 40.\n\nWhat improved your conversion rate the most?",
      "My 11th customer came from a referral.\n\nMy first customer told a friend.\n\nThat moment changed everything.\n\nMake 10 people incredibly happy, and they do your marketing for you.\n\n50 customers later: word of mouth is my best channel 🔥\n\nWhat product have you recommended recently?",
    ],
    faqs: [
      { question: "Is 50 customers good for a SaaS?", answer: "50 customers is excellent for an early-stage SaaS. It shows clear product-market fit and provides enough data to make informed decisions about pricing, features, and growth strategy." },
    ],
    cardParams: nextCardParams("customers"),
    relatedSlugs: ["10-customers", "100-customers", "500-mrr", "500-followers"],
  },
  {
    slug: "100-customers",
    category: "customers",
    metricType: "totalCustomers",
    value: 100,
    displayValue: "100",
    shortValue: "100",
    title: "100 Customers Milestone — Triple Digits!",
    description: "100 paying customers is a major SaaS milestone. Celebrate triple-digit customers with a professional visual.",
    keywords: ["100 customers milestone", "100 paying customers", "saas 100 customers", "triple digit customers"],
    headline: "100 customers — triple digits!",
    intro: "100 customers is the milestone that transforms your product from 'promising startup' to 'legitimate business.' You've proven that a market exists and you can serve it.",
    whatItMeans: "Reaching 100 paying customers is one of the most important SaaS milestones. It proves repeatable demand — you can acquire, onboard, and retain customers consistently. At this level, you have enough data to optimize your funnel, predict revenue, and plan for growth.",
    tips: [
      "Implement proper customer success — at 100 customers, churn becomes your biggest lever",
      "Create case studies from your best customers",
      "Optimize your onboarding flow — it's now your most important funnel",
      "Set a goal for 500 customers and work backwards to create a plan",
      "Celebrate publicly — 100 customers is a milestone worth sharing",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "100 people pay for my product.\n\nEvery. Single. Month.\n\nTriple digits. A real business serving real people.\n\nFrom launch day jitters to 100 paying customers.\n\nEvery single one taught me something 🎯\n\nWhat milestone made your business feel \"real\"?",
      "0 → 100 customers.\n\nTime to 100: 11 months\nMonthly churn: 4.2%\nLTV: $180\nBest segment: small teams (60% of revenue)\nNPS: 62\n\nTriple-digit customers. Data-driven growth from here.\n\nWhat's your most important customer metric right now?",
      "Customer #1: cold email.\nCustomer #50: referral.\nCustomer #100: Google.\n\nEach wave taught me something different.\n\nCold outreach gets you started.\nHappy customers get you to 50.\nSEO and content get you to 100.\n\nThe playbook changes at every stage 🔥\n\nWhat stage are you in?",
    ],
    faqs: [
      { question: "How long does it take to get 100 customers?", answer: "For most SaaS products, reaching 100 customers takes 6-18 months from launch. The timeline depends on your pricing, market size, and sales/marketing strategy." },
      { question: "What should I focus on after 100 customers?", answer: "Retention. At 100 customers, improving your retention rate has a bigger impact on revenue than acquiring new customers. Focus on customer success, product quality, and onboarding optimization." },
    ],
    cardParams: nextCardParams("customers"),
    relatedSlugs: ["50-customers", "500-customers", "1k-mrr", "1k-followers"],
  },
  {
    slug: "500-customers",
    category: "customers",
    metricType: "totalCustomers",
    value: 500,
    displayValue: "500",
    shortValue: "500",
    title: "500 Customers Milestone — Scaling Up",
    description: "500 customers means your SaaS is scaling. Celebrate this growth milestone with a professional visual.",
    keywords: ["500 customers milestone", "500 paying customers", "saas scaling", "customer growth milestone"],
    headline: "500 customers — scaling up!",
    intro: "500 customers means your product is scaling beyond what one person can personally manage. You're building a machine, not just a product.",
    whatItMeans: "At 500 customers, you've built a scalable acquisition engine. Your product serves a diverse customer base, your processes are being tested, and you need systems to maintain quality. This is where many founders hire their first support or success person.",
    tips: [
      "Invest in customer support tooling and documentation",
      "Segment your customers — different segments need different attention",
      "Build automated onboarding flows",
      "Think about expansion revenue — upsells, add-ons, higher tiers",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "500 businesses depend on my product.\n\nThat's terrifying. And beautiful.\n\nEach one trusting me with part of their workflow.\n\nThe responsibility is immense. And it's the best fuel I've ever had.\n\nFrom solo founder to real company 🎯\n\nWhat's the scariest part of scaling for you?",
      "100 → 500 customers. What changed:\n\nHired first support person (game-changer)\nAutomated onboarding (2x activation)\nAdded annual plans (+35% cash flow)\nChurn dropped from 5.1% to 3.4%\n\nThe product is scaling. And so am I.\n\nWhat hire or change transformed your business?",
      "At 100 customers, I answered every support ticket myself.\n\nAt 300, I was drowning.\n\nAlmost burned out. Then I did something I should have done sooner: asked for help.\n\n500 customers later, with a small team.\n\nScaling means letting go 💪\n\nWhat did you hold onto too long as a founder?",
    ],
    faqs: [
      { question: "How do you manage 500 customers?", answer: "At 500 customers, you need systems: help documentation, automated onboarding, customer support tools, and ideally a dedicated support person. Personal touch for every customer is no longer feasible." },
    ],
    cardParams: nextCardParams("customers"),
    relatedSlugs: ["100-customers", "1k-customers", "5k-mrr", "5k-followers"],
  },
  {
    slug: "1k-customers",
    category: "customers",
    metricType: "totalCustomers",
    value: 1000,
    displayValue: "1,000",
    shortValue: "1K",
    title: "1,000 Customers Milestone — Four-Digit Customer Base",
    description: "1,000 paying customers! You've built a product that serves thousands. Celebrate this incredible milestone.",
    keywords: ["1000 customers milestone", "1k customers", "four digit customers", "saas 1000 customers"],
    headline: "1,000 customers — you serve thousands!",
    intro: "1K customers is an incredible achievement. A thousand people or businesses rely on your product. You've built something that matters at scale.",
    whatItMeans: "At 1,000 customers, you're running a real company. Your product is mission-critical for a thousand users, your revenue is substantial, and your brand has real recognition in your market. This is the milestone that proves your business is built to last.",
    tips: [
      "Build a customer advisory board from your best customers",
      "Invest heavily in product reliability and performance",
      "Create a formal customer success program",
      "Share your milestone — 1K customers is a powerful social proof number",
      "Think about your next 1,000 — what needs to change about your product and processes?",
      "End your post with a question to invite replies — engagement in the first hour boosts reach",
    ],
    captionIdeas: [
      "1,000 businesses trust my product.\n\nA thousand.\n\nEvery morning I wake up knowing that a thousand teams depend on what I built.\n\nThat's humbling. That's motivating.\n\nFrom 0 to 1K. Every single customer matters 🎯\n\nWhat drives you to keep building every day?",
      "0 → 1,000 customers.\n\n10: validation\n50: traction\n100: real business\n500: scaling\n1,000: today\n\nTime: 2.5 years\nTeam: 4 people\nRevenue: life-changing\nChurn: 2.8%\n\nFour-digit customer base. Built to last.\n\nWhat customer milestone are you working toward?",
      "Customer #1 emailed me last week.\n\n\"I've been with you since the beginning.\"\n\nSince the product was buggy, the UI was ugly, and the docs were one paragraph.\n\n1,000 customers later: the early believers are still here.\n\nThat means more than any number 🙏\n\nDo you have a customer who's been there since day one?",
    ],
    faqs: [
      { question: "How rare is 1,000 customers for a SaaS?", answer: "Reaching 1,000 paying customers puts you well ahead of most SaaS companies. The majority of products never reach this scale. It's a testament to strong product-market fit and execution." },
      { question: "What comes after 1,000 customers?", answer: "Focus on efficiency — reducing cost per acquisition, improving retention, and increasing average revenue per user. The path from 1K to 10K customers is about systems and scalability, not hustle." },
    ],
    cardParams: nextCardParams("customers"),
    relatedSlugs: ["500-customers", "10k-mrr", "10k-followers", "1k-github-stars"],
  },
];

// ─── Platform variant pages ────────────────────────────────────────

import {
  PLATFORMS,
  PLATFORM_INFO,
  PLATFORM_TIPS,
  PLATFORM_CAPTIONS,
  PLATFORM_WHAT_IT_MEANS,
  PLATFORM_FAQS,
} from "./milestone-platform-content";

const BASE_MILESTONES: MilestonePageData[] = [
  ...FOLLOWERS,
  ...MRR,
  ...REVENUE,
  ...GITHUB_STARS,
  ...CUSTOMERS,
];

function generatePlatformPages(): MilestonePageData[] {
  const pages: MilestonePageData[] = [];

  for (const base of BASE_MILESTONES) {
    for (const platform of PLATFORMS) {
      const p = PLATFORM_INFO[platform];
      const catLabel = CATEGORY_LABELS[base.category].toLowerCase();
      const captions = PLATFORM_CAPTIONS[platform][base.category];
      const whatItMeans = PLATFORM_WHAT_IT_MEANS[platform][base.category];
      const tips = PLATFORM_TIPS[platform][base.category];
      const faqs = PLATFORM_FAQS[platform][base.category];

      const fillTemplate = (tpl: string) =>
        tpl.replace(/\{v\}/g, base.shortValue).replace(/\{dv\}/g, base.displayValue).replace(/\{cat\}/g, catLabel);

      pages.push({
        slug: `${base.slug}-on-${p.slug}`,
        category: base.category,
        metricType: base.metricType,
        value: base.value,
        displayValue: base.displayValue,
        shortValue: base.shortValue,
        title: `${base.shortValue} ${CATEGORY_LABELS[base.category]} on ${p.shortName} — Milestone Post Template`,
        description: `Celebrate reaching ${base.displayValue} ${catLabel} on ${p.name}. Get tips, post ideas, and create a stunning milestone visual to share on ${p.shortName}.`,
        keywords: [
          `${base.shortValue} ${catLabel} ${p.shortName.toLowerCase()}`,
          `${catLabel} milestone ${p.shortName.toLowerCase()}`,
          `celebrate ${catLabel} on ${p.shortName.toLowerCase()}`,
          `${base.shortValue} ${catLabel} post`,
          `${p.shortName.toLowerCase()} milestone post`,
        ],
        headline: `${base.shortValue} ${catLabel} on ${p.shortName}!`,
        intro: `You just hit ${base.displayValue} ${catLabel} on ${p.name}! Here's how to celebrate this milestone and create a post that resonates with the ${p.shortName} audience.`,
        whatItMeans: whatItMeans(base.shortValue, base.displayValue),
        tips,
        captionIdeas: captions.map((c) => fillTemplate(c.template) + ` ${c.emoji}`),
        faqs,
        cardParams: nextCardParams(base.category),
        relatedSlugs: [
          base.slug,
          ...PLATFORMS.filter((pl) => pl !== platform).slice(0, 2).map((pl) => `${base.slug}-on-${PLATFORM_INFO[pl].slug}`),
        ],
      });
    }
  }

  return pages;
}

const PLATFORM_PAGES = generatePlatformPages();

// ─── All pages + lookups ────────────────────────────────────────────

export const MILESTONE_PAGES: MilestonePageData[] = [
  ...BASE_MILESTONES,
  ...PLATFORM_PAGES,
];

export function getMilestoneBySlug(slug: string): MilestonePageData | undefined {
  return MILESTONE_PAGES.find((m) => m.slug === slug);
}

export function getMilestonesByCategory(category: MilestoneCategory): MilestonePageData[] {
  return MILESTONE_PAGES.filter((m) => m.category === category);
}

export function getNextMilestonePage(slug: string): MilestonePageData | undefined {
  const page = getMilestoneBySlug(slug);
  if (!page) return undefined;
  const category = getMilestonesByCategory(page.category);
  const idx = category.findIndex((m) => m.slug === slug);
  return idx >= 0 && idx < category.length - 1 ? category[idx + 1] : undefined;
}

export function getPrevMilestonePage(slug: string): MilestonePageData | undefined {
  const page = getMilestoneBySlug(slug);
  if (!page) return undefined;
  const category = getMilestonesByCategory(page.category);
  const idx = category.findIndex((m) => m.slug === slug);
  return idx > 0 ? category[idx - 1] : undefined;
}
