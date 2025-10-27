export interface ChatMessage {
  type: "chat_message";
  user: string;
  text: string;
  timestamp: number;
}

export interface SearchResult {
  id: {
    kind: string;
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
  };
}

export interface YouTubeSearchResponse {
  items: SearchResult[];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}
