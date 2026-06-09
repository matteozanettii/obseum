import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, orderBy, addDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import Recommendation from '../components/Recommendation';

function PostPage() {
  const { id } = useParams(); 
  const [user] = useAuthState(auth);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

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
    return <div className="text-center p-10 text-zinc-500 italic">Loading post...</div>;
  }

  if (!post) {
    return <div className="text-center p-10 text-zinc-600 italic">Post not found.</div>;
  }

  return (
    <>
      <Recommendation />
      <div className="w-full max-w-2xl mx-auto border-x border-zinc-800 bg-black min-h-screen pb-24">
        {/* Header di navigazione indietro */}
        <div className="p-4 border-b border-zinc-800 sticky top-0 bg-black/80 backdrop-blur-md z-10 flex items-center space-x-4">
          <button onClick={() => window.history.back()} className="text-white hover:bg-zinc-900 p-2 rounded-full transition">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">Post</h1>
        </div>

        {/* Corpo del Post Principale */}
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

        {/* Box Input per la Risposta */}
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
          <div className="p-4 text-zinc-500 italic text-sm text-center border-b border-zinc-800">Log in to reply to this post.</div>
        )}

        {/* Lista Risposte */}
        <div className="divide-y divide-zinc-800">
          {comments.map((comment, idx) => (
            <div key={idx} className="p-4 flex space-x-3 items-start">
              {/* Qui il tag alt è stato corretto eliminando il backslash di escape d'errore */}
              <img className="h-9 w-9 rounded-full object-cover" src={comment.img || 'https://via.placeholder.com/150'} alt="" />
              <div className="flex-1 min-w-0">
                <span className="font-bold text-white hover:underline cursor-pointer text-[15px]">{comment.username}</span>
                <p className="text-zinc-300 text-[15px] mt-1 break-words whitespace-pre-wrap">{renderTextWithLinks(comment.text)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default PostPage;