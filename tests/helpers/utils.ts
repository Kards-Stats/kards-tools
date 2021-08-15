export async function wait (seconds: number = 1, milliseconds: number = 0): Promise<void> {
  if (seconds < 0) { seconds = 0 }
  if (milliseconds < 0) { milliseconds = 0 }
  const totalTime = (seconds * 1000) + milliseconds
  await new Promise(resolve => setTimeout(resolve, totalTime))
}
