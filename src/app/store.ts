import {create} from 'zustand';
import {loadData,writeData} from '../db';
import {emptyData,grade,schedule} from '../lib/learning';
import {questionMap,conceptMap,cards} from '../content';
import {validateBackup} from '../lib/backup';
import type {StudyData,Attempt,Rating,ExamRun} from '../types';
let queue=Promise.resolve();
type Store={data:StudyData;ready:boolean;saveError:string|null;toast:string;hydrate:()=>Promise<void>;commit:(d:StudyData)=>void;notify:(s:string)=>void;review:(id:string,r:Rating)=>void;complete:(id:string,v:boolean)=>void;attempt:(a:Omit<Attempt,'id'|'createdAt'|'category'|'resolved'>)=>string;updateAttempt:(id:string,patch:Partial<Pick<Attempt,'score'|'criteria'|'category'|'resolved'>>)=>void;startExam:(qids:string[],minutes:number,name:string)=>void;examAnswer:(qid:string,value:string)=>void;examIndex:(index:number)=>void;submitExam:()=>void;restore:(data:StudyData)=>Promise<void>};
export const useStudy=create<Store>((set,get)=>({
 data:emptyData(),ready:false,saveError:null,toast:'',
 hydrate:async()=>{try{const d=await loadData();set({data:d?validateBackup(d):emptyData(),ready:true});}catch{set({ready:true,saveError:'이 브라우저에서 학습 기록을 저장할 수 없습니다. 브라우저의 저장소 권한을 확인하세요.'});}},
 commit:(d)=>{set({data:d});const snapshot=structuredClone(d);queue=queue.then(()=>writeData(snapshot)).then(()=>set({saveError:null})).catch(()=>{set({saveError:'기록 저장에 실패했습니다. 현재 기록을 JSON으로 백업하세요.'});});},
 notify:(toast)=>{set({toast});},
 review:(id,r)=>{if(!cards.some(c=>c.id===id))return;const d=get().data;get().commit({...d,cardReviews:{...d.cardReviews,[id]:schedule(id,d.cardReviews[id],r)}});},
 complete:(id,v)=>{if(!conceptMap[id])return;const d=get().data;get().commit({...d,completedConcepts:{...d.completedConcepts,[id]:v}});},
 attempt:(a)=>{const id=crypto.randomUUID(),d=get().data;get().commit({...d,attempts:[...d.attempts,{...a,id,createdAt:Date.now(),category:'UNCLASSIFIED',resolved:false}]});return id;},
 updateAttempt:(id,patch)=>{const d=get().data;get().commit({...d,attempts:d.attempts.map(a=>a.id===id?{...a,...patch}:a)});},
 startExam:(qids,minutes,name)=>{const d=get().data;if(!qids.length||new Set(qids).size!==qids.length||!qids.every(id=>questionMap[id])||!Number.isFinite(minutes)||minutes<0||minutes>300||d.exams.some(e=>e.status==='running'))return;const now=Date.now(),id=crypto.randomUUID();const run:ExamRun={id,questionIds:qids,answers:{},startedAt:now,deadline:minutes>0?now+minutes*60000:null,submittedAt:null,status:'running',name,index:0};get().commit({...d,exams:[...d.exams,run],activeExamId:id});},
 examAnswer:(qid,value)=>{const d=get().data,run=d.exams.find(e=>e.id===d.activeExamId);if(!run||run.status!=='running'||!run.questionIds.includes(qid))return;if(run.deadline!==null&&Date.now()>=run.deadline){get().submitExam();return;}get().commit({...d,exams:d.exams.map(e=>e.id===d.activeExamId&&e.status==='running'?{...e,answers:{...e.answers,[qid]:value}}:e)});},
 examIndex:(index)=>{const d=get().data,run=d.exams.find(e=>e.id===d.activeExamId);if(!run||run.status!=='running'||!Number.isInteger(index)||index<0||index>=run.questionIds.length)return;get().commit({...d,exams:d.exams.map(e=>e.id===d.activeExamId?{...e,index}:e)});},
 submitExam:()=>{const d=get().data,e=d.exams.find(e=>e.id===d.activeExamId);if(!e||e.status!=='running')return;const now=Date.now();const attempts:Attempt[]=e.questionIds.map(id=>({id:crypto.randomUUID(),questionId:id,answer:e.answers[id]??'',score:grade(questionMap[id],e.answers[id]??''),createdAt:now,mode:'exam',examId:e.id,category:'UNCLASSIFIED',resolved:false,criteria:[]}));get().commit({...d,attempts:[...d.attempts,...attempts],exams:d.exams.map(x=>x.id===e.id?{...x,status:'submitted',submittedAt:now}:x)});},
 restore:async(data)=>{const checked=validateBackup(data);await queue;await writeData(checked);set({data:structuredClone(checked),saveError:null});}
}));

export async function flushWrites(){await queue;}
