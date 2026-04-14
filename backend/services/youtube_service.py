import os
import httpx
from schemas import YouTubeVideo
from typing import List
from dotenv import load_dotenv

load_dotenv()

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")
YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/search"

async def search_youtube_videos(query: str) -> List[YouTubeVideo]:
    if not YOUTUBE_API_KEY:
        return get_fallback_videos(query)

    try:
        async with httpx.AsyncClient() as client:
            # Clean the query: removes "1.1", "1.2", etc., so YouTube focuses on the topic
            clean_query = ' '.join([w for w in query.split() if not any(c.isdigit() for c in w)])
            final_query = f"{clean_query if clean_query else query} tutorial"

            response = await client.get(
                YOUTUBE_API_URL,
                params={
                    "part": "snippet",
                    "q": final_query,
                    "type": "video",
                    "maxResults": 5,
                    "key": YOUTUBE_API_KEY,
                    "relevanceLanguage": "en",
                    # Removed "videoEmbeddable": "true" because it filters out 
                    # many educational videos that disable embedding.
                }
            )
            data = response.json()
            
            # Check for API errors (like quota limit) in the response
            if "error" in data:
                print(f"YouTube API Error: {data['error'].get('message')}")
                return get_fallback_videos(query)

            videos = []
            for item in data.get("items", []):
                # Ensure we only process actual video results
                if item.get("id", {}).get("kind") == "youtube#video":
                    video_id = item["id"]["videoId"]
                    snippet = item["snippet"]
                    videos.append(YouTubeVideo(
                        title=snippet["title"],
                        video_id=video_id,
                        thumbnail=snippet["thumbnails"]["medium"]["url"],
                        channel=snippet["channelTitle"],
                        url=f"https://www.youtube.com/watch?v={video_id}"
                    ))
            
            # If the API returns an empty list, trigger the fallback
            if not videos:
                return get_fallback_videos(query)
                
            return videos
            
    except Exception as e:
        print(f"YouTube API Exception: {e}")
        return get_fallback_videos(query)

def get_fallback_videos(query: str) -> List[YouTubeVideo]:
    search_query = query.replace(" ", "+")
    return [
        YouTubeVideo(
            title=f"Learn {query} - Complete Tutorial",
            video_id="dQw4w9WgXcQ",
            thumbnail="https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
            channel="Educational Channel",
            url=f"https://www.youtube.com/results?search_query={search_query}+tutorial"
        ),
        YouTubeVideo(
            title=f"{query} for Beginners",
            video_id="dQw4w9WgXcQ",
            thumbnail="https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
            channel="Learning Hub",
            url=f"https://www.youtube.com/results?search_query={search_query}+beginners"
        ),
        YouTubeVideo(
            title=f"Advanced {query} Concepts",
            video_id="dQw4w9WgXcQ",
            thumbnail="https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
            channel="Tech Academy",
            url=f"https://www.youtube.com/results?search_query={search_query}+advanced"
        ),
    ]