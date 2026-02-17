import { ICompatibilityScore, IContentModerationResult, IUser, ICompanion } from '@/types';

// ============================================
// AI Compatibility Score Calculation
// ============================================

interface CompatibilityFactors {
  interests: number;
  personality: number;
  language: number;
  location: number;
}

/**
 * Calculate AI compatibility score between a user and companion
 * This is a basic implementation that can be enhanced with ML models
 */
export function calculateCompatibilityScore(
  user: Partial<IUser>,
  companion: Partial<ICompanion>
): ICompatibilityScore {
  const factors: CompatibilityFactors = {
    interests: 0,
    personality: 0,
    language: 0,
    location: 0,
  };
  const reasons: string[] = [];

  // Interest matching (40% weight)
  if (user.profile?.interests && companion.profile?.interests) {
    const userInterests = user.profile.interests.map((i) => i.toLowerCase());
    const companionInterests = companion.profile.interests.map((i) => i.toLowerCase());
    const commonInterests = userInterests.filter((i) => companionInterests.includes(i));

    if (commonInterests.length > 0) {
      factors.interests = Math.min((commonInterests.length / Math.min(userInterests.length, 5)) * 40, 40);
      reasons.push(`Shares ${commonInterests.length} common interests: ${commonInterests.slice(0, 3).join(', ')}`);
    }
  }

  // Personality matching (25% weight)
  if (user.profile?.personalityTraits && companion.profile?.personalityTraits) {
    const userTraits = user.profile.personalityTraits.map((t) => t.toLowerCase());
    const companionTraits = companion.profile.personalityTraits.map((t) => t.toLowerCase());
    const complementaryTraits = findComplementaryTraits(userTraits, companionTraits);

    if (complementaryTraits.length > 0) {
      factors.personality = Math.min(complementaryTraits.length * 8, 25);
      reasons.push('Complementary personality traits');
    }
  }

  // Language matching (20% weight)
  if (user.profile?.languages && companion.profile?.languages) {
    const userLanguages = user.profile.languages.map((l) => l.toLowerCase());
    const companionLanguages = companion.profile.languages.map((l) => l.toLowerCase());
    const commonLanguages = userLanguages.filter((l) => companionLanguages.includes(l));

    if (commonLanguages.length > 0) {
      factors.language = Math.min(commonLanguages.length * 10, 20);
      reasons.push(`Speaks ${commonLanguages.join(', ')}`);
    }
  }

  // Location proximity (15% weight)
  if (user.profile?.location?.city && companion.profile?.location?.city) {
    if (user.profile.location.city.toLowerCase() === companion.profile.location.city.toLowerCase()) {
      factors.location = 15;
      reasons.push('Located in the same city');
    } else if (user.profile.location.state === companion.profile.location.state) {
      factors.location = 8;
      reasons.push('Located in the same state');
    }
  }

  // Calculate total score
  const totalScore = Math.round(
    factors.interests + factors.personality + factors.language + factors.location
  );

  // Normalize to 0-100 scale
  const normalizedScore = Math.min(Math.max(totalScore, 0), 100);

  return {
    userId: user._id || '',
    companionId: companion._id || '',
    score: normalizedScore,
    factors,
    reasons: reasons.length > 0 ? reasons : ['New match'],
  };
}

// Helper function to find complementary personality traits
function findComplementaryTraits(userTraits: string[], companionTraits: string[]): string[] {
  const complementaryPairs: Record<string, string[]> = {
    introvert: ['extrovert', 'outgoing', 'social'],
    extrovert: ['introvert', 'calm', 'listener'],
    adventurous: ['spontaneous', 'explorer', 'thrill-seeker'],
    calm: ['relaxed', 'peaceful', 'patient'],
    creative: ['artistic', 'imaginative', 'innovative'],
    analytical: ['logical', 'thinker', 'problem-solver'],
    empathetic: ['caring', 'understanding', 'supportive'],
    ambitious: ['driven', 'motivated', 'goal-oriented'],
  };

  const complementary: string[] = [];

  userTraits.forEach((trait) => {
    const pairs = complementaryPairs[trait] || [];
    pairs.forEach((pair) => {
      if (companionTraits.includes(pair)) {
        complementary.push(pair);
      }
    });
  });

  return [...new Set(complementary)];
}

// ============================================
// AI Content Moderation
// ============================================

interface ModerationKeywords {
  harassment: string[];
  hateSpeech: string[];
  sexual: string[];
  violence: string[];
  spam: string[];
}

const moderationKeywords: ModerationKeywords = {
  harassment: [
    'harass', 'bully', 'threaten', 'intimidate', 'stalk', 'abuse',
    'insult', 'mock', 'tease', 'torment', 'persecute', 'victimize',
  ],
  hateSpeech: [
    'hate', 'racist', 'sexist', 'homophobic', 'transphobic', 'xenophobic',
    'discriminat', 'prejudice', 'bigot', 'supremacist', 'nazi', 'fascist',
  ],
  sexual: [
    'sex', 'porn', 'nude', 'naked', 'explicit', 'adult content',
    'prostitut', 'escort service', 'sexual favor', 'inappropriate touch',
  ],
  violence: [
    'kill', 'murder', 'attack', 'hurt', 'harm', 'violence', 'assault',
    'weapon', 'gun', 'knife', 'bomb', 'terrorist', 'threat',
  ],
  spam: [
    'spam', 'scam', 'fraud', 'phishing', 'click here', 'limited time',
    'act now', 'urgent', 'winner', 'lottery', 'prize', 'free money',
  ],
};

/**
 * Basic content moderation using keyword matching
 * This can be replaced with more sophisticated ML models
 */
export function moderateContent(content: string): IContentModerationResult {
  const lowerContent = content.toLowerCase();
  const categories = {
    harassment: false,
    hateSpeech: false,
    sexual: false,
    violence: false,
    spam: false,
  };

  let flaggedCount = 0;
  let totalConfidence = 0;

  // Check each category
  (Object.keys(moderationKeywords) as Array<keyof ModerationKeywords>).forEach((category) => {
    const keywords = moderationKeywords[category];
    const matches = keywords.filter((keyword) => lowerContent.includes(keyword.toLowerCase()));

    if (matches.length > 0) {
      categories[category] = true;
      flaggedCount++;
      totalConfidence += Math.min(matches.length * 0.2, 0.9);
    }
  });

  const confidence = flaggedCount > 0 ? totalConfidence / flaggedCount : 0;

  // Determine action based on severity
  let action: 'allow' | 'warn' | 'block' = 'allow';
  if (categories.violence || categories.sexual) {
    action = 'block';
  } else if (categories.hateSpeech || categories.harassment) {
    action = confidence > 0.5 ? 'block' : 'warn';
  } else if (categories.spam) {
    action = confidence > 0.7 ? 'block' : 'warn';
  }

  return {
    flagged: flaggedCount > 0,
    categories,
    confidence,
    action,
  };
}

/**
 * Check if profile content is appropriate
 */
export function moderateProfile(
  profile: Partial<IUser['profile']> & Partial<ICompanion['profile']>
): IContentModerationResult {
  const contentToCheck = [
    profile.bio,
    profile.about,
    ...(profile.interests || []),
    ...(profile.personalityTraits || []),
  ].join(' ');

  return moderateContent(contentToCheck);
}

/**
 * Check if a review is appropriate
 */
export function moderateReview(comment: string): IContentModerationResult {
  return moderateContent(comment);
}

/**
 * Check if a chat message is appropriate
 */
export function moderateChatMessage(content: string): IContentModerationResult {
  const result = moderateContent(content);

  // Additional checks for chat messages
  const lowerContent = content.toLowerCase();

  // Check for personal information sharing (basic pattern)
  const personalInfoPatterns = [
    /\b\d{10}\b/, // Phone number
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
  ];

  const hasPersonalInfo = personalInfoPatterns.some((pattern) => pattern.test(lowerContent));

  if (hasPersonalInfo && result.action === 'allow') {
    result.action = 'warn';
    result.categories.spam = true;
    result.confidence = Math.max(result.confidence, 0.5);
  }

  return result;
}

// ============================================
// Recommendation Engine
// ============================================

interface RecommendationParams {
  userId: string;
  location?: string;
  maxResults?: number;
  minScore?: number;
}

/**
 * Get companion recommendations for a user
 * This is a placeholder for a more sophisticated recommendation system
 */
export function getRecommendations(
  user: Partial<IUser>,
  companions: Partial<ICompanion>[],
  params: RecommendationParams
): Array<{ companion: Partial<ICompanion>; score: number; reasons: string[] }> {
  const { maxResults = 10, minScore = 30 } = params;

  const scoredCompanions = companions.map((companion) => {
    const compatibility = calculateCompatibilityScore(user, companion);
    return {
      companion,
      score: compatibility.score,
      reasons: compatibility.reasons,
    };
  });

  // Filter by minimum score and sort by score descending
  return scoredCompanions
    .filter((item) => item.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

// ============================================
// Sentiment Analysis (Basic)
// ============================================

const positiveWords = [
  'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
  'awesome', 'perfect', 'love', 'happy', 'satisfied', 'recommend',
  'professional', 'friendly', 'kind', 'helpful', 'polite', 'punctual',
];

const negativeWords = [
  'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate',
  'disappointed', 'unsatisfied', 'rude', 'unprofessional', 'late',
  'no show', 'fake', 'scam', 'fraud', 'waste', 'problem', 'issue',
];

interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number; // -1 to 1
  confidence: number;
}

/**
 * Basic sentiment analysis
 */
export function analyzeSentiment(text: string): SentimentResult {
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);

  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach((word) => {
    if (positiveWords.some((pw) => word.includes(pw))) positiveCount++;
    if (negativeWords.some((nw) => word.includes(nw))) negativeCount++;
  });

  const total = positiveCount + negativeCount;
  if (total === 0) {
    return { sentiment: 'neutral', score: 0, confidence: 1 };
  }

  const score = (positiveCount - negativeCount) / total;
  const confidence = Math.min(total / 10, 1);

  let sentiment: 'positive' | 'negative' | 'neutral';
  if (score > 0.2) sentiment = 'positive';
  else if (score < -0.2) sentiment = 'negative';
  else sentiment = 'neutral';

  return { sentiment, score, confidence };
}

// ============================================
// Price Optimization (Basic)
// ============================================

interface PriceOptimizationParams {
  currentPrice: number;
  bookingCount: number;
  rating: number;
  demandLevel: 'low' | 'medium' | 'high';
  competitorPrices: number[];
}

/**
 * Suggest optimal pricing based on market conditions
 */
export function suggestOptimalPrice(params: PriceOptimizationParams): {
  suggestedPrice: number;
  priceRange: { min: number; max: number };
  reasoning: string[];
} {
  const { currentPrice, bookingCount, rating, demandLevel, competitorPrices } = params;
  const reasoning: string[] = [];

  // Calculate average competitor price
  const avgCompetitorPrice = competitorPrices.length > 0
    ? competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length
    : currentPrice;

  let suggestedPrice = currentPrice;

  // Factor 1: Rating impact
  if (rating >= 4.5) {
    suggestedPrice *= 1.1;
    reasoning.push('High rating allows for premium pricing');
  } else if (rating < 3.5) {
    suggestedPrice *= 0.9;
    reasoning.push('Lower rating suggests competitive pricing');
  }

  // Factor 2: Demand level
  if (demandLevel === 'high') {
    suggestedPrice *= 1.15;
    reasoning.push('High demand supports price increase');
  } else if (demandLevel === 'low') {
    suggestedPrice *= 0.85;
    reasoning.push('Low demand suggests promotional pricing');
  }

  // Factor 3: Booking history
  if (bookingCount < 5) {
    suggestedPrice *= 0.9;
    reasoning.push('New companion - introductory pricing recommended');
  } else if (bookingCount > 50) {
    suggestedPrice *= 1.05;
    reasoning.push('Established companion - experience premium');
  }

  // Factor 4: Competitor comparison
  if (suggestedPrice > avgCompetitorPrice * 1.2) {
    suggestedPrice = avgCompetitorPrice * 1.2;
    reasoning.push('Price adjusted to stay competitive');
  }

  // Round to nearest 50
  suggestedPrice = Math.round(suggestedPrice / 50) * 50;

  const priceRange = {
    min: Math.round(suggestedPrice * 0.8 / 50) * 50,
    max: Math.round(suggestedPrice * 1.2 / 50) * 50,
  };

  return {
    suggestedPrice,
    priceRange,
    reasoning,
  };
}
