/**
 * Utility function for making authenticated API calls using HTTP-only cookies
 * Replaces all localStorage token usage throughout the application
 */

interface FetchWithAuthOptions extends RequestInit {
  // Extends standard fetch options
}

/**
 * Attempts to refresh the authentication token using the refresh token
 * @returns Promise<boolean> - true if refresh was successful, false otherwise
 */
async function attemptTokenRefresh(): Promise<boolean> {
  try {
    // Directly attempt to refresh the token using the refresh endpoint
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}), // Refresh token will be read from cookies server-side
    });

    return refreshResponse.ok;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
}

/**
 * Makes an authenticated API call using HTTP-only cookies
 * @param url - The API endpoint URL
 * @param options - Fetch options (method, body, etc.)
 * @returns Promise<Response>
 */
export async function fetchWithAuth(url: string, options: FetchWithAuthOptions = {}): Promise<Response> {
  const defaultOptions: RequestInit = {
    credentials: 'include', // Always include HTTP-only cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  let response = await fetch(url, defaultOptions);

  // Handle authentication failures with automatic token refresh
  if (response.status === 401 || response.status === 403) {
    // console.log('Authentication failed, attempting token refresh...');

    // Try to refresh the token
    const refreshSuccessful = await attemptTokenRefresh();

    if (refreshSuccessful) {
      // console.log('Token refresh successful, retrying original request...');
      // Retry the original request with new tokens
      response = await fetch(url, defaultOptions);

      // If it still fails after refresh, redirect to login
      if (response.status === 401 || response.status === 403) {
        console.error('Authentication still failed after token refresh');
        window.location.href = '/auth';
        throw new Error("Authentication failed. Please log in again.");
      }
    } else {
      console.error('Token refresh failed, redirecting to login');
      window.location.href = '/auth';
      throw new Error("Authentication failed. Please log in again.");
    }
  }

  return response;
}

/**
 * Makes an authenticated API call and returns JSON data
 * @param url - The API endpoint URL
 * @param options - Fetch options (method, body, etc.)
 * @returns Promise<any>
 */
export async function fetchWithAuthJson(url: string, options: FetchWithAuthOptions = {}): Promise<any> {
  const response = await fetchWithAuth(url, options);

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  // Check if the response is HTML (likely an error page or login page)
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("text/html")) {
    console.error("Received HTML response instead of JSON, redirecting to login");
    window.location.href = '/auth';
    throw new Error("Authentication failed. Please log in again.");
  }

  return response.json();
}
