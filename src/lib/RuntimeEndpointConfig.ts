/** Resolves local-development and packaged-station endpoints in one place. */
export class RuntimeEndpointConfig {
  static apiBaseUrl(): string {
    const configured = import.meta.env.VITE_API_URL?.trim();
    if (configured) return this.withoutTrailingSlash(configured);
    return import.meta.env.DEV ? 'http://127.0.0.1:8080' : window.location.origin;
  }

  static websocketBaseUrl(): string {
    const configured = import.meta.env.VITE_WS_URL?.trim();
    if (configured) return this.withoutTrailingSlash(configured);
    if (import.meta.env.DEV) return 'ws://127.0.0.1:8080';

    const endpoint = new URL(this.apiBaseUrl(), window.location.origin);
    endpoint.protocol = endpoint.protocol === 'https:' ? 'wss:' : 'ws:';
    return endpoint.origin;
  }

  static cameraStreamUrl(): string {
    const configured = import.meta.env.VITE_CAMERA_STREAM_URL?.trim();
    return this.withoutTrailingSlash(configured || 'http://127.0.0.1:8091/video.mjpg');
  }

  private static withoutTrailingSlash(value: string): string {
    return value.replace(/\/+$/, '');
  }
}
