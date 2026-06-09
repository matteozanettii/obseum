import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

function Recommendation() {
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getTrending = async () => {
      try {
        // ALGORITMO: Prende i 3 post con più visualizzazioni (views) in assoluto nel database
        const q = query(
          collection(db, 'posts'), 
          orderBy('views', 'desc'), 
          limit(3)
        );
        
        const querySnapshot = await getDocs(q);
        let trending = [];
        
        querySnapshot.forEach((doc) => {
          trending.push({ uid: doc.id, ...doc.data() });
        });
        
        setTrendingPosts(trending);
      } catch (error) {
        console.error("Error fetching trending posts:", error);
      } finally {
        setLoading(false);
      }
    };

    getTrending();
  }, []);

  const truncateText = (text, maxLength) => {
    if (!text) return 'No content';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    // Cambiato lg:inline con lg:block e bloccata la larghezza massima a 350px per farlo restare a destra compatto
    <div className="hidden lg:block w-full max-w-[350px] h-fit sticky top-4 p-3 select-none flex-shrink-0 ml-6">
      {/* Box dei Trend dinamico basato sulle visualizzazioni reali */}
      <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-2xl space-y-3">
        <h3 className="text-lg font-black text-white px-1">What's happening</h3>

        {loading ? (
          <div className="text-xs text-zinc-500 italic px-1">Loading trends...</div>
        ) : trendingPosts.length > 0 ? (
          trendingPosts.map((post, idx) => (
            <div 
              key={post.uid} 
              onClick={() => window.location.href = `/post/${post.uid}`}
              className="hover:bg-zinc-900/60 p-2 rounded-xl transition cursor-pointer border border-transparent hover:border-zinc-800/60"
            >
              <div className="flex justify-between items-center">
                <p className="text-[11px] text-sky-500 font-bold uppercase tracking-wider">
                  @{post.username || 'Anonymous'}
                </p>
                <span className="text-[9px] text-zinc-500 font-bold bg-zinc-900/80 px-1.5 py-0.5 rounded-full">
                  #{idx + 1}
                </span>
              </div>
              <h4 className="text-xs font-semibold text-zinc-300 mt-1 break-words line-clamp-2">
                {truncateText(post.text, 50)}
              </h4>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                {post.views || 0} views · {post.likes ? post.likes.length : 0} likes
              </p>
            </div>
          ))
        ) : (
          <div className="text-xs text-zinc-600 italic px-1">No posts trending yet.</div>
        )}
      </div>
    </div>
  );
}

export default Recommendation;