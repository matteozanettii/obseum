import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

function Post({ refresh }) {
  const [text, setText] = useState('');
  const [user] = useAuthState(auth);
  const [error, setError] = useState(''); // Stato per gestire i messaggi di blocco della sicurezza

  // LISTA NERA MULTILINGUA (Parole offensive/pornografiche e domini spam comuni)
  const blacklist = [
    'porn', 'sex', 'porno', 'xxx', 'hentai', 'naked', 'nude', 'nudi', 'nuda',
    'viagra', 'casino', 'betting', 'sesso', 'puttana', 'troia', 'vaffanculo',
    'fuck', 'bitch', 'asshole', 'dick', 'pussy', 'cock',
    '.porn', '.xxx', '.adult', 'onlyfans'
  ];

  const sendPost = async () => {
    if (!text.trim() || !user) return;
    
    setError(''); // Resetta eventuali errori precedenti
    const lowerText = text.toLowerCase();

    // CONTROLLO DI SICUREZZA: Scansiona il testo parola per parola
    const containsBadWord = blacklist.some((word) => {
      // Controlla se la stringa vietata è contenuta nel testo (funziona sia per parole isolate che nei link)
      return lowerText.includes(word);
    });

    if (containsBadWord) {
      setError('Content not allowed. Please keep the community safe!');
      return; // BLOCCO IMMEDIATO: Impedisce l'esecuzione di addDoc su Firebase
    }

    try {
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
    } catch (err) {
      console.error("Error creating post:", err);
    }
  };

  // Se l'utente non è loggato, blocchiamo il rendering qui
  if (!user) return null;

  return (
    <div className="p-4 border-b border-zinc-800 bg-black max-w-2xl mx-auto border-x">
      <div className="flex space-x-3">
        <img className="h-10 w-10 rounded-full object-cover mt-1" src={user.photoURL} alt="" />
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError(''); // Rimuove l'errore appena l'utente ricomincia a scrivere
            }}
            className="w-full bg-transparent text-white text-lg placeholder-zinc-500 outline-none resize-none border-none focus:ring-0 min-h-[60px]"
            placeholder="Che c'è di nuovo?"
          />

          {/* MESSAGGIO DI AVVISO DI SICUREZZA */}
          {error && (
            <div className="text-red-500 text-xs font-semibold bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl mt-2 animate-pulse">
              ⚠️ {error}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-zinc-800/60 mt-2">
            <button
              onClick={sendPost}
              disabled={!text.trim()}
              className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold px-5 py-1.5 rounded-full text-sm transition duration-200"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Post;