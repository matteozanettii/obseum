import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import Feed from '../components/Feed';
import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore';

function UserPage() {
  let uid =  useParams().uid;
  const [user, setUser] = useState(null);
  const [loading, setloading] = useState(true)
  const [posts, setPosts] = useState([]);

  const getUserData = async()=>{
    const snap = await getDoc(doc(db, 'users', uid));
    setUser(snap.data());
    setloading(false);
    console.log(user);
    refresh();
  }
  loading && getUserData();

  const refresh = async()=>{
    const q = query(collection(db, 'posts'), where('id', '==', uid), orderBy('date', 'desc'))
    const snap = await getDocs(q);
    let rposts = [];
    snap.forEach((doc)=>{
        let data = doc.data();
        data['uid'] = doc.id;
        rposts.push(data);
    })
    setPosts(rposts);
  }

  return (
    <>
        <div className='bg-color-3 rounded-lg my-5'>
            <div className="flex flex-shrink-0 p-4">
                <div className="flex-shrink-0 group block">
                    <div className="flex items-center">
                        <div>
                            <img className="inline-block h-10 w-10 rounded-full" src={user?.img} alt="" />
                        </div>
                        <div className="ml-3">
                            <p className="text-base leading-6 font-medium color-1">
                                {user?.username}
                                {loading && <>Loading...</>}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        {posts && <Feed fposts={posts} refresh={refresh}/>}
    </>
  )
}

export default UserPage