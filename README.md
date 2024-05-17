# MERN Application With Grafana And Prometheus
Assignment on MERN Application with Grafana and Prometheus

## Objective:
- Develop an advanced monitoring solution for a MERN application using Grafana and Prometheus. This assignment includes setting up detailed monitoring for a full-stack JavaScript application, including database, backend, and frontend performance metrics, as well as log aggregation and tracing.

## Task
1. MERN Application Setup:
    - Deploy a travel memory application in your local machine.
2. Integrate Prometheus:
   - Integrate Prometheus metrics into the Node.js backend. Use client libraries to expose custom metrics like API response times, request counts, and error rates.
   - Set up MongoDB monitoring using an exporter, such as MongoDB Exporter, to track database performance.
3. Enhance Grafana Dashboards:
   - Create advanced Grafana dashboards to display both the default and custom metrics from the MERN application.
   - Include detailed visualizations for backend performance, database health, and frontend performance (if possible).
4. Log Aggregation:
   - Integrate a log aggregation system (such as Loki, ELK Stack, or Fluentd) to collect and visualize logs from the MERN application.
   - Create a dashboard in Grafana to explore and analyze these logs.
5. Implement Distributed Tracing:
   - Set up distributed tracing in the application using tools like Jaeger or Zipkin.
   - Integrate tracing data into Grafana for a full view of request flows through the application stack.
6. Alerting and Anomaly Detection:
   - Develop sophisticated alerting rules in Grafana based on application-specific metrics and log patterns.
   - Explore anomaly detection with Grafana, using the gathered metrics and logs.

## Setup MongoDb Server on Linux using Docker Container
```bash
docker pull mongo
docker run -dp 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=root -e MONGO_INITDB_ROOT_PASSWORD=root -v /data/db --name mongodb mongo:latest
docker exec -it mongodb /bin/bash
mongosh -u root -p root
use travelmemory
db.createUser({
    user: "root",
    pwd: "secret1234",
    roles: [{ role: "readWrite", db: "travelmemory" }]
});

```
## Setup Directory
```bash
mkdir aws-projects
cd aws-projects/
git clone https://github.com/surendergupta/mern-app-with-grafana-and-prometheus.git
cd mern-app-with-grafana-and-prometheus/
git clone https://github.com/surendergupta/TravelMemory.git
cd backend/
touch .env

```

## Put these below code inside .env file

```
PORT=3001
MONGO_URI='mongodb://root:secret1234@127.0.0.1:27017/travelmemory'
```

## Setup some packages for metrics for Prometheus in the backend
```bash
npm install prom-client
```

## Put these below code inside backend/index.js file

```js
const promClient = require('prom-client'); 

// Initialize Prometheus metrics
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ register: promClient.register });

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
    const start = Date.now();
    res.on('finish', () => {
        if (res.statusCode >= 400) {
            httpRequestsErrors.labels(req.method, req.url).inc();
        }
        const duration = Date.now() - start;
        httpRequestDurationMicroseconds.labels(req.method, req.url, res.statusCode).observe(duration / 1000);
    });
    httpRequestsTotal.labels(req.method, req.url, res.statusCode).inc();
    next();
});

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', promClient.register.contentType);
    const metrics = await promClient.register.metrics();
    res.send(metrics);
});

```

## Create file mongodb_exporter.yml inside backend folder and put below code 
```yml
---
mongodb:
  uri: "mongodb://root:secret1234@127.0.0.1:27017/travelmemory"
  username: "root"
  password: "secret1234"
```

## Create file prometheus-config.yml inside backend folder and put below code 

```yml
global:
  scrape_interval: 4s

scrape_configs:
  - job_name: 'travelmemory-backend'
    static_configs:
      - targets: ['172.21.61.204:3001']
  - job_name: 'mongodb'
    static_configs:
      - targets: ['172.21.61.204:9216']
```

## Run MongoDB Exporter using docker
```bash
docker run -d -p 9216:9216 -p 27017:27017 percona/mongodb_exporter:0.40 --mongodb.uri=mongodb://root:secret1234@127.0.0.1:27017/travelmemory
```

## craete file docker-compose.yml inside backend forlder and put below code
```yml
version: "3"

services:
  prom-server:
    image: prom/prometheus
    ports:
      - 9090:9090
    volumes:
      - ./prometheus_configs.yml:/etc/prometheus/prometheus.yml
```

## Run Prometheus using docker-compose

```bash
docker-compose --version
docker-compose up
```

## Run Grafana using docker

```bash
docker run -d -p 3000:3000 --name=grafana grafana/grafana-oss
```

## Run Loki using docker

```bash
docker run -d --name=loki -p 3100:3100 grafana/loki
```

## Log Aggregation use Loki. Install some packages for backend
```bash
npm install winston winston-loki

```

## Put these below code inside backend/index.js file
```js

const { createLogger, transports } = require("winston");
const LokiTransport = require("winston-loki");

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

app.get('/hello', (req,res)=>{
    const tracer = trace.getTracer('travel-memory-backend-route');
    const span = tracer.startSpan('GET /hello');
    logger.info('This is sample url for testing /hello');
    span.end();
    res.send('Hello World!');
});
```

## Put these below code inside backend/controller/trip.controller.js file

```js
const { createLogger, transports } = require("winston");
const LokiTransport = require("winston-loki");

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

// every controller add thse logger info
try
{
    logger.info('Trip added Successfully by post request /trip')

}
catch(error)
{
    logger.error('Error through post request /trip', error.message);
}

```

## Implement Distributed Tracing use Zipkin. Install some packages for backend and frontend

- install some packages for backend
```bash
npm install @opentelemetry/api @opentelemetry/node @opentelemetry/tracing @opentelemetry/exporter-zipkin
```

- Create tracing.js file and configure OpenTelemetry for backend
```javascript
// tracing.js
const { NodeTracerProvider } = require('@opentelemetry/node');
const { SimpleSpanProcessor } = require('@opentelemetry/tracing');
const { ZipkinExporter } = require('@opentelemetry/exporter-zipkin');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');


// Configure the NodeTracerProvider
const provider = new NodeTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'travel-memory-node-service',
  }),
});

// Configure the Zipkin exporter
const zipkinExporter = new ZipkinExporter({
  url: 'http://localhost:9411/api/v2/spans',
});

// Add a SimpleSpanProcessor to send spans to Zipkin
provider.addSpanProcessor(new SimpleSpanProcessor(zipkinExporter));

// Register the provider globally
provider.register();

console.log('Tracing initialized in Node.js');

```

- Now Import tracing.js into entry-point of backend

```javascript
require('./tracing');

```

- install some packages for frontend

```bash
npm install @opentelemetry/api @opentelemetry/sdk-trace-web @opentelemetry/sdk-trace-base @opentelemetry/exporter-zipkin

```

- Create tracing.js file and configure OpenTelemetry for frontend
```javascript
// tracing.js
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { ZipkinExporter } from '@opentelemetry/exporter-zipkin';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
// Initialize the OpenTelemetry provider
const provider = new WebTracerProvider({
  // Set the default service name
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'travel-memory-react-app',
  }),
});

// Configure the Zipkin exporter
const zipkinExporter = new ZipkinExporter({
  url: 'http://localhost:9411/api/v2/spans',
});

// Add a BatchSpanProcessor to send spans to Zipkin
provider.addSpanProcessor(new BatchSpanProcessor(zipkinExporter));

// Register the provider globally
provider.register();

console.log('Tracing initialized in React');
```

- Now Import ./frontend/src/tracing.js into entry-point of frontend
- index.js
```javascript
import './tracing';

```

## Run Zipkin using docker
```bash
docker run -dp 9411:9411 openzipkin/zipkin

```

## Setting spanName for backend (Express.js)
```javascript
const { trace } = require('@opentelemetry/api');

// Middleware to create a span for each request
app.use((req, res, next) => {
    const tracer = trace.getTracer('travel-memory-backend-middleware'); // Added
    const span = tracer.startSpan(`${req.method} ${req.path}`); // Added
    const start = Date.now();
    res.on('finish', () => {
        if (res.statusCode >= 400) {
            httpRequestsErrors.labels(req.method, req.url).inc();
        }
        const duration = Date.now() - start;
        httpRequestDurationMicroseconds.labels(req.method, req.url, res.statusCode).observe(duration / 1000);
        span.end(); // Added
    });
    httpRequestsTotal.labels(req.method, req.url, res.statusCode).inc();
    next();
});

app.get('/hello', (req,res)=>{
    const tracer = trace.getTracer('travel-memory-backend-route'); // Added
    const span = tracer.startSpan('GET /hello'); // Added
    logger.info('This is sample url for testing /hello');
    span.end(); // Added
    res.send('Hello World!');
})
```

## Setting spanName for \backend\controller\trip.controller.js  backend (Express.js)
```javascript
const { trace } = require('@opentelemetry/api');

// every controller function
async function tripAdditionController(req, res){
    const tracer = trace.getTracer('travel-memory-backend-route');
    const span = tracer.startSpan('POST /trip/');
    try
    {
        span.end();
    }
    catch(error)
    {
        span.end();
    }
```

## Setting spanName for /frontend/src/components/pages/Home.js frontend (React.js)
```javascript
import { trace } from '@opentelemetry/api';
const tracer = trace.getTracer('travel-memory-react-app');
const span = tracer.startSpan('fetch trip data');
const fetchData = async () => {
    try {
        // Perform operations...
    }
    catch (error) 
    {
        span.recordException(error);
    }
    finally
    {
        span.end();
    }
}
```

## Setting spanName for /frontend/src/components/pages/ExperienceDetails.js frontend (React.js)

```javascript
import { trace } from '@opentelemetry/api';
const tracer = trace.getTracer('travel-memory-react-app');
const span = tracer.startSpan('fetch trip data by id');
try 
{
    // Perform operations...
}
catch (error) 
{
    span.recordException(error);
}
finally
{
    span.end();
}
```

## Setting spanName for /frontend/src/components/pages/Home.js frontend (React.js)

```javascript
import { trace } from '@opentelemetry/api';
const tracer = trace.getTracer('travel-memory-react-app');
const span = tracer.startSpan('Add trip data');
try 
{
    // Perform operations...
}
catch (error) 
{
    span.recordException(error);
}
finally
{
    span.end();
}
```

## Setup Grafana DataSource for Prometheus, Loki amd Zipkin
- Grafana home page select add your first data source click
- Select your data source like ., Prometheus in Time Series database
- Select your data source like ., Loki in Logging & document database
- Select your data source like ., Zipkin in Distributed tracing database
- After choose one of them fill some information and click on save & test button on bottom. Information like Name, Server Url depends on what you choose above like prometheus then type prometheus server url and respectively
- All data source added one by one

## Setup Dashboard for mongoDB exporter that tell you Health of MongoDB

- We are use predefined template for MonoDb
- Grafana home page select Create your dashboard click
- Select import a dashboard click and put 2583 id and click on load button
- Now fill some information like., Name, select folder and datasource will your prometheus data source
- Now click on Import 

## Setup Dashboard for Node.js that tell you metrics of backend

- We are use predefined template for Node.js
- Grafana home page select Create your dashboard click
- Select import a dashboard click and put 12230 id and click on load button
- Now fill some information like., Name, select folder and datasource will your prometheus data source
- Now click on Import 

## Dashboard for Node.js Add Some Visualization for Loki, Zipkins and prometheus custum metrics

- In query section select DataSource., prometheus-backend, Loki and zipkin-travel-memory

- prometheus and Loki show query builder and select metrics and lable fileter and then run query
- If You see everything look good click on apply button on top to save this metrics on dashboard in a panel section
- In Zipkin data source you are select trace and the show some options travel-memory-node-service or travel-memory-react-app click any one you want to show
- select what you show and click on apply button show on dashboard
- after add visualization save dashboard for not lossing your visualization

## Screenshots

![alt text](./screenshots/image.png)

![alt text](./screenshots/image-1.png)

![alt text](./screenshots/image-2.png)

![alt text](./screenshots/image-3.png)

![alt text](./screenshots/image-4.png)

![alt text](./screenshots/image-5.png)

![alt text](./screenshots/image-6.png)

![alt text](./screenshots/image-7.png)

![alt text](./screenshots/image-8.png)

![alt text](./screenshots/image-9.png)

![alt text](./screenshots/image-10.png)

![alt text](./screenshots/image-11.png)

![alt text](./screenshots/image-12.png)

![alt text](./screenshots/image-13.png)

![alt text](./screenshots/image-14.png)
