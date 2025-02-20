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

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
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

  try {
    // Check if user already exists
    let user = await User.findOne({ facebookId });

    if (user) {
      // Update access token if user exists
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

  try {
    // Fetch Page Access Token
    const response = await axios.get(
      `https://graph.facebook.com/v12.0/${pageId}?fields=access_token&access_token=${userAccessToken}`
    );

    const pageAccessToken = response.data.access_token;
    res.status(200).json({ pageAccessToken });
  } catch (error) {
    console.error(
      "Error fetching Page Access Token:",
      error.response?.data || error.message
    );
    res.status(500).json({
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

  //   Configure axios with timeout
  const axiosConfig = {
    timeout: 5000, // 5 second timeout
    validateStatus: (status) => status < 500,
  };

  try {
    // Basic page info first
    const pageInfoResponse = await axios.get(
      `https://graph.facebook.com/v12.0/${pageId}?fields=fan_count&access_token=${pageAccessToken}`,
      axiosConfig
    );

    // Then fetch metrics separately
    const metricsResponse = await axios.get(
      `https://graph.facebook.com/v12.0/${pageId}/insights?` +
        `metric=page_impressions_unique&` +
        `period=day&` +
        `access_token=${pageAccessToken}`,
      axiosConfig
    );

    console.log(pageInfoResponse, metricsResponse);

    const metrics = {
      followers: pageInfoResponse.data.fan_count || 0,
      uniqueImpressions: metricsResponse.data.data[0]?.values[0]?.value || 0,
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

app.get("/api/page-posts", async (req, res) => {
  const { pageAccessToken, pageId, dateRange } = req.query;
  const limit = req.query.limit || 10; // Default to 10 posts

  // Validate required parameters
  if (!pageAccessToken || !pageId) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  const axiosConfig = {
    timeout: 5000,
    validateStatus: (status) => status < 500,
  };

  // Date range filtering logic
  const getDateFilter = (dateRange) => {
    const now = new Date();
    switch (dateRange) {
      case "last7days":
        return new Date(now.setDate(now.getDate() - 7)).toISOString();
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
      `https://graph.facebook.com/v12.0/${pageId}/posts?` +
      `fields=id,message,created_time,permalink_url,attachments,reactions.summary(total_count),comments.summary(total_count),shares&` +
      `limit=${limit}&` +
      `access_token=${pageAccessToken}`;

    // Add date filtering if applicable
    if (dateFilter) {
      apiUrl += `&since=${dateFilter}`;
    }

    const response = await axios.get(apiUrl, axiosConfig);

    const posts = response.data.data.map((post) => ({
      id: post.id,
      message: post.message || "",
      createdAt: post.created_time,
      url: post.permalink_url,
      media: post.attachments?.data?.[0],
      reactions: post.reactions?.summary?.total_count || 0,
      comments: post.comments?.summary?.total_count || 0,
      shares: post.shares?.count || 0,
    }));

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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
