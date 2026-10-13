import {describe,it,expect} from 'vitest';
import {schedule,grade,remaining,clockLabel,mastered,shuffle} from '../src/lib/learning';
import {questions} from '../src/content';
describe('review schedules',()=>{
 it('Again is ten minutes; success preserves history and increases interval',()=>{const first=schedule('a',undefined,'again',1000);expect(first.due).toBe(601000);expect(first.lapses).toBe(1);const next=schedule('a',first,'good',2000);expect(next.interval).toBe(1);expect(next.repetitions).toBe(2);expect(next.successes).toBe(1);expect(mastered(next)).toBe(false);});
 it('easy advances, ease stays bounded, lapses remove mastery',()=>{let r=schedule('a',undefined,'easy',0);for(let i=0;i<10;i++)r=schedule('a',r,'easy',r.due);expect(r.ease).toBeLessThanOrEqual(3.5);expect(mastered(r)).toBe(true);r=schedule('a',r,'again',r.due);expect(mastered(r)).toBe(false);for(let i=0;i<20;i++)r=schedule('a',r,'hard',r.due);expect(r.ease).toBeGreaterThanOrEqual(1.3);});
});
describe('grading and deadlines',()=>{
 it('accepts formatting differences without reordering outputs',()=>{const q={...questions.find(q=>q.grading==='tokens')!,answer:'1 2 3'};expect(grade(q,'[1, 2, 3]\n')).toBe(1);expect(grade(q,'3 2 1')).toBe(0);expect(grade(q,'')).toBe(0);});
 it('requires self assessment for any written equivalent answer',()=>{const q=questions.find(q=>q.grading==='rubric')!;expect(grade(q,'동치인 다른 풀이')).toBeNull();expect(grade(q,q.answer)).toBeNull();expect(grade(q,' ')).toBe(0);});
 it('handles reloads, exact expiry and unlimited time',()=>{expect(remaining(60000,49999)).toBe(11);expect(remaining(60000,60000)).toBe(0);expect(remaining(60000,999999)).toBe(0);expect(remaining(null,999999)).toBeNull();expect(clockLabel(61)).toBe('01:01');});
 it('shuffle never mutates or duplicates items',()=>{const a=[1,2,3,4,5];expect(shuffle(a).sort()).toEqual(a);expect(a).toEqual([1,2,3,4,5]);});
});
