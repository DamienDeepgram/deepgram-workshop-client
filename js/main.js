var audioContextOut = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive", sampleRate: 48000 });
var audioContext = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive" });
var startTime = -1;

window.onload = function () {
  prepareDriveThruConfig();
  var voice = document.getElementById("voice");
  var model = document.getElementById("model");
  document.getElementById("startConversationBtn").addEventListener("click", () => {
    startConversaton(model, voice);
  });
};

function startConversaton(model, voice) {
  const config = configureSettings(model, voice);
  var ws = new WebSocket("wss://sts.sandbox.deepgram.com/demo/agent");
  ws.binaryType = 'arraybuffer';

  ws.onopen = function () {
    console.log("WebSocket connection established.");
    ws.send(JSON.stringify(config)); // Send initial config on connection
    startStreaming(ws);
  };

  ws.onerror = function (error) {
    console.error("WebSocket error:", error);
  };

  ws.onmessage = function (event) {
    if (typeof event.data === "string") {
      console.log("Text message received:", event.data);
      // Handle text messages here
      handleMessageEvent(event.data);
    } else if (event.data instanceof ArrayBuffer) {
      updateBlobSize(0.25);
      feedAudioData(event.data);
    } else {
      console.error("Unsupported message format.");
    }
  };

  updateUI();

  updateVoices((voice_selection) => {
    ws.send(JSON.stringify({
      "type": "UpdateSpeak",
      "model": voice_selection
    }));
  });

  updateInstructions((instructions) => {
    ws.send(JSON.stringify({
      "type": "UpdateInstructions",
      "instructions": instructions
    }))
  });
}

function feedAudioData(audioData) {
  // See https://stackoverflow.com/a/61481513 for tips on smooth playback

  var audioDataView = new Int16Array(audioData);

  if (audioDataView.length === 0) {
    console.error("Received audio data is empty.");
    return;
  }

  var audioBuffer = audioContextOut.createBuffer(
    1,
    audioDataView.length,
    48000
  ); // 1 channel, 48 kHz sample rate
  var audioBufferChannel = audioBuffer.getChannelData(0);

  // Copy audio data to the buffer
  for (var i = 0; i < audioDataView.length; i++) {
    audioBufferChannel[i] = audioDataView[i] / 32768; // Convert linear16 PCM to float [-1, 1]
  }

  var source = audioContextOut.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContextOut.destination);

  if (startTime < audioContextOut.currentTime) {
    startTime = audioContextOut.currentTime;
  }
  source.start(startTime);
  startTime += audioBuffer.duration;
}

function startStreaming(ws) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error("getUserMedia is not supported in this browser.");
    return;
  }

  // In the browser, run `navigator.mediaDevices.getSupportedConstraints()` to see your
  // options here.
  var constraints = {
    audio: {
      sampleRate: 48000,
      channelCount: 1,
      echoCancellation: true,
      autoGainControl: true,
      voiceIsolation: true,
      noiseSuppression: false,
      latency: 0,
    },
  };

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function (stream) {
      var audioContext = new AudioContext();
      var microphone = audioContext.createMediaStreamSource(stream);
      var processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = function (event) {
        // console.log("sending audio data?");
        var inputData = event.inputBuffer.getChannelData(0);
        // update blob size based on audio level
        var rms = Math.sqrt(
          inputData.reduce((sum, value) => sum + value * value, 0) /
          inputData.length
        );
        updateBlobSize(rms * 5); // Scale RMS value to control size

        ws.send(inputData);
      };

      microphone.connect(processor);
      processor.connect(audioContext.destination);
    })
    .catch(function (error) {
      console.error("Error accessing microphone:", error);
    });
}

function updateVoices(callback) {
  document.querySelectorAll(".circle-button").forEach((button) => {
    button.addEventListener("click", function () {
      document
        .querySelector(".circle-button.selected")
        .classList.remove("selected");
      this.classList.add("selected");
      var voice_selection = this.id;
      console.log("Voice selection changed to:", voice_selection);

      callback(voice_selection);
    });
  });
}

function updateInstructions(callback) {
  // Update the instructions when a button is clicked
  document
    .getElementById("updateInstructionsBtn")
    .addEventListener("click", function () {
      var instructions = document.getElementById("instructionsInput").value;
      callback(instructions);
    });
}

function updateMenu(){
  let itemsDiv = document.querySelector('#items');
  state.menu.items.forEach((item) => {
    let itemLi = document.createElement('li');
    itemLi.innerHTML = item.name + ' - $' + item.price;
    itemLi.className = 'no-bullets items';
    itemsDiv.appendChild(itemLi);
});
}

function updateUI() {
  document.getElementById("startContainer").style.display = "none";
  document.getElementById("blobCanvas").style.display = "flex";
  document.getElementById("buttonContainer").style.display = "flex";

  animateBlob();
}

function configureSettings(model, voice) {
  var voice = voice.options[voice.selectedIndex].value;
  var providerAndModel = model.options[model.selectedIndex].value.split("+");
  // Configuration settings for the agent
  var config_settings = getDriveThruStsConfig(state.callID, JSON.stringify(Object.values(state.menu)));
  config_settings.agent.think.provider = providerAndModel[0];
  config_settings.agent.think.model = providerAndModel[1];
  console.log('config_settings', JSON.stringify(config_settings))

  // Update the text area to match the initial instructions
  document.getElementById("instructionsInput").value = config_settings.agent.think.instructions;
  document.getElementById(voice).classList.add("selected");
  return config_settings;
}

async function handleMessageEvent(){
  if (!state.callID || state.status === 'sleeping') return;

  const order = await service.getOrder(state.callID);
  if (order) {
      // Consolidate order needed because sometimes server can send back duplicate items
      state.consolidatedOrder = order.reduce((acc, item) => {
          const existingItem = acc.find(i => i.name === item.name);
          if (existingItem) {
              existingItem.qty += 1;
          } else {
              acc.push({ ...item, qty: 1 });
          }
          return acc;
      }, []);
      let orderItems = document.querySelector('#orderItems');
      orderItems.innerHTML = '';
      let total = 0;
      state.consolidatedOrder.forEach((item) => {
          let itemLi = document.createElement('li');
          itemLi.innerHTML = item.qty + ' x ' + item.name + ' - $' + item.price;
          itemLi.className = 'no-bullets';
          orderItems.appendChild(itemLi);
          total += item.qty * item.price;
      });
      let orderTotal = document.querySelector('#orderTotal');
      orderTotal.innerHTML = '$' + total;
  }
}

async function prepareDriveThruConfig() {
  state.initializedDriveThru = true;
  try {
    await service.deleteMenu();state.consolidatedOrder
    const menuPromises = driveThruMenu.map((item) => service.addToMenu(item));
    await Promise.all(menuPromises);
    state.callID = await service.getCallID();
    state.menu.items = await service.getMenu();
    let button = document.querySelector('#startConversationBtn');
    button.innerHTML = 'Start Conversation';
    button.removeAttribute('disabled');

    updateMenu();
  } catch (error) {
    console.error("Config error:", error);
  }
}