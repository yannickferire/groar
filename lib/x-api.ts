// X (Twitter) API v2 helper functions
// Docs: https://docs.x.com/x-api

const X_API_BASE = "https://api.twitter.com/2";

// Types for X API responses
export type XUserPublicMetrics = {
  followers_count: number;
  following_count: number;
  tweet_count: number;
  listed_count: number;
};

export type XUser = {
  id: string;
  name: string;
  username: string;
  public_metrics: XUserPublicMetrics;
};

export type XTweetPublicMetrics = {
  retweet_count: number;
  reply_count: number;
  like_count: number;
  quote_count: number;
  bookmark_count: number;
  impression_count: number;
};

export type XTweetNonPublicMetrics = {
  impression_count: number;
  user_profile_clicks: number;
  url_link_clicks: number;
};

export type XTweetOrganicMetrics = {
  impression_count: number;
  user_profile_clicks: number;
  url_link_clicks: number;
  retweet_count: number;
  reply_count: number;
  like_count: number;
};

export type XTweet = {
  id: string;
  text: string;
  created_at: string;
  public_metrics: XTweetPublicMetrics;
  non_public_metrics?: XTweetNonPublicMetrics;
  organic_metrics?: XTweetOrganicMetrics;
};

export type XApiError = {
  error: string;
  status?: number;
};

// Fetch authenticated user's profile with metrics
export async function getAuthenticatedUser(
  accessToken: string
): Promise<XUser | XApiError> {
  try {
    const response = await fetch(
      `${X_API_BASE}/users/me?user.fields=public_metrics`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("X API error (users/me):", errorText);
      return {
        error: `X API error: ${response.status}`,
        status: response.status,
      };
    }

    const data = await response.json();
    return data.data as XUser;
  } catch (error) {
    console.error("Failed to fetch X user:", error);
    return { error: "Failed to connect to X API" };
  }
}

// Fetch user's recent tweets with metrics (last 30 days max for non-public metrics)
export async function getUserTweets(
  accessToken: string,
  userId: string,
  maxResults: number = 100
): Promise<XTweet[] | XApiError> {
  try {
    // Calculate date 30 days ago (X API limit for non-public metrics)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startTime = thirtyDaysAgo.toISOString();

    const params = new URLSearchParams({
      max_results: Math.min(maxResults, 100).toString(),
      start_time: startTime,
      // Only request public_metrics (free) - non_public requires paid API access
      "tweet.fields": "created_at,public_metrics",
      exclude: "retweets,replies", // Only original tweets
    });

    const response = await fetch(
      `${X_API_BASE}/users/${userId}/tweets?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("X API error (tweets):", errorText);

      // Check if it's a scope issue
      if (response.status === 403) {
        return {
          error: "Missing permissions. User needs to reconnect with analytics scope.",
          status: 403,
        };
      }

      return {
        error: `X API error: ${response.status}`,
        status: response.status,
      };
    }

    const data = await response.json();
    console.log("X API tweets response:", JSON.stringify(data, null, 2));
    return (data.data || []) as XTweet[];
  } catch (error) {
    console.error("Failed to fetch X tweets:", error);
    return { error: "Failed to connect to X API" };
  }
}

// Aggregate metrics from a list of tweets
export function aggregateTweetMetrics(tweets: XTweet[]) {
  return tweets.reduce(
    (acc, tweet) => {
      const pub = tweet.public_metrics;
      const nonPub = tweet.non_public_metrics;
      const organic = tweet.organic_metrics;

      return {
        impressionsCount:
          acc.impressionsCount +
          (nonPub?.impression_count || organic?.impression_count || pub?.impression_count || 0),
        likesCount: acc.likesCount + (pub?.like_count || 0),
        retweetsCount: acc.retweetsCount + (pub?.retweet_count || 0),
        repliesCount: acc.repliesCount + (pub?.reply_count || 0),
        quotesCount: acc.quotesCount + (pub?.quote_count || 0),
        bookmarksCount: acc.bookmarksCount + (pub?.bookmark_count || 0),
        profileClicksCount:
          acc.profileClicksCount +
          (nonPub?.user_profile_clicks || organic?.user_profile_clicks || 0),
        urlClicksCount:
          acc.urlClicksCount +
          (nonPub?.url_link_clicks || organic?.url_link_clicks || 0),
      };
    },
    {
      impressionsCount: 0,
      likesCount: 0,
      retweetsCount: 0,
      repliesCount: 0,
      quotesCount: 0,
      bookmarksCount: 0,
      profileClicksCount: 0,
      urlClicksCount: 0,
    }
  );
}

// Check if an error response indicates token expiry
export function isTokenExpired(error: XApiError): boolean {
  return error.status === 401;
}

// Check if an error response indicates missing scope
export function isMissingScope(error: XApiError): boolean {
  return error.status === 403;
}

// Token refresh result type
export type TokenRefreshResult = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
} | XApiError;

// Refresh an expired access token using the refresh token
export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenRefreshResult> {
  const clientId = process.env.TWITTER_CLIENT_ID;

  if (!clientId) {
    return { error: "Missing Twitter client ID" };
  }

  try {
    const response = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Token refresh failed:", errorText);
      return {
        error: "Token refresh failed. Please reconnect your X account.",
        status: response.status,
      };
    }

    const data = await response.json();
    console.log("Token refreshed successfully");
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    };
  } catch (error) {
    console.error("Failed to refresh token:", error);
    return { error: "Failed to refresh token" };
  }
}
