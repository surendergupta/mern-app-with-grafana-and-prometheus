import React, { useEffect, useState } from "react";
import Card from "../UIC/Card";
import FeaturedCard from "../UIC/FeaturedCard";
import axios from "axios";
import { baseUrl } from "../../url";
import { trace } from '@opentelemetry/api';

export default function Home() {
  const [data, setData] = useState();
  useEffect(() => {
    const tracer = trace.getTracer('travel-memory-react-app');
    const span = tracer.startSpan('fetch trip data');
    const fetchData = async () => {
      try {
        axios.get(`${baseUrl}/trip/`).then((res) => setData(res.data));
      } catch (error) {
        span.recordException(error);
      } finally {
        span.end();
      }
    }
    fetchData();
  }, []);
  if (data) {
    return (
      <div style={{ margin: "2%" }}>
        {data.map((e) => {
          if (e.featured) {
            return (
              <FeaturedCard
                title={e.tripName}
                tripType={e.tripType}
                description={e.shortDescription}
                id={e._id}
              ></FeaturedCard>
            );
          } else {
            return null;
          }
        })}
        {data.map((e) => {
          if (!e.featured) {
            return (
              <Card
                title={e.tripName}
                tripType={e.tripType}
                description={e.shortDescription}
                id={e._id}
              ></Card>
            );
          } else {
            return null;
          }
        })}
      </div>
    );
  } else {
    return <>Loading...</>;
  }
}
