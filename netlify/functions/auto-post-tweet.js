const { TwitterApi } = require('twitter-api-v2');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Check for required environment variables
  const xaiApiKey = process.env.XAI_API_KEY;
  const twitterApiKey = process.env.TWITTER_API_KEY;
  const twitterApiSecret = process.env.TWITTER_API_SECRET;
  const twitterAccessToken = process.env.TWITTER_ACCESS_TOKEN;
  const twitterAccessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

  if (!xaiApiKey || !twitterApiKey || !twitterApiSecret || !twitterAccessToken || !twitterAccessTokenSecret) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API credentials not configured' }),
    };
  }

  try {
    // Generate tweet content using Grok
    const prompt = "Generate a short, engaging tweet (under 280 characters) about asphalt paving tips, industry news, or construction advice for J Worden & Sons Asphalt Paving. Make it professional and helpful.";
    
    const grokResponse = await fetch('https://api.x.ai/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${xaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-4.20-reasoning',
        input: prompt,
      }),
    });

    if (!grokResponse.ok) {
      throw new Error(`Grok API error: ${grokResponse.status} ${grokResponse.statusText}`);
    }

    const grokData = await grokResponse.json();
    const tweetText = grokData.response?.trim();

    if (!tweetText || tweetText.length > 280) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Generated tweet is invalid or too long' }),
      };
    }

    // Initialize Twitter client
    const client = new TwitterApi({
      appKey: twitterApiKey,
      appSecret: twitterApiSecret,
      accessToken: twitterAccessToken,
      accessSecret: twitterAccessTokenSecret,
    });

    // Post the tweet
    const tweet = await client.v2.tweet(tweetText);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        tweet: {
          id: tweet.data.id,
          text: tweet.data.text,
        },
        generated: tweetText,
      }),
    };
  } catch (error) {
    console.error('Auto-post error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to generate and post tweet',
        details: error.message,
      }),
    };
  }
};