import pyaudio
p = pyaudio.PyAudio()
info = p.get_default_input_device_info()
print("DEFAULT INPUT DEVICE:")
print(f"Name: {info.get('name')}")
print(f"Channels: {info.get('maxInputChannels')}")
print(f"Rate: {info.get('defaultSampleRate')}")
p.terminate()
