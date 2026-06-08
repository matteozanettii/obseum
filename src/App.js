import './App.css';
import Navbar from './components/Navbar';
import {useAuthState} from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import {
  Route,
  Routes,
  BrowserRouter,
} from "react-router-dom";
import UserPage from './pages/UserPage';
import Main from './pages/Main';

function App() {
  const [user] = useAuthState(auth);
  
  return (
    <BrowserRouter>
      <Navbar>
        <Routes>
          <Route path="/">
            <Route
              index
              element={
                /* Rimosso il blocco rigido: ora Main (il Feed) viene caricato sempre */
                <Main />
              }
            />
            <Route path="/user/:uid" element={<>{user ? <UserPage/> : <div className="color-1 text-xl text-center m-5">Log in to view the profile.</div>}</>} />
          </Route>
        </Routes>
      </Navbar>
    </BrowserRouter>
  );
}

export default App;