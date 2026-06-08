import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

function Post({ refresh }) {
  const [text, setText] = useState('');
  const [user] = useAuthState(auth);

  const sendPost = async () => {
    if (!text.trim() || !user) return;

    await addDoc(collection(db, 'posts'), {
      text: text,
      id: user.uid,
      username: user.displayName,
      img: user.photoURL,
      date: serverTimestamp(),
      likes: [],
      comments: 0,
      views: 0,
      category: 'Other'
    });

    setText('');
    refresh();
  };

  // SE L'UTENTE NON È LOGGATO, BLOCCHIAMO IL RENDERING QUI.
  // In questo modo l'app non cercherà mai di leggere user.photoURL se l'utente è null.
  if (!user) return null;

  return (
    <div className="p-4 border-b border-zinc-800 bg-black max-w-2xl mx-auto border-x">
      <div className="flex space-x-3">
        <img className="h-10 w-10 rounded-full object-cover mt-1" src={user.photoURL} alt="" />
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full bg-transparent text-white text-lg placeholder-zinc-500 outline-none resize-none border-none focus:ring-0 min-h-[60px]"
            placeholder="Che c'è di nuovo?"
          />
          <div className="flex justify-end pt-2 border-t border-zinc-800/60 mt-2">
            <button
              onClick={sendPost}
              disabled={!text.trim()}
              className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold px-5 py-1.5 rounded-full text-sm transition duration-200"
            >
              Posta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Post;