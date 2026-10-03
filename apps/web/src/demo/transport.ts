const paused = new Set<string>();
const requests = new Map<string, Set<AbortController>>();

export function pauseWitnessTransport(token: string, value: boolean): void {
  if (!value) {
    paused.delete(token);
    return;
  }
  paused.add(token);
  requests.get(token)?.forEach(controller => controller.abort());
}

export function witnessTransportPaused(token: string): boolean {
  return paused.has(token);
}

export function trackWitnessRequest(token: string, controller: AbortController): () => void {
  const active = requests.get(token) ?? new Set<AbortController>();
  active.add(controller);
  requests.set(token, active);
  return () => {
    active.delete(controller);
    if (active.size === 0) requests.delete(token);
  };
}
