import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, orderBy, addDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import Recommendation from '../components/Recommendation';

function PostPage() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
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

  const fetchPostAndComments = async () => {
    try {
      const postRef = doc(db, 'posts', id);
      const postSnap = await getDoc(postRef);
      
      if (postSnap.exists()) {
        setPost({ uid: postSnap.id, ...postSnap.data() });
        await updateDoc(postRef, { views: increment(1) });

        const q = query(collection(db, 'posts', id, 'comments'), orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        let comms = [];
        querySnapshot.forEach((doc) => {
          comms.push(doc.data());
        });
        setComments(comms);
      }
    } catch (error) {
      console.error("Error fetching post details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPostAndComments();
    }
  }, [id]);

  const sendComment = async () => {
    if (!text.trim() || !user || !post) return;
    try {
      await addDoc(collection(db, 'posts', post.uid, 'comments'), {
        text: text,
        username: user.displayName,
        img: user.photoURL,
        date: serverTimestamp()
      });

      await updateDoc(doc(db, 'posts', post.uid), {
        comments: increment(1)
      });

      setText('');
      fetchPostAndComments();
    } catch (error) {
      console.error("Error sending reply:", error);
    }
  };

  const renderTextWithLinks = (inputText) => {
    if (!inputText) return '';
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return inputText.split(urlRegex).map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline break-all">
            {part}
          </a>
        );
      }
      return part;
    });
  };

  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading post...</div>;
  }

  if (!post) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Post not found.</div>;
  }

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="flex max-w-7xl mx-auto px-4">
        
        <div className="flex-1 max-w-2xl border-x border-zinc-800 bg-black min-h-screen pb-24">
          {/* Header di navigazione con Login/Logout */}
          <div className="p-4 border-b border-zinc-800 sticky top-0 bg-black/80 backdrop-blur-md z-10 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => navigate('/')}
                className="text-xl font-black tracking-wider text-white hover:opacity-80 transition duration-150 uppercase bg-transparent border-none outline-none cursor-pointer p-0"
              >
                ALLMATTER
              </button>
              <span className="text-zinc-700">|</span>
              <button onClick={() => window.history.back()} className="text-white hover:bg-zinc-900 p-1.5 rounded-full transition">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-sm font-bold text-zinc-400">Post</h1>
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

          <div className="p-4 border-b border-zinc-800">
            <div className="flex space-x-3 items-center">
              <img className="h-10 w-10 rounded-full object-cover" src={post.img || 'https://via.placeholder.com/150'} alt="" />
              <div>
                <h2 className="font-bold text-white text-[15px]">{post.username}</h2>
                <p className="text-zinc-500 text-xs">Obseum Member</p>
              </div>
            </div>
            <p className="text-[#e7e9ea] text-lg mt-4 whitespace-pre-wrap break-words leading-relaxed">
              {renderTextWithLinks(post.text)}
            </p>
          </div>

          {user ? (
            <div className="p-4 border-b border-zinc-800 flex items-start space-x-3 bg-zinc-950/20">
              <img className="h-9 w-9 rounded-full object-cover mt-1" src={user.photoURL} alt="" />
              <div className="flex-1 bg-zinc-950 p-2 rounded-xl border border-zinc-800 flex items-center justify-between">
                <input 
                  value={text} 
                  onChange={(e) => setText(e.target.value)} 
                  className="bg-transparent outline-none flex-1 text-[15px] text-white px-2 placeholder-zinc-500" 
                  placeholder="Post your reply..." 
                />
                <button 
                  onClick={sendComment}
                  disabled={!text.trim()}
                  className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold px-4 py-1.5 rounded-full text-xs transition"
                >
                  Reply
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 text-zinc-500 italic text-sm text-center border-b border-zinc-800">
              <button onClick={login} className="text-sky-500 font-bold hover:underline">Log in</button> to reply to this post.
            </div>
          )}

          <div className="divide-y divide-zinc-800">
            {comments.map((comment, idx) => (
              <div key={idx} className="p-4 flex space-x-3 items-start">
                <img className="h-9 w-9 rounded-full object-cover" src={comment.img || 'https://via.placeholder.com/150'} alt="" />
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-white hover:underline cursor-pointer text-[15px]">{comment.username}</span>
                  <p className="text-zinc-300 text-[15px] mt-1 break-words whitespace-pre-wrap">{renderTextWithLinks(comment.text)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Recommendation />
      </div>
    </div>
  );
}

export default PostPage;