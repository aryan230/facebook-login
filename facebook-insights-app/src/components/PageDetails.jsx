import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaFacebookF,
  FaChartLine,
  FaUsers,
  FaRegThumbsUp,
  FaEye,
  FaClock,
  FaUser,
} from "react-icons/fa";
import { format } from "date-fns";

const Profile = ({ accessToken }) => {
  const [profile, setProfile] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState("2025-01-25 09:03:57");
  const [metrics, setMetrics] = useState({
    totalFollowers: 0,
    totalEngagement: 0,
    totalImpressions: 0,
    totalReactions: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentDateTime(format(new Date(), "yyyy-MM-dd HH:mm:ss"));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setLoading(true);
    // Fetch user profile
    axios
      .get(
        `https://graph.facebook.com/v12.0/me?access_token=${accessToken}&fields=name,picture`
      )
      .then((response) => {
        setProfile(response.data);
        setLoading(false);
      })
      .catch((error) => {
        setError("Failed to load profile");
        setLoading(false);
      });

    // Fetch user pages
    axios
      .get(
        `https://graph.facebook.com/v12.0/me/accounts?access_token=${accessToken}`
      )
      .then((response) => setPages(response.data.data))
      .catch((error) => setError("Failed to load pages"));
  }, [accessToken]);

  const handlePageSelect = (e) => {
    setSelectedPage(e.target.value);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedPage) {
      setError("Please select a page.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch Page Access Token
      const pageAccessTokenResponse = await axios.get(
        "http://localhost:5000/api/page-access-token",
        {
          params: {
            userAccessToken: accessToken,
            pageId: selectedPage,
          },
        }
      );

      const pageAccessToken = pageAccessTokenResponse.data.pageAccessToken;

      // Fetch Page Metrics
      const metricsResponse = await axios.get(
        "http://localhost:5000/api/page-metrics",
        {
          params: {
            pageAccessToken,
            pageId: selectedPage,
          },
        }
      );

      // Check follower count
      if (metricsResponse.data.totalFollowers < 100) {
        setError("You need at least 100 followers to get page insights.");
        setMetrics({
          totalFollowers: 0,
          totalEngagement: 0,
          totalImpressions: 0,
          totalReactions: 0,
        });
      } else {
        setMetrics(metricsResponse.data);
      }
    } catch (error) {
      setError(
        error.response?.data?.error?.message || "Failed to fetch page metrics"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex">
      {/* Sidebar */}
      <div className="w-80 bg-gradient-to-b from-blue-900 to-blue-800 text-white p-8 flex flex-col items-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-blue-800 opacity-10 z-0"></div>

        {/* Facebook Logo */}
        <div className="relative z-10 mb-12">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
            <FaFacebookF className="text-blue-900 text-3xl" />
          </div>
        </div>

        {/* Profile Section */}
        {profile && (
          <div className="relative z-10 text-center mb-12">
            <div className="relative">
              <img
                src={profile.picture.data.url}
                alt="Profile"
                className="w-32 h-32 rounded-full border-4 border-white shadow-xl transform hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
            </div>
            <h2 className="text-2xl font-bold mt-4 mb-2">{profile.name}</h2>
            <p className="text-blue-200">Page Administrator</p>
          </div>
        )}

        {/* DateTime & User Info */}
        <div className="w-full space-y-4 relative z-10 bg-blue-800/50 p-4 rounded-lg backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <FaClock className="text-blue-300" />
            <div>
              <p className="text-sm text-blue-200">Current Time (UTC)</p>
              <p className="font-mono">{currentDateTime}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <FaUser className="text-blue-300" />
            <div>
              <p className="text-sm text-blue-200">Logged in as</p>
              <p className="font-mono">aryan230</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">
            Page Analytics Dashboard
          </h1>
          <p className="text-blue-600">
            Monitor and analyze your Facebook page performance
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-red-50 opacity-50 blur"></div>
            <div className="bg-white border-l-4 border-red-500 p-6 rounded-lg shadow-lg relative z-10">
              <h3 className="text-red-800 font-semibold mb-2">Error Notice</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Page Selection */}
        <div className="bg-white rounded-xl shadow-xl p-6 mb-8 backdrop-blur-lg border border-blue-100">
          <label className="block text-blue-800 mb-3 font-semibold">
            Select Facebook Page
          </label>
          <div className="flex space-x-4">
            <select
              className="flex-1 p-3 rounded-lg bg-blue-50 border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              onChange={handlePageSelect}
              value={selectedPage}
            >
              <option value="">Choose a page</option>
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedPage}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                       transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center space-x-2 shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <FaChartLine />
                  <span>Analyze Page</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        {selectedPage && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: "Total Followers",
                value: metrics.totalFollowers,
                icon: <FaUsers className="text-2xl" />,
                color: "bg-gradient-to-br from-blue-500 to-blue-600",
                textColor: "text-blue-500",
              },
              {
                label: "Total Engagement",
                value: metrics.totalEngagement,
                icon: <FaRegThumbsUp className="text-2xl" />,
                color: "bg-gradient-to-br from-green-500 to-green-600",
                textColor: "text-green-500",
              },
              {
                label: "Total Impressions",
                value: metrics.totalImpressions,
                icon: <FaEye className="text-2xl" />,
                color: "bg-gradient-to-br from-purple-500 to-purple-600",
                textColor: "text-purple-500",
              },
              {
                label: "Total Reactions",
                value: metrics.totalReactions,
                icon: <FaRegThumbsUp className="text-2xl" />,
                color: "bg-gradient-to-br from-red-500 to-red-600",
                textColor: "text-red-500",
              },
            ].map((metric, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300"
              >
                <div className={`${metric.color} p-4`}>
                  <div className="text-white">{metric.icon}</div>
                </div>
                <div className="p-6">
                  <h3 className="text-gray-600 font-medium mb-2">
                    {metric.label}
                  </h3>
                  <p className={`text-3xl font-bold ${metric.textColor}`}>
                    {metric?.value?.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
