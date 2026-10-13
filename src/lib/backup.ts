import {cards,concepts,questions,categories} from '../content';
import type {StudyData} from '../types';
function isObj(x:unknown):x is Record<string,unknown>{return !!x&&typeof x==='object'&&!Array.isArray(x);}
export function validateBackup(value:unknown):StudyData{
 const root=isObj(value)&&'data' in value?value.data:value;
 if(!isObj(root)||root.schemaVersion!==1||!isObj(root.cardReviews)||!Array.isArray(root.attempts)||!isObj(root.completedConcepts)||!Array.isArray(root.exams))throw Error('StudyOS 백업 형식 또는 버전이 맞지 않습니다.');
 const cs=new Set(cards.map(c=>c.id)),co=new Set(concepts.map(c=>c.id)),qs=new Set(questions.map(q=>q.id));
 const num=(x:unknown)=>typeof x==='number'&&Number.isFinite(x)&&x>=0;
 if(root.attempts.length>100000||root.exams.length>10000)throw Error('백업 기록 수가 허용 범위를 넘었습니다.');
 for(const [id,r] of Object.entries(root.cardReviews)){
  if(!cs.has(id)||!isObj(r)||r.id!==id||!['again','hard','good','easy'].includes(String(r.rating))||!['due','interval','lastReviewed','ease','repetitions','successes','lapses'].every(k=>num(r[k]))||Number(r.ease)<1.3||Number(r.ease)>3.5||!Number.isInteger(r.repetitions)||Number(r.repetitions)<1||!Number.isInteger(r.successes)||!Number.isInteger(r.lapses)||Number(r.successes)+Number(r.lapses)!==Number(r.repetitions))throw Error('카드 복습 기록이 올바르지 않습니다.');
 }
 for(const [id,v] of Object.entries(root.completedConcepts))if(!co.has(id)||typeof v!=='boolean')throw Error('알 수 없는 개념 기록입니다.');
 const attemptIds=new Set<string>();
 for(const a of root.attempts){
  if(!isObj(a)||typeof a.id!=='string'||attemptIds.has(a.id)||!qs.has(String(a.questionId))||typeof a.answer!=='string'||a.answer.length>100000||!num(a.createdAt)||!(a.score===null||(num(a.score)&&Number(a.score)<=1))||!['practice','exam'].includes(String(a.mode))||typeof a.resolved!=='boolean'||(typeof a.category!=='string'||!Object.hasOwn(categories,a.category))||!Array.isArray(a.criteria)||!a.criteria.every(x=>typeof x==='boolean'))throw Error('문제 풀이 기록이 올바르지 않습니다.');
  attemptIds.add(a.id);
 }
 const examIds=new Set<string>();let running=0;
 for(const e of root.exams){
  if(!isObj(e)||typeof e.id!=='string'||examIds.has(e.id)||!Array.isArray(e.questionIds)||e.questionIds.length===0||e.questionIds.length>questions.length||new Set(e.questionIds).size!==e.questionIds.length||!e.questionIds.every(q=>qs.has(String(q)))||!isObj(e.answers)||!['running','submitted'].includes(String(e.status))||typeof e.name!=='string'||!num(e.startedAt)||!(e.deadline===null||num(e.deadline))||!(e.submittedAt===null||num(e.submittedAt))||!Number.isInteger(e.index)||Number(e.index)<0||Number(e.index)>=e.questionIds.length)throw Error('시험 기록이 올바르지 않습니다.');
  for(const [qid,answer] of Object.entries(e.answers))if(!e.questionIds.includes(qid)||typeof answer!=='string'||answer.length>100000)throw Error('시험 답안 형식이 올바르지 않습니다.');
  if(e.status==='running'){running++;if(root.activeExamId!==e.id||e.submittedAt!==null)throw Error('진행 중 시험의 상태가 일치하지 않습니다.');}
  if(e.deadline!==null&&Number(e.deadline)<Number(e.startedAt))throw Error('시험 제한 시간이 올바르지 않습니다.');
  if(e.status==='submitted'&&(e.submittedAt===null||Number(e.submittedAt)<Number(e.startedAt)))throw Error('시험 제출 시간이 올바르지 않습니다.');
  examIds.add(e.id);
 }
 if(running>1||!(root.activeExamId===null||(typeof root.activeExamId==='string'&&examIds.has(root.activeExamId))))throw Error('활성 시험 정보가 올바르지 않습니다.');
 for(const a of root.attempts)if(a.mode==='exam'&&(!examIds.has(a.examId)||!root.exams.some(e=>e.id===a.examId&&e.questionIds.includes(a.questionId))))throw Error('시험과 풀이 기록의 연결이 맞지 않습니다.');
 for(const e of root.exams){const attempts=root.attempts.filter(a=>a.examId===e.id);if(e.status==='submitted'&&(attempts.length!==e.questionIds.length||new Set(attempts.map(a=>a.questionId)).size!==e.questionIds.length))throw Error('제출한 시험의 문항 기록이 누락되거나 중복되었습니다.');if(e.status==='running'&&attempts.length)throw Error('진행 중 시험에는 채점 기록이 있을 수 없습니다.');}
 return structuredClone(root) as unknown as StudyData;
}
export function downloadBackup(data:StudyData){const blob=new Blob([JSON.stringify({app:'StudyOS Programming I',exportedAt:new Date().toISOString(),data},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`studyos-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
