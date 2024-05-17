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