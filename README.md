# CORS Proxy

## Introduction
Generally if avoidable, this solution should be avoided. 
This tool is intended to be used exclusively as a development tool.

On some environments like Chromecast and other WebCTV devices, a traditional tool like Charles can't be used to modify headers for a variety of reasons. 

In situations where the domain can't be consistently be added to the CORS allow list (e.g. security concerns, changing URLs, ect.) CORS issues can cause a problem in the development cycle.

This proxy will maintain the majority of the original request, and return the responses from the server, with CORS headers modified to be a wildcard value of `*`.

Requests will be sent to `server-ip:port/proxy?url={API_URL}`

### Key Details
- Preserves the HTTP method (GET, POST, etc.)
- Passes through most headers
- Forwards body content, including JSON
- Returns status codes and response bodies unchanged
- Rewrites response headers only to inject permissive CORS headers

## Usage

To start the service, run `pnpm start`

By default this application will run on port 3420.
