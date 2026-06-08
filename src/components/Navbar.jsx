import React from 'react'
import { signInWithPopup, signOut } from 'firebase/auth'
import { auth, db, provider } from '../firebase'
import { useAuthState } from 'react-firebase-hooks/auth'
import { doc, setDoc } from 'firebase/firestore';

function Navbar(props) {
  const [user] = useAuthState(auth);
  
  const login = ()=>{
    signInWithPopup(auth, provider)
    .then(async(result)=>{
      const usr = result.user;
      await setDoc(doc(db, 'users', usr.uid), {
        username: usr.displayName,
        img: usr.photoURL,
      });
    });
  }

  const logout = ()=>{
    signOut(auth);
  }

  return (
    <>
      <div className='shadow-md w-full fixed top-0 left-0 z-50'>
        <div className='flex items-center justify-between bg-color-3 py-4 px-5'>
          <a href='/' className='font-bold text-2xl cursor-pointer flex items-center text-gray-800 btn-secondary'>
            <span className='text-3xl mr-5 color-1'>AllMatter</span>
          </a>
          <div>
            {user ? 
              <button onClick={logout} className='bg-color-2 text-white px-5 py-1'>Log out</button>
              :
              <button onClick={login} className='bg-color-2 text-white px-5 py-1'>Log in</button>
            }
          </div>
        </div>
      </div>
      <div className='container mt-12 mx-auto p-5'>
        {props.children}
      </div>
    </>
  )
}

export default Navbar