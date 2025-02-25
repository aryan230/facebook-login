const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Update MongoDB connection without deprecated options
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Define User Schema
const userSchema = new mongoose.Schema({
  facebookId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  picture: { type: String, required: true },
  accessToken: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// Save or Update User Data
app.post("/api/save-user", async (req, res) => {
  const { facebookId, name, picture, accessToken } = req.body;

  // Validate required parameters
  if (!facebookId || !name || !accessToken) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  try {
    // Check if user already exists
    let user = await User.findOne({ facebookId });

    if (user) {
      // Update user information if user exists
      user.name = name;
      user.picture = picture;
      user.accessToken = accessToken;
      await user.save();
    } else {
      // Create new user if they don't exist
      user = new User({ facebookId, name, picture, accessToken });
      await user.save();
    }

    res.status(200).json({ message: "User data saved successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving user data" });
  }
});

app.get("/api/page-access-token", async (req, res) => {
  const { userAccessToken, pageId } = req.query;

  // Validate required parameters
  if (!userAccessToken || !pageId) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  try {
    // Fetch Page Access Token with updated API version
    const response = await axios.get(
      `https://graph.facebook.com/v17.0/${pageId}?fields=access_token&access_token=${userAccessToken}`
    );

    const pageAccessToken = response.data.access_token;
    if (!pageAccessToken) {
      return res.status(404).json({ message: "Page access token not found" });
    }

    res.status(200).json({ pageAccessToken });
  } catch (error) {
    console.error(
      "Error fetching Page Access Token:",
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      message: "Error fetching Page Access Token",
      error: error.response?.data || error.message,
    });
  }
});

app.get("/api/page-metrics", async (req, res) => {
  const { pageAccessToken, pageId } = req.query;

  // Validate required parameters
  if (!pageAccessToken || !pageId) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  // Configure axios with timeout
  const axiosConfig = {
    timeout: 10000, // 10 second timeout
    validateStatus: (status) => status < 500,
  };

  try {
    // Basic page info first
    const pageInfoResponse = await axios.get(
      `https://graph.facebook.com/v17.0/${pageId}?fields=fan_count,name,username,picture&access_token=${pageAccessToken}`,
      axiosConfig
    );

    // Fetch more comprehensive insights with improved metrics
    const metricsResponse = await axios.get(
      `https://graph.facebook.com/v17.0/${pageId}/insights?` +
        `metric=page_impressions_unique,page_engaged_users,page_post_engagements,page_fans,page_views_total&` +
        `period=day&` +
        `date_preset=last_30_days&` +
        `access_token=${pageAccessToken}`,
      axiosConfig
    );

    // Process metrics data
    const processedMetrics = processInsightsData(metricsResponse.data);

    const metrics = {
      pageInfo: {
        id: pageId,
        name: pageInfoResponse.data.name || "",
        username: pageInfoResponse.data.username || "",
        picture: pageInfoResponse.data.picture?.data?.url || "",
        followers: pageInfoResponse.data.fan_count || 0,
      },
      insights: processedMetrics,
    };

    res.status(200).json(metrics);
  } catch (error) {
    console.error(
      "Error fetching page metrics:",
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      message: "Error fetching page metrics",
      error: error.response?.data || error.message,
    });
  }
});

// Helper function to process insights data
function processInsightsData(insightsData) {
  const processed = {};

  if (!insightsData.data || !Array.isArray(insightsData.data)) {
    return processed;
  }

  insightsData.data.forEach((metric) => {
    if (metric.name && metric.values && metric.values.length > 0) {
      // Get the most recent value
      const latestValue = metric.values[0].value;
      processed[metric.name] = latestValue;

      // Calculate total if values array has multiple entries
      if (metric.values.length > 1) {
        const total = metric.values.reduce(
          (sum, entry) => sum + (entry.value || 0),
          0
        );
        processed[`${metric.name}_total`] = total;
      }
    }
  });

  return processed;
}

app.get("/api/page-posts", async (req, res) => {
  const { pageAccessToken, pageId, dateRange } = req.query;
  const limit = parseInt(req.query.limit) || 10; // Default to 10 posts, ensure it's a number

  // Validate required parameters
  if (!pageAccessToken || !pageId) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  const axiosConfig = {
    timeout: 10000,
    validateStatus: (status) => status < 500,
  };

  // Date range filtering logic
  const getDateFilter = (dateRange) => {
    const now = new Date();
    switch (dateRange) {
      case "last7days":
        return new Date(now.setDate(now.getDate() - 7)).toISOString();
      case "last30days":
        return new Date(now.setDate(now.getDate() - 30)).toISOString();
      case "lifetime":
        return null; // No date filter
      case "custom":
        // Expect start and end dates to be passed separately
        return req.query.startDate ? req.query.startDate : null;
      default:
        return null;
    }
  };

  const dateFilter = getDateFilter(dateRange);

  try {
    let apiUrl =
      `https://graph.facebook.com/v17.0/${pageId}/posts?` +
      `fields=id,message,created_time,permalink_url,attachments,reactions.summary(total_count),comments.summary(total_count),shares,insights.metric(post_impressions,post_engaged_users)&` +
      `limit=${limit}&` +
      `access_token=${pageAccessToken}`;

    // Add date filtering if applicable
    if (dateFilter) {
      apiUrl += `&since=${encodeURIComponent(dateFilter)}`;
    }

    if (req.query.endDate && dateRange === "custom") {
      apiUrl += `&until=${encodeURIComponent(req.query.endDate)}`;
    }

    const response = await axios.get(apiUrl, axiosConfig);

    // Enhanced post processing with more detailed metrics
    const posts = response.data.data.map((post) => {
      // Extract post insights if available
      const impressions =
        post.insights?.data?.find((d) => d.name === "post_impressions")
          ?.values?.[0]?.value || 0;
      const engagedUsers =
        post.insights?.data?.find((d) => d.name === "post_engaged_users")
          ?.values?.[0]?.value || 0;

      return {
        id: post.id,
        message: post.message || "",
        createdAt: post.created_time,
        url: post.permalink_url,
        media: post.attachments?.data?.[0],
        metrics: {
          reactions: post.reactions?.summary?.total_count || 0,
          comments: post.comments?.summary?.total_count || 0,
          shares: post.shares?.count || 0,
          impressions: impressions,
          engagedUsers: engagedUsers,
          engagementRate:
            impressions > 0
              ? ((engagedUsers / impressions) * 100).toFixed(2) + "%"
              : "0%",
        },
      };
    });

    res.status(200).json({
      posts,
      paging: response.data.paging || null,
    });
  } catch (error) {
    console.error(
      "Error fetching page posts:",
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      message: "Error fetching page posts",
      error: error.response?.data || error.message,
    });
  }
});

// New endpoint for detailed page insights
app.get("/api/page-insights", async (req, res) => {
  const { pageAccessToken, pageId } = req.query;
  const period = req.query.period || "day";
  const datePreset = req.query.datePreset || "last_30_days";

  // Validate required parameters
  if (!pageAccessToken || !pageId) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  const metrics = [
    "page_impressions",
    "page_impressions_unique",
    "page_engaged_users",
    "page_consumptions",
    "page_post_engagements",
    "page_fans",
    "page_fan_adds",
    "page_views_total",
  ].join(",");

  try {
    const response = await axios.get(
      `https://graph.facebook.com/v17.0/${pageId}/insights`,
      {
        params: {
          metric: metrics,
          period: period,
          date_preset: datePreset,
          access_token: pageAccessToken,
        },
        timeout: 15000,
      }
    );

    res.status(200).json({
      insights: response.data,
      timeGenerated: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "Error fetching detailed page insights:",
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      message: "Error fetching page insights",
      error: error.response?.data || error.message,
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
