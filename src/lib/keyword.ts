// lib/feed-coordination.ts

// import { db } from "@/db";
// import { Subscriptions, users, userTopicPreferences, videos, videosReactions, videosViews, videoTopics } from "@/db/schema";
// import { and, desc, eq, getTableColumns, inArray, isNotNull, not, sql } from "drizzle-orm";

// interface FeedSection {
//     type: 'trending' | 'for-you' | 'related' | 'shorts' | 'subscriptions';
//     priority: number; // Lower number = higher priority
//     limit: number;
//     title: string;
// }

// interface CoordinatedFeedResult {
//     sections: Array<{
//         type: string;
//         title: string;
//         items: any[];
//     }>;
//     allVideoIds: Set<string>; // For tracking what's been shown
// }

// export class FeedCoordinationService {

//     async getCoordinatedHomeFeed(userId: string | undefined, clerkUserId: string | undefined): Promise<CoordinatedFeedResult> {

//         // Define feed sections with priorities (YouTube-style)
//         const sections: FeedSection[] = [
//             { type: 'for-you', priority: 1, limit: 10, title: 'Recommended for you' },
//             { type: 'trending', priority: 2, limit: 5, title: 'Trending now' },
//             { type: 'subscriptions', priority: 1, limit: 8, title: 'Latest from your subscriptions' },
//             { type: 'shorts', priority: 1, limit: 12, title: 'Shorts' },
//             { type: 'for-you', priority: 3, limit: 10, title: 'More recommendations' },
//             { type: 'related', priority: 4, limit: 8, title: 'Because you watched...' },
//         ];

//         // Sort by priority
//         sections.sort((a, b) => a.priority - b.priority);

//         const allVideoIds = new Set<string>();
//         const resultSections = [];

//         // Process each section in priority order
//         for (const section of sections) {
//             // Get videos for this section, excluding already shown videos
//             const sectionVideos = await this.getSectionVideos({
//                 sectionType: section.type,
//                 userId,
//                 clerkUserId,
//                 limit: section.limit * 2, // Get extra to allow for deduplication
//                 excludeVideoIds: Array.from(allVideoIds)
//             });

//             // Deduplicate videos that haven't been shown yet
//             const uniqueVideos = sectionVideos.filter(video => !allVideoIds.has(video.id));

//             // Take only what we need
//             const finalVideos = uniqueVideos.slice(0, section.limit);

//             // Add these videos to our tracking set
//             finalVideos.forEach(video => allVideoIds.add(video.id));

//             // Only add section if it has videos
//             if (finalVideos.length > 0) {
//                 resultSections.push({
//                     type: section.type,
//                     title: section.title,
//                     items: finalVideos
//                 });
//             }
//         }

//         // If we don't have enough videos, fill with default content
//         if (allVideoIds.size < 30) {
//             const fillVideos = await this.getFillVideos(Array.from(allVideoIds), 30 - allVideoIds.size);
//             if (fillVideos.length > 0) {
//                 resultSections.push({
//                     type: 'discover',
//                     title: 'Discover something new',
//                     items: fillVideos
//                 });
//             }
//         }

//         return {
//             sections: resultSections,
//             allVideoIds: allVideoIds
//         };
//     }

//     private async getSectionVideos({ sectionType, userId, clerkUserId, limit, excludeVideoIds }: any) {
//         switch (sectionType) {
//             case 'for-you':
//                 return await this.getPersonalizedVideos(userId, limit, excludeVideoIds);
//             case 'trending':
//                 return await this.getTrendingVideos(limit, excludeVideoIds);
//             case 'subscriptions':
//                 return await this.getSubscribedVideos(userId, limit, excludeVideoIds);
//             case 'shorts':
//                 return await this.getShortVideos(limit, excludeVideoIds);
//             case 'related':
//                 return await this.getRelatedVideos(userId, limit, excludeVideoIds);
//             default:
//                 return [];
//         }
//     }

//     private async getPersonalizedVideos(userId: string | undefined, limit: number, excludeIds: string[]) {

//         const conditions = [
//             eq(videos.videoVisibility, 'public'),
//             excludeIds.length > 0 ? not(inArray(videos.id, excludeIds)) : undefined,
//         ].filter(Boolean);
//         // If no user logged in, fall back to default feed
//         if (!userId) {
//             return await getDefaultFeed({ baseConditions, userId, cursor, limit, clerkUserId });
//         }

//         // Get user's topic preferences
//         const userPreferences = await db.query.userTopicPreferences.findMany({
//             where: eq(userTopicPreferences.userId, userId),
//             orderBy: desc(userTopicPreferences.affinity),
//             limit: 10
//         });

//         // If user has no preferences, show popular content
//         if (userPreferences.length === 0) {
//             return await getDefaultFeed({ baseConditions, userId, cursor, limit, clerkUserId });
//         }

//         // Build topic affinity map
//         const topicAffinity = new Map(userPreferences.map(p => [p.topicName, p.affinity]));
//         const preferredTopics = userPreferences.map(p => p.topicName);

//         // CTEs
//         const viewerReactions = db.$with("viewer_reactions").as(
//             db.select({
//                 videoId: videosReactions.videoId,
//                 type: videosReactions.type,
//             }).from(videosReactions)
//                 .where(inArray(videosReactions.userId, userId ? [userId] : []))
//         );

//         const viewerSubscription = db.$with("viewer_subscription").as(
//             db.select().from(Subscriptions)
//                 .where(inArray(Subscriptions.viewerId, userId ? [userId] : []))
//         );

//         // First, get videos that match user's topics
//         const matchingVideos = await db
//             .with(viewerReactions, viewerSubscription)
//             .select({
//                 ...getTableColumns(videos),
//                 user: {
//                     ...getTableColumns(users),
//                     subscriberCount: db.$count(Subscriptions, eq(Subscriptions.creatorId, users.id)),
//                     viewerSubscribed: isNotNull(viewerSubscription.viewerId).mapWith(Boolean)
//                 },
//                 viewCount: db.$count(videosViews, eq(videosViews.videoId, videos.id)),
//                 likeCount: db.$count(
//                     videosReactions,
//                     and(eq(videosReactions.videoId, videos.id), eq(videosReactions.type, 'like')),
//                 ),
//                 dislikeCount: db.$count(
//                     videosReactions,
//                     and(eq(videosReactions.videoId, videos.id), eq(videosReactions.type, 'dislike')),
//                 ),
//                 viewerReaction: viewerReactions.type,
//                 topicMatchScore: sql<number>`MAX(${videoTopics.confidence})`,
//                 relevanceScore: sql<number>`0`, // Will calculate after
//             })
//             .from(videos)
//             .innerJoin(users, eq(videos.userId, users.id))
//             .innerJoin(videoTopics, eq(videoTopics.videoId, videos.id))
//             .leftJoin(viewerReactions, eq(viewerReactions.videoId, videos.id))
//             .leftJoin(viewerSubscription, eq(viewerSubscription.creatorId, users.id))
//             .where(and(
//                 ...baseConditions,
//                 inArray(videoTopics.topicName, preferredTopics),
//                 cursor ? or(
//                     lt(videos.updatedAt, cursor.updatedAt),
//                     and(eq(videos.updatedAt, cursor.updatedAt), lt(videos.id, cursor.id))
//                 ) : undefined,
//             ))
//             .groupBy(videos.id, users.id, viewerReactions.type, viewerSubscription.viewerId)
//             .orderBy(desc(videos.updatedAt), desc(videos.id))
//             .limit(limit + 5); // Get extra for scoring

//         // Calculate relevance scores based on topic affinity
//         const scoredVideos = matchingVideos.map(video => {
//             let score = 0;
//             // In a real implementation, you'd fetch topics for each video
//             // For now, use a simplified scoring
//             score += (video.viewCount / 10000) * 0.3; // Popularity factor
//             score += (video.likeCount / 1000) * 0.2;  // Engagement factor
//             score += Math.random() * 0.1; // Small randomization for diversity

//             return {
//                 ...video,
//                 relevanceScore: score
//             };
//         });

//         // Sort by relevance score
//         scoredVideos.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

//         const hasMore = scoredVideos.length > limit;
//         const items = hasMore ? scoredVideos.slice(0, limit) : scoredVideos;

//         const nextCursor = hasMore ? {
//             id: items[items.length - 1].id,
//             updatedAt: items[items.length - 1].updatedAt,
//         } : null;

//         return { items, nextCursor };

//         // ... rest of your personalized feed logic
//         return [];
//     }

//     private async getTrendingVideos(limit: number, excludeIds: string[]) {
//         // Your trending logic with exclusions
//         const sevenDaysAgo = new Date();
//         sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

//         // ... trending query with not(inArray(videos.id, excludeIds))
//         return [];
//     }

//     private async getSubscribedVideos(userId: string | undefined, limit: number, excludeIds: string[]) {
//         if (!userId) return [];

//         // Get videos from subscribed channels
//         // ... with exclusion logic
//         return [];
//     }

//     private async getShortVideos(limit: number, excludeIds: string[]) {
//         // Get short-form content
//         // ... with exclusion logic
//         return [];
//     }

//     private async getRelatedVideos(userId: string | undefined, limit: number, excludeIds: string[]) {
//         // Get videos related to user's watch history
//         // ... with exclusion logic
//         return [];
//     }

//     private async getFillVideos(excludeIds: string[], needed: number) {
//         // Fallback: get popular videos that haven't been shown
//         return [];
//     }
// }

export const keywordCategories = {
    // Entertainment & Media
    entertainment: [
        "entertainment", "hollywood", "bollywood", "celebrity", "gossip", "red carpet",
        "awards show", "oscars", "grammy", "emmy", "tony", "golden globes", "cannes",
        "venice film festival", "sundance", "tiff", "variety show", "talkshow", "late night",
        "snl", "saturday night live", "ellen", "jimmy fallon", "jimmy kimmel", "stephen colbert",
        "conan", "graham norton", "hot ones", "chicken shop date", "react", "reaction video",
        "commentary", "drama alert", "tea", "exposed", "controversy", "scandal", "roast", "diss track"
    ],

    // Gaming (Hyper-detailed)
    gaming: [
        "game", "gaming", "playthrough", "walkthrough", "gameplay", "lets play", "playthrough",
        "fps", "rpg", "mmo", "mmorpg", "rts", "moba", "battle royale", "survival", "horror game",
        "indie game", "triple a", "aaa game", "open world", "sandbox", "simulation", "racing game",
        "sports game", "fighting game", "puzzle game", "casual game", "mobile game", "pc gaming",
        "console gaming", "playstation", "xbox", "nintendo", "switch", "ps4", "ps5", "xbox series x",
        "xbox series s", "gamecube", "wii", "wii u", "3ds", "ds", "gameboy", "retro gaming",
        "minecraft", "fortnite", "roblox", "gta", "grand theft auto", "call of duty", "cod",
        "valorant", "league of legends", "lol", "dota", "dota 2", "counter strike", "csgo", "cs2",
        "overwatch", "apex legends", "warzone", "pubg", "rust", "ark", "among us", "fall guys",
        "rocket league", "rainbow six", "siege", "destiny", "borderlands", "skyrim", "fallout",
        "witcher", "cyberpunk", "elden ring", "dark souls", "bloodborne", "sekiro", "demon souls",
        "final fantasy", "kingdom hearts", "persona", "nier", "monster hunter", "resident evil",
        "silent hill", "dead space", "the last of us", "uncharted", "god of war", "spider man",
        "batman arkham", "zelda", "mario", "pokemon", "animal crossing", "splatoon", "kirby",
        "metroid", "fire emblem", "xenoblade", "sonic", "crash bandicoot", "spyro", "halo",
        "gears of war", "forza", "grand turismo", "fifa", "madden", "nba 2k", "mlb the show",
        "speedrun", "any percent", "100 percent", "glitchless", "no hit", "pacifist", "no damage",
        "world record", "wr attempt", "game review", "game critique", "video essay gaming",
        "gaming news", "gaming leaks", "gaming rumors", "game dev", "game development",
        "unity tutorial", "unreal engine", "godot", "game design", "indie dev", "solo dev"
    ],

    // Education & Learning
    education: [
        "tutorial", "learn", "course", "lesson", "education", "how to", "guide", "explained",
        "documentary", "educational", "crash course", "khan academy", "ted talk", "tedx",
        "lecture", "university", "college", "school", "science", "physics", "chemistry", "biology",
        "mathematics", "algebra", "calculus", "geometry", "trigonometry", "statistics", "probability",
        "history", "world history", "american history", "european history", "ancient history",
        "geography", "maps", "countries", "capitals", "flags", "economics", "finance literacy",
        "psychology", "philosophy", "sociology", "anthropology", "archaeology", "linguistics",
        "literature", "english literature", "shakespeare", "poetry", "novels", "book summary",
        "critical thinking", "problem solving", "study tips", "exam prep", "sat prep", "act prep",
        "gre prep", "gmat prep", "lsat prep", "mcat prep", "homework help", "math help",
        "science help", "writing help", "essay writing", "research paper", "citation", "apa format",
        "mla format", "chicago style", "programming tutorial", "coding tutorial", "web development",
        "data science", "machine learning tutorial", "deep learning", "neural networks", "ai tutorial",
        "cloud computing", "aws tutorial", "azure tutorial", "gcp tutorial", "devops", "docker",
        "kubernetes", "git tutorial", "github", "open source", "software architecture", "system design",
        "algorithms", "data structures", "leetcode", "coding interview", "technical interview",
        "whiteboard interview", "remote work", "productivity", "time management", "note taking",
        "study with me", "pomodoro", "focus music", "concentration", "memory technique", "mnemonic"
    ],

    // Technology & Computing
    technology: [
        "tech", "technology", "gadget", "device", "smartphone", "iphone", "android", "samsung galaxy",
        "google pixel", "oneplus", "xiaomi", "huawei", "laptop", "notebook", "ultrabook", "gaming laptop",
        "macbook", "dell xps", "thinkpad", "surface", "tablet", "ipad", "samsung tab", "smartwatch",
        "apple watch", "galaxy watch", "fitness tracker", "smart home", "iot", "home automation",
        "smart speaker", "alexa", "google home", "homepod", "smart display", "ring doorbell",
        "nest thermostat", "security camera", "robot vacuum", "roomba", "coding", "programming",
        "software development", "web dev", "frontend", "backend", "fullstack", "mobile dev", "ios dev",
        "android dev", "cross platform", "react native", "flutter", "api", "rest api", "graphql",
        "database", "sql", "nosql", "mongodb", "postgresql", "mysql", "firebase", "supabase",
        "framework", "react", "vue", "angular", "svelte", "django", "flask", "spring boot", "express",
        "node js", "python", "javascript", "typescript", "java", "csharp", "cpp", "rust", "go", "swift",
        "kotlin", "php", "ruby", "perl", "haskell", "clojure", "elixir", "security", "cybersecurity",
        "ethical hacking", "penetration testing", "bug bounty", "cryptography", "encryption", "vpn",
        "privacy", "tor", "dark web", "blockchain", "cryptocurrency", "bitcoin", "ethereum", "web3",
        "nft", "smart contract", "defi", "artificial intelligence", "ai", "machine learning", "ml",
        "deep learning", "dl", "computer vision", "nlp", "natural language processing", "llm",
        "gpt", "chatgpt", "claude", "gemini", "copilot", "midjourney", "dalle", "stable diffusion",
        "generative ai", "prompt engineering", "automation", "robotics", "drones", "vr", "virtual reality",
        "ar", "augmented reality", "mr", "mixed reality", "metaverse", "3d printing", "cad", "blender"
    ],

    // Music
    music: [
        "song", "music", "cover", "remix", "playlist", "concert", "live performance", "live show",
        "music video", "official audio", "official video", "lyric video", "behind the scenes",
        "making of", "studio session", "recording session", "rehearsal", "sound check", "tour vlog",
        "album review", "song review", "reaction", "music reaction", "first listen", "album release",
        "new music", "upcoming album", "music news", "music theory", "songwriting", "composition",
        "arrangement", "production", "music production", "ableton", "fl studio", "logic pro", "pro tools",
        "garageband", "cubase", "reaper", "beat making", "beat making tutorial", "sampling", "sound design",
        "synthesizer", "midi", "daw", "recording", "mixing", "mastering", "audio engineering",
        "vocal tuning", "autotune", "melodyne", "compression", "equalizer", "reverb", "delay",
        "distortion", "overdrive", "fuzz", "chorus", "flanger", "phaser", "vocals", "singing", "vocal coach",
        "voice lesson", "singer", "rapper", "hip hop", "rap", "trap", "drill", "boom bap", "old school",
        "rnb", "rhythm and blues", "soul", "funk", "disco", "pop", "pop music", "dance pop", "synth pop",
        "electropop", "rock", "rock music", "alternative", "indie rock", "punk rock", "post punk",
        "new wave", "garage rock", "hard rock", "metal", "heavy metal", "thrash metal", "death metal",
        "black metal", "doom metal", "power metal", "progressive metal", "metalcore", "deathcore",
        "electronic", "edm", "house", "techno", "trance", "dubstep", "drum and bass", "dnb", "garage",
        "uk garage", "footwork", "juke", "ambient", "downtempo", "chillout", "lo fi", "lofi hip hop",
        "classical", "orchestra", "symphony", "chamber music", "opera", "jazz", "blues", "country",
        "folk", "acoustic", "singer songwriter", "gospel", "reggae", "dancehall", "ska", "punk",
        "ska punk", "latin", "reggaeton", "bachata", "salsa", "merengue", "cumbia", "k pop", "kpop",
        "j pop", "jpop", "c pop", "vocaloid", "anime music", "ost", "soundtrack", "film score",
        "video game music", "vgm", "chiptune", "8bit", "16bit", "instrumental", "piano cover",
        "guitar cover", "drum cover", "bass cover", "violin cover", "cello cover", "orchestral",
        "band cover", "mashup", "medley", "battle", "rap battle", "beef", "diss", "collab", "feat",
        "ft", "remix competition", "song challenge", "music challenge", "vocal challenge"
    ],

    // Sports & Fitness
    sports: [
        "sport", "game", "match", "tournament", "championship", "league", "sports highlights",
        "best plays", "top 10", "top plays", "overtime", "clutch", "comeback", "underdog",
        "football", "soccer", "premier league", "la liga", "serie a", "bundesliga", "ligue 1",
        "champions league", "europa league", "world cup", "euros", "copa america", "gold cup",
        "afcon", "asian cup", "basketball", "nba", "wnba", "euroleague", "fib a", "ncaa basketball",
        "march madness", "final four", "baseball", "mlb", "world series", "little league", "softball",
        "american football", "nfl", "super bowl", "college football", "cfp", "rose bowl", "cfl",
        "hockey", "nhl", "stanley cup", "khl", "world juniors", "olympics hockey", "tennis", "atp",
        "wta", "grand slam", "australian open", "french open", "wimbledon", "us open", "golf", "pga",
        "lpga", "the masters", "us open golf", "open championship", "pga championship", "ryder cup",
        "boxing", "heavyweight", "middleweight", "welterweight", "lightweight", "muhammad ali",
        "mike tyson", "floyd mayweather", "canelo", "anthony joshua", "tyson fury", "mma", "ufc",
        "bellator", "one championship", "conor mcgregor", "khabib", "jon jones", "israel adesanya",
        "wrestling", "wwe", "aew", "nxt", "raw", "smackdown", "royal rumble", "wrestlemania",
        "summerslam", "survivor series", "motor sports", "f1", "formula 1", "lewis hamilton",
        "max verstappen", "ferrari", "mercedes", "red bull", "moto gp", "moto2", "moto3", "nascar",
        "indycar", "rally", "wrc", "formula e", "track and field", "athletics", "sprinting", "hurdles",
        "relay", "marathon", "long jump", "high jump", "shot put", "discus", "javelin", "swimming",
        "diving", "water polo", "gymnastics", "artistic gymnastics", "rhythmic gymnastics", "trampoline",
        "weightlifting", "powerlifting", "bodybuilding", "crossfit", "calisthenics", "parkour",
        "free running", "skateboarding", "bmx", "snowboarding", "skiing", "surfing", "rock climbing",
        "bouldering", "fencing", "judo", "taekwondo", "karate", "bjj", "brazilian jiu jitsu",
        "muay thai", "kickboxing", "workout", "fitness", "gym", "home workout", "leg day", "arm day",
        "back day", "chest day", "shoulder day", "push day", "pull day", "full body", "cardio",
        "hiit", "tabata", "circuit training", "strength training", "endurance training", "plyometrics",
        "stretching", "yoga", "pilates", "meditation", "mindfulness", "wellness", "health tips",
        "nutrition", "diet", "meal prep", "protein shake", "supplements", "bulking", "cutting",
        "transformation", "fitness journey", "weight loss", "weight gain", "muscle building"
    ],

    // Cooking & Food
    cooking: [
        "recipe", "cook", "food", "meal prep", "baking", "cuisine", "kitchen", "cooking show",
        "food network", "chef", "home cook", "professional chef", "restaurant", "street food",
        "food tour", "food review", "food challenge", "eating challenge", "mukbang", "asmr eating",
        "breakfast", "lunch", "dinner", "snack", "appetizer", "starter", "main course", "entree",
        "dessert", "sweet", "savory", "soup", "salad", "sandwich", "burger", "pizza", "pasta",
        "noodles", "rice", "bread", "pastry", "cake", "cookie", "brownie", "pie", "tart", "muffin",
        "cupcake", "donut", "ice cream", "gelato", "sorbet", "chocolate", "candy", "caramel",
        "breakfast recipes", "brunch ideas", "lunch ideas", "dinner ideas", "quick meals", "easy recipes",
        "30 minute meals", "one pot meal", "sheet pan dinner", "slow cooker", "crockpot", "instant pot",
        "air fryer", "air fryer recipes", "pressure cooker", "sous vide", "bbq", "grilling", "smoker",
        "barbecue", "smoked meat", "brisket", "ribs", "pulled pork", "chicken wings", "steak", "beef",
        "pork", "chicken", "turkey", "fish", "seafood", "shrimp", "lobster", "crab", "salmon", "tuna",
        "vegetarian", "vegan", "plant based", "meatless", "tofu", "tempeh", "seitan", "vegetables",
        "fruits", "healthy recipes", "low carb", "keto", "paleo", "gluten free", "dairy free",
        "mediterranean diet", "asian cuisine", "chinese food", "japanese food", "korean food",
        "thai food", "vietnamese food", "indian food", "italian food", "french food", "mexican food",
        "spanish food", "greek food", "middle eastern", "moroccan", "ethiopian", "international cuisine",
        "fusion", "experimental", "molecular gastronomy", "baking tutorial", "cake decorating",
        "cookie decorating", "sugar art", "fondant", "royal icing", "buttercream", "ganache",
        "fermentation", "pickling", "canning", "preserving", "sourdough", "bread baking", "pizza dough",
        "homemade pasta", "sauce recipe", "gravy", "marinade", "rub", "spice blend", "seasoning",
        "cooking technique", "knife skills", "meal planning", "grocery haul", "kitchen organization",
        "food storage", "leftover ideas", "budget meals", "meal prep sunday", "cooking for one",
        "cooking for two", "family meals", "holiday recipes", "thanksgiving", "christmas dinner",
        "easter brunch", "halloween treats", "super bowl snacks", "game day food"
    ],

    // Travel & Adventure
    travel: [
        "travel", "trip", "vacation", "adventure", "destination", "tourist", "explore", "wanderlust",
        "backpacking", "solo travel", "family travel", "couples travel", "group travel", "luxury travel",
        "budget travel", "travel tips", "travel guide", "travel vlog", "travel diary", "road trip",
        "cross country", "usa road trip", "route 66", "pacific highway", "great ocean road",
        "iceland ring road", "wild atlantic way", "flights", "air travel", "first class", "business class",
        "economy class", "budget airline", "airport lounge", "travel hacking", "points and miles",
        "credit card points", "travel rewards", "hotel", "resort", "all inclusive", "boutique hotel",
        "hostel", "airbnb", "vacation rental", "glamping", "camping", "rv living", "van life",
        "nomad life", "digital nomad", "work from anywhere", "remote work travel", "beach vacation",
        "mountain getaway", "city break", "road adventure", "national park", "yosemite", "yellowstone",
        "grand canyon", "zion", "rocky mountains", "banff", "lake louise", "japan travel", "tokyo",
        "kyoto", "osaka", "hokkaido", "europe travel", "paris", "london", "rome", "barcelona",
        "amsterdam", "berlin", "prague", "vienna", "budapest", "asia travel", "thailand", "vietnam",
        "cambodia", "laos", "indonesia", "bali", "singapore", "malaysia", "philippines", "south korea",
        "seoul", "busan", "australia travel", "sydney", "melbourne", "queensland", "great barrier reef",
        "new zealand", "south island", "queenstown", "milford sound", "africa travel", "south africa",
        "cape town", "safari", "serengeti", "masai mara", "morocco", "marrakech", "sahara desert",
        "egypt", "cairo", "pyramids", "luxor", "south america travel", "peru", "machu picchu", "cusco",
        "brazil", "rio de janeiro", "amazon jungle", "chile", "patagonia", "argentina", "buenos aires",
        "colombia", "medellin", "cartagena", "central america", "costa rica", "panama", "belize",
        "mexico travel", "cancun", "mexico city", "tulum", "cabos", "caribbean", "bahamas", "jamaica",
        "dominican republic", "puerto rico", "cuba", "cruise", "carnival cruise", "royal caribbean",
        "norwegian cruise", "mediterranean cruise", "alaskan cruise", "travel photography", "travel tips",
        "packing list", "what to pack", "carry on only", "one bag travel", "travel essentials",
        "travel hacks", "cheap flights", "flight deals", "hotel deals", "last minute travel",
        "staycation", "day trip", "weekend getaway", "long weekend", "summer vacation", "winter getaway",
        "spring break", "fall foliage", "christmas market", "new years eve", "festival travel",
        "cultural travel", "heritage", "unesco", "world heritage", "historical site", "landmark",
        "eiffel tower", "colosseum", "great wall", "taj mahal", "statue of liberty", "big ben",
        "sydney opera house", "christ the redeemer", "petra", "chichen itza"
    ],

    // Business & Entrepreneurship
    business: [
        "business", "entrepreneur", "startup", "small business", "side hustle", "passive income",
        "business ideas", "business tips", "business advice", "entrepreneurship", "solopreneur",
        "founder", "ceo", "startup founder", "tech startup", "serial entrepreneur", "business coach",
        "business mentor", "business consultant", "business strategy", "growth strategy", "scale business",
        "business model", "lean startup", "agile", "scrum", "kanban", "business plan", "pitch deck",
        "investor pitch", "venture capital", "angel investor", "seed funding", "series a", "startup funding",
        "crowdfunding", "kickstarter", "indiegogo", "bootstrapping", "business finance", "cash flow",
        "profit margin", "revenue stream", "cost cutting", "business expenses", "tax write offs",
        "small business accounting", "bookkeeping", "invoicing", "payment processing", "stripe", "paypal",
        "square", "marketing", "digital marketing", "social media marketing", "content marketing",
        "seo", "search engine optimization", "email marketing", "newsletter", "sms marketing",
        "influencer marketing", "affiliate marketing", "partnership marketing", "brand building",
        "brand identity", "brand strategy", "company culture", "hiring", "recruitment", "talent acquisition",
        "team building", "leadership", "management", "productivity", "time management", "delegation",
        "outsourcing", "virtual assistant", "freelancing", "freelancer", "upwork", "fiverr", "toptal",
        "sales", "selling", "closing deals", "negotiation", "pricing strategy", "customer acquisition",
        "customer retention", "customer service", "client management", "networking", "business networking",
        "linkedin", "b2b", "b2c", "saas", "software as a service", "ecommerce", "shopify", "woocommerce",
        "amazon fba", "dropshipping", "print on demand", "wholesale", "retail", "direct to consumer",
        "real estate investing", "rental property", "house flipping", "commercial real estate", "reit",
        "stock market investing", "trading", "day trading", "swing trading", "value investing",
        "dividend investing", "etf", "mutual fund", "index fund", "401k", "ira", "roth ira",
        "personal finance", "budgeting", "saving money", "financial independence", "fire movement",
        "early retirement", "wealth building", "real estate agent", "realtor", "mortgage broker",
        "loan officer", "insurance agent", "financial advisor", "wealth manager", "business podcast",
        "startup podcast", "interview", "founder story", "success story", "failure story", "business case study",
        "business breakdown", "company analysis", "market analysis", "competitor analysis", "swot analysis"
    ],

    // Lifestyle & Personal Development
    lifestyle: [
        "lifestyle", "daily vlog", "vlog", "day in my life", "week in my life", "day in the life",
        "morning routine", "night routine", "evening routine", "self care routine", "skincare routine",
        "haircare routine", "body care", "dental care", "hydration", "wellness routine", "lifestyle changes",
        "healthy lifestyle", "minimalism", "minimalist lifestyle", "declutter", "organize", "organization tips",
        "home organization", "closet organization", "kitchen organization", "office organization",
        "digital organization", "filing system", "labeling", "storage ideas", "space saving", "tiny home",
        "small space living", "apartment living", "home tour", "apartment tour", "room tour", "house tour",
        "interior design", "home decor", "aesthetic", "cozy home", "modern decor", "boho", "scandinavian",
        "mid century modern", "industrial", "rustic", "farmhouse", "vintage", "antique", "diy decor",
        "furniture flip", "upcycling", "refurbish", "painting furniture", "homemade", "crafts", "diy projects",
        "home improvement", "renovation", "remodel", "kitchen remodel", "bathroom remodel", "backyard makeover",
        "gardening", "plant care", "houseplants", "succulents", "indoor garden", "vegetable garden",
        "herb garden", "flower garden", "landscaping", "lawn care", "patio", "deck", "outdoor living",
        "pets", "dog", "cat", "puppy", "kitten", "pet care", "dog training", "pet grooming", "pet health",
        "animal rescue", "adopt dont shop", "foster pets", "pet hauls", "pet toys", "pet products",
        "fashion", "style", "outfit ideas", "ootd", "what i wore", "lookbook", "hairstyle", "hair tutorial",
        "haircut", "hair color", "dye hair", "bleach hair", "hair products", "skin care", "skincare tips",
        "facial", "face mask", "serum", "moisturizer", "sunscreen", "anti aging", "acne treatment", "makeup",
        "makeup tutorial", "makeup look", "natural makeup", "full glam", "no makeup", "beauty tips",
        "beauty hacks", "product review", "beauty products", "cosmetics", "self improvement", "personal growth",
        "self development", "habits", "habit building", "goal setting", "new year resolutions", "vision board",
        "manifestation", "law of attraction", "affirmations", "positive thinking", "mindset shift",
        "growth mindset", "fixed mindset", "confidence", "self esteem", "body positivity", "self love",
        "self acceptance", "self compassion", "therapy", "mental health", "anxiety", "depression", "stress",
        "burnout", "healing", "recovery", "journaling", "gratitude journal", "bullet journal", "planning",
        "planner", "calendar", "scheduling", "to do list", "productivity tips", "focus", "concentration",
        "discipline", "motivation", "inspiration", "daily motivation", "positive vibes", "good energy"
    ],

    // Arts & Creativity
    arts: [
        "art", "artist", "painting", "drawing", "sketching", "illustration", "digital art", "traditional art",
        "oil painting", "watercolor", "acrylic painting", "gouache", "pastel", "charcoal", "pencil drawing",
        "ink drawing", "pen art", "marker art", "colored pencil", "calligraphy", "hand lettering", "typography",
        "graffiti", "street art", "mural", "sculpture", "clay", "pottery", "ceramics", "glass blowing",
        "metal work", "wood carving", "wood working", "carpentry", "furniture making", "jewelry making",
        "beadwork", "resin art", "epoxy resin", "fluid art", "pour painting", "abstract art", "realism",
        "hyperrealism", "surrealism", "impressionism", "expressionism", "cubism", "pop art", "modern art",
        "contemporary art", "art history", "art tutorial", "how to draw", "how to paint", "learn to draw",
        "drawing tutorial", "painting tutorial", "step by step", "art challenge", "inktober", "mermay",
        "draw this in your style", "dtiys", "art style", "developing style", "art improvement", "art journey",
        "art progress", "sketchbook", "sketchbook tour", "flip through", "studio vlog", "artist vlog",
        "art haul", "art supply", "art tools", "brushes", "canvas", "paper", "paint", "coloring book",
        "adult coloring", "coloring tutorial", "animation", "2d animation", "3d animation", "stop motion",
        "claymation", "pixel art", "game art", "concept art", "character design", "environment design",
        "storyboard", "visual development", "graphic design", "logo design", "branding", "packaging design",
        "poster design", "flyer design", "business card", "typography design", "font design", "ui design",
        "ux design", "user interface", "user experience", "web design", "app design", "product design",
        "industrial design", "fashion design", "fashion sketch", "pattern design", "textile design",
        "embroidery", "sewing", "quilting", "knitting", "crochet", "macrame", "weaving", "tie dye",
        "batik", "screen printing", "printmaking", "linocut", "woodcut", "etching", "lithography",
        "photography", "photoshoot", "portrait photography", "landscape photography", "street photography",
        "macro photography", "product photography", "food photography", "fashion photography", "wedding photography",
        "event photography", "film photography", "analog", "film camera", "darkroom", "photo editing",
        "lightroom", "photoshop", "affinity photo", "capture one", "filmmaking", "cinematography",
        "video production", "directing", "screenwriting", "script writing", "storytelling", "film theory",
        "movie analysis", "film criticism", "directors cut", "behind the scenes", "blooper reel", "outtakes"
    ],

    // Health & Wellness
    health: [
        "health", "wellness", "healthy living", "wellness journey", "health tips", "wellness tips",
        "physical health", "mental health", "emotional health", "spiritual health", "holistic health",
        "functional medicine", "integrative medicine", "nutrition", "diet", "healthy eating", "clean eating",
        "whole foods", "plant based", "vegan diet", "vegetarian diet", "pescatarian", "flexitarian",
        "mediterranean diet", "dash diet", "low carb", "keto diet", "atkins", "paleo diet", "carnivore",
        "intermittent fasting", "time restricted eating", "fasting", "water fasting", "juice cleanse",
        "detox", "gut health", "digestion", "probiotics", "prebiotics", "fermented foods", "kombucha",
        "kimchi", "sauerkraut", "yogurt", "kefir", "supplements", "vitamins", "minerals", "protein powder",
        "collagen", "omega 3", "vitamin d", "vitamin b12", "magnesium", "zinc", "iron", "calcium",
        "fitness", "exercise", "workout", "strength training", "resistance training", "weight lifting",
        "bodybuilding", "powerlifting", "olympic lifting", "calisthenics", "bodyweight exercise",
        "cardiovascular", "cardio", "aerobic", "hiit", "tabata", "interval training", "endurance training",
        "stamina", "conditioning", "mobility", "flexibility", "stretching", "dynamic stretching",
        "static stretching", "foam rolling", "self myofascial release", "yoga", "ashtanga", "vinyasa",
        "hatha", "yin yoga", "restorative yoga", "hot yoga", "bikram", "kundalini", "pilates", "reformer",
        "mat pilates", "barre", "dance fitness", "zumba", "aerobics", "kickboxing", "martial arts",
        "boxing fitness", "muay thai fitness", "running", "jogging", "sprinting", "marathon training",
        "half marathon", "5k", "10k", "trail running", "ultra marathon", "cycling", "spin class",
        "indoor cycling", "peloton", "swimming", "lap swimming", "open water", "triathlon", "walking",
        "hiking", "rucking", "sleep", "sleep hygiene", "sleep quality", "insomnia", "circadian rhythm",
        "sleep schedule", "nap", "rest", "recovery", "active recovery", "rest day", "deload week",
        "injury prevention", "physical therapy", "rehab", "rehabilitation", "chiropractic", "massage",
        "deep tissue", "sports massage", "acupuncture", "acupressure", "cupping", "dry needling",
        "meditation", "mindfulness", "breathwork", "pranayama", "guided meditation", "body scan",
        "loving kindness", "transcendental meditation", "zen", "mindfulness based stress reduction",
        "stress management", "coping skills", "resilience", "burnout prevention", "work life balance",
        "self compassion", "therapy", "counseling", "psychology", "psychotherapy", "cbt",
        "cognitive behavioral therapy", "dbt", "emdr", "exposure therapy", "mental health awareness",
        "anxiety relief", "depression help", "panic attack", "ptsd", "ocd", "adhd", "bipolar",
        "eating disorder", "body dysmorphia", "addiction", "substance abuse", "sober living", "recovery"
    ],

    // Science & Nature
    science: [
        "science", "scientific", "research", "experiment", "laboratory", "lab", "scientist", "physics",
        "quantum physics", "theoretical physics", "astrophysics", "nuclear physics", "particle physics",
        "chemistry", "organic chemistry", "inorganic chemistry", "biochemistry", "physical chemistry",
        "analytical chemistry", "biology", "molecular biology", "cell biology", "genetics", "genomics",
        "evolution", "natural selection", "ecology", "ecosystem", "biodiversity", "conservation",
        "marine biology", "zoology", "botany", "microbiology", "virology", "bacteriology", "immunology",
        "neuroscience", "brain science", "cognitive science", "behavioral science", "psychology science",
        "social science", "sociology", "anthropology", "archaeology", "paleontology", "fossils",
        "dinosaurs", "geology", "earth science", "mineralogy", "volcanology", "seismology", "oceanography",
        "meteorology", "climatology", "weather", "climate", "climate change", "global warming",
        "environmental science", "sustainability", "renewable energy", "solar power", "wind energy",
        "hydro power", "geothermal", "nuclear energy", "space", "astronomy", "astrophysics", "cosmology",
        "planetary science", "exoplanet", "star", "galaxy", "nebula", "black hole", "wormhole",
        "neutron star", "supernova", "constellation", "telescope", "hubble", "james webb", "jwst",
        "spacex", "nasa", "esa", "roscosmos", "international space station", "iss", "rocket", "launch",
        "mars rover", "apollo mission", "moon landing", "space exploration", "astronaut", "cosmonaut",
        "mathematics", "pure mathematics", "applied mathematics", "algebra", "linear algebra", "calculus",
        "differential equations", "geometry", "trigonometry", "topology", "number theory", "combinatorics",
        "statistics", "probability", "data science", "analytics", "engineering", "mechanical engineering",
        "electrical engineering", "civil engineering", "chemical engineering", "aerospace engineering",
        "biomedical engineering", "computer engineering", "software engineering", "robotics engineering",
        "nanotechnology", "materials science", "polymers", "ceramics", "composites", "biotechnology",
        "genetic engineering", "crispr", "gene editing", "synthetic biology", "bioinformatics",
        "medical science", "medicine", "clinical research", "pharmacology", "epidemiology", "anatomy",
        "physiology", "pathology", "radiology", "surgery", "cardiology", "neurology", "oncology",
        "pediatrics", "geriatrics", "emergency medicine", "science communication", "science education",
        "stem", "science experiment", "diy science", "home lab", "citizen science", "science news",
        "breakthrough", "discovery", "scientific paper", "peer review", "academic research", "phd",
        "postdoc", "science podcast", "science video essay", "veritasium", "scishow", "kurzgesagt",
        "smarter every day", "mark rober", "physics girl", "minute physics", "vsauce", "numberphile"
    ],

    // News & Politics
    news: [
        "news", "breaking news", "current events", "headlines", "top stories", "daily news", "weekly news",
        "world news", "international news", "global news", "local news", "national news", "politics",
        "political news", "election", "voting", "campaign", "political debate", "government", "congress",
        "parliament", "senate", "house of representatives", "president", "prime minister", "governor",
        "mayor", "political analysis", "political commentary", "political science", "public policy",
        "legislation", "bill", "law", "supreme court", "judicial", "legal news", "constitutional law",
        "human rights", "civil rights", "social justice", "activism", "protest", "demonstration",
        "social movement", "advocacy", "political activism", "community organizing", "economy news",
        "financial news", "stock market", "wall street", "federal reserve", "inflation", "recession",
        "unemployment", "job market", "housing market", "real estate news", "trade", "tariffs", "taxes",
        "tax policy", "budget deficit", "national debt", "technology news", "tech news", "silicon valley",
        "startup news", "innovation", "product launch", "apple news", "google news", "microsoft news",
        "amazon news", "facebook news", "meta", "twitter news", "x news", "tiktok news", "youtube news",
        "science news", "health news", "medical news", "covid 19", "pandemic", "public health",
        "environmental news", "climate news", "climate crisis", "extreme weather", "natural disaster",
        "hurricane", "earthquake", "wildfire", "flood", "tornado", "business news", "corporate news",
        "earnings report", "merger", "acquisition", "ipo", "investing news", "cryptocurrency news",
        "bitcoin news", "ethereum news", "international relations", "foreign policy", "diplomacy",
        "geopolitics", "conflict", "war", "peace", "treaty", "alliance", "united nations", "nato",
        "european union", "brexit", "china news", "russia news", "ukraine news", "israel news",
        "middle east", "us news", "canada news", "uk news", "australia news", "india news", "media",
        "journalism", "investigative journalism", "press freedom", "fake news", "misinformation",
        "fact checking", "media literacy", "press conference", "interview", "political interview",
        "news anchor", "reporter", "correspondent", "news analysis", "opinion", "editorial", "columnist"
    ],

    // Family & Parenting
    family: [
        "family", "parenting", "parents", "mom", "dad", "mother", "father", "parenthood", "new parents",
        "first time parents", "expecting parents", "pregnancy", "expecting", "pregnant", "due date",
        "baby bump", "pregnancy journey", "birth story", "labor and delivery", "home birth", "water birth",
        "c section", "natural birth", "postpartum", "newborn", "baby", "infant", "baby development",
        "baby care", "baby feeding", "breastfeeding", "bottle feeding", "pumping", "baby sleep",
        "sleep training", "baby schedule", "baby routine", "baby milestones", "baby first year",
        "baby products", "baby gear", "stroller", "car seat", "crib", "baby registry", "baby shower",
        "gender reveal", "baby name", "nursery", "baby room", "toddler", "toddler life", "toddler development",
        "toddler activities", "toddler meals", "toddler sleep", "potty training", "terrible twos",
        "threenager", "preschooler", "preschool activities", "kindergarten", "elementary school",
        "school age", "child development", "child psychology", "gentle parenting", "positive parenting",
        "attachment parenting", "free range parenting", "helicopter parenting", "authoritative parenting",
        "disciplining", "boundaries", "emotional regulation", "tantrums", "kids activities", "crafts for kids",
        "educational activities", "sensory play", "imaginative play", "outdoor activities", "family activities",
        "family game night", "movie night", "family dinner", "family traditions", "family values",
        "family bonding", "quality time", "stay at home mom", "sahm", "stay at home dad", "sahd",
        "working mom", "working parent", "work life balance", "single parent", "single mom", "single dad",
        "co parenting", "blended family", "adoption", "foster care", "special needs", "autism parenting",
        "adhd parenting", "teenager", "teen parenting", "adolescent", "parenting teens", "teen issues",
        "parenting tips", "parenting hacks", "mom hacks", "dad hacks", "family vlog", "family channel",
        "daily family life", "family routine", "morning routine family", "bedtime routine", "family meals",
        "family recipes", "kid friendly meals", "picky eaters", "family travel", "vacation with kids",
        "road trip with kids", "flying with kids", "family fun", "family outings", "family adventures",
        "grandparents", "grandparenting", "multigenerational", "extended family", "family support",
        "parenting community", "mom group", "dad group", "parenting forum", "child safety", "baby proofing",
        "childproof", "car seat safety", "internet safety", "kids online", "screen time", "limits",
        "parental controls", "family technology", "education at home", "homeschool", "unschooling",
        "remote learning", "virtual school", "homework help", "tutoring", "learning resources"
    ],

    // Automotive
    automotive: [
        "car", "auto", "automotive", "vehicle", "truck", "suv", "sedan", "coupe", "convertible", "hatchback",
        "wagon", "minivan", "van", "pickup", "off road", "jeep", "land rover", "range rover", "mercedes",
        "bmw", "audi", "volkswagen", "porsche", "ferrari", "lamborghini", "mclaren", "aston martin",
        "bentley", "rolls royce", "bugatti", "koenigsegg", "tesla", "rivian", "lucid", "ford", "chevrolet",
        "dodge", "ram", "gmc", "cadillac", "chrysler", "jeep", "toyota", "honda", "nissan", "hyundai",
        "kia", "subaru", "mazda", "mitsubishi", "suzuki", "lexus", "acura", "infiniti", "genesis",
        "volvo", "jaguar", "alfa romeo", "maserati", "fiat", "mini", "smart", "car review", "test drive",
        "first drive", "road test", "comparison", "vs", "competitor", "car buying", "car buying guide",
        "car lease", "car loan", "car finance", "car insurance", "car maintenance", "oil change", "tire change",
        "brake replacement", "car repair", "mechanic", "auto repair", "alternative parts", "car mods",
        "car modifications", "aftermarket", "performance parts", "tuning", "engine swap", "turbo", "supercharger",
        "exhaust", "intake", "ecu tune", "remap", "suspension", "lowering", "lift kit", "wheels", "rims",
        "tires", "performance tires", "winter tires", "car detailing", "car wash", "paint correction",
        "ceramic coating", "ppf", "car wrap", "vinyl wrap", "color change", "car restoration", "classic car",
        "vintage car", "muscle car", "hot rod", "antique car", "supercar", "hypercar", "exotic car",
        "sports car", "gt car", "grand tourer", "daily driver", "commuter", "economy car", "fuel efficient",
        "hybrid", "plug in hybrid", "phev", "electric vehicle", "ev", "battery electric", "bev", "charging",
        "ev charging", "supercharger", "fast charging", "range anxiety", "autonomous driving", "self driving",
        "autopilot", "full self driving", "fsd", "driver assistance", "adaptive cruise", "lane keeping",
        "car tech", "infotainment", "apple carplay", "android auto", "car audio", "subwoofer", "sound system",
        "dash cam", "radar detector", "car accessories", "car camping", "overlanding", "car meet", "car show",
        "car event", "cars and coffee", "auto show", "motor show", "detroit auto show", "geneva motor show",
        "tokyo auto salon", "sema", "race", "racing", "track day", "lap time", "drag race", "quarter mile",
        "top speed", "0 to 60", "acceleration", "braking", "handling", "cornering", "motorsport", "formula 1",
        "f1", "indycar", "nascar", "rally", "wrc", "dakar", "le mans", "wec", "gt racing", "touring car",
        "drift", "drifting", "formula drift", "automotive journalism", "car journalist", "doug demuro",
        "jay leno", "chris harris", "shmee", "supercar blondie", "dde", "whistlin diesel", "cleetus mcfarland",
        "car throttle", "donut media", "hagerty", "top gear", "the grand tour", "motor trend", "car wow"
    ],

    // Pets & Animals
    pets: [
        "pet", "animal", "pets", "animals", "cute animals", "animal lover", "pet lover", "pet owner",
        "pet care", "pet health", "pet wellness", "pet nutrition", "pet food", "pet treats", "pet supplies",
        "pet products", "pet toys", "pet accessories", "pet bed", "pet crate", "pet carrier", "pet grooming",
        "pet bath", "pet nail trimming", "pet haircut", "pet brushing", "pet dental", "pet training",
        "dog training", "puppy training", "obedience training", "trick training", "agility training",
        "service dog", "therapy dog", "working dog", "dog", "puppy", "puppies", "dogs", "dog breeds",
        "puppy breeds", "small dog", "medium dog", "large dog", "giant dog", "hypoallergenic dog",
        "golden retriever", "labrador", "german shepherd", "french bulldog", "bulldog", "poodle", "beagle",
        "rottweiler", "yorkshire terrier", "yorkie", "dachshund", "boxer", "husky", "siberian husky",
        "great dane", "doberman", "shih tzu", "pug", "corgi", "australian shepherd", "border collie",
        "chihuahua", "maltese", "bichon frise", "cockapoo", "goldendoodle", "labradoodle", "mixed breed",
        "rescue dog", "adopted dog", "shelter dog", "foster dog", "cat", "kitten", "cats", "kittens",
        "cat breeds", "persian cat", "maine coon", "ragdoll", "bengal", "sphynx", "british shorthair",
        "scottish fold", "siamese", "abyssinian", "burmese", "birman", "norwegian forest", "oriental",
        "rescue cat", "feral cat", "indoor cat", "outdoor cat", "cat behavior", "cat training", "litter box",
        "cat litter", "scratching post", "cat tree", "cat toys", "small pets", "rabbit", "bunny", "guinea pig",
        "hamster", "gerbil", "mouse", "rat", "chinchilla", "ferret", "hedgehog", "bird", "parrot", "parakeet",
        "cockatiel", "conure", "macaw", "african grey", "cockatoo", "lovebird", "canary", "finch", "reptile",
        "lizard", "gecko", "leopard gecko", "crested gecko", "bearded dragon", "iguana", "chameleon",
        "snake", "ball python", "corn snake", "king snake", "boa", "python", "turtle", "tortoise",
        "aquatic turtle", "fish", "aquarium", "fish tank", "freshwater fish", "saltwater fish", "betta fish",
        "goldfish", "koi", "cichlid", "tetra", "guppy", "molly", "platy", "discus", "angelfish", "aquascape",
        "horse", "equestrian", "horse riding", "horse training", "horse care", "stable", "barn", "pony",
        "foal", "horse breeds", "thoroughbred", "quarter horse", "arabian", "mustang", "appaloosa",
        "paint horse", "friesian", "andalusian", "clydesdale", "miniature horse", "farm animals", "cow",
        "goat", "sheep", "pig", "chicken", "duck", "turkey", "goose", "llama", "alpaca", "donkey", "mule",
        "exotic pets", "sugar glider", "ferret", "chinchilla", "hedgehog", "capybara", "kangaroo", "wallaby",
        "fox", "raccoon", "skunk", "pet bird", "pet reptile", "pet photography", "pet portraits", "pet art",
        "animal rescue", "wildlife rescue", "animal shelter", "adopt dont shop", "pets of instagram",
        "pet influencer", "animal videos", "cute compilations", "animal facts", "wildlife", "wild animals",
        "zoo animals", "sanctuary", "animal sanctuary", "wildlife photography", "nature documentary"
    ]
};


