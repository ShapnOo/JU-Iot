import type { SensorData, Thresholds } from '../types/iot';

export class VoiceAssistant {
  private static synth: SpeechSynthesis | null =
    typeof window !== 'undefined' && 'speechSynthesis' in window
      ? window.speechSynthesis
      : null;

  public static speak(text: string) {
    if (!this.synth) return;
    this.synth.cancel(); // Stop active speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    this.synth.speak(utterance);
  }

  public static announceSensorSummary(sensors: SensorData, thresholds: Thresholds) {
    const isTempAlert = sensors.temperature >= thresholds.temperature;
    const isGasAlert = sensors.gas >= thresholds.gas;
    const isDistAlert = sensors.distance > 0 && sensors.distance <= thresholds.distance;

    if (isTempAlert || isGasAlert || isDistAlert) {
      let warning = 'Alert triggered!';
      if (isTempAlert) warning += ` High temperature of ${sensors.temperature} degrees.`;
      if (isGasAlert) warning += ` High gas level of ${sensors.gas} PPM.`;
      if (isDistAlert) warning += ` Object detected at ${sensors.distance} centimeters.`;
      this.speak(warning);
    } else {
      this.speak(
        `All systems normal. Temperature is ${sensors.temperature.toFixed(
          1
        )} degrees. Humidity is ${sensors.humidity.toFixed(0)} percent.`
      );
    }
  }

  public static listen(onCommand: (cmd: string) => void, onError?: (err: string) => void): boolean {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (onError) onError('Speech Recognition is not supported in this browser.');
      return false;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        onCommand(transcript);
      };

      recognition.onerror = (event: any) => {
        if (onError) onError(event.error || 'Voice error');
      };

      recognition.start();
      return true;
    } catch (e: any) {
      if (onError) onError(e.message || 'Voice recognition error');
      return false;
    }
  }
}
