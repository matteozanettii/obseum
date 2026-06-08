import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

function Recommendation() {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getRecommendations = async () => {
      try {
        const docRef = doc(db, 'recommendations', 'data');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setRecommendations(docSnap.data());
        } else {
          console.log("No recommendations document found!");
        }
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setLoading(false);
      }
    };

    getRecommendations();
  }, []);

  return (
    <div className="hidden lg:inline w-80 h-fit sticky top-0 p-3 space-y-4 select-none">
      {/* Box dei Trend / Search */}
      <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl space-y-3">
        <h3 className="text-xl font-black text-white px-1">What's happening</h3>

        {loading ? (
          <div className="text-xs text-zinc-500 italic px-1">Loading trends...</div>
        ) : recommendations && recommendations.News ? (
          /* CONTROLLO SICURO: Mappa l'array News solo se esiste davvero */
          recommendations.News.map((item, idx) => (
            <div key={idx} className="hover:bg-zinc-900/40 p-2 rounded-xl transition cursor-pointer">
              <p className="text-xs text-zinc-500 font-medium">{item.category || 'Trending'}</p>
              <h4 className="text-sm font-bold text-white mt-0.5">{item.title}</h4>
              <p className="text-xs text-zinc-500 mt-1">{item.postsCount || '0'} Posts</p>
            </div>
          ))
        ) : (
          <div className="text-xs text-zinc-600 italic px-1">No trends available right now.</div>
        )}
      </div>
    </div>
  );
}

export default Recommendation;