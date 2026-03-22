import http, { type IncomingMessage, type ServerResponse } from "http";

export interface LoadBalancerOptions {
  host: string;
  listenPort: number;
  workerPorts: number[];
}

function pipeToWorker(
  req: IncomingMessage,
  res: ServerResponse,
  host: string,
  workerPort: number,
): void {
  const proxyRequest = http.request(
    {
      hostname: host,
      port: workerPort,
      method: req.method,
      path: req.url,
      headers: req.headers,
    },
    (proxyResponse) => {
      res.writeHead(proxyResponse.statusCode ?? 500, {
        ...proxyResponse.headers,
        "x-worker-port": String(workerPort),
      });

      proxyResponse.pipe(res);
    },
  );

  proxyRequest.on("error", () => {
    if (res.writableEnded) {
      return;
    }

    res.writeHead(502, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        statusCode: 502,
        error: "Bad Gateway",
        message: `Worker on port ${workerPort} is unavailable`,
      }),
    );
  });

  req.pipe(proxyRequest);
}

export function createLoadBalancer(options: LoadBalancerOptions): http.Server {
  let index = 0;

  return http.createServer((req, res) => {
    const workerPort = options.workerPorts[index % options.workerPorts.length];
    index += 1;

    pipeToWorker(req, res, options.host, workerPort);
  });
}

