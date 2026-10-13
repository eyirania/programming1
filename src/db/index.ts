import Dexie from 'dexie';
import type {StudyData} from '../types';
export const db=new Dexie('studyos-programming-i');
db.version(1).stores({snapshots:'id'});
export async function loadData(){return (await db.table('snapshots').get('main'))?.data as StudyData|undefined;}
export async function writeData(data:StudyData){await db.table('snapshots').put({id:'main',data:structuredClone(data)});}
