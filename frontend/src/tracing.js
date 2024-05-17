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