import React, { useState } from 'react';
import Post from '../components/Post';
import Recommendation from '../components/Recommendation';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import Feed from '../components/Feed';

function Main() {
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState();
    
    const getFeed = async () => {
        const q = query(collection(db, 'posts'), orderBy('date', 'desc'), limit(100));
        const querySnapshot = await getDocs(q);
        const msgs = [];
        
        querySnapshot.forEach((doc) => {
            let data = doc.data();
            data['uid'] = doc.id;
            msgs.push(data);
        });
        
        setPosts(msgs);
        setLoading(false);
    };

    if (loading) {
        getFeed();
    }

    const handleLogoClick = () => {
        window.location.reload();
    };
  
    return (
        <div className="bg-black min-h-screen text-white w-full">
            {/* AGGANCIO FLEX: Mette i componenti in riga e li centra nello schermo */}
            <div className="flex max-w-5xl mx-auto justify-center items-start px-4">
                
                {/* Colonna Centrale (Feed e Scrittura) */}
                <div className="w-full max-w-2xl border-x border-zinc-800 bg-black min-h-screen">
                    {/* Header superiore fisso */}
                    <div className="p-4 border-b border-zinc-800 sticky top-0 bg-black/80 backdrop-blur-md z-10 flex items-center">
                        <button 
                            onClick={handleLogoClick}
                            className="text-xl font-black tracking-wider text-white hover:opacity-80 transition duration-150 cursor-pointer uppercase bg-transparent border-none outline-none text-left p-0"
                        >
                            ALLMATTER
                        </button>
                    </div>

                    <Post refresh={getFeed} />
                    
                    <div className='px-4 py-2 text-zinc-500 text-xs font-bold uppercase tracking-wider border-b border-zinc-800 bg-zinc-950/20'>
                        Feed
                    </div>
                    
                    {loading && <div className='p-4 text-center text-zinc-500 text-sm italic'>Loading...</div>}
                    {posts && <Feed fposts={posts} refresh={getFeed} />}
                </div>

                {/* Colonna Destra (Trend) - Adesso si affianca a destra grazie al flex padre */}
                <Recommendation />
                
            </div>
        </div>
    );
}

export default Main;