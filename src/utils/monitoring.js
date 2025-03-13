/**
 * @desc    Server monitoring utilities
 * @author  David Sandoval
 */

const os = require('os');
const EventEmitter = require('events');
const logger = require('./logger');

class ServerMonitor extends EventEmitter {
    constructor(options = {}) {
        super();

        // Default options
        this.options = {
            interval: options.interval || 60000, // Default: check every minute
            memoryThreshold: options.memoryThreshold || 85, // Default: warn at 85% memory usage
            cpuThreshold: options.cpuThreshold || 80, // Default: warn at 80% CPU usage
            logToConsole: options.logToConsole !== undefined ? options.logToConsole : true,
            logToFile: options.logToFile !== undefined ? options.logToFile : true,
        };

        this.isRunning = false;
        this.intervalId = null;
        this.startTime = Date.now();
        this.metrics = {
            lastCheck: null,
            memoryUsage: 0,
            cpuUsage: 0,
            requestCount: 0,
            errorCount: 0,
            avgResponseTime: 0,
        };

        // Store previous CPU measurements for accurate calculation
        this.previousCpuUsage = null;

        // Response time tracking
        this.responseTimes = [];
    }

    /**
     * Start monitoring the server
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.startTime = Date.now();

        this.log('Server monitoring started');

        // Collect initial CPU measurement
        this.previousCpuUsage = os.cpus().map((cpu) => ({
            idle: cpu.times.idle,
            total: Object.values(cpu.times).reduce((acc, time) => acc + time, 0),
        }));

        // Set interval for periodic checks
        this.intervalId = setInterval(() => this.check(), this.options.interval);

        // Immediate first check
        this.check();
    }

    /**
     * Stop monitoring the server
     */
    stop() {
        if (!this.isRunning) return;

        clearInterval(this.intervalId);
        this.isRunning = false;
        this.log('Server monitoring stopped');
    }

    /**
     * Perform a check of system metrics
     */
    check() {
        try {
            const memoryUsage = this.getMemoryUsage();
            const cpuUsage = this.getCpuUsage();

            this.metrics.lastCheck = new Date();
            this.metrics.memoryUsage = memoryUsage;
            this.metrics.cpuUsage = cpuUsage;

            // Reset response time tracking after each check
            if (this.responseTimes.length > 0) {
                this.metrics.avgResponseTime =
                    this.responseTimes.reduce((acc, time) => acc + time, 0) / this.responseTimes.length;
                this.responseTimes = [];
            }

            // Emit metrics event
            this.emit('metrics', this.getMetrics());

            // Check thresholds and emit warnings if exceeded
            if (memoryUsage > this.options.memoryThreshold) {
                this.log(`WARNING: Memory usage is high: ${memoryUsage.toFixed(2)}%`, 'warn');
                this.emit('memoryWarning', memoryUsage);
            }

            if (cpuUsage > this.options.cpuThreshold) {
                this.log(`WARNING: CPU usage is high: ${cpuUsage.toFixed(2)}%`, 'warn');
                this.emit('cpuWarning', cpuUsage);
            }

            // Log metrics if enabled
            if (this.options.logToConsole || this.options.logToFile) {
                this.log(
                    `Metrics: Memory: ${memoryUsage.toFixed(2)}%, CPU: ${cpuUsage.toFixed(2)}%, ` +
                        `Requests: ${this.metrics.requestCount}, Errors: ${this.metrics.errorCount}, ` +
                        `Avg Response: ${this.metrics.avgResponseTime.toFixed(2)}ms`
                );
            }
        } catch (error) {
            this.log(`Error in server monitoring: ${error.message}`, 'error');
        }
    }

    /**
     * Get current memory usage percentage
     */
    getMemoryUsage() {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        return ((totalMem - freeMem) / totalMem) * 100;
    }

    /**
     * Get current CPU usage percentage
     */
    getCpuUsage() {
        if (!this.previousCpuUsage) return 0;

        const currentCpuUsage = os.cpus().map((cpu) => ({
            idle: cpu.times.idle,
            total: Object.values(cpu.times).reduce((acc, time) => acc + time, 0),
        }));

        // Calculate CPU usage since last check
        const cpuUsages = this.previousCpuUsage.map((prev, i) => {
            const curr = currentCpuUsage[i];
            const idleDiff = curr.idle - prev.idle;
            const totalDiff = curr.total - prev.total;

            return totalDiff === 0 ? 0 : 100 - (idleDiff / totalDiff) * 100;
        });

        // Store current measurements for next check
        this.previousCpuUsage = currentCpuUsage;

        // Return average CPU usage across all cores
        return cpuUsages.reduce((acc, usage) => acc + usage, 0) / cpuUsages.length;
    }

    /**
     * Track request with response time
     * @param {number} responseTime - Response time in milliseconds
     * @param {boolean} isError - Whether the request resulted in an error
     */
    trackRequest(responseTime, isError = false) {
        this.metrics.requestCount++;
        if (isError) this.metrics.errorCount++;
        if (responseTime) this.responseTimes.push(responseTime);
    }

    /**
     * Get current server uptime in human-readable format
     */
    getUptime() {
        const uptimeMs = Date.now() - this.startTime;
        const seconds = Math.floor(uptimeMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        return {
            days,
            hours: hours % 24,
            minutes: minutes % 60,
            seconds: seconds % 60,
            formatted: `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`,
        };
    }

    /**
     * Reset request and error counters
     */
    resetCounters() {
        this.metrics.requestCount = 0;
        this.metrics.errorCount = 0;
    }

    /**
     * Get current metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            uptime: this.getUptime(),
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            hostname: os.hostname(),
        };
    }

    /**
     * Log a message using the logger
     * @param {string} message - Message to log
     * @param {string} level - Log level (info, warn, error)
     */
    log(message, level = 'info') {
        if (this.options.logToConsole) {
            console[level === 'info' ? 'log' : level](message);
        }

        if (this.options.logToFile && logger[level]) {
            logger[level](message);
        }
    }
}

// Create singleton instance with default options
const monitor = new ServerMonitor();

// Express middleware for request tracking
const monitoringMiddleware = (req, res, next) => {
    const startTime = Date.now();

    // Add listener for response finish event
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        const isError = res.statusCode >= 400;
        monitor.trackRequest(responseTime, isError);
    });

    next();
};

module.exports = {
    ServerMonitor,
    monitor,
    monitoringMiddleware,
};
