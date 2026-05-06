const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const UNSPLASH_BASE_URL = 'https://api.unsplash.com';

/**
 * @route   GET /api/unsplash/search?query=&page=&per_page=
 * @desc    Search Unsplash images by query
 * @access  Auth
 */
const searchImages = asyncHandler(async (req, res) => {
  const { query, page = 1, per_page = 12 } = req.query;

  if (!query) {
    throw new ApiError(400, 'Search query is required');
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey || accessKey === 'your_unsplash_access_key') {
    // Return mock data for development
    const mockImages = Array.from({ length: 12 }, (_, i) => ({
      id: `mock-${i}`,
      urls: {
        regular: `https://picsum.photos/seed/${query}-${i}/800/600`,
        small: `https://picsum.photos/seed/${query}-${i}/400/300`,
        thumb: `https://picsum.photos/seed/${query}-${i}/200/150`,
      },
      alt_description: `${query} image ${i + 1}`,
      user: {
        name: 'Unsplash Photographer',
        links: { html: 'https://unsplash.com' },
      },
      links: { html: 'https://unsplash.com' },
    }));

    return ApiResponse.success(res, {
      results: mockImages,
      total: 100,
      total_pages: 9,
    }, 'Mock images (configure UNSPLASH_ACCESS_KEY for real images)');
  }

  const url = `${UNSPLASH_BASE_URL}/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${per_page}&orientation=landscape`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
    },
  });

  if (!response.ok) {
    throw new ApiError(502, 'Failed to fetch images from Unsplash');
  }

  const data = await response.json();

  // Return only needed fields to reduce payload
  const images = data.results.map((img) => ({
    id: img.id,
    urls: {
      regular: img.urls.regular,
      small: img.urls.small,
      thumb: img.urls.thumb,
    },
    alt_description: img.alt_description,
    user: {
      name: img.user.name,
      links: { html: img.user.links.html },
    },
    links: { html: img.links.html },
  }));

  ApiResponse.success(res, {
    results: images,
    total: data.total,
    total_pages: data.total_pages,
  });
});

module.exports = { searchImages };
