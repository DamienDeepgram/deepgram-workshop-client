# deepgram-workshop-client

Simple web interface for the Deepgram Voice AI Agent API showing a simple menu ordering system.

* LLM Configuration
* LLM Function Calling
* Websocket Interface
  * Sending browser microphone audio
  * Receiving audio response
 
## Setup

Set your Deepgram API Key in main.js [here](https://github.com/DamienDeepgram/deepgram-workshop-client/blob/main/js/main.js#L27)

```
let ws = new WebSocket("wss://agent.deepgram.com/agent", ["token", "<your-api-key-here>"]);
```

## Installation

```
npm install -g http-server
```

## Running

In the root of the repo run

```
http-server
```
