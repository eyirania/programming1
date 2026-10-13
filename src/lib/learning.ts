import type {CardReview,Rating,Question,StudyData,Attempt} from '../types';
const DAY=86400000;
export function schedule(id:string,old:CardReview|undefined,rating:Rating,now=Date.now()):CardReview{
 const prev=old??{id,repetitions:0,successes:0,lapses:0,ease:2.5,interval:0,lastReviewed:0,due:0,rating};
 let interval:number,ease=prev.ease;
 if(rating==='again'){interval=10/1440;ease=Math.max(1.3,ease-.2);}
 else if(rating==='hard'){interval=prev.interval<1?1:Math.max(1,prev.interval*1.2);ease=Math.max(1.3,ease-.15);}
 else if(rating==='good'){interval=prev.interval<1?1:Math.max(3,Math.round(prev.interval*ease));}
 else {interval=prev.interval<1?4:Math.max(4,Math.round(prev.interval*ease*1.3));ease=Math.min(3.5,ease+.15);}
 return {id,repetitions:prev.repetitions+1,successes:prev.successes+(rating==='again'?0:1),lapses:prev.lapses+(rating==='again'?1:0),ease,interval,lastReviewed:now,due:now+interval*DAY,rating};
}
export function tokens(s:string){return s.trim().normalize('NFKC').replace(/[\[\](),<>]/g,' ').replace(/\s+/g,' ').trim();}
export function grade(q:Question,answer:string):number|null{
 if(!answer.trim())return 0;
 if(q.grading==='rubric')return null;
 return (q.grading==='choice'?answer===q.answer:tokens(answer)===tokens(q.answer))?1:0;
}
export function shuffle<T>(items:T[]):T[]{const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function remaining(deadline:number|null,now=Date.now()){return deadline===null?null:Math.max(0,Math.ceil((deadline-now)/1000));}
export function clockLabel(seconds:number|null){return seconds===null?'시간 제한 없음':`${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;}
export function percentage(n:number,d:number){return d?Math.round(n/d*100):0;}
export function mastered(r:CardReview|undefined){return !!r&&r.interval>=21&&r.repetitions>=3&&r.rating!=='again';}
export function scoredAttempts(a:Attempt[]){return a.filter(x=>x.score!==null);}
export function emptyData():StudyData{return {schemaVersion:1,cardReviews:{},attempts:[],completedConcepts:{},exams:[],activeExamId:null};}
