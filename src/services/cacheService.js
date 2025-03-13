const { LRUCache } = require('lru-cache');
const crypto = require('crypto');
const config = require('../config/env');
const logger = require('../utils/logger');

// Initialize cache if enabled
const cache = config.enableAiResponseCache
    ? new LRUCache({
          max: 1000, // Store max 1000 items
          ttl: config.aiCacheTtl * 1000, // TTL in ms
          allowStale: false,
          updateAgeOnGet: true,
          updateAgeOnHas: false,
      })
    : null;

/**
 * Generate cache key from request data
 * @param {Object} data - Data to generate key from
 * @returns {string} - Hash key
 */
const generateKey = (data) => {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHash('md5').update(str).digest('hex');
};

/**
 * Get item from cache
 * @param {string|Object} key - Cache key or object to generate key from
 * @returns {any} - Cached item or null if not found
 */
exports.get = (key) => {
    if (!cache) return null;

    const cacheKey = typeof key === 'string' ? key : generateKey(key);
    const value = cache.get(cacheKey);

    if (value) {
        logger.debug(`Cache hit for key: ${cacheKey.substring(0, 8)}...`);
    } else {
        logger.debug(`Cache miss for key: ${cacheKey.substring(0, 8)}...`);
    }

    return value;
};

/**
 * Set item in cache
 * @param {string|Object} key - Cache key or object to generate key from
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (optional, uses default if not provided)
 */
exports.set = (key, value, ttl = null) => {
    if (!cache) return;

    const cacheKey = typeof key === 'string' ? key : generateKey(key);
    const ttlMs = ttl ? ttl * 1000 : undefined;

    cache.set(cacheKey, value, { ttl: ttlMs });
    logger.debug(`Cache set for key: ${cacheKey.substring(0, 8)}...`);
};

/**
 * Delete item from cache
 * @param {string|Object} key - Cache key or object to generate key from
 */
exports.delete = (key) => {
    if (!cache) return;

    const cacheKey = typeof key === 'string' ? key : generateKey(key);
    cache.delete(cacheKey);
    logger.debug(`Cache delete for key: ${cacheKey.substring(0, 8)}...`);
};

/**
 * Clear all items from cache
 */
exports.clear = () => {
    if (!cache) return;

    cache.clear();
    logger.info('Cache cleared');
};

/**
 * Get cache stats
 * @returns {Object|null} - Cache stats or null if cache is disabled
 */
exports.getStats = () => {
    if (!cache) return null;

    return {
        size: cache.size,
        itemCount: cache.itemCount,
        maxSize: cache.max,
        ttl: config.aiCacheTtl,
        hits: cache.stats?.hits || 0,
        misses: cache.stats?.misses || 0,
        hitRate: cache.stats ? ((cache.stats.hits / (cache.stats.hits + cache.stats.misses)) * 100).toFixed(1) : 0,
    };
};

/**
 * Middleware to add cache data in development env
 */
exports.cacheDebugMiddleware = (req, res, next) => {
    if (config.nodeEnv !== 'production' && cache) {
        res.set('X-Cache-Status', 'enabled');

        const cacheSize = cache.size !== undefined && cache.size !== null ? cache.size.toString() : '';
        res.set('X-Cache-Size', cacheSize);

        const cacheItems = cache.itemCount !== undefined && cache.itemCount !== null ? cache.itemCount.toString() : '';
        res.set('X-Cache-Items', cacheItems);
    }

    next();
};
