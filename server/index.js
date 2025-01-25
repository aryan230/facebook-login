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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
