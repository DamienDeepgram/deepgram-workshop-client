const audioContextOut = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive", sampleRate: 48000 });
const audioContext = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive" });
let startTime = -1;

window.onload = function () {
  prepareDriveThruConfig();
  const voice = document.getElementById("voice");
  const model = document.getElementById("model");
  document.getElementById("startConversationBtn").addEventListener("click", () => {
    startConversaton(model, voice);
  });
};

function startConversaton(model, voice) {
  const config = configureSettings(model, voice);
  let ws = new WebSocket("wss://sts.sandbox.deepgram.com/demo/agent");
  ws.binaryType = 'arraybuffer';

  ws.onopen = function () {
    console.log("WebSocket connection established.");
    // Send initial config on connection
    ws.send(JSON.stringify(config)); 
    // Send the microphone audio to the websocket
    captureAudio((data)=>{
      ws.send(data);
    });
  };

  ws.onerror = function (error) {
    console.error("WebSocket error:", error);
  };

  ws.onmessage = function (event) {
    if (typeof event.data === "string") {
      console.log("Text message received:", event.data);
      // Handle text messages
      handleMessageEvent(event.data);
    } else if (event.data instanceof ArrayBuffer) {
      // Update the animation
      updateBlobSize(0.25);
      // Play the audio
      receiveAudio(event.data);
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

function updateVoices(callback) {
  document.querySelectorAll(".circle-button").forEach((button) => {
    button.addEventListener("click", function () {
      document
        .querySelector(".circle-button.selected")
        .classList.remove("selected");
      this.classList.add("selected");
      const voice_selection = this.id;
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
      let instructions = document.getElementById("instructionsInput").value;
      callback(instructions);
    });
}

function updateMenu(){
  const itemsDiv = document.querySelector('#items');
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
  const voiceSelection = voice.options[voice.selectedIndex].value;
  const providerAndModel = model.options[model.selectedIndex].value.split("+");

  // Configuration settings for the agent
  let config_settings = getDriveThruStsConfig(state.callID, JSON.stringify(Object.values(state.menu)));
  config_settings.agent.think.provider = providerAndModel[0];
  config_settings.agent.think.model = providerAndModel[1];
  console.log('config_settings', JSON.stringify(config_settings))

  // Update the text area to match the initial instructions
  document.getElementById("instructionsInput").value = config_settings.agent.think.instructions;
  document.getElementById(voiceSelection).classList.add("selected");
  return config_settings;
}

async function handleMessageEvent(data){
  let msgObj = JSON.parse(data);
  if (msgObj["type"] === "UserStartedSpeaking") {
    clearScheduledAudio();
  }
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
      orderTotal.innerHTML = '$' + total.toFixed(2);
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