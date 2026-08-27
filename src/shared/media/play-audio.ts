/** Normalize legacy void returns and synchronous failures without delaying play(). */
export async function playAudio(audio: HTMLAudioElement): Promise<void> {
  // Keep play() in the user gesture's call stack for iOS playback authorization.
  // A legacy void return does not confirm playback; use media events or paused.
  await audio.play();
}
