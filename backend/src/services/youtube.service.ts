import { AppError } from "../utils/AppError";

export interface YouTubeMetadata {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  totalDurationSeconds?: number;
}

const extractVideoId = (input: string) => {
  try {
    const url = new URL(input.trim());
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] || "";
    }

    if (hostname.endsWith("youtube.com")) {
      if (url.pathname === "/watch") return url.searchParams.get("v") || "";
      if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/")) {
        return url.pathname.split("/").filter(Boolean)[1] || "";
      }
    }
  } catch {
    return "";
  }

  return "";
};

const readInitialPlayerResponse = (html: string) => {
  const marker = "ytInitialPlayerResponse = ";
  const startIndex = html.indexOf(marker);
  if (startIndex === -1) return null;

  const jsonStart = startIndex + marker.length;
  const jsonEnd = html.indexOf(";</script>", jsonStart);
  if (jsonEnd === -1) return null;

  try {
    return JSON.parse(html.slice(jsonStart, jsonEnd)) as {
      videoDetails?: {
        title?: string;
        lengthSeconds?: string;
        thumbnail?: { thumbnails?: { url: string }[] };
      };
    };
  } catch {
    return null;
  }
};

export const youtubeService = {
  async getMetadata(youtubeUrl: string): Promise<YouTubeMetadata> {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) throw new AppError("Please enter a valid single YouTube video URL.", 400, "INVALID_YOUTUBE_URL");

    const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`;
    const metadata: YouTubeMetadata = {
      videoId,
      title: `YouTube course ${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };

    try {
      const response = await fetch(oEmbedUrl);
      if (response.ok) {
        const data = (await response.json()) as { title?: string; thumbnail_url?: string };
        metadata.title = data.title || metadata.title;
        metadata.thumbnailUrl = data.thumbnail_url || metadata.thumbnailUrl;
      }
    } catch {
      // Title and thumbnail can still be derived from the video id fallback.
    }

    try {
      const response = await fetch(`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (response.ok) {
        const playerResponse = readInitialPlayerResponse(await response.text());
        const details = playerResponse?.videoDetails;
        const duration = Number(details?.lengthSeconds);
        metadata.title = details?.title || metadata.title;
        metadata.thumbnailUrl = details?.thumbnail?.thumbnails?.at(-1)?.url || metadata.thumbnailUrl;
        if (Number.isFinite(duration) && duration > 0) metadata.totalDurationSeconds = duration;
      }
    } catch {
      // Duration detection is best effort. The frontend exposes manual entry when this is unavailable.
    }

    return metadata;
  },
};
