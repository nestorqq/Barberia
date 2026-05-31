import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBq1Jg2T8veRdYbsMVjh0SgGY8ms6Gj3LI",
  authDomain: "barber-c5d10.firebaseapp.com",
  projectId: "barber-c5d10",
  storageBucket: "barber-c5d10.firebasestorage.app",
  messagingSenderId: "367477634554",
  appId: "1:367477634554:web:2f2e8abd4d36490849a043",
  measurementId: "G-3XNBPE2Y0E"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

export { auth, googleProvider, facebookProvider };
