"""Create disjoint 20-question sets with target difficulty and topic diversity."""
from collections import Counter

def build_exams(questions):
 used=set();exams=[]
 levels=[1,2,3,4,5,3,4,2,3,4,5,1,3,4,2,3,4,5,3,4]
 for i in range(3):
  picked=[];units=Counter();types=Counter();concepts=Counter();grading=Counter()
  for level in levels:
   candidates=[q for q in questions if q['id'] not in used and q['level']==level]
   q=min(candidates,key=lambda q:(units[q['unitId']]*5+types[q['type']]*3+sum(concepts[c] for c in q['conceptIds'])*2+grading[q['grading']],q['id']))
   picked.append(q);used.add(q['id']);units[q['unitId']]+=1;types[q['type']]+=1;grading[q['grading']]+=1
   concepts.update(q['conceptIds'])
  exams.append({'id':f'exam-{i+1}','name':f'예상 모의고사 {i+1:02}','minutes':40,'questionIds':[q['id'] for q in picked],'description':'수업 자료 기반 창작 문제 · 20문항 · Lv.1~5: 2/3/6/6/3 · 서술형 자기 채점'})
 return exams
if __name__=='__main__':
 import json
 from pathlib import Path
 d=Path(__file__).resolve().parents[1]/'src/content'
 qs=json.loads((d/'questions.json').read_text())
 exams=build_exams(qs);(d/'exams.json').write_text(json.dumps(exams,ensure_ascii=False,indent=2)+'\n')
 for e in exams:
  picked=[q for q in qs if q['id'] in e['questionIds']]
  print(e['id'],dict(Counter(q['level'] for q in picked)),len(set(q['unitId'] for q in picked)),dict(Counter(q['grading'] for q in picked)))
