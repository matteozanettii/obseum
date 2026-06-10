import { doc, getDocs, query, collection, orderBy, updateDoc, addDoc, serverTimestamp, increment} from 'firebase/firestore'
import {auth, db} from '../firebase'
import React, {useState, useEffect} from 'react'
import { useAuthState } from 'react-firebase-hooks/auth';

function MonetagAd({ zoneId, index, isVignette }) {
  useEffect(() => {
    const containerId = isVignette ? 'vignette-container' : `ad-container-${index}`;
    const container = document.getElementById(containerId);
    if (!container) return;

    const script = document.createElement('script');
    script.src = isVignette ? 'https://n6wxm.com/vignette.min.js' : 'https://nap5k.com/tag.min.js';
    script.dataset.zone = zoneId;
    
    container.appendChild(script);

    return () => {
      if (container.contains(script)) {
        container.removeChild(script);
      }
    };
  }, [zoneId, index, isVignette]);

  const containerId = isVignette ? 'vignette-container' : `ad-container-${index}`;
  return <div id={containerId}></div>;
}

function Feed({fposts, refresh}) {
  const [open, setOpen] = useState('');
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [user] = useAuthState(auth);
  const [shareStatus, setShareStatus] = useState({});

  // Impression passive al caricamento del feed
  useEffect(() => {
    if (fposts && fposts.length > 0) {
      fposts.forEach(async (post) => {
        const postRef = doc(db, 'posts', post['uid']);
        await updateDoc(postRef, {
          views: increment(1)
        }).catch(err => console.error("Error updating views:", err));
      });
    }
  }, [fposts]);

  function dateCovert(day, month){
    let m = '';
    switch(month){
      case 0: m='Jan'; break;
      case 1: m='Feb'; break;
      case 2: m='Mar'; break;
      case 3: m='Apr'; break;
      case 4: m='May'; break;
      case 5: m='Jun'; break;
      case 6: m='Jul'; break;
      case 7: m='Aug'; break;
      case 8: m='Sep'; break;
      case 9: m='Oct'; break;
      case 10: m='Nov'; break;
      case 11: m='Dec'; break;
      default: m='';
    }
    return day + ' ' + m;
  }

  function likesConvert(likes){
    if (!likes) return '0';
    let string = likes.toString()
    if(likes>999){
      if(likes>999999){
        return string.substring(0, string.length-6) + 'M';
      }
      return string.substring(0, string.length-3) + 'K';
    }
    return string;
  }

  // 💥 BOTTONE INTERATTIVO: Like infiniti + incremento views (Impression) ad ogni singolo click
  const handleSpamLike = async (id, currentLikes, e) => {
    e.stopPropagation();
    
    const postRef = doc(db, 'posts', id);
    
    // Gestione ibrida intelligente per non rompere i vecchi post nel database
    let baseIncrement = 1;
    if (Array.isArray(currentLikes)) {
        // Se il campo è ancora un vecchio array, lo convertiamo sul momento forzando un numero alto
        baseIncrement = currentLikes.length + 1;
        await updateDoc(postRef, {
            likes: baseIncrement,
            views: increment(1)
        });
    } else {
        // Logica standard a regime: incrementa semplicemente di 1 sia i like che le impression
        await updateDoc(postRef, {
            likes: increment(1),
            views: increment(1)
        });
    }
    refresh();
  };

  const openComment = async(uid)=>{
    if(open === uid){
      setOpen('');
      setComments([]);
    }
    else{
      setOpen(uid);
      const q = query(collection(db, "posts", uid, 'comments'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      let comms = [];
      querySnapshot.forEach((doc) => {
        comms.push(doc.data());
      });
      setComments(comms);

      // Incrementa la visualizzazione quando apri i commenti
      await updateDoc(doc(db, 'posts', uid), {
        views: increment(1)
      }).catch(err => console.error(err));
    }
    setText('');
  };

  const sendComment = async (postId) => {
    if (!text.trim() || !user) return;

    try {
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        text: text,
        username: user.displayName,
        img: user.photoURL,
        date: serverTimestamp()
      });

      // Incrementa commenti e regala un'ulteriore visualizzazione (Impression)
      await updateDoc(doc(db, 'posts', postId), {
        comments: increment(1),
        views: increment(1)
      });

      setText('');
      const q = query(collection(db, "posts", postId, 'comments'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      let comms = [];
      querySnapshot.forEach((doc) => {
        comms.push(doc.data());
      });
      setComments(comms);
      refresh();
    } catch (error) {
      console.error("Error sending comment:", error);
    }
  };

  const handleShare = async (postId) => {
    const postUrl = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(postUrl).then(async () => {
      setShareStatus(prev => ({ ...prev, [postId]: 'Copied!' }));
      
      try {
        // La condivisione aumenta la viralità e regala un'ulteriore impression
        await updateDoc(doc(db, 'posts', postId), {
          shares: increment(1),
          views: increment(1)
        });
        refresh();
      } catch (err) {
        console.error("Error updating shares:", err);
      }

      setTimeout(() => {
        setShareStatus(prev => ({ ...prev, [postId]: null }));
      }, 2000);
    });
  };

  const renderTextWithLinks = (inputText) => {
    if (!inputText) return '';
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = inputText.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={index} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sky-500 hover:underline break-all inline-block font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const extractYouTubeId = (inputText) => {
    if (!inputText) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = inputText.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="w-full max-w-2xl mx-auto border-x border-zinc-800 bg-black min-h-screen select-none">
      <MonetagAd zoneId="11119420" isVignette={true} />

      {
        fposts?.map((post, index)=>(
          <React.Fragment key={post['uid']}>
            <div 
              onClick={() => window.location.href = `/post/${post['uid']}`}
              className="p-4 border-b border-zinc-800 hover:bg-zinc-900/10 transition duration-200 cursor-pointer"
            >
              <div className="flex space-x-3">
                <a 
                  href={'/user/' + (post.username || post.id)} 
                  className="flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img className="h-10 w-10 rounded-full object-cover" src={post.img ? post.img : 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1665px-No-Image-Placeholder.svg.png'} alt="" />
                </a>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-1">
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = '/user/' + (post.username || post.id);
                      }}
                      className="font-bold text-white hover:underline cursor-pointer text-[15px]"
                    >
                      {post.username}
                    </span>
                    <span className="text-zinc-500 text-sm">·</span>
                    <span className="text-zinc-500 text-sm">
                      {post.date && dateCovert(post.date.toDate().getDate(), post.date.toDate().getMonth())}
                    </span>
                  </div>
                  
                  <p className="text-[#e7e9ea] text-[15px] leading-relaxed mt-1 whitespace-pre-wrap break-words">
                    {renderTextWithLinks(post.text)}
                  </p>

                  {extractYouTubeId(post.text) && (
                    <div 
                      className="mt-3 rounded-2xl overflow-hidden border border-zinc-800 aspect-video w-full bg-zinc-950"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${extractYouTubeId(post.text)}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}

                  <div className="flex justify-between max-w-md mt-4 text-zinc-500">
                    
                    {/* Views Counter */}
                    <div className="flex items-center space-x-1 group cursor-pointer" onClick={(e) => e.stopPropagation()}>
                      <div className="p-2 rounded-full group-hover:bg-sky-500/10 group-hover:text-sky-500 transition">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <span className="group-hover:text-sky-500 text-[14px] font-medium pl-0.5">{post.views ? likesConvert(post.views) : '0'}</span>
                    </div>

                    {/* Comment Button */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation(); 
                        openComment(post['uid']);
                      }} 
                      className="flex items-center space-x-1 group cursor-pointer"
                    >
                      <div className="p-2 rounded-full group-hover:bg-sky-500/10 group-hover:text-sky-500 transition">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                      </div>
                      <span className="group-hover:text-sky-500 text-[14px] font-medium pl-0.5">{post.comments ? post.comments : '0'}</span>
                    </div>

                    {/* Like Button (Sbloccato ed Infinito) */}
                    <div 
                      onClick={(e) => handleSpamLike(post['uid'], post.likes, e)} 
                      className="flex items-center space-x-1 group cursor-pointer"
                    >
                      <div className="p-2 rounded-full group-hover:bg-pink-500/10 group-hover:text-pink-500 transition">
                        <svg className="h-5 w-5" fill={post.likes && (Array.isArray(post.likes) ? post.likes.length > 0 : post.likes > 0) ? '#ec4899' : 'none'} stroke={post.likes && (Array.isArray(post.likes) ? post.likes.length > 0 : post.likes > 0) ? '#ec4899' : 'currentColor'} strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                      </div>
                      <span className="group-hover:text-pink-500 text-[14px] font-medium pl-0.5">
                        {Array.isArray(post.likes) ? likesConvert(post.likes.length) : likesConvert(post.likes)}
                      </span>
                    </div>

                    {/* Share Button */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(post['uid']);
                      }} 
                      className="flex items-center space-x-1 group cursor-pointer relative"
                    >
                      <div className="p-2 rounded-full group-hover:bg-green-500/10 group-hover:text-green-500 transition">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <span className="group-hover:text-green-500 text-[14px] font-medium pl-0.5">{post.shares ? likesConvert(post.shares) : '0'}</span>
                      {shareStatus[post['uid']] && (
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] px-2 py-0.5 rounded-md font-bold shadow-md whitespace-nowrap animate-bounce">
                          {shareStatus[post['uid']]}
                        </span>
                      )}
                    </div>

                  </div>
                </div>
              </div>

              {open === (post['uid']) && (
                <div className="mt-4 pl-4 ml-3 border-l border-zinc-800 space-y-4" onClick={(e) => e.stopPropagation()}>
                  {user ? (
                    <div className="flex items-start space-x-3 pt-1">
                      <img className="h-8 w-8 rounded-full object-cover mt-1" src={user.photoURL} alt="" />
                      <div className="flex-1 bg-zinc-950 p-2 rounded-xl border border-zinc-800 flex items-center justify-between">
                        <input 
                          value={text} 
                          onChange={(e)=>setText(e.target.value)} 
                          className="bg-transparent outline-none flex-1 text-[14px] text-white px-2 placeholder-zinc-600" 
                          placeholder="Post your reply..." 
                        />
                        <button 
                          onClick={() => sendComment(post['uid'])}
                          disabled={!text.trim()}
                          className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold px-4 py-1.5 rounded-full text-xs transition duration-150"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500 p-2 italic bg-zinc-900/25 rounded-lg border border-zinc-800">
                      Log in to post your reply.
                    </div>
                  )}
                  
                  <div className="space-y-4 pt-1">
                    {comments && comments.length > 0 ? (
                      comments.map((comment, cIdx)=>(
                        <div key={cIdx} className="flex space-x-3 items-start p-2 rounded-xl hover:bg-zinc-900/5 transition">
                          <img 
                            className="h-8 w-8 rounded-full object-cover mt-0.5" 
                            src={comment.img ? comment.img : 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1665px-No-Image-Placeholder.svg.png'} 
                            alt="" 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px]">
                              <span className="font-bold text-white mr-1.5 hover:underline cursor-pointer">{comment.username}</span>
                              <span className="text-zinc-500 text-xs">replied</span>
                            </div>
                            <p className="text-zinc-300 text-[14px] leading-relaxed mt-0.5 break-words whitespace-pre-wrap">
                              {renderTextWithLinks(comment.text)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-zinc-600 pl-11">No replies yet.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </React.Fragment>
        ))
      }
    </div>
  )
}

export default Feed;