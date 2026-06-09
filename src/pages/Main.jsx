import React, { useState, useEffect } from 'react';
import Post from '../components/Post';
import Recommendation from '../components/Recommendation';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import Feed from '../components/Feed';

function Main() {
    const [user] = useAuthState(auth);
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState();

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
    
    const getFeed = async () => {
        try {
            const q = query(collection(db, 'posts'), orderBy('date', 'desc'), limit(100));
            const querySnapshot = await getDocs(q);
            const msgs = [];
            
            querySnapshot.forEach((doc) => {
                let data = doc.data();
                data['uid'] = doc.id;
                msgs.push(data);
            });
            
            setPosts(msgs);
        } catch (error) {
            console.error("Error fetching feed:", error);
        } finally {
            setLoading(false);
        }
    };

    // PROTEZIONE LOOP: Carica il feed in modo sicuro solo all'avvio della pagina
    useEffect(() => {
        getFeed();
    }, []);

    const handleLogoClick = () => {
        window.location.reload();
    };
  
    return (
        <div className="bg-black min-h-screen text-white w-full">
            <div className="flex max-w-5xl mx-auto justify-center items-start px-4">
                
                {/* Colonna Centrale */}
                <div className="w-full max-w-2xl border-x border-zinc-800 bg-black min-h-screen">
                    
                    {/* Header superiore con ALLMATTER e Login/Logout */}
                    <div className="p-4 border-b border-zinc-800 sticky top-0 bg-black/80 backdrop-blur-md z-10 flex items-center justify-between">
                        <button 
                            onClick={handleLogoClick}
                            className="text-xl font-black tracking-wider text-white hover:opacity-80 transition duration-150 cursor-pointer uppercase bg-transparent border-none outline-none text-left p-0"
                        >
                            ALLMATTER
                        </button>

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
                                className="bg-zinc-100 text-black text-xs font-bold px-4 py-1.5 rounded-full hover:bg-zinc-300 transition duration-150 border border-white inline-block"
                                style={{ color: '#000000', backgroundColor: '#f4f4f5' }}
                            >
                                Log In
                            </button>
                        )}
                    </div>

                    <Post refresh={getFeed} />
                    
                    <div className='px-4 py-2 text-zinc-500 text-xs font-bold uppercase tracking-wider border-b border-zinc-800 bg-zinc-950/20'>
                        Feed
                    </div>
                    
                    {loading && <div className='p-4 text-center text-zinc-500 text-sm italic'>Loading...</div>}
                    {posts && <Feed fposts={posts} refresh={getFeed} />}
                </div>

                {/* Colonna Destra (Trend) */}
                <Recommendation />
                
            </div>
        </div>
    );
}

export default Main;