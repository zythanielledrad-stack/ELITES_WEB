import formidable from "formidable";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, addDoc, collection } from "firebase/firestore";

export const config = {
  api: {
    bodyParser: false
  }
};

const firebaseConfig = {
  apiKey: "AIzaSyAmzy_8B2h_sTtAKE2dVgfl2K-OXd5TVZg",
  authDomain: "voting-890f2.firebaseapp.com",
  projectId: "voting-890f2",
  storageBucket: "voting-890f2.appspot.com",
  messagingSenderId: "537631858085",
  appId: "1:537631858085:web:1234567890abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export default async function handler(req, res) {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    const file = files.file;
    const title = fields.title;
    const description = fields.description;

    const buffer = fs.readFileSync(file.filepath);

    const storageRef = ref(storage, "happenings/" + file.originalFilename);

    await uploadBytes(storageRef, buffer, {
      contentType: file.mimetype
    });

    const imageUrl = await getDownloadURL(storageRef);

    await addDoc(collection(db, "happenings"), {
      title,
      description,
      image: imageUrl
    });

    res.status(200).json({ success: true });
  });
}
