import React, {useState} from 'react'
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, limit, orderBy, query, where, collection, getDocs } from 'firebase/firestore';
import Feed from './Feed';

function Recommendation() {
    const [loading, setLoading] = useState(true);
    const [user] = useAuthState(auth);
    const [posts, setPosts] = useState();

    const getRecommendations = async()=>{
        const snap = await getDoc(doc(db, 'users', user.uid));
        let recom = snap.data().recommendation;
        let total = recom.News + recom['Q&A'] + recom.Programming + recom.Other + recom.Gaming;

        let news = recom.News / total;
        let qna = recom['Q&A'] / total + news;
        let program = recom.Programming / total + qna;
        let gaming = recom.Gaming / total + program;
        let rposts = [];
        let indexes = [];

        for(let i = 0; i<5; i++){
            let random = Math.random();
            let category = '';

            if(random<news)category='News';
            else if(random<qna)category='Q&A';
            else if(random<program)category='Programming';
            else if(random<gaming)category='Gaming';
            else category='Other';

            const q = query(collection(db, 'posts'), where('category', '==', category), orderBy('likes', 'desc'), limit(5));
            const querySnapshot = await getDocs(q)
            let added = false;
            querySnapshot.forEach((doc)=>{
                let data = doc.data();
                data['uid'] = doc.id;

                if(added)return;

                if(rposts.indexOf(data)<0 && indexes.indexOf(data['uid'])<0){
                    rposts.push(data);
                    indexes.push(data['uid']);
                    added=true;
                }
            })
        }

        setPosts(rposts);
        setLoading(false);
    }

    user && loading && getRecommendations();

    const refresh = async () => {
        const rposts = [];
        for (const post of posts) {
          const id = post['uid'];
          const snap = await getDoc(doc(db, 'posts', id));
          const data = snap.data();
          data['uid'] = snap.id;
          rposts.push(data);
        }
        setPosts(rposts);
        console.log(rposts);
    };
    
    return (
    <>
        <div className='color-1'>Recommended</div>
        {loading && <div className='color-1'>Loading...</div>}
        {!loading && <Feed fposts={posts} refresh={refresh}/>}
    </>
  )
}

export default Recommendation