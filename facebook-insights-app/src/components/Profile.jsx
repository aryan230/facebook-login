import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaFacebookF,
  FaChartLine,
  FaUsers,
  FaRegThumbsUp,
  FaEye,
  FaClock,
  FaEnvelope,
  FaIdBadge,
} from "react-icons/fa";
import { format } from "date-fns";

const Profile = ({ accessToken }) => {
  const [profile, setProfile] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState("2025-01-25 09:03:57");
  const [metrics, setMetrics] = useState(null);
  const [fol, setFol] = useState(true);
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
        "https://facebook-login-cm0u.onrender.com/api/page-access-token",
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
        "https://facebook-login-cm0u.onrender.com/api/page-metrics",
        {
          params: {
            pageAccessToken,
            pageId: selectedPage,
          },
        }
      );
      console.log(metricsResponse.data);
      // Check follower count
      if (metricsResponse.data.followers < 100) {
        setError("You need at least 100 followers to get page insights.");
        setMetrics([
          {
            label: "Total Followers",
            value: metricsResponse.data.followers,
            icon: <FaUsers />,
            bgColor: "bg-blue-50",
            textColor: "text-blue-600",
          },

          {
            label: "Total Impressions",
            value: metricsResponse.data.uniqueImpressions,
            icon: <FaEye />,
            bgColor: "bg-purple-50",
            textColor: "text-purple-600",
          },
        ]);
      } else {
        setMetrics([
          {
            label: "Total Followers",
            value: metricsResponse.data.totalFollowers,
            icon: <FaUsers />,
            bgColor: "bg-blue-50",
            textColor: "text-blue-600",
          },
          {
            label: "Total Engagement",
            value: metricsResponse.data.totalFollowers,
            icon: <FaRegThumbsUp />,
            bgColor: "bg-green-50",
            textColor: "text-green-600",
          },
          {
            label: "Total Impressions",
            value: metricsResponse.data.totalFollowers,
            icon: <FaEye />,
            bgColor: "bg-purple-50",
            textColor: "text-purple-600",
          },
          {
            label: "Total Reactions",
            value: metricsResponse.data.totalFollowers,
            icon: <FaRegThumbsUp />,
            bgColor: "bg-red-50",
            textColor: "text-red-600",
          },
        ]);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6 font-inter">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <FaFacebookF className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Facebook Analytics
                </h1>
                <p className="text-gray-500 text-sm">
                  Monitor your page performance
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <FaClock className="text-blue-500" />
                <span className="text-sm text-gray-600 font-mono">
                  2025-01-25 11:25:50
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              {profile && (
                <img
                  src={profile.picture.data.url}
                  alt={profile.name}
                  className="w-16 h-16 rounded-xl object-cover ring-2 ring-blue-100"
                />
              )}
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-gray-800">
                  {profile ? profile.name : "Loading..."}
                </h2>
                <div className="flex items-center space-x-3 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <FaIdBadge className="text-blue-500" />
                    <span>{profile ? profile.id : ""}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Active Now</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
              <span className="text-sm text-blue-600 font-medium">
                @aryan230
              </span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-xl overflow-hidden">
            <div className="p-4 flex items-center space-x-3">
              <div className="flex-shrink-0 text-red-400">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Page Selection */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Select Page to Analyze
            </h3>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-grow">
                <select
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           transition-all duration-200 text-gray-700"
                  onChange={handlePageSelect}
                  value={selectedPage}
                >
                  <option value="">Choose a Facebook Page</option>
                  {pages.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSubmit}
                disabled={loading || !selectedPage}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl
                         hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 
                         disabled:cursor-not-allowed flex items-center justify-center space-x-2
                         min-w-[160px]"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  <>
                    <FaChartLine />
                    <span>Get Insights</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        {selectedPage && metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200"
              >
                <div className={`${metric.bgColor} p-4`}>
                  <div className={`${metric.textColor} text-xl`}>
                    {metric.icon}
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 font-medium mb-2">
                    {metric.label}
                  </p>
                  <p className={`text-3xl font-bold ${metric.textColor}`}>
                    {metric.value.toLocaleString()}
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
