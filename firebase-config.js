// Pega aquí el objeto de configuración que Firebase te da al crear el proyecto.
// Lo encuentras en: Configuración del proyecto (⚙️) > Tus apps > Config
const firebaseConfig = {
  apiKey: "AIzaSyBqMvqX-hl8nZ3XFpmZQUqmn7u0v_Hm3pk",
  authDomain: "conecta-4-5183a.firebaseapp.com",
  databaseURL: "https://conecta-4-5183a-default-rtdb.firebaseio.com",
  projectId: "conecta-4-5183a",
  storageBucket: "conecta-4-5183a.firebasestorage.app",
  messagingSenderId: "219774543915",
  appId: "1:219774543915:web:21af9330b2391bac4d626e",
  measurementId: "G-FEV7J85HTT"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
