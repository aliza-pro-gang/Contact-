Real-Time Chat App
یہ ایک GitHub-ready بنیادی Chat App ہے۔
Features
Google Login
ہر user کی الگ 7-digit User ID
User ID Search
Private 1-to-1 real-time chat
Online/Offline status
Firebase Firestore
Firebase Setup
Firebase Console میں نیا project بنائیں۔
Authentication > Sign-in method میں Google enable کریں۔
Firestore Database create کریں۔
Web App register کریں۔
Firebase کی config کو firebase-config.js میں paste کریں۔
Firebase Authentication میں اپنے GitHub Pages domain کو Authorized domains میں شامل کریں۔
Firestore Rules کو production میں محفوظ rules کے ساتھ configure کریں۔
GitHub Pages
Files کو GitHub repository میں upload کریں اور Settings > Pages سے deployment enable کریں۔
نوٹ: یہ starter project ہے۔ Production app کے لیے مضبوط Firestore Security Rules، abuse protection اور بہتر presence system ضرور شامل کریں۔
