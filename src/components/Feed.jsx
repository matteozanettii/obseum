import { doc, getDocs, query, collection, orderBy, updateDoc, arrayUnion, addDoc, serverTimestamp, increment} from 'firebase/firestore'
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

  useEffect(() => {
    if (fposts && fposts.length > 0) {
      fposts.forEach(async (post) => {
        const postRef = doc(db, 'posts', post['uid']);
        await updateDoc(postRef, {
          views: increment(1)
        }).catch(err => console.error("Errore view:", err));
      });
    }
  }, [fposts]);

  function dateCovert(day, month){
    let m = '';
    switch(month){
      case 0: m='Gen'; break;
      case 1: m='Feb'; break;
      case 2: m='Mar'; break;
      case 3: m='Apr'; break;
      case 4: m='Mag'; break;
      case 5: m='Giu'; break;
      case 6: m='Lug'; break;
      case 7: m='Ago'; break;
      case 8: m='Set'; break;
      case 9: m='Ott'; break;
      case 10: m='Nov'; break;
      case 11: m='Dic'; break;
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

  const like = async(id, category, e)=>{
    if(!user) return;
    await updateDoc(doc(db, 'posts', id), {
      likes: arrayUnion(user.uid),
    });
    refresh();
  }

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
    }
    setText('');
  }

  const sendComment = async (postId) => {
    if (!text.trim() || !user) return;

    try {
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        text: text,
        username: user.displayName,
        img: user.photoURL, // Salviamo la foto profilo anche nel commento
        date: serverTimestamp()
      });

      await updateDoc(doc(db, 'posts', postId), {
        comments: increment(1)
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
      console.error("Errore nell'invio del commento:", error);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto border-x border-zinc-800 bg-black min-h-screen">
      <MonetagAd zoneId="11119420" isVignette={true} />

      {
        fposts?.map((post, index)=>(
          <React.Fragment key={post['uid']}>
            <div className="p-4 border-b border-zinc-800 hover:bg-zinc-900/20 transition duration-200">
              <div className="flex space-x-3">
                <a href={'/user/' + post.id} className="flex-shrink-0">
                  <img className="h-10 w-10 rounded-full object-cover" src={post.img ? post.img : 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1665px-No-Image-Placeholder.svg.png'} alt="" />
                </a>
                <div className="flex-1">
                  <div className="flex items-center space-x-1">
                    <span className="font-bold text-white hover:underline cursor-pointer text-[15px]">{post.username}</span>
                    <span className="text-zinc-500 text-sm">·</span>
                    <span className="text-zinc-500 text-sm">
                      {post.date && dateCovert(post.date.toDate().getDate(), post.date.toDate().getMonth())}
                    </span>
                  </div>
                  
                  <p className="text-white text-[15px] leading-relaxed mt-1 whitespace-pre-wrap">
                    {post.text}
                  </p>

                  <div className="flex justify-between max-w-md mt-3 text-zinc-500">
                    {/* View Counter */}
                    <div className="flex items-center space-x-2 text-sm group cursor-pointer">
                      <div className="p-2 rounded-full group-hover:bg-sky-500/10 group-hover:text-sky-500 transition">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <span className="group-hover:text-sky-500 text-xs">{post.views ? likesConvert(post.views) : '0'}</span>
                    </div>

                    {/* Comment Button */}
                    <div onClick={()=>openComment(post['uid'])} className="flex items-center space-x-2 text-sm group cursor-pointer">
                      <div className="p-2 rounded-full group-hover:bg-sky-500/10 group-hover:text-sky-500 transition">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                      </div>
                      <span className="group-hover:text-sky-500 text-xs">{post.comments ? post.comments : '0'}</span>
                    </div>

                    {/* Like Button */}
                    <div onClick={(e)=>{ if(user && post.likes.indexOf(user.uid)<0) like(post['uid'], post.category, e) }} className="flex items-center space-x-2 text-sm group cursor-pointer">
                      <div className="p-2 rounded-full group-hover:bg-pink-500/10 group-hover:text-pink-500 transition">
                        <svg className="h-4 w-4" fill={user && post.likes.indexOf(user.uid)>=0 ? '#ec4899' : 'none'} stroke={user && post.likes.indexOf(user.uid)>=0 ? '#ec4899' : 'currentColor'} strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                      </div>
                      <span className="group-hover:text-pink-500 text-xs">{likesConvert(post.likes.length)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sezione Commenti Ottimizzata stile X */}
              {open === (post['uid']) && (
                <div className="mt-4 pl-4 ml-3 border-l-2 border-zinc-800 space-y-4">
                  {user ? (
                    <div className="flex items-start space-x-3 pt-2">
                      <img className="h-8 w-8 rounded-full object-cover mt-0.5" src={user.photoURL} alt="" />
                      <div className="flex-1 bg-zinc-900/40 p-2 rounded-xl border border-zinc-800 flex items-center justify-between">
                        <input 
                          value={text} 
                          onChange={(e)=>setText(e.target.value)} 
                          className="bg-transparent outline-none flex-1 text-[14px] text-white px-2 placeholder-zinc-500" 
                          placeholder="Posta la tua risposta..." 
                        />
                        <button 
                          onClick={() => sendComment(post['uid'])}
                          disabled={!text.trim()}
                          className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold px-4 py-1.5 rounded-full text-xs transition duration-150"
                        >
                          Rispondi
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500 p-2 italic bg-zinc-900/20 rounded-lg border border-zinc-800">
                      Accedi per poter rispondere a questo post.
                    </div>
                  )}
                  
                  {/* Lista Risposte con Foto Profilo e Spaziature Morbide */}
                  <div className="space-y-3 pt-1">
                    {comments && comments.length > 0 ? (
                      comments.map((comment, cIdx)=>(
                        <div key={cIdx} className="flex space-x-3 items-start p-2 rounded-xl hover:bg-zinc-900/10 transition">
                          <img 
                            className="h-8 w-8 rounded-full object-cover mt-0.5" 
                            src={comment.img ? comment.img : 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1665px-No-Image-Placeholder.svg.png'} 
                            alt="" 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm">
                              <span className="font-bold text-white mr-1.5 hover:underline cursor-pointer">{comment.username}</span>
                              <span className="text-zinc-500 text-xs">Risposta</span>
                            </div>
                            <p className="text-zinc-200 text-[14px] leading-relaxed mt-0.5 break-words whitespace-pre-wrap">
                              {comment.text}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-zinc-600 pl-11">Nessuna risposta ancora.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Banner Pubblicitario Integrato nel Feed */}
            {(index + 1) % 3 === 0 && (
              <div className="border-b border-zinc-800 p-4 text-center bg-zinc-950/40">
                <span className="text-[11px] text-zinc-500 block mb-2 font-semibold tracking-wider uppercase">Contenuto Sponsorizzato</span>
                <div className="flex justify-center items-center min-h-[100px]">
                  <MonetagAd zoneId="11119349" index={index} isVignette={false} />
                </div>
              </div>
            )}
          </React.Fragment>
        ))
      }
    </div>
  )
}

export default Feed;