import { invoke } from "@tauri-apps/api/core";

// Wrappers over Tauri commands that talk to a locally-running Ollama server.
// All generation stays on-device; nothing is sent to a remote service.

export async function ollamaStatus(): Promise<boolean> {
  try {
    return await invoke<boolean>("ollama_status");
  } catch {
    return false;
  }
}

// Returns the model's raw text answer. The caller runs it through extractJson +
// the existing validators, exactly like a pasted answer.
export async function generateViaOllama(
  prompt: string,
  model: string
): Promise<string> {
  return invoke<string>("generate_via_ollama", { prompt, model });
}
