import { Preview } from './preview/Preview';

/**
 * Single-route app. `/preview` is the canonical URL; the SPA fallback means it
 * also resolves at `/`. The whole point of this package is the preview surface
 * plus the importable tokens + components beneath it.
 */
export function App() {
  return <Preview />;
}
