import React, {useState} from 'react'
import Post from '../components/Post'
import Recommendation from '../components/Recommendation'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import Feed from '../components/Feed';

function Main() {
    const [loading, setLoading] = useState(true)
    const [posts, setPosts] = useState();
    
    const getFeed = async()=>{
        const q = query(collection(db, 'posts'), orderBy('date', 'desc'), limit(100));
    
        const querySnapshot = await getDocs(q);
        const msgs = [];
        querySnapshot.forEach(async (doc)=>{
          let data = doc.data();
          data['uid'] = doc.id;
            msgs.push(data);
        })
        setPosts(msgs);
        setLoading(false);
        console.log('update');
    }

    loading && getFeed();
  
    return (
    <>
        <Post refresh={getFeed}/>
        <Recommendation />
        <div className='color-1'>Feed</div>
        {loading && <div className='color-1'>Loading...</div>}
        {posts && <Feed fposts={posts} refresh={getFeed}/>}
    </>
  )
}

export default Main