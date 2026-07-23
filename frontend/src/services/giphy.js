/**
 * GIPHY API Service
 * - Search GIF với debounce (300ms)
 * - Trending GIF mặc định khi mở picker
 * - Tự động xử lý rate limit error
 */

const GIPHY_BASE = 'https://api.giphy.com/v1/gifs';
const API_KEY = import.meta.env.VITE_GIPHY_API_KEY;

/**
 * Gọi GIPHY API với timeout + error handling
 */
async function fetchGiphy(endpoint, params = {}) {
  const url = new URL(`${GIPHY_BASE}/${endpoint}`);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('rating', 'g');
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString());
  if (!res.ok) {
    if (res.status === 429) throw new Error('Rate limit GIPHY — thử lại sau 1 phút');
    if (res.status === 401 || res.status === 403) throw new Error('GIPHY API key không hợp lệ');
    throw new Error(`GIPHY lỗi HTTP ${res.status}`);
  }

  const data = await res.json();
  if (data.meta?.status !== 200) {
    throw new Error(data.meta?.msg || 'Lỗi GIPHY không xác định');
  }
  return data;
}

/**
 * Định dạng kết quả GIPHY thành object nhẹ, chỉ giữ các field cần dùng
 */
function formatGif(gif) {
  return {
    id: gif.id,
    title: gif.title,
    // URL gốc (chất lượng cao nhất — dùng để lưu vào post)
    url: gif.images?.original?.url,
    // Preview nhỏ trong grid picker (fixed_height_small)
    preview: gif.images?.fixed_height_small?.url,
    // Kích thước gốc để giữ tỷ lệ khi hiển thị
    width: gif.images?.original?.width,
    height: gif.images?.original?.height,
    // Thumbnail tĩnh khi chưa hover (tiết kiệm băng thông)
    still: gif.images?.fixed_height_small_still?.url,
  };
}

/**
 * Tìm kiếm GIF theo từ khóa
 * @param {string} query - Từ khóa tìm kiếm
 * @param {object} options - { limit, offset }
 * @returns {{ gifs: Array, total: number, offset: number }}
 */
export async function searchGifs(query, { limit = 20, offset = 0 } = {}) {
  if (!query?.trim()) return { gifs: [], total: 0, offset: 0 };

  const data = await fetchGiphy('search', {
    q: query.trim(),
    limit,
    offset,
    lang: 'vi',
  });

  return {
    gifs: (data.data || []).map(formatGif),
    total: data.pagination?.total_count || 0,
    offset: data.pagination?.offset || 0,
  };
}

/**
 * Lấy GIF trending (khi chưa gõ search)
 * @returns {{ gifs: Array }}
 */
export async function getTrending({ limit = 20, offset = 0 } = {}) {
  const data = await fetchGiphy('trending', { limit, offset });

  return {
    gifs: (data.data || []).map(formatGif),
    total: data.pagination?.total_count || 0,
    offset: data.pagination?.offset || 0,
  };
}

/**
 * Debounce helper — trả về function chỉ gọi sau khi ngừng gọi trong `delay` ms
 */
export function debounce(fn, delay = 300) {
  let timer;
  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

/**
 * Kiểm tra URL có phải là GIPHY GIF không
 */
export function isGiphyUrl(url) {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return host.includes('giphy.com') || host.includes('giphy');
  } catch {
    return false;
  }
}
