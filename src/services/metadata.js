import { runYtdlp, onOutput, onDone } from "@/services/sidecar.js";

export async function fetchMetadata(url) {
  const id = `meta-${Date.now()}`;
  let json = "";
  let errors = "";

  const unlistenOutput = await onOutput((payload) => {
    if (payload.id !== id) return;
    if (payload.kind === "stderr") errors += payload.line + "\n";
    else json += payload.line;
  });

  return new Promise((resolve, reject) => {
    const handleDone = (payload) => {
      if (payload.id !== id) return;
      unlistenOutput();
      unlistenDone.then((stop) => stop());

      if (payload.code !== 0) {
        reject(new Error(errors.trim() || "yt-dlp could not fetch this URL."));
        return;
      }
      try {
        resolve(JSON.parse(json));
      } catch {
        reject(new Error(errors.trim() || "Could not read video info."));
      }
    };

    const unlistenDone = onDone(handleDone);
    runYtdlp(id, ["-J", "--flat-playlist", "--no-warnings", "--no-progress", url]).catch(reject);
  });
}
