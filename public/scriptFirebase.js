// Importações de módulos Firebase
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, getFirestore, setDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDsxtDB056yc2sYM80A-u-08pLMKoLwT6c",
  authDomain: "lotterysimulator-cx.firebaseapp.com",
  databaseURL: "https://lotterysimulator-cx-default-rtdb.firebaseio.com",
  projectId: "lotterysimulator-cx",
  storageBucket: "lotterysimulator-cx.firebasestorage.app",
  messagingSenderId: "300318348807",
  appId: "1:300318348807:web:438ba4ffcc955a8538fca2",
  measurementId: "G-K8C7CBJWXL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

var user = undefined;
var credential = undefined;
var uid = undefined;
var userData = undefined;

export function getUser() { return user; }
export function setUser(newUser) { user = newUser; }
export function getCredential() { return credential; }
export function setCredential(newCredential) { credential = newCredential; }
export function getUid() { return uid; }
export function setUid(newUid) { uid = newUid; }
export function getUserData() { return userData; }
export function setUserData(newUserData) { userData = newUserData; }


// |- Fazer login no Firestore
export const login = async (email, password) => {
  try {
    // Faz login e define as credenciais
    setCredential(await signInWithEmailAndPassword(auth, email, password));
    // Define o usuário e o UID
    setUser(getCredential().user);
    setUid(getUser().uid);
    // Redireciona para a página com o UID
    window.location.href = `page.html?uid=${getUid()}`;
    /*
      página dinâmica: window.location.href = `page.html?uid=${uid}`;
      page.html?uid=${uid}, resulta em uma nova página html apenas no lado do cliente
      baseada no arquivo page.html mas personalizada pelo parâmetro ?uid=${uid}?
    */
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    alert(`Erro: ${errorCode}, ${errorMessage}`);
  }
};

// |- Fazer logout no Firestore
export const logout = async () => {
  try {
    await signOut(auth);
    console.log("Usuário deslogado com sucesso.");
    return true;
  } catch (error) {
    console.error("Erro ao deslogar usuário:", error);
    return false;
  }
}

// |- Criar ou substituir .json
export const createUserProfile = async (data) => {
  try {
    await setDoc(doc(db, "users", getUid()), data);
    console.log("Perfil do usuário criado com sucesso!");
  } catch (error) {
    console.error("Erro ao criar perfil do usuário:", error);
  }
};

// |- Registrar novo usuário
export const register = async (email, password, userData) => {
  try {
    setCredential(await createUserWithEmailAndPassword(auth, email, password)); // Registra o usuário
    setUser(getCredential().user); // Define o usuário
    setUid(getUser().uid); // Define o UID do usuário
    await createUserProfile(userData);
    return true;
  }
  catch (error) {
    const errorCodeData = error.code; // Código do erro
    const errorMessageData = error.message; // Mensagem do erro
    console.log(`Erro: ${errorCodeData}, ${errorMessageData}`);
    return false;
  }
};

// |- Atualizar json no Firestore
export const updateUserProfile = async (updates) => {
  try {
    // Atualiza campos específicos do documento do usuário
    await updateDoc(doc(db, "users", getUid()), updates);
    console.log("Perfil do usuário atualizado com sucesso!");
  } catch (error) {
    console.error("Erro ao atualizar perfil do usuário:", error);
  }
};
// Exemplo de uso
// const userId = "unique-user-id";
// const userUpdates = {
//   email: "new.email@example.com",
//   age: 31
// };
// updateUserProfile(uid, userUpdates);


// |- Importar valores do usuário
// | - - obter parâmetro 'uid' da URL
export const getUidFromUrl = () => {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  return urlParams.get('uid');
};

// |- - Pegar dados do usuário
export const fetchUserData = async () => {
  const uid = getUidFromUrl(); // Obtém o uid da URL
  if (getUid()) {
    try {
      // Obtenha a referência do documento do usuário
      const docRef = doc(db, 'users', getUid()); // Correção: use doc() para acessar o documento
      const docSnap = await getDoc(docRef); // Correção: use getDoc() para obter os dados do documento

      if (docSnap.exists()) {
        setUserData(docSnap.data()); // Obtém os dados do documento
        // Aplicar os dados na página
        if (getUserData()) {
          try {
            console.log(getUserData().birthdate);
            console.log(getUserData().name);
            console.log(getUserData().phone);
          } catch (error) {
            console.log('Erro ao aplicar o background: ' + error.message);
          }
        }
        // if (userData.profilePictureUrl) {
        //   const profileImg = document.createElement('img');
        //   profileImg.src = userData.profilePictureUrl;
        //   profileImg.alt = 'Profile Picture';
        //   document.body.appendChild(profileImg);
        // }
      } else {
        console.log('Nenhum dado encontrado para o usuário:', getUid());
      }
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
    }
  } else {
    console.log('UID não encontrado na URL.');
  }
};

// Função para fazer upload da imagem
export async function uploadImage(file) {
  if (file) {
    const storageRef = ref(storage, `user_images/${getUid()}/${file.name}`);
    try {
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      console.log('File available at', downloadURL);
      alert('Upload realizado com sucesso!');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Erro ao realizar o upload.');
    }
  } else {
    alert('Por favor, selecione um arquivo.');
  }
}

// Executa a função quando a página carrega
// window.onload = fetchUserData;