import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import Recommendation from '../components/Recommendation';
import Feed from '../components/Feed';

function UserPage() {
  const { uid } = useParams(); 
  const [userPosts, setUserPosts] = useState([]);
  const [displayName, setDisplayName] = useState(uid);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!uid) return;
      setLoading(true);
      try {
        let posts = [];
        
        // FASE 1: Cerca per campo 'id' alfanumerico
        const qById = query(collection(db, 'posts'), where('id', '==', uid));
        const snapshotById = await getDocs(qById);
        
        snapshotById.forEach((doc) => {
          posts.push({ uid: doc.id, ...doc.data() });
        });

        // FASE 2: Cerca per campo 'username' testuale
        if (posts.length === 0) {
          const qByUsername = query(collection(db, 'posts'), where('username', '==', uid));
          const snapshotByUsername = await getDocs(qByUsername);
          
          snapshotByUsername.forEach((doc) => {
            posts.push({ uid: doc.id, ...doc.data() });
          });
          setDisplayName(uid);
        } else {
          if (posts[0] && posts[0].username) {
            setDisplayName(posts[0].username);
          }
        }
        
        posts.sort((a, b) => {
          const timeA = a.date?.seconds || 0;
          const timeB = b.date?.seconds || 0;
          return timeB - timeA;
        });
        
        setUserPosts(posts);
      } catch (error) {
        console.error("Error loading user timeline:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, [uid]);

  return (
    <>
      <Recommendation />
      <div className="w-full max-w-2xl mx-auto border-x border-zinc-800 bg-black min-h-screen">
        {/* Header del Profilo */}
        <div className="p-4 border-b border-zinc-800 sticky top-0 bg-black/80 backdrop-blur-md z-10">
          <h1 className="text-xl font-bold tracking-tight text-white">{displayName}</h1>
          <p className="text-xs text-zinc-500 font-medium">
            {userPosts.length} {userPosts.length === 1 ? 'post' : 'posts'}
          </p>
        </div>

        {/* Box Informazioni */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/10">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-700 text-2xl font-bold uppercase text-sky-500">
              {displayName?.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">@{displayName}</h2>
              <p className="text-sm text-zinc-400">Obseum Member Profile</p>
            </div>
          </div>
        </div>

        {/* Menu Timeline Tab */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/30">
          <span className="text-sm font-bold text-white border-b-4 border-sky-500 pb-4 px-2">Posts</span>
        </div>

        {/* Feed dei Post */}
        <div className="pb-24">
          {loading ? (
            <div className="text-center p-10 text-zinc-500 text-sm italic">Loading timeline...</div>
          ) : userPosts.length > 0 ? (
            <Feed fposts={userPosts} refresh={() => window.location.reload()} />
          ) : (
            <div className="text-center p-10 text-zinc-600 text-sm italic">
              @{displayName} hasn't posted anything yet.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default UserPage;