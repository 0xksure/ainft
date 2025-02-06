import logging
import time
from opentelemetry import trace, metrics
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter


class Telemetry:
    def __init__(self, service_name: str):
        # Configure tracing
        trace.set_tracer_provider(TracerProvider())
        otlp_exporter = OTLPSpanExporter()
        trace.get_tracer_provider().add_span_processor(
            BatchSpanProcessor(otlp_exporter)
        )
        self.tracer = trace.get_tracer(service_name)

        # Configure metrics
        reader = PeriodicExportingMetricReader(OTLPMetricExporter())
        metrics.set_meter_provider(MeterProvider(metric_readers=[reader]))
        self.meter = metrics.get_meter(service_name)

        # Configure logging
        self.logger = logging.getLogger(service_name)
        self.logger.setLevel(logging.INFO)

        # Create metrics
        self.request_counter = self.meter.create_counter(
            "model_requests", description="Number of model requests"
        )
        self.latency_histogram = self.meter.create_histogram(
            "model_latency", description="Model response latency"
        )

    async def record_request(
        self, prompt: str, context: str, response: str, duration: float
    ):
        self.request_counter.add(1)
        self.latency_histogram.record(duration)

        self.logger.info(
            "Model request processed",
            extra={
                "prompt_length": len(prompt),
                "context_length": len(context),
                "response_length": len(response),
                "duration_ms": duration * 1000,
            },
        )
