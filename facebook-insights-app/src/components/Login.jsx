import React from "react";
import FacebookLogin from "react-facebook-login/dist/facebook-login-render-props";

const Login = ({ onLogin }) => {
  const responseFacebook = (response) => {
    if (response.accessToken) {
      const { accessToken, name, picture, id } = response;
      onLogin(accessToken);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/40 backdrop-blur-lg shadow-xl rounded-2xl border border-blue-100/50 overflow-hidden">
        <div className="p-8 text-center">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">
              Facebook Login
            </h2>
            <p className="text-blue-600 mb-6">
              Connect your Facebook account securely
            </p>
          </div>

          <FacebookLogin
            appId={import.meta.env.VITE_FACEBOOK_APP_ID}
            autoLoad={false}
            fields="name,email,picture"
            callback={responseFacebook}
            render={(renderProps) => (
              <button
                onClick={renderProps.onClick}
                className="w-full bg-blue-600 text-white py-3 rounded-lg 
                           hover:bg-blue-700 transition-colors duration-300 
                           flex items-center justify-center 
                           space-x-3 shadow-md hover:shadow-lg hover:cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="mr-2"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Login with Facebook
              </button>
            )}
            scope="public_profile,email,pages_show_list,pages_read_engagement,pages_read_user_content,read_insights"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
