import { KLIPY_API_KEY } from "../utils/constants";

const BASE_URL = "https://api.klipy.com";

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
 * Fetch trending GIFs from Klipy API
 * @param {number} page - Page number (1-indexed)
 * @param {number} perPage - Number of items per page (max 50)
 * @returns {Promise<{items: Array, hasMore: boolean}>}
 */
export async function getTrendingGifs(page = 1, perPage = 24) {
    const customerId = getCustomerId();
    const url = new URL(`${BASE_URL}/v1/gifs/${KLIPY_API_KEY}/trending`);

    url.searchParams.set("page", page.toString());
    url.searchParams.set("per_page", perPage.toString());
    url.searchParams.set("customer_id", customerId);
    url.searchParams.set("locale", navigator.language?.split("-")[0] || "en");

    const response = await fetch(url.toString());

    if (!response.ok) {
        throw new Error(`Klipy API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.result) {
        throw new Error("Failed to fetch trending GIFs");
    }

    return {
        items: data.data?.items || [],
        hasMore: (data.data?.items?.length || 0) === perPage,
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
    const url = new URL(`${BASE_URL}/v1/gifs/${KLIPY_API_KEY}/search`);

    url.searchParams.set("q", query.trim());
    url.searchParams.set("page", page.toString());
    url.searchParams.set("per_page", perPage.toString());
    url.searchParams.set("customer_id", customerId);
    url.searchParams.set("locale", navigator.language?.split("-")[0] || "en");

    const response = await fetch(url.toString());

    if (!response.ok) {
        throw new Error(`Klipy API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.result) {
        throw new Error("Failed to search GIFs");
    }

    return {
        items: data.data?.items || [],
        hasMore: (data.data?.items?.length || 0) === perPage,
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
    if (!gif?.files) return null;

    const sizeData = gif.files[size];
    if (!sizeData) return null;

    // Prefer webp, then gif, then mp4
    return sizeData.webp || sizeData.gif || sizeData.mp4 || null;
}

/**
 * Get GIF dimensions for a specific size
 * @param {object} gif - GIF object from Klipy API
 * @param {string} size - Size variant: 'xs', 'sm', 'md', 'hd'
 * @returns {{width: number, height: number}|null}
 */
export function getGifDimensions(gif, size = "sm") {
    if (!gif?.files?.[size]) return null;

    return {
        width: gif.files[size].width,
        height: gif.files[size].height,
    };
}
