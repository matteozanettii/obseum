import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, {useState} from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db } from '../firebase'

function Post({refresh}) {
  const [user] = useAuthState(auth);
  const [msg, setMsg] = useState('');

  const publish = async()=>{
    let text = msg;
    if (text.length === 0) return;
    setMsg('');

    // Se l'utente mette un hashtag prende quello, altrimenti assegna la categoria 'Other' in automatico
    let finalCategory = 'Other';
    if (text.includes('#')) {
      try {
        let parts = text.split('#');
        finalCategory = parts[1].split(' ')[0] || 'Other';
      } catch (e) {
        finalCategory = 'Other';
      }
    }

    await addDoc(collection(db, 'posts'), {
        date: serverTimestamp(),
        id: user.uid,
        likes: [],
        views: 0, 
        text: text,
        username: user.displayName,
        img: user.photoURL,
        category: finalCategory,
    })
    refresh();
  }
  
  return (
    <div className='bg-color-3 rounded-lg my-5'>
        <div className="flex flex-shrink-0 p-4 pb-0">
        <a href="/" className="flex-shrink-0 group block">
            <div className="flex items-center">
            <div>
                <img className="inline-block h-10 w-10 rounded-full" src={user.photoURL} alt="" />
            </div>
            <div className="ml-3">
                <p className="text-base leading-6 font-medium color-1">
                    {user.displayName} 
                    <span className="p-1 text-sm leading-5 font-medium color-2">
                        Now
                    </span>
                </p>
            </div>
            </div>
        </a>
        </div>
        <div className="pl-16">
        <p className="text-base width-auto font-medium flex-shrink text-white">
            <textarea className="bg-transparent border-none border-transparent focus:border-none w-5/6 h-100" placeholder="Scrivi qualcosa... (Puoi usare #Gaming #News #Programming se vuoi)" value={msg} onChange={(e)=>setMsg(e.target.value)}/>
        </p>

        <div className="flex">
            <div className="w-full">
                <div className="flex justify-end items-center">
                    <div className="text-center">
                    <button onClick={publish} className='bg-color-2 text-white px-5 py-1 m-2 rounded-full'>Post</button>
                    </div>           
                </div>
            </div>
        </div>
        </div>
    </div>
  )
}

export default Post