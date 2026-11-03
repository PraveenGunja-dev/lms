/**
 * Wraps an RTK Query base query so that application-level failures are treated
 * as errors.
 *
 * The backend historically answers many failures with HTTP 200 and
 * `{ status: false, message }`. RTK Query's `.unwrap()` only throws on non-2xx
 * responses, so screens showed "saved successfully" for requests the server had
 * rejected. For mutations (non-GET requests) such responses are converted into
 * an error carrying the server message. GET queries are left untouched because
 * several list endpoints use `status: false` to mean "no data".
 */
export const withStatusCheck = (baseQuery) => async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);
  const method = typeof args === "string" ? "GET" : (args?.method || "GET").toUpperCase();
  if (method !== "GET" && result?.data && result.data.status === false) {
    return {
      error: {
        status: "APP_ERROR",
        data: result.data,
        message: result.data.message || "The request could not be completed.",
      },
    };
  }
  return result;
};

/** Best human-readable message from an RTK Query / axios error. */
export const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") =>
  error?.data?.message || error?.message || error?.response?.data?.message || fallback;
