import 'fake-indexeddb/auto';
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {useStudy,flushWrites} from '../src/app/store';
import {emptyData} from '../src/lib/learning';
import {validateBackup} from '../src/lib/backup';
import {loadData,writeData,db} from '../src/db';
import {questions,cards,concepts} from '../src/content';
beforeEach(async()=>{await flushWrites();await db.table('snapshots').clear();useStudy.setState({data:emptyData(),ready:true,saveError:null});});
afterEach(async()=>{await flushWrites();vi.useRealTimers();});
describe('persistent learning state',()=>{
 it('round-trips reviews, concept completion and attempts through IndexedDB',async()=>{const s=useStudy.getState();s.review(cards[0].id,'good');s.complete(concepts[0].id,true);s.attempt({questionId:questions[0].id,answer:'0',score:0,mode:'practice',criteria:[]});await flushWrites();const saved=await loadData();expect(validateBackup(saved)).toEqual(useStudy.getState().data);useStudy.setState({data:emptyData()});await s.hydrate();expect(useStudy.getState().data.attempts).toHaveLength(1);expect(useStudy.getState().data.cardReviews[cards[0].id].repetitions).toBe(1);});
 it('submits only once, preserves answer and grades blank rubric zero',async()=>{const q=questions[0],r=questions.find(q=>q.grading==='rubric')!;const s=useStudy.getState();s.startExam([q.id,r.id],40,'검증');s.examAnswer(q.id,q.answer);s.examIndex(1);s.submitExam();s.submitExam();const d=useStudy.getState().data;expect(d.attempts.map(a=>a.score)).toEqual([1,0]);expect(d.exams[0].status).toBe('submitted');expect(validateBackup(d)).toEqual(d);s.examAnswer(q.id,'changed');expect(useStudy.getState().data.exams[0].answers[q.id]).toBe(q.answer);});
 it('refuses a late edit and submits the previously saved answer',()=>{vi.spyOn(Date,'now').mockReturnValue(1000);const s=useStudy.getState();s.startExam([questions[0].id],1,'만료');s.examAnswer(questions[0].id,'1');vi.mocked(Date.now).mockReturnValue(61000);s.examAnswer(questions[0].id,'2');expect(useStudy.getState().data.exams[0].status).toBe('submitted');expect(useStudy.getState().data.attempts[0].answer).toBe('1');vi.restoreAllMocks();});
 it('rejects invalid exams and navigation, preserves running exam across hydration',async()=>{const s=useStudy.getState();s.startExam([],20,'empty');s.startExam(['unknown'],20,'bad');expect(useStudy.getState().data.exams).toHaveLength(0);s.startExam([questions[0].id],20,'valid');s.examIndex(99);s.examAnswer('unknown','bad');s.startExam([questions[1].id],20,'second');await flushWrites();const d=structuredClone(useStudy.getState().data);useStudy.setState({data:emptyData()});await s.hydrate();expect(useStudy.getState().data).toEqual(d);expect(d.exams).toHaveLength(1);expect(d.exams[0].index).toBe(0);});
 it('restores atomically and rejects a malformed backup before mutation',async()=>{const s=useStudy.getState();s.complete(concepts[0].id,true);await flushWrites();const before=structuredClone(s.data);const backup=emptyData();backup.completedConcepts[concepts[1].id]=true;await s.restore(backup);expect(await loadData()).toEqual(backup);await expect(s.restore({...backup,schemaVersion:999} as never)).rejects.toThrow();expect(await loadData()).toEqual(backup);expect(before).not.toBe(backup);});
});
describe('backup validation',()=>{
 it.each([null,{},[],{schemaVersion:2}, {...emptyData(),completedConcepts:{unknown:true}}, {...emptyData(),activeExamId:'missing'}])('rejects invalid structure or references %#',(x)=>expect(()=>validateBackup(x)).toThrow());
 it('rejects missing submitted attempt records and impossible dates',()=>{const s=useStudy.getState();s.startExam([questions[0].id],1,'x');s.submitExam();const d=structuredClone(useStudy.getState().data);d.attempts=[];expect(()=>validateBackup(d)).toThrow();});
 it('accepts an exported envelope and creates an isolated copy',()=>{const d=emptyData();const copy=validateBackup({app:'StudyOS Programming I',data:d});expect(copy).toEqual(d);expect(copy).not.toBe(d);});
});
