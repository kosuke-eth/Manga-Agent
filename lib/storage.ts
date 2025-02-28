import {Firestore} from '@google-cloud/firestore';
import {Storage} from '@google-cloud/storage';

export const fireStoreDb = new Firestore();
export const storage = new Storage();
export const bucket = storage.bucket('Manga-Agent');

