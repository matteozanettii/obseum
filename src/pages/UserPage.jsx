import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import Recommendation from '../components/Recommendation';
import Feed from '../components/Feed';

function UserPage() {
  const { uid } = useParams(); 
  const [user] = useAuthState(auth);
  const [userPosts, setUserPosts] = useState([]);
  const [displayName, setDisplayName] = useState(uid);
  const [loading, setLoading] = useState(true);

  const provider = new GoogleAuthProvider();

  const login = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const logout = () => {
    if (window.confirm("Do you want to log out?")) {
      signOut(auth);
    }
  };

  const fetchUserPosts = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      let posts = [];
      
      const qById = query(collection(db, 'posts'), where('id', '==', uid));
      const snapshotById = await getDocs(qById);
      
      snapshotById.forEach((doc) => {
        posts.push({ uid: doc.id, ...doc.data() });
      });

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

  useEffect(() => {
    fetchUserPosts();
  }, [uid]);

  const handleLogoClick = () => {
    window.location.reload();
  };

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="flex max-w-7xl mx-auto px-4">
        
        <div className="flex-1 max-w-2xl border-x border-zinc-800 bg-black min-h-screen pb-24 md:pb-0">
          {/* Header superiore con Login/Logout dinamico */}
          <div className="p-4 border-b border-zinc-800 sticky top-0 bg-black/80 backdrop-blur-md z-10 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleLogoClick}
                className="text-xl font-black tracking-wider text-white hover:opacity-80 transition duration-150 cursor-pointer uppercase bg-transparent border-none outline-none text-left p-0"
              >
                ALLMATTER
              </button>
              <span className="text-zinc-600">|</span>
              <div>
                <h1 className="text-sm font-bold text-zinc-300 inline-block">@{displayName}</h1>
              </div>
            </div>

            {/* Tasto Login o Foto Profilo Logout */}
            {user ? (
              <img 
                onClick={logout}
                src={user.photoURL} 
                alt="Logout" 
                className="h-8 w-8 rounded-full border border-zinc-700 object-cover cursor-pointer hover:opacity-70 transition duration-150"
                title="Click to logout"
              />
            ) : (
              <button 
                onClick={login}
                className="bg-white text-black font-bold text-xs px-4 py-1.5 rounded-full hover:bg-zinc-200 transition duration-150"
              >
                Log In
              </button>
            )}
          </div>

          <div className="p-4 border-b border-zinc-800 bg-zinc-900/10">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-700 text-2xl font-bold uppercase text-sky-500">
                {displayName?.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">@{displayName}</h2>
                <p className="text-sm text-zinc-400">AllMatter Member Profile</p>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-zinc-800 bg-zinc-950/30">
            <span className="text-sm font-bold text-white border-b-4 border-sky-500 pb-4 px-2">Posts</span>
          </div>

          <div className="pb-24">
            {loading ? (
              <div className="text-center p-10 text-zinc-500 text-sm italic">Loading timeline...</div>
            ) : userPosts.length > 0 ? (
              <Feed fposts={userPosts} refresh={fetchUserPosts} />
            ) : (
              <div className="text-center p-10 text-zinc-600 text-sm italic">
                @{displayName} hasn't posted anything yet.
              </div>
            )}
          </div>
        </div>

        <Recommendation />
      </div>
    </div>
  );
}

export default UserPage;