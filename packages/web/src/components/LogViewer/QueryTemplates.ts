/**
 * Pre-built Elasticsearch query templates for common log search scenarios
 */

export interface QueryTemplate {
  name: string;
  description: string;
  query: Record<string, any>;
}

export const QUERY_TEMPLATES: QueryTemplate[] = [
  {
    name: 'Last Hour',
    description: 'Logs from the last hour',
    query: {
      query: {
        bool: {
          filter: [
            {
              range: {
                '@timestamp': {
                  gte: 'now-1h',
                  lte: 'now'
                }
              }
            }
          ]
        }
      },
      size: 100,
      sort: [{ '@timestamp': { order: 'desc' } }]
    }
  },
  {
    name: 'Last 24 Hours',
    description: 'Logs from the last 24 hours',
    query: {
      query: {
        bool: {
          filter: [
            {
              range: {
                '@timestamp': {
                  gte: 'now-24h',
                  lte: 'now'
                }
              }
            }
          ]
        }
      },
      size: 100,
      sort: [{ '@timestamp': { order: 'desc' } }]
    }
  },
  {
    name: 'Search by Message',
    description: 'Search for specific text in message field',
    query: {
      query: {
        bool: {
          must: [
            {
              match: {
                message: 'YOUR_SEARCH_TEXT'
              }
            }
          ]
        }
      },
      size: 100,
      sort: [{ '@timestamp': { order: 'desc' } }]
    }
  },
  {
    name: 'Search by Exception',
    description: 'Find logs with specific exception',
    query: {
      query: {
        bool: {
          must: [
            {
              match: {
                exception: 'org.springframework.security.authentication.BadCredentialsException'
              }
            }
          ]
        }
      },
      size: 100,
      sort: [{ '@timestamp': { order: 'desc' } }]
    }
  },
  {
    name: 'By Span ID',
    description: 'Find logs by span ID for distributed tracing',
    query: {
      query: {
        bool: {
          filter: [
            {
              term: {
                spanId: 'YOUR_SPAN_ID'
              }
            }
          ]
        }
      },
      size: 100,
      sort: [{ '@timestamp': { order: 'desc' } }]
    }
  },
  {
    name: 'By Trace ID',
    description: 'Find logs by trace ID for distributed tracing',
    query: {
      query: {
        bool: {
          filter: [
            {
              term: {
                traceId: 'YOUR_TRACE_ID'
              }
            }
          ]
        }
      },
      size: 100,
      sort: [{ '@timestamp': { order: 'desc' } }]
    }
  }
];

