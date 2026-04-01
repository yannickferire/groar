// Platform-specific content for milestone pSEO pages
// Each platform has unique tips, caption style, and FAQs

import type { MilestoneCategory } from "./milestone-pages";

export type Platform = "x" | "linkedin" | "instagram" | "tiktok" | "bluesky";

export const PLATFORM_INFO: Record<Platform, { name: string; shortName: string; slug: string }> = {
  x: { name: "X (Twitter)", shortName: "X", slug: "x" },
  linkedin: { name: "LinkedIn", shortName: "LinkedIn", slug: "linkedin" },
  instagram: { name: "Instagram", shortName: "Instagram", slug: "instagram" },
  tiktok: { name: "TikTok", shortName: "TikTok", slug: "tiktok" },
  bluesky: { name: "Bluesky", shortName: "Bluesky", slug: "bluesky" },
};

export const PLATFORMS: Platform[] = ["x", "linkedin", "instagram", "tiktok", "bluesky"];

// ─── Tips per platform x category ──────────────────────────────────

export const PLATFORM_TIPS: Record<Platform, Record<MilestoneCategory, string[]>> = {
  x: {
    followers: [
      "Post your milestone card during peak hours (8-10am or 5-7pm in your timezone)",
      "Quote-tweet your milestone with a thread about your growth journey",
      "Tag people who helped you grow and thank them publicly",
      "Pin the milestone post to your profile for new visitors",
      "End with a question to drive replies in the first hour",
    ],
    mrr: [
      "Build in public posts about MRR milestones get massive engagement on X",
      "Share the real numbers: MRR, churn, customers. Transparency wins on X",
      "Thread your journey from $0 to current MRR for maximum reach",
      "Tag #buildinpublic and #indiehackers for community visibility",
      "Reply to every comment in the first hour to boost the algorithm",
    ],
    revenue: [
      "Revenue milestone posts perform best as visual cards, not just text",
      "Share your revenue timeline: first dollar, first $1K, where you are now",
      "Be transparent about what worked and what didn't",
      "The build in public community on X celebrates revenue milestones loudly",
      "Add context: how long it took, team size, main channel",
    ],
    "github-stars": [
      "Share your milestone with a code snippet or demo GIF for maximum engagement",
      "Tag the top contributors who helped build the project",
      "Cross-post to dev communities after posting on X",
      "Include a link to the repo so people can star it right away",
      "Show the star history chart alongside your milestone card",
    ],
    customers: [
      "Customer milestones are powerful social proof on X",
      "Share a quote from one of your customers alongside the number",
      "Break down your acquisition channels: what brought each wave of customers",
      "Post during weekday mornings when SaaS founders are most active",
      "Mention your zero-ads strategy if applicable: organic growth stories resonate",
    ],
  },
  linkedin: {
    followers: [
      "Write a story format: where you started, what changed, where you are now",
      "LinkedIn's algorithm boosts posts with 8+ comments in the first hour",
      "Use 3-5 line breaks between paragraphs for readability in the feed",
      "Add your milestone card as the post image for 2x more impressions",
      "Ask a question at the end that invites professional insights",
    ],
    mrr: [
      "Frame your MRR milestone as a business lesson, not just a celebration",
      "LinkedIn loves data: share specific metrics alongside your milestone",
      "Connect your MRR journey to broader entrepreneurship themes",
      "Tag your mentors and advisors who helped you reach this point",
      "Post on Tuesday-Thursday mornings for maximum B2B visibility",
    ],
    revenue: [
      "Position your revenue story as inspiration for other professionals",
      "LinkedIn engagement peaks when you share vulnerability alongside success",
      "Include a \"what I'd do differently\" section for maximum comments",
      "Revenue posts with a visual card get 3x more shares than text-only",
      "Comment on your own post with additional context to boost reach",
    ],
    "github-stars": [
      "Frame your open source success as a career development story",
      "LinkedIn's developer audience appreciates technical milestone posts",
      "Connect your project's growth to industry trends for broader appeal",
      "Share what you learned about community building through open source",
      "Tag companies using your project for social proof",
    ],
    customers: [
      "Frame customer growth as a team achievement and tag your colleagues",
      "Share a specific customer success story alongside the number",
      "LinkedIn audiences love the journey narrative: from idea to 100 customers",
      "Use the milestone to announce what's coming next for your product",
      "Post early in the week for maximum professional audience reach",
    ],
  },
  instagram: {
    followers: [
      "Share your milestone card as a carousel with a growth story in the slides",
      "Use Instagram Stories to share your reaction to hitting the milestone",
      "Add 5-10 relevant hashtags in a comment (not the caption) for discoverability",
      "Create a Reel showing your follower count journey over time",
      "Pin the milestone post to the top of your grid",
    ],
    mrr: [
      "Create a carousel breaking down your revenue journey visually",
      "Instagram Stories with poll stickers drive engagement on milestone posts",
      "Use the milestone card as slide 1, then share your story in slides 2-5",
      "Behind-the-scenes content performs well alongside business milestones",
      "Save the post to a \"Milestones\" highlight for social proof",
    ],
    revenue: [
      "Visual content is king on Instagram: lead with your milestone card",
      "Use carousel format: card > journey > lessons > what's next",
      "Share your revenue milestone as a Reel with trending audio for extra reach",
      "Keep the caption short and visual, save details for carousel slides",
      "Add it to your bio link page as a trust signal",
    ],
    "github-stars": [
      "Turn your GitHub stars milestone into a visual story with screenshots",
      "Dev content on Instagram is niche but highly engaged",
      "Use Reels to show a quick demo of your project alongside the milestone",
      "Cross-promote: link to your GitHub in bio after posting",
      "Carousel: milestone card > what the project does > code snippets > CTA",
    ],
    customers: [
      "Feature a customer testimonial alongside your milestone number",
      "Carousel format: milestone card > customer quotes > product screenshots",
      "Use Instagram Stories for real-time milestone celebrations",
      "Tag customers who gave you permission to share their feedback",
      "Save customer milestone posts to a dedicated highlight reel",
    ],
  },
  tiktok: {
    followers: [
      "Film a genuine reaction to hitting your milestone for maximum authenticity",
      "Use trending audio under your milestone card for algorithmic boost",
      "Keep it under 30 seconds: show the number, share one key lesson",
      "Duet or stitch other creators' milestone content to ride the trend",
      "Post between 7-9pm when engagement peaks on TikTok",
    ],
    mrr: [
      "\"Day in the life of a founder making $X/month\" format performs insanely well",
      "Show your actual dashboard/Stripe notification for authenticity",
      "TikTok audiences love the raw, unfiltered entrepreneurship content",
      "Keep it casual: talk to the camera like you're telling a friend",
      "Use the green screen effect with your milestone card as the background",
    ],
    revenue: [
      "Film a quick talking-head video reacting to your revenue milestone",
      "TikTok loves before/after content: $0 vs $X revenue",
      "Show the product behind the revenue: quick demo + milestone number",
      "Use text overlays on screen to highlight key numbers",
      "Post the raw, unedited reaction for maximum authenticity",
    ],
    "github-stars": [
      "\"Things I built that people actually use\" is a winning TikTok format",
      "Show a quick demo of your project alongside the stars count",
      "Dev TikTok is growing fast: milestone content helps you find your niche",
      "Use screen recording to show the stars climbing in real-time",
      "Explain what your project does in 15 seconds, then drop the milestone",
    ],
    customers: [
      "\"I have X people paying for my app\" with a reaction video crushes on TikTok",
      "Show the behind-the-scenes: your desk, your setup, your Stripe dashboard",
      "Film a \"storytime\" about your journey to X customers",
      "Keep it authentic: TikTok penalizes overly polished content",
      "Use the milestone card as a visual in your video",
    ],
  },
  bluesky: {
    followers: [
      "Bluesky values authentic, non-algorithmic growth conversations",
      "Share your milestone in a relevant custom feed for targeted visibility",
      "The Bluesky community appreciates open and honest growth stories",
      "Engage with replies thoughtfully: Bluesky rewards genuine conversations",
      "Tag the post with relevant topics for feed discovery",
    ],
    mrr: [
      "Bluesky's indie/tech community is perfect for build in public content",
      "Share specific numbers: the Bluesky audience values transparency",
      "Connect your milestone to the open web / indie web movement",
      "Cross-reference your journey on other platforms for context",
      "The developer-heavy audience appreciates technical details about your stack",
    ],
    revenue: [
      "Bluesky's growing creator economy community celebrates revenue milestones",
      "Share your revenue story as an alternative to VC-funded narratives",
      "The bootstrapped/indie angle resonates strongly on Bluesky",
      "Post in relevant custom feeds where founders and builders hang out",
      "Be specific about what drove the revenue: Bluesky users love details",
    ],
    "github-stars": [
      "Bluesky has a strong developer community that celebrates open source",
      "Share your project alongside the milestone for direct discovery",
      "The AT Protocol community on Bluesky especially values open source work",
      "Connect your project to the decentralized/open web narrative",
      "Engage with dev-focused custom feeds for maximum visibility",
    ],
    customers: [
      "Bluesky's indie-friendly community roots for bootstrapped businesses",
      "Share your customer growth story with full transparency",
      "Connect with other founders on Bluesky for cross-promotion opportunities",
      "The platform's anti-hype culture rewards honest, specific milestone posts",
      "Share what your customers taught you alongside the number",
    ],
  },
};

// ─── Caption templates per platform x category ─────────────────────
// {v} = shortValue, {dv} = displayValue, {cat} = category label

type CaptionTemplate = { template: string; emoji: string };

function t(template: string, emoji: string): CaptionTemplate {
  return { template, emoji };
}

export const PLATFORM_CAPTIONS: Record<Platform, Record<MilestoneCategory, CaptionTemplate[]>> = {
  x: {
    followers: [
      t("{v} followers on X.\n\nNo hacks. No follow-for-follow.\n\nJust posting, replying, and showing up every day.\n\nThe algorithm rewards conversations.\n\nThank you for being here.", "🚀"),
      t("0 → {v} followers on X.\n\nWhat actually worked:\n\n1 post/day\nGenuine replies\nZero viral tricks\n\nMost growth came from conversations, not content.\n\nWhat's your top growth tip on X?", "🔥"),
      t("{v} people chose to follow my journey on X.\n\nEvery one of them earned, not bought.\n\nPosting into the void until it wasn't.\n\nThis platform changed everything for me.", "🙏"),
    ],
    mrr: [
      t("{v} MRR.\n\nBuilt in public on X from day one.\n\nShared the wins, the failures, the real numbers.\n\nThis community pushed me to keep going.\n\nX is the best platform for SaaS founders. Period.", "🔥"),
      t("$0 → {v} MRR.\n\nShared every step on X.\n\nThe build in public community here is unmatched.\n\nEvery reply, every DM, every repost helped.\n\nWhat's your current MRR?", "🚀"),
      t("{v} MRR and I shared it all on X.\n\nThe good months.\nThe bad months.\nThe months I almost quit.\n\nTransparency is the best marketing strategy.\n\nWhat milestone are you chasing?", "💪"),
    ],
    revenue: [
      t("{v} in total revenue.\n\nShared the journey here on X from the very first dollar.\n\nBuild in public works.\nTransparency works.\nShowing up works.\n\nWhat revenue milestone are you working toward?", "🔥"),
      t("$0 → {v} revenue.\n\nEvery milestone shared on X.\nEvery lesson learned in public.\n\nThis platform is the best distribution channel a solo founder can have.\n\nGrateful for this community.", "🙏"),
      t("{v} earned from a product I built.\n\nX was my only marketing channel.\n\nPosting, engaging, building trust one tweet at a time.\n\nOrganic growth is slow but it compounds.", "🚀"),
    ],
    "github-stars": [
      t("{v} GitHub stars.\n\nShared the project on X and the dev community showed up.\n\nFiled issues. Sent PRs. Spread the word.\n\nOpen source + X is an incredible combination.\n\nWhat project deserves more stars?", "✨"),
      t("0 → {v} stars on GitHub.\n\nThe growth came from sharing on X.\n\nOne post. A few retweets. Then the snowball started.\n\nThe dev community on X is the best.\n\nWhat are you building?", "🔥"),
      t("{v} developers starred my project.\n\nMost discovered it through X.\n\nThis platform is where open source gets discovered.\n\nGrateful for every star, issue, and PR.", "🙏"),
    ],
    customers: [
      t("{v} paying customers.\n\nMost of them found me through X.\n\nBuilding in public turned followers into users, and users into customers.\n\nThe best sales funnel is trust.\n\nHow did you get your first customers?", "🎯"),
      t("0 → {v} customers.\n\nAcquisition channel #1: X.\n\nNo ads. No cold emails. Just sharing the journey.\n\nPeople buy from people they trust.\n\nWhat's working for your acquisition?", "🔥"),
      t("{v} people pay for my product.\n\nStarted by sharing what I was building on X.\n\nThe community gave feedback, shared it, and became customers.\n\nBuild in public is the ultimate growth hack.", "🚀"),
    ],
  },
  linkedin: {
    followers: [
      t("{v} followers on LinkedIn.\n\nNot connections. Followers.\n\nPeople who chose to see my content in their feed because it brings them value.\n\nThe professional network is becoming a creator platform.\n\nWhat's working for your LinkedIn growth?", "🚀"),
      t("I hit {v} followers on LinkedIn.\n\nHere's what I learned:\n\nConsistency beats perfection.\nComments matter more than likes.\nStories outperform hot takes.\n\nLinkedIn rewards depth over virality.", "💡"),
      t("{v} people follow me on LinkedIn.\n\nEvery one of them is a professional who decided my content was worth their time.\n\nThat means more than any vanity metric.\n\nWhat made you start creating on LinkedIn?", "🙏"),
    ],
    mrr: [
      t("{v} MRR.\n\nSharing this on LinkedIn because the professional community here understands what this number means.\n\nMonths of building. Iterations. Customer conversations.\n\nThis is what product-market fit looks like.\n\nWhat's your biggest business lesson this year?", "📈"),
      t("My SaaS just hit {v} MRR.\n\nI started sharing my journey on LinkedIn 6 months ago.\n\nThe feedback from this community shaped my product more than any survey.\n\nLinkedIn is underrated for B2B founders.\n\nWhat business milestone are you working toward?", "🔥"),
      t("{v} in monthly recurring revenue.\n\nBehind this number:\n\nCountless customer calls\nFeatures built and killed\nLessons only failure teaches\n\nThe entrepreneurship journey is messy. And worth it.", "💪"),
    ],
    revenue: [
      t("{v} in total revenue.\n\nSharing this because I believe in building transparently.\n\nThe professional community on LinkedIn has been incredibly supportive of this journey.\n\nWhat's the revenue milestone that changed your perspective?", "📈"),
      t("My product generated {v} in revenue.\n\nHere's what I wish I knew at $0:\n\nPrice higher than you think.\nTalk to customers weekly.\nDistribution > product.\n\nWhat's your top business lesson?", "💡"),
      t("{v} earned.\n\nNot from consulting. Not from a salary.\n\nFrom a product that solves a real problem for real businesses.\n\nLinkedIn helped me find my first 20 customers.\n\nNever underestimate this platform for B2B.", "🚀"),
    ],
    "github-stars": [
      t("{v} GitHub stars on my open source project.\n\nSharing this on LinkedIn because open source is a career accelerator that too few professionals talk about.\n\nIt opened doors I didn't know existed.\n\nWhat open source project impressed you recently?", "✨"),
      t("My open source project just hit {v} stars.\n\nWhat started as a side project became a portfolio piece that speaks louder than any resume.\n\nLinkedIn recruiters: yes, the link is in my profile.\n\nWhat side project changed your career?", "🔥"),
      t("{v} developers starred my project on GitHub.\n\nOpen source taught me more about software engineering than any job.\n\nCode review from strangers. Issues from production users. PRs from around the world.\n\nThe best learning environment is open source.", "🙏"),
    ],
    customers: [
      t("{v} paying customers.\n\nBehind each number is a business that trusted us with part of their workflow.\n\nThat responsibility drives everything we build.\n\nWhat customer milestone made your business feel real?", "🎯"),
      t("We just crossed {v} customers.\n\nThe journey from 1 to {v}:\n\nFirst 10: personal outreach\nNext 50: word of mouth\nThe rest: content and SEO\n\nThe playbook changes at every stage.\n\nWhat stage are you in?", "📈"),
      t("{v} customers chose our product.\n\nLinkedIn was key to our early B2B growth.\n\nSharing insights, engaging with our ICP, building trust before the sales call.\n\nSocial selling works when it's genuine.", "💪"),
    ],
  },
  instagram: {
    followers: [
      t("{v} followers on Instagram.\n\nEvery single one chose to see my content in their feed.\n\nConsistency + Reels + genuine engagement.\n\nThat's the formula. No shortcuts.\n\nWhat's your Instagram growth tip?", "🚀"),
      t("Just hit {v} followers on Instagram.\n\nCarousels drove 60% of the growth.\nReels brought the reach.\nStories built the connection.\n\nThe visual platform rewards visual thinkers.\n\nHow are you growing on IG?", "🔥"),
      t("{v} on Instagram.\n\nStarted posting consistently 6 months ago.\n\nThe algorithm took a while to notice.\n\nBut once it did, the compound effect kicked in.\n\nPatience is the most underrated growth strategy.", "💪"),
    ],
    mrr: [
      t("{v} MRR and I'm sharing the journey on Instagram.\n\nBehind-the-scenes content.\nReal numbers.\nReal struggles.\n\nThe founder journey is visual. Instagram gets that.\n\nSwipe for the full breakdown.", "🔥"),
      t("My SaaS makes {v} per month.\n\nI share every step on Instagram.\n\nThe carousel format is perfect for breaking down metrics.\n\nSlide 1: the number\nSlide 2-5: how I got here\n\nWhat business content do you like on IG?", "📊"),
      t("{v} MRR.\n\nShared as a carousel because the story deserves more than one slide.\n\nFrom idea to revenue.\nFrom doubt to proof.\n\nCheck my highlights for the full journey.", "🚀"),
    ],
    revenue: [
      t("{v} in revenue.\n\nThis is what building a product looks like.\n\nNot overnight success.\nNot luck.\n\nJust showing up, shipping, and iterating.\n\nSave this if you're on the same journey.", "🔥"),
      t("Revenue milestone: {v}.\n\nI documented every step on Instagram.\n\nThe carousels. The Reels. The behind-the-scenes Stories.\n\nContent is the best marketing for a bootstrapped product.", "💪"),
      t("{v} earned from my product.\n\nInstagram helped me tell the story visually.\n\nPeople connect with the journey, not just the numbers.\n\nWhat revenue goal are you working toward?", "🎯"),
    ],
    "github-stars": [
      t("{v} GitHub stars.\n\nSharing this on Instagram because dev content deserves a visual platform too.\n\nCode is beautiful. Open source is beautiful.\n\nTime to show it.\n\nWhat project are you building?", "✨"),
      t("My open source project hit {v} stars.\n\nTurning it into a carousel:\n\nSlide 1: the milestone\nSlide 2: what it does\nSlide 3: the code\nSlide 4: how to contribute\n\nDev Instagram is underrated.", "🔥"),
      t("{v} developers starred my project.\n\nSharing the visual journey on Instagram.\n\nBecause code has a story too.\n\nSwipe to see how it started.", "🚀"),
    ],
    customers: [
      t("{v} customers.\n\nEach one found through a different channel.\n\nBut Instagram helped me build the brand that made people trust the product.\n\nVisual storytelling sells.\n\nHow are you building trust with your audience?", "🎯"),
      t("We hit {v} paying customers.\n\nDocumenting it all on Instagram.\n\nThe wins. The losses. The lessons.\n\nCarousel coming with the full breakdown.\n\nSave this for motivation.", "🔥"),
      t("{v} people pay for my product.\n\nInstagram showed me that behind every customer is a person who connected with my story first.\n\nSell the journey, not just the product.", "💪"),
    ],
  },
  tiktok: {
    followers: [
      t("{v} followers on TikTok.\n\nNo viral dance. No trending audio hack.\n\nJust talking to the camera about what I'm building.\n\nAuthenticity wins on this platform.\n\nWhat's your TikTok growth story?", "🔥"),
      t("Just hit {v} followers on TikTok.\n\nThe algorithm is wild.\n\nOne video: 50 views.\nNext video: 500K views.\n\nYou never know which post changes everything.\n\nKeep posting.", "🚀"),
      t("{v} on TikTok.\n\nStarted posting founder content 3 months ago.\n\nThe audience here is hungry for real stories.\n\nNo polish needed. Just show up and be honest.\n\nThat's it. That's the strategy.", "💪"),
    ],
    mrr: [
      t("{v} MRR from my app.\n\nSharing this on TikTok because this platform needs more real founder content.\n\nNot fake gurus. Not rented Lambos.\n\nReal numbers from a real product.\n\nWhat are you building?", "🔥"),
      t("My app makes {v} per month.\n\nFilmed my reaction when I saw the number.\n\nTikTok loves raw, unfiltered moments.\n\nThis is what building a SaaS actually looks like.\n\nNo filter needed.", "🚀"),
      t("{v} MRR.\n\nShowing my Stripe dashboard on TikTok because transparency is the new flex.\n\nReal revenue. Real product. Real journey.\n\nDrop your MRR in the comments.", "💪"),
    ],
    revenue: [
      t("{v} in revenue from an app I built.\n\nTikTok told me to share this.\n\nSo here it is. The real number. No cap.\n\nBuilding in public hits different on this platform.\n\nWhat's your revenue goal?", "🔥"),
      t("Revenue check: {v}.\n\nNo course to sell you. No mentorship program.\n\nJust a founder sharing real numbers.\n\nTikTok needs more of this.\n\nLess guru content. More real builders.", "💪"),
      t("My product made {v}.\n\nFilmed my actual reaction.\n\nTikTok is where I share the unfiltered journey.\n\nThe highs. The lows. The real numbers.\n\nFollow for more founder content.", "🚀"),
    ],
    "github-stars": [
      t("{v} stars on GitHub.\n\nDev TikTok, we made it.\n\nBuilt something useful. Open sourced it. People cared.\n\nThe developer community is everywhere.\n\nEven on TikTok.\n\nWhat are you building?", "✨"),
      t("My open source project hit {v} stars.\n\nShowing this on TikTok because coding content deserves more love here.\n\nQuick demo in the next video.\n\nFollow if you like dev content.", "🔥"),
      t("{v} GitHub stars.\n\nPosting this on TikTok because why not.\n\nOpen source is cool.\nBuilding in public is cool.\n\nDev TikTok rise up.", "🚀"),
    ],
    customers: [
      t("{v} people pay for my app.\n\nLet that sink in.\n\nI built something. Strangers use it. And they pay for it.\n\nTikTok, this is the founder dream.\n\nWhat are you building?", "🔥"),
      t("{v} paying customers.\n\nNo VC money. No growth hacks.\n\nJust a product that solves a real problem.\n\nSharing the raw numbers on TikTok because transparency wins.\n\nDrop your customer count below.", "💪"),
      t("Customer milestone: {v}.\n\nFilmed my reaction because this stuff never gets old.\n\nEvery new customer is validation.\n\nTikTok founder content hits different.", "🚀"),
    ],
  },
  bluesky: {
    followers: [
      t("{v} followers on Bluesky.\n\nThis platform feels different.\n\nNo algorithm manipulation. No engagement bait.\n\nJust genuine conversations and people who actually read your posts.\n\nThe open web is growing.", "🦋"),
      t("Hit {v} followers on Bluesky.\n\nGrowing here feels organic in a way other platforms don't.\n\nCustom feeds help the right people find your content.\n\nNo tricks needed. Just be interesting.\n\nWhat brought you to Bluesky?", "🚀"),
      t("{v} on Bluesky.\n\nThe community here is small but mighty.\n\nEvery follower feels intentional.\n\nNo bots. No follow-for-follow.\n\nJust people who care about what you share.", "🙏"),
    ],
    mrr: [
      t("{v} MRR.\n\nSharing on Bluesky because the indie web community here gets it.\n\nBootstrapped. Transparent. Building in the open.\n\nThis platform is perfect for founders who value authenticity over hype.\n\nWhat are you building?", "🔥"),
      t("My SaaS hit {v} MRR.\n\nBluesky's founder community is small but incredibly supportive.\n\nNo growth hacking vibes. Just genuine builders sharing real numbers.\n\nThis is what the internet should feel like.", "🦋"),
      t("{v} in monthly recurring revenue.\n\nSharing here because Bluesky rewards honest content.\n\nNo algorithm to game. No engagement tricks.\n\nJust real builders and real conversations.\n\nWhat's your current MRR?", "💪"),
    ],
    revenue: [
      t("{v} in total revenue.\n\nBluesky feels like the right place to share this.\n\nThe indie web is alive and the people here understand what it takes to build something from nothing.\n\nGrateful for this community.", "🦋"),
      t("Revenue milestone: {v}.\n\nSharing transparently on Bluesky because that's what this platform is about.\n\nNo hype. No fake screenshots.\n\nReal revenue from a real product.\n\nWhat are you working on?", "🔥"),
      t("{v} earned.\n\nBluesky's bootstrapper community is the most supportive I've found.\n\nEvery milestone shared here gets thoughtful responses.\n\nNot just likes. Real conversations.\n\nThat matters more than reach.", "🙏"),
    ],
    "github-stars": [
      t("{v} GitHub stars.\n\nBluesky's developer community is one of the best.\n\nOpen source + open social web = perfect match.\n\nThe AT Protocol folks especially appreciate open source work.\n\nWhat project are you contributing to?", "✨"),
      t("My project hit {v} stars on GitHub.\n\nThe dev community on Bluesky helped spread the word.\n\nDecentralized social + open source code.\n\nThis is the internet I want to build.\n\nWhat's your favorite open source project?", "🦋"),
      t("{v} GitHub stars.\n\nSharing on Bluesky because this platform was built by developers who understand open source.\n\nGrateful for every star, fork, and PR.\n\nThe open web is strong.", "🙏"),
    ],
    customers: [
      t("{v} paying customers.\n\nBluesky's indie community celebrated every milestone with me.\n\nFrom 0 to {v}. Shared every step.\n\nThis platform rewards transparency over performance.\n\nWhat milestone are you working toward?", "🦋"),
      t("{v} customers trust my product.\n\nSharing on Bluesky because the founder community here is real.\n\nNo hustle culture. No toxic positivity.\n\nJust builders supporting builders.\n\nWhat's your customer count?", "🔥"),
      t("Customer milestone: {v}.\n\nBluesky might be smaller than other platforms.\n\nBut the quality of conversations here is unmatched.\n\nEvery reply adds value. Every interaction feels human.\n\nThis is how social should work.", "🙏"),
    ],
  },
};

// ─── What it means per platform x category ─────────────────────────

export const PLATFORM_WHAT_IT_MEANS: Record<Platform, Record<MilestoneCategory, (v: string, dv: string) => string>> = {
  x: {
    followers: (v, dv) => `Reaching ${dv} followers on X means your voice carries real weight on the platform. X's algorithm rewards engagement, so ${dv} followers translates to thousands of impressions per post. At this level, your replies get noticed, your threads get shared, and your influence in the build in public community grows with every interaction.`,
    mrr: (v, dv) => `Sharing ${v} MRR on X is a powerful move. The build in public community on X is the most active in the world, and MRR milestones consistently get the highest engagement of any content type. Founders, indie hackers, and investors watch these numbers closely. Your transparency becomes your marketing.`,
    revenue: (v, dv) => `Posting your ${v} revenue milestone on X puts you in front of the most engaged entrepreneurship community online. Revenue posts signal credibility and attract customers, collaborators, and opportunities. The X algorithm tends to boost milestone content because it drives replies and conversations.`,
    "github-stars": (v, dv) => `${dv} GitHub stars shared on X reaches the world's largest developer audience on social media. Dev Twitter (now X) has always been where open source projects get discovered. A milestone post here can drive a surge of new stars, contributors, and users to your project.`,
    customers: (v, dv) => `Celebrating ${dv} customers on X is powerful social proof. The SaaS community on X pays close attention to customer milestones because they signal real product-market fit. Unlike revenue (which can come from a few big clients), customer count shows broad adoption.`,
  },
  linkedin: {
    followers: (v, dv) => `${dv} followers on LinkedIn represents a professional audience that actively chose to follow your content. Unlike connections (which are mutual), followers on LinkedIn are people who find value in what you share. LinkedIn's algorithm heavily favors content that generates comments, so ${dv} followers here means meaningful professional influence.`,
    mrr: (v, dv) => `Sharing ${v} MRR on LinkedIn positions you as a credible entrepreneur in the world's largest professional network. LinkedIn's audience includes potential customers, investors, and partners. Business metrics posts perform exceptionally well on LinkedIn because the audience understands and appreciates them.`,
    revenue: (v, dv) => `Posting ${v} in revenue on LinkedIn signals business credibility to a professional audience. LinkedIn is where B2B decisions are made, and revenue milestones serve as powerful trust signals. Your post will be seen by potential customers, partners, and industry peers who can directly impact your business.`,
    "github-stars": (v, dv) => `${dv} GitHub stars shared on LinkedIn showcases your technical leadership to recruiters, hiring managers, and potential collaborators. Open source contributions are increasingly valued in professional contexts, and LinkedIn is where that value gets recognized. A milestone post here can open career doors.`,
    customers: (v, dv) => `Celebrating ${dv} customers on LinkedIn is a powerful B2B signal. Your professional network includes potential customers who trust social proof from their peers. Customer milestones on LinkedIn often generate inbound leads because decision-makers see the traction and want to evaluate your product.`,
  },
  instagram: {
    followers: (v, dv) => `${dv} followers on Instagram means your visual content resonates. Instagram's algorithm prioritizes content that gets saves and shares, so reaching ${dv} followers means your posts consistently deliver value worth saving. At this level, your Reels reach exponentially more people and your brand becomes visually recognizable.`,
    mrr: (v, dv) => `Sharing ${v} MRR on Instagram brings your business story to a visual-first audience. The founder content niche on Instagram is growing fast, and milestone posts in carousel format consistently outperform text-only content. Visual proof of your revenue journey builds trust with a new audience.`,
    revenue: (v, dv) => `Posting ${v} revenue on Instagram turns a number into a visual story. Instagram's carousel and Reel formats are perfect for breaking down your revenue journey into digestible, shareable slides. The platform's younger audience is increasingly interested in entrepreneurship and startup content.`,
    "github-stars": (v, dv) => `${dv} GitHub stars shared on Instagram bridges the gap between developer and mainstream audiences. Dev content on Instagram is a growing niche with high engagement because it stands out in people's feeds. Visual code content, project demos, and milestone celebrations perform well.`,
    customers: (v, dv) => `Celebrating ${dv} customers on Instagram turns social proof into visual content. Customer testimonials, behind-the-scenes product content, and milestone visuals perform exceptionally well in carousel format. Instagram's algorithm rewards content that tells a story, and customer milestones are the ultimate story.`,
  },
  tiktok: {
    followers: (v, dv) => `${dv} followers on TikTok means the algorithm chose your content. TikTok's For You page can surface your videos to millions regardless of follower count, so ${dv} followers means people consistently watched, engaged, and hit follow. On TikTok, follower quality is high because users have to actively choose to follow after seeing your content organically.`,
    mrr: (v, dv) => `Sharing ${v} MRR on TikTok is a bold move that pays off. Founder content on TikTok is exploding because the audience craves authenticity. Polished LinkedIn posts don't work here. Showing your real Stripe dashboard and reacting genuinely to your MRR number is what goes viral.`,
    revenue: (v, dv) => `${v} revenue shared on TikTok reaches a massive audience that's hungry for real entrepreneurship content. The platform's algorithm doesn't care about your follower count, so even a small account can go viral with authentic revenue content. TikTok is where the next generation of entrepreneurs gets inspired.`,
    "github-stars": (v, dv) => `${dv} GitHub stars shared on TikTok taps into the growing developer content niche. Dev TikTok is one of the fastest-growing communities on the platform. Quick project demos, coding tips, and milestone celebrations consistently perform well because they stand out from typical TikTok content.`,
    customers: (v, dv) => `Celebrating ${dv} customers on TikTok brings your business story to a massive, engaged audience. The \"day in my life as a founder\" and \"how I built an app\" formats are hugely popular. Customer milestones add credibility to your founder content and drive genuine interest in your product.`,
  },
  bluesky: {
    followers: (v, dv) => `${dv} followers on Bluesky represents a curated, intentional audience. Without algorithmic manipulation, every follower on Bluesky chose to follow you based on your content quality alone. The platform's custom feeds system means your content reaches people genuinely interested in your niche. Growth here is organic in the truest sense.`,
    mrr: (v, dv) => `Sharing ${v} MRR on Bluesky resonates with the platform's indie builder community. Bluesky attracts developers, founders, and creators who value the open web over walled gardens. MRR milestones here generate thoughtful conversations instead of surface-level engagement. The quality of feedback is unmatched.`,
    revenue: (v, dv) => `${v} revenue shared on Bluesky reaches a community that genuinely values bootstrapped, transparent businesses. The platform's culture favors substance over hype. Revenue milestones posted here attract quality engagement from people who understand and appreciate the indie builder journey.`,
    "github-stars": (v, dv) => `${dv} GitHub stars shared on Bluesky is a natural fit. The platform was built on the AT Protocol by developers who value open source. The developer community on Bluesky is highly engaged and appreciates open source milestones. Your project can gain real contributors from the conversations here.`,
    customers: (v, dv) => `Celebrating ${dv} customers on Bluesky connects your milestone with a community that roots for indie businesses. The platform's anti-corporate culture means bootstrapped customer growth stories are celebrated more authentically here than on any other social network. Conversations are deeper and more meaningful.`,
  },
};

// ─── FAQs per platform x category ──────────────────────────────────

export const PLATFORM_FAQS: Record<Platform, Record<MilestoneCategory, { question: string; answer: string }[]>> = {
  x: {
    followers: [
      { question: "What's the best time to post a follower milestone on X?", answer: "Weekday mornings (8-10am) and evenings (5-7pm) in your timezone tend to get the most engagement. The first hour of replies is critical for X's algorithm, so post when your audience is most active." },
      { question: "How do I create a follower milestone image for X?", answer: "Use GROAR to create a professional milestone card. Connect your X account, select the milestone template, and your follower count is automatically imported. Export the image and share it directly to X." },
    ],
    mrr: [
      { question: "Should I share my MRR publicly on X?", answer: "Building in public with real numbers is one of the most effective growth strategies on X. The indie hacker community values transparency, and MRR posts consistently get high engagement. Just share what you're comfortable with." },
      { question: "What hashtags should I use for MRR milestones on X?", answer: "The most relevant hashtags are #buildinpublic, #indiehackers, #saas, and #mrr. Don't overdo it though. 2-3 hashtags max. The content matters more than the tags." },
    ],
    revenue: [
      { question: "How do I make a revenue milestone post for X?", answer: "Use GROAR to create a clean visual with your revenue number. Pair it with your story: how long it took, what you built, and what you learned. Visual posts get 2-3x more engagement than text-only on X." },
    ],
    "github-stars": [
      { question: "How do I announce GitHub stars on X?", answer: "Share your milestone card with a link to the repo. Include a brief description of what the project does. Tag key contributors. Posts about open source consistently perform well on dev Twitter." },
    ],
    customers: [
      { question: "Should I share my customer count on X?", answer: "Yes! Customer milestones are powerful social proof. They signal product-market fit more clearly than revenue (which could come from a few big contracts). The SaaS community on X celebrates customer milestones enthusiastically." },
    ],
  },
  linkedin: {
    followers: [
      { question: "How do I grow followers on LinkedIn?", answer: "Post consistently (3-5x/week), focus on storytelling over tips, engage meaningfully in comments on others' posts, and share personal lessons from your professional experience. LinkedIn's algorithm heavily rewards comment engagement." },
      { question: "What's a good follower count on LinkedIn?", answer: "Context matters: for most professionals, 1K+ followers puts you in the top tier of content creators on the platform. LinkedIn has lower follower counts than X or Instagram, but the audience is more targeted and valuable for B2B." },
    ],
    mrr: [
      { question: "Is LinkedIn good for sharing SaaS milestones?", answer: "Absolutely. LinkedIn's professional audience includes potential customers, investors, and partners. MRR posts position you as a credible entrepreneur and often generate inbound leads. The key is to frame it as a business lesson, not just a celebration." },
    ],
    revenue: [
      { question: "How should I format a revenue post on LinkedIn?", answer: "Lead with a hook, use short paragraphs with line breaks, include your milestone visual, and end with a thought-provoking question. LinkedIn posts with images get 2x the engagement of text-only." },
    ],
    "github-stars": [
      { question: "Should I share GitHub milestones on LinkedIn?", answer: "Yes, especially if you're in tech. Open source contributions signal technical leadership and initiative. Frame it as a career story: what you built, why, and what you learned. Recruiters and tech leaders pay attention." },
    ],
    customers: [
      { question: "How do customer milestone posts perform on LinkedIn?", answer: "Very well. B2B audiences on LinkedIn understand and appreciate customer count as a credibility signal. Include a specific customer success story for maximum impact." },
    ],
  },
  instagram: {
    followers: [
      { question: "What's the best format for milestone posts on Instagram?", answer: "Carousel format works best: slide 1 is your milestone card (the hook), slides 2-5 tell your growth story, and the last slide has a CTA. Reels with your reaction also perform well." },
      { question: "How many hashtags should I use on Instagram?", answer: "Use 5-10 relevant hashtags in a separate comment (not in the caption). Mix popular and niche tags. For milestones, try #growthmilestone #buildingpublic #founderstory and niche-specific tags." },
    ],
    mrr: [
      { question: "Does business content work on Instagram?", answer: "Yes, and it's growing fast. Founder content, startup journeys, and behind-the-scenes posts are a rising niche on Instagram. The carousel format is perfect for breaking down business metrics visually." },
    ],
    revenue: [
      { question: "How do I make revenue content visual for Instagram?", answer: "Use GROAR to create a milestone card for the main visual. Then create a carousel that tells the story: milestone card > timeline > lessons > what's next > CTA. Visual storytelling is how business content works on IG." },
    ],
    "github-stars": [
      { question: "Is Instagram good for developer content?", answer: "It's an emerging niche with high engagement because it's unexpected. Code snippets, project demos, and dev milestone posts stand out in people's feeds. The audience is smaller but highly engaged." },
    ],
    customers: [
      { question: "How should I celebrate customer milestones on Instagram?", answer: "Create a carousel: milestone card, customer testimonial quotes, product screenshots, and a slide about what's next. Save it to a 'Milestones' highlight for ongoing social proof." },
    ],
  },
  tiktok: {
    followers: [
      { question: "How do I go viral with a milestone on TikTok?", answer: "Film a genuine reaction video. Keep it under 30 seconds. Use a trending audio if it fits naturally. Don't over-produce it. TikTok's algorithm favors authentic, raw content over polished posts." },
      { question: "Does follower count matter on TikTok?", answer: "Less than other platforms. TikTok's For You page shows content to everyone regardless of follower count. But followers still matter for building a consistent audience that sees all your content." },
    ],
    mrr: [
      { question: "Is TikTok good for SaaS content?", answer: "Founder TikTok is one of the fastest-growing niches. The audience craves authentic business content. Showing real numbers (your Stripe dashboard, your MRR growth) performs much better than polished presentations." },
    ],
    revenue: [
      { question: "What revenue content works on TikTok?", answer: "Reaction videos to your own milestones. 'Day in my life making $X/month' format. Before/after revenue comparisons. The key is authenticity and brevity. Keep it under 60 seconds." },
    ],
    "github-stars": [
      { question: "Is there a dev community on TikTok?", answer: "Yes, and it's growing rapidly. Dev TikTok (#devtok) features coding tutorials, project showcases, and tech career content. Milestone posts stand out because they're concrete and visual." },
    ],
    customers: [
      { question: "How do I share customer milestones on TikTok?", answer: "Film a quick talking-head video: show the number, explain what you built, share your reaction. Authenticity is everything on TikTok. Don't script it. Just be genuine about what the milestone means to you." },
    ],
  },
  bluesky: {
    followers: [
      { question: "How does growth work on Bluesky?", answer: "Bluesky uses custom feeds and algorithmic choice rather than a single algorithm. Growth comes from posting quality content, engaging in conversations, and being discoverable in relevant feeds. It's slower but more intentional than other platforms." },
      { question: "Is Bluesky worth building an audience on?", answer: "If your audience includes developers, tech enthusiasts, or people who value the open web, absolutely. The platform is growing, and early creators benefit most from being established before the mainstream wave." },
    ],
    mrr: [
      { question: "Is Bluesky good for build in public?", answer: "The indie builder community on Bluesky is small but highly engaged. Founders who value transparency and the open web find a natural home here. MRR posts generate thoughtful conversations rather than surface-level reactions." },
    ],
    revenue: [
      { question: "Should I share revenue on Bluesky?", answer: "Yes. Bluesky's culture rewards transparency and honest sharing. Revenue milestones are well-received, especially from bootstrapped founders. The conversations you'll get are more substantive than on larger platforms." },
    ],
    "github-stars": [
      { question: "Why share GitHub milestones on Bluesky?", answer: "Bluesky was built by developers on an open protocol. The developer community here naturally celebrates open source work. Your GitHub milestone will reach people who might actually use and contribute to your project." },
    ],
    customers: [
      { question: "How do customer posts perform on Bluesky?", answer: "Bluesky's community values indie businesses and bootstrapped growth. Customer milestones receive genuine, supportive engagement. The conversations are more meaningful than on algorithm-driven platforms." },
    ],
  },
};
