
const config = {
    BACKEND_API_URL: process.env.REACT_APP_APIKEY || "http://localhost:8000",
    AUTH_TOKEN_KEY: "token", // key used to store the auth token
    DEFAULT_AUTH: process.env.REACT_APP_DEFAULTAUTH || "fake",
    PUBLIC_URL: process.env.PUBLIC_URL || "", // you can also use this if needed
  };
  
  export default config;
  