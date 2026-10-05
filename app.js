import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs,
  addDoc, orderBy, onSnapshot, serverTimestamp, updateDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const $ = id => document.getElementById(id);
let me = null, chatUser = null, unsubscribeMessages = null;

function makeUserId() {
  return String(Math.floor(1000000 + Math.random() * 9000000));
}

async function ensureProfile(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { online: true, lastSeen: serverTimestamp() });
    return snap.data();
  }
  let id;
  let exists = true;
  while (exists) {
    id = makeUserId();
    exists = (await getDocs(query(collection(db, "users"), where("userId", "==", id)))).size > 0;
  }
  const data = { uid:user.uid, userId:id, name:user.displayName || "User", photo:user.photoURL || "", online:true, lastSeen:serverTimestamp() };
  await setDoc(ref, data);
  return data;
}

$("googleLogin").onclick = async () => {
  try { await signInWithPopup(auth, provider); }
  catch(e) { alert(e.message); }
};

$("logout").onclick = async () => { await signOut(auth); };

onAuthStateChanged(auth, async user => {
  if (!user) {
    $("loginScreen").classList.remove("hidden");
    $("appScreen").classList.add("hidden");
    return;
  }
  me = await ensureProfile(user);
  $("loginScreen").classList.add("hidden");
  $("appScreen").classList.remove("hidden");
  $("myId").textContent = `آپ کی ID: ${me.userId}`;
});

$("searchBtn").onclick = async () => {
  const id = $("searchId").value.trim();
  if (!/^\d{7}$/.test(id)) return alert("7 ہندسوں کی درست User ID لکھیں۔");
  const snap = await getDocs(query(collection(db,"users"), where("userId","==",id)));
  if (snap.empty) {
    $("userResult").innerHTML = "<p>User نہیں ملا۔</p>";
    $("userResult").classList.remove("hidden");
    return;
  }
  const data = snap.docs[0].data();
  if (data.uid === me.uid) {
    $("userResult").innerHTML = "<p>یہ آپ کی اپنی ID ہے۔</p>";
  } else {
    $("userResult").innerHTML = `
      <div class="user">
        <div><strong>${escapeHtml(data.name)}</strong><small>ID: ${data.userId}</small></div>
        <button id="chatBtn">Chat</button>
      </div>`;
    $("userResult").classList.remove("hidden");
    $("chatBtn").onclick = () => openChat(data);
  }
};

function openChat(user) {
  chatUser = user;
  $("chatPanel").classList.remove("hidden");
  $("chatName").textContent = user.name;
  $("chatId").textContent = `ID: ${user.userId}`;
  $("chatStatus").textContent = user.online ? "Online" : "Offline";
  if (unsubscribeMessages) unsubscribeMessages();

  const ids = [me.uid, user.uid].sort();
  const chatId = `${ids[0]}_${ids[1]}`;
  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));

  unsubscribeMessages = onSnapshot(q, snap => {
    $("messages").innerHTML = "";
    snap.forEach(d => {
      const m = d.data();
      const box = document.createElement("div");
      box.className = `msg ${m.senderId === me.uid ? "mine" : "theirs"}`;
      const time = m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "";
      box.innerHTML = `<div>${escapeHtml(m.text)}</div><div class="time">${time}</div>`;
      $("messages").appendChild(box);
    });
    $("messages").scrollTop = $("messages").scrollHeight;
  });
}

$("messageForm").onsubmit = async e => {
  e.preventDefault();
  if (!chatUser) return;
  const input = $("messageInput");
  const text = input.value.trim();
  if (!text) return;
  const ids = [me.uid, chatUser.uid].sort();
  const chatId = `${ids[0]}_${ids[1]}`;
  await addDoc(collection(db, "chats", chatId, "messages"), {
    text, senderId: me.uid, receiverId: chatUser.uid, createdAt: serverTimestamp()
  });
  input.value = "";
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

window.addEventListener("beforeunload", async () => {
  if (me?.uid) await updateDoc(doc(db,"users",me.uid), {online:false,lastSeen:serverTimestamp()}).catch(()=>{});
});
