import React, { useState, useEffect } from 'react';
import Post from '../components/Post';
import Recommendation from '../components/Recommendation';
import { collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import Feed from '../components/Feed';

// 🤖 PHANTOM BOT ACCOUNTS
const FAKE_USERS = [
    { username: "Zetaverso_Bot", img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150" },
    { username: "CryptoWhale", img: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=150" },
    { username: "TechPulse", img: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=150" },
    { username: "CyberPulse", img: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150" }
];

// 🤖 AUTOMATIC ENGLISH POSTS DATABASE
const FAKE_POSTS = [
    "Artificial intelligence is completely reshaping passive income models. Who is already experimenting with automation?",
    "Bitcoin and digital markets remain stable this week. Perfect time to map out the next strategic trading moves.",
    "Building a platform from scratch is hard work, but seeing the flex layout respond perfectly on mobile makes it worth it.",
    "Welcome to ALLMATTER! The feed is officially open for live publication, likes, and real-time views testing.",
    "The future of the digital economy relies heavily on project scalability. Less bureaucracy, more clean code.",
    "Analyzing today's data streams: engagement on micro-social networks is rapidly outpacing traditional boards.",
    "Remember that the recommendation algorithm rewards posts with higher view counts. Engage more to climb the trends!",
    "Just integrated the new trend tracking system. Real-time analytics are looking solid on the dashboard.",
    "Scaling an online business requires the right stack. React + Tailwind + Firebase is proving to be unmatched for speed.",
    "Consistency beats talent every single day. Keep building, keep coding, and trust the automation systems."
];

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

    // 🤖 FORZA INIEZIONE AUTOMATICA AD OGNI CARICAMENTO PAGINA
    useEffect(() => {
        const injectPhantomPost = async () => {
            try {
                const randomUser = FAKE_USERS[Math.floor(Math.random() * FAKE_USERS.length)];
                const randomText = FAKE_POSTS[Math.floor(Math.random() * FAKE_POSTS.length)];
                
                // Inietta il post sul database reale di Firebase
                await addDoc(collection(db, 'posts'), {
                    text: randomText,
                    username: randomUser.username,
                    img: randomUser.img,
                    date: serverTimestamp(),
                    views: Math.floor(Math.random() * 140) + 20, // views finte alte per pompare la sidebar
                    comments: 0,
                    likes: []
                });
                
                // Una volta iniettato, scarica il feed aggiornato
                getFeed();
            } catch (err) {
                console.error("Phantom injector failed:", err);
                // Se fallisce l'iniezione (es. indice mancante), carica comunque i post esistenti
                getFeed();
            }
        };

        injectPhantomPost();
    }, []);

    const handleLogoClick = () => {
        window.location.reload();
    };
  
    return (
        <div className="bg-black min-h-screen text-white w-full">
            <div className="flex max-w-5xl mx-auto justify-center items-start px-4">
                
                {/* Central Column */}
                <div className="w-full max-w-2xl border-x border-zinc-800 bg-black min-h-screen">
                    
                    {/* Upper Header */}
                    <div className="p-4 border-b border-zinc-800 sticky top-0 bg-black/80 backdrop-blur-md z-10 flex items-center justify-between">
                        <button 
                            onClick={handleLogoClick}
                            className="text-xl font-black tracking-wider text-white hover:opacity-80 transition duration-150 cursor-pointer uppercase bg-transparent border-none outline-none text-left p-0"
                        >
                            ALLMATTER
                        </button>

                        {/* Login / Logout Button */}
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
                                style={{ color: '#ffffff', backgroundColor: '#f4f4f5' }}
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

                {/* Right Column (Trends) */}
                <Recommendation />
                
            </div>
        </div>
    );
}

export default Main;