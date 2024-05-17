require('./tracing');
const express = require('express');
const promClient = require('prom-client'); // Metric Collection
const { createLogger, transports } = require("winston");
const LokiTransport = require("winston-loki");
const cors = require('cors');
const { trace } = require('@opentelemetry/api');
require('dotenv').config();
const options = {
    transports: [
      new LokiTransport({
        labels: {
            appName: 'Express node js'
        },
        host: "http://172.21.61.204:3100"
      })
    ]
};
const logger = createLogger(options);

const app = express()
// Initialize Prometheus metrics
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ register: promClient.register });

const conn = require('./conn')
app.use(express.json())
app.use(cors())

const httpRequestDurationMicroseconds = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in microseconds',
    labelNames: ['method', 'route', 'statusCode'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 2, 3, 5, 10]
});

const httpRequestsTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'statusCode']
});

const httpRequestsErrors = new promClient.Counter({
    name: 'http_requests_errors_total',
    help: 'Total number of HTTP requests resulting in errors',
    labelNames: ['method', 'route']
});

app.use((req, res, next) => {
    const tracer = trace.getTracer('travel-memory-backend-middleware');
    const span = tracer.startSpan(`${req.method} ${req.path}`);
    const start = Date.now();
    res.on('finish', () => {
        if (res.statusCode >= 400) {
            httpRequestsErrors.labels(req.method, req.url).inc();
        }
        const duration = Date.now() - start;
        httpRequestDurationMicroseconds.labels(req.method, req.url, res.statusCode).observe(duration / 1000);
        span.end();
    });
    httpRequestsTotal.labels(req.method, req.url, res.statusCode).inc();
    next();
});

const tripRoutes = require('./routes/trip.routes')

app.use('/trip', tripRoutes) // http://localhost:3001/trip --> POST/GET/GET by ID

app.get('/hello', (req,res)=>{
    const tracer = trace.getTracer('travel-memory-backend-route');
    const span = tracer.startSpan('GET /hello');
    logger.info('This is sample url for testing /hello');
    span.end();
    res.send('Hello World!');
})

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', promClient.register.contentType);
    const metrics = await promClient.register.metrics();
    res.send(metrics);
});

PORT = process.env.PORT
app.listen(PORT, ()=>{
    console.log(`Server started at http://localhost:${PORT}`)
})
