/**
 * Where the frontend finds the backend.
 *
 * REACT_APP_APIKEY / REACT_APP_ONLYOFFICE_SCRIPT come from lmsdms_frontend/.env at
 * BUILD time. That file is not in git, so a server that builds from git has no
 * value. In that case we fall back to the host the app is opened from:
 *   API:        <same host>:8000/api/
 *   OnlyOffice: <same host>/web-apps/apps/api/documents/api.js
 * Set the variables (see .env.example) when the backend lives elsewhere.
 */
const withTrailingSlash = (url) => (url.endsWith("/") ? url : `${url}/`);

const currentHost = () =>
  typeof window !== "undefined"
    ? { protocol: window.location.protocol, hostname: window.location.hostname }
    : { protocol: "http:", hostname: "localhost" };

const resolveApiUrl = () => {
  const fromEnv = (process.env.REACT_APP_APIKEY || "").trim();
  if (fromEnv) return withTrailingSlash(fromEnv);
  const { protocol, hostname } = currentHost();
  return `${protocol}//${hostname}:8000/api/`;
};

const resolveOnlyOfficeScript = () => {
  const fromEnv = (process.env.REACT_APP_ONLYOFFICE_SCRIPT || "").trim();
  if (fromEnv) return fromEnv;
  const { protocol, hostname } = currentHost();
  return `${protocol}//${hostname}/web-apps/apps/api/documents/api.js`;
};

const config = {
  BACKEND_API_URL: resolveApiUrl(),
  ONLYOFFICE_SCRIPT_URL: resolveOnlyOfficeScript(),
  AUTH_TOKEN_KEY: "token", // key used to store the auth token
  DEFAULT_AUTH: process.env.REACT_APP_DEFAULTAUTH || "fake",
  PUBLIC_URL: process.env.PUBLIC_URL || "",
};

export default config;
