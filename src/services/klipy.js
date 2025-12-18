import { KLIPY_API_KEY } from "../utils/constants";

const BASE_URL = "https://api.klipy.com/api";

// Generate or retrieve anonymous customer ID for Klipy API
function getCustomerId() {
    const storageKey = "klipy_customer_id";
    let customerId = localStorage.getItem(storageKey);

    if (!customerId) {
        customerId = crypto.randomUUID();
        localStorage.setItem(storageKey, customerId);
    }

    return customerId;
}

/**
 * Safely parse JSON response, handling empty responses
 */
async function safeJsonParse(response) {
    const text = await response.text();
    if (!text || text.trim() === "") {
        throw new Error("Empty response from API");
    }
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse API response:", text);
        throw new Error("Invalid JSON response from API");
    }
}

/**
 * Fetch trending GIFs from Klipy API
 * @param {number} page - Page number (1-indexed)
 * @param {number} perPage - Number of items per page (max 50)
 * @returns {Promise<{items: Array, hasMore: boolean}>}
 */
export async function getTrendingGifs(page = 1, perPage = 24) {
    const customerId = getCustomerId();
    const url = new URL(`${BASE_URL}/v1/${KLIPY_API_KEY}/gifs/trending`);

    url.searchParams.set("page", page.toString());
    url.searchParams.set("per_page", perPage.toString());
    url.searchParams.set("customer_id", customerId);
    url.searchParams.set("locale", navigator.language?.split("-")[0] || "en");

    const response = await fetch(url.toString());

    // 204 No Content means empty response - treat as no results or API key issue
    if (response.status === 204) {
        console.warn(
            "Klipy API returned 204 No Content - API key may need activation"
        );
        return {
            items: [],
            hasMore: false,
        };
    }

    if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error("Klipy API error:", response.status, errorText);
        throw new Error(`Klipy API error: ${response.status}`);
    }

    const data = await safeJsonParse(response);

    if (!data.result) {
        throw new Error("Failed to fetch trending GIFs");
    }

    // Extract items from nested data.data structure
    const items = data.data?.data || [];
    const hasNext = data.data?.has_next || false;

    return {
        items: Array.isArray(items) ? items : [],
        hasMore: hasNext,
    };
}

/**
 * Search GIFs from Klipy API
 * @param {string} query - Search query
 * @param {number} page - Page number (1-indexed)
 * @param {number} perPage - Number of items per page (max 50)
 * @returns {Promise<{items: Array, hasMore: boolean}>}
 */
export async function searchGifs(query, page = 1, perPage = 24) {
    if (!query?.trim()) {
        return getTrendingGifs(page, perPage);
    }

    const customerId = getCustomerId();
    const url = new URL(`${BASE_URL}/v1/${KLIPY_API_KEY}/gifs/search`);

    url.searchParams.set("q", query.trim());
    url.searchParams.set("page", page.toString());
    url.searchParams.set("per_page", perPage.toString());
    url.searchParams.set("customer_id", customerId);
    url.searchParams.set("locale", navigator.language?.split("-")[0] || "en");

    const response = await fetch(url.toString());

    // 204 No Content means empty response - treat as no results or API key issue
    if (response.status === 204) {
        console.warn(
            "Klipy API returned 204 No Content - API key may need activation"
        );
        return {
            items: [],
            hasMore: false,
        };
    }

    if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error("Klipy API error:", response.status, errorText);
        throw new Error(`Klipy API error: ${response.status}`);
    }

    const data = await safeJsonParse(response);

    if (!data.result) {
        throw new Error("Failed to search GIFs");
    }

    // Extract items from nested data.data structure
    const items = data.data?.data || [];
    const hasNext = data.data?.has_next || false;

    return {
        items: Array.isArray(items) ? items : [],
        hasMore: hasNext,
    };
}

/**
 * Extract the best URL for displaying a GIF
 * Prefers sm.webp for thumbnails, md.webp for full display
 * @param {object} gif - GIF object from Klipy API
 * @param {string} size - Size variant: 'xs', 'sm', 'md', 'hd'
 * @returns {string|null} - URL of the GIF
 */
export function getGifUrl(gif, size = "sm") {
    if (!gif?.file) return null;

    const sizeData = gif.file[size];
    if (!sizeData) return null;

    // Prefer webp, then gif, then mp4 - access the .url property
    return sizeData.webp?.url || sizeData.gif?.url || sizeData.mp4?.url || null;
}

/**
 * Get GIF dimensions for a specific size
 * @param {object} gif - GIF object from Klipy API
 * @param {string} size - Size variant: 'xs', 'sm', 'md', 'hd'
 * @returns {{width: number, height: number}|null}
 */
export function getGifDimensions(gif, size = "sm") {
    if (!gif?.file?.[size]) return null;

    // Get dimensions from the webp or gif format
    const format = gif.file[size].webp || gif.file[size].gif;
    if (!format) return null;

    return {
        width: format.width,
        height: format.height,
    };
}

/**
 * Fetch GIF categories from Klipy API
 * @param {string} locale - Locale code (e.g., 'en', 'de')
 * @returns {Promise<Array>} - Array of category objects
 */
export async function getCategories(locale) {
    const url = new URL(`${BASE_URL}/v1/${KLIPY_API_KEY}/gifs/categories`);
    // Always use en_US as it has the most categories populated
    url.searchParams.set("locale", locale || "en_US");

    const response = await fetch(url.toString());

    if (response.status === 204) {
        return [];
    }

    if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error("Klipy API error:", response.status, errorText);
        throw new Error(`Klipy API error: ${response.status}`);
    }

    const data = await safeJsonParse(response);

    if (!data.result) {
        throw new Error("Failed to fetch categories");
    }

    // Categories are in data.categories array
    const items = data.data?.categories || [];

    // If API returns empty categories, provide common fallback categories
    if (!items || items.length === 0) {
        return [
            { category: "happy", query: "happy", preview_url: null },
            { category: "sad", query: "sad", preview_url: null },
            { category: "love", query: "love", preview_url: null },
            { category: "angry", query: "angry", preview_url: null },
            { category: "laugh", query: "laugh", preview_url: null },
            { category: "wow", query: "wow", preview_url: null },
            { category: "thumbs up", query: "thumbs up", preview_url: null },
            { category: "clap", query: "clap", preview_url: null },
            { category: "dance", query: "dance", preview_url: null },
            { category: "celebrate", query: "celebrate", preview_url: null },
            { category: "thinking", query: "thinking", preview_url: null },
            { category: "facepalm", query: "facepalm", preview_url: null },
        ];
    }

    return Array.isArray(items) ? items : [];
}

/**
 * Fetch recent GIFs for a customer from Klipy API
 * @param {number} page - Page number (1-indexed)
 * @param {number} perPage - Number of items per page (max 50)
 * @returns {Promise<{items: Array, hasMore: boolean}>}
 */
export async function getRecentGifs(page = 1, perPage = 24) {
    const customerId = getCustomerId();
    const url = new URL(
        `${BASE_URL}/v1/${KLIPY_API_KEY}/gifs/recent/${customerId}`
    );

    url.searchParams.set("page", page.toString());
    url.searchParams.set("per_page", perPage.toString());

    const response = await fetch(url.toString());

    if (response.status === 204) {
        return { items: [], hasMore: false };
    }

    if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error("Klipy API error:", response.status, errorText);
        throw new Error(`Klipy API error: ${response.status}`);
    }

    const data = await safeJsonParse(response);

    if (!data.result) {
        throw new Error("Failed to fetch recent GIFs");
    }

    const items = data.data?.data || [];
    const hasNext = data.data?.has_next || false;

    return {
        items: Array.isArray(items) ? items : [],
        hasMore: hasNext,
    };
}

/**
 * Fetch specific GIFs by IDs or slugs
 * @param {string[]} ids - Array of GIF IDs
 * @param {string[]} slugs - Array of GIF slugs
 * @returns {Promise<Array>} - Array of GIF objects
 */
export async function getGifsByIds(ids = [], slugs = []) {
    const url = new URL(`${BASE_URL}/v1/${KLIPY_API_KEY}/gifs/items`);

    if (ids.length > 0) {
        url.searchParams.set("ids", ids.join(","));
    }
    if (slugs.length > 0) {
        url.searchParams.set("slugs", slugs.join(","));
    }

    const response = await fetch(url.toString());

    if (response.status === 204) {
        return [];
    }

    if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error("Klipy API error:", response.status, errorText);
        throw new Error(`Klipy API error: ${response.status}`);
    }

    const data = await safeJsonParse(response);

    if (!data.result) {
        throw new Error("Failed to fetch GIFs by IDs");
    }

    return data.data || [];
}

/**
 * Remove a GIF from recent history
 * @param {string} slug - GIF slug to remove
 * @returns {Promise<boolean>} - True if successful
 */
export async function removeFromRecent(slug) {
    const customerId = getCustomerId();
    const url = new URL(
        `${BASE_URL}/v1/${KLIPY_API_KEY}/gifs/recent/${customerId}`
    );
    url.searchParams.set("slug", slug);

    const response = await fetch(url.toString(), { method: "DELETE" });

    if (!response.ok && response.status !== 204) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error("Klipy API error:", response.status, errorText);
        throw new Error(`Klipy API error: ${response.status}`);
    }

    return true;
}

/**
 * Log a GIF share event for analytics and personalization
 * This also adds the GIF to the user's recent history
 * @param {string} slug - GIF slug that was shared
 * @param {string} searchQuery - The search query that led to this share (optional)
 * @returns {Promise<boolean>} - True if successful
 */
export async function shareGif(slug, searchQuery = "") {
    const url = new URL(`${BASE_URL}/v1/${KLIPY_API_KEY}/gifs/share/${slug}`);
    const customerId = getCustomerId();

    try {
        const response = await fetch(url.toString(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                customer_id: customerId,
                q: searchQuery || "trending",
            }),
        });
        return response.ok || response.status === 204;
    } catch (err) {
        // Fire-and-forget - don't throw on analytics failure
        console.warn("Failed to log GIF share:", err);
        return false;
    }
}

// ============== Local Favorites Storage ==============

const FAVORITES_STORAGE_KEY = "klipy_favorites";

/**
 * Get all favorite GIFs from local storage
 * @returns {Array} - Array of favorite GIF objects
 */
export function getFavoriteGifs() {
    try {
        const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (err) {
        console.error("Failed to load favorites:", err);
        return [];
    }
}

/**
 * Add a GIF to favorites
 * @param {object} gif - GIF object to add
 * @returns {boolean} - True if added successfully
 */
export function addFavorite(gif) {
    try {
        const favorites = getFavoriteGifs();
        const slug = gif.slug || gif.id;

        // Don't add duplicates
        if (favorites.some((f) => (f.slug || f.id) === slug)) {
            return false;
        }

        // Store minimal data needed to display the GIF
        const minimalGif = {
            id: gif.id,
            slug: gif.slug,
            title: gif.title,
            file: gif.file,
        };

        favorites.unshift(minimalGif);
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
        return true;
    } catch (err) {
        console.error("Failed to add favorite:", err);
        return false;
    }
}

/**
 * Remove a GIF from favorites
 * @param {string} slug - GIF slug to remove
 * @returns {boolean} - True if removed successfully
 */
export function removeFavorite(slug) {
    try {
        const favorites = getFavoriteGifs();
        const filtered = favorites.filter((f) => (f.slug || f.id) !== slug);

        if (filtered.length === favorites.length) {
            return false; // Not found
        }

        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(filtered));
        return true;
    } catch (err) {
        console.error("Failed to remove favorite:", err);
        return false;
    }
}

/**
 * Check if a GIF is in favorites
 * @param {string} slug - GIF slug to check
 * @returns {boolean} - True if in favorites
 */
export function isFavorite(slug) {
    const favorites = getFavoriteGifs();
    return favorites.some((f) => (f.slug || f.id) === slug);
}
