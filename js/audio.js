let scheduledAudioSources = [];

function receiveAudio(audioData) {
	// See https://stackoverflow.com/a/61481513 for tips on smooth playback

	const audioDataView = new Int16Array(audioData);

	if (audioDataView.length === 0) {
		console.error("Received audio data is empty.");
		return;
	}

	// 1 channel, 48 kHz sample rate
	const audioBuffer = audioContextOut.createBuffer(
		1,
		audioDataView.length,
		48000
	); 
	const audioBufferChannel = audioBuffer.getChannelData(0);

	// Copy audio data to the buffer
	for (var i = 0; i < audioDataView.length; i++) {
		// Convert linear16 PCM to float [-1, 1]
		audioBufferChannel[i] = audioDataView[i] / 32768; 
	}

	let source = audioContextOut.createBufferSource();
	source.buffer = audioBuffer;
	source.connect(audioContextOut.destination);

	if (startTime < audioContextOut.currentTime) {
		startTime = audioContextOut.currentTime;
	}
	source.start(startTime);
	startTime += audioBuffer.duration;

	// Buffer
	scheduledAudioSources.push(source);
}

function captureAudio(callback) {
	if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
		console.error("getUserMedia is not supported in this browser.");
		return;
	}

	// In the browser, run `navigator.mediaDevices.getSupportedConstraints()` to see your options here if needed
	const constraints = {
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
			const audioContext = new AudioContext();
			const microphone = audioContext.createMediaStreamSource(stream);
			const processor = audioContext.createScriptProcessor(4096, 1, 1);

			processor.onaudioprocess = function (event) {
				// console.log("sending audio data?");
				const inputData = event.inputBuffer.getChannelData(0);
				// update blob size based on audio level
				const rms = Math.sqrt(
					inputData.reduce((sum, value) => sum + value * value, 0) /
					inputData.length
				);
				updateBlobSize(rms * 5); // Scale RMS value to control size
				callback(inputData)
			};

			microphone.connect(processor);
			processor.connect(audioContext.destination);
		})
		.catch(function (error) {
			console.error("Error accessing microphone:", error);
		});
}

function clearScheduledAudio() {
	scheduledAudioSources.forEach(source => {
	  source.stop();
	})
	scheduledAudioSources = [];

	let scheduledAudioMs = Math.round(1000*(startTime - audioContextOut.currentTime));
	if (scheduledAudioMs > 0) {
	  console.log(`Cleared ${scheduledAudioMs}ms of scheduled audio`);
	} else {
	  console.log("No scheduled audio to clear.");
	}

	startTime = -1;
}