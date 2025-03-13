const { monitor } = require('../utils/monitoring');

/**
 * Middleware that tracks request metrics for monitoring
 */
const trackRequest = (req, res, next) => {
    const startTime = Date.now();

    // Add listener for response finish event
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        const isError = res.statusCode >= 400;
        monitor.trackRequest(responseTime, isError);
    });

    next();
};

/**
 * Middleware that adds monitoring headers to responses
 */
const addMonitoringHeaders = (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        res.set('X-Response-Time', Date.now() - req.startTime + 'ms');
        res.set('X-Memory-Usage', Math.round(monitor.getMetrics().memoryUsage) + '%');
        res.set('X-Server-Uptime', monitor.getMetrics().uptime.formatted);
    }

    next();
};

module.exports = {
    trackRequest,
    addMonitoringHeaders,
};
