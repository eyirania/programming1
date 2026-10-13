#!/usr/bin/env python3
"""Compile C-based questions with C11 or minimal C++11 for taught STL.
Expected outputs are authored from independent reference algorithms, not captured
from these programs. Logical questions have explicit manually reviewed rubrics.
"""
from pathlib import Path
import json,subprocess,tempfile,concurrent.futures,collections,hashlib,math,itertools
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'src/content'
questions=json.loads((D/('questions.draft.json' if (D/'questions.draft.json').exists() else 'questions.json')).read_text())
sources={s['id']:s for s in json.loads((D/'sources.json').read_text())}
concepts={c['id']:c for c in json.loads((D/'concepts.json').read_text())}
for s in sources.values():
 assert hashlib.sha256((ROOT/'public'/s['path']).read_bytes()).hexdigest()==s['sha256']
seen=set()
for q in questions:
 assert q['id'] not in seen;seen.add(q['id'])
 assert q['unitId'] in sources and all(c in concepts for c in q['conceptIds'])
 assert q['answer'] and q['prompt'] and q['explanation']
 for ref in q['sources']:assert 1<=ref['page']<=sources[ref['sourceId']]['pages']
 if q['grading']=='rubric':assert len(q['rubric'])>=3
 if q['grading']=='choice':assert 0<=int(q['answer'])<len(q['options'])

def test_code(q):
 with tempfile.TemporaryDirectory(prefix='studyos-cpp-') as td:
  p=Path(td);language=q.get('language','cpp');src=p/('q.c' if language=='c' else 'q.cpp');src.write_text(q['code'])
  compiler='clang' if language=='c' else 'clang++';standard='-std=c11' if language=='c' else '-std=c++11'
  compile=subprocess.run([compiler,standard,'-O1','-Wall','-Wextra','-Werror','-fsanitize=undefined','-fno-sanitize-recover=all',str(src),'-o',str(p/'q')],capture_output=True,text=True,timeout=40)
  if compile.returncode:return {'id':q['id'],'passed':False,'error':compile.stderr}
  run=subprocess.run([str(p/'q')],capture_output=True,text=True,timeout=5)
  ok=run.returncode==0 and run.stdout.split()==q['expectedOutput'].split()
  return {'id':q['id'],'language':language,'passed':ok,'expected':q['expectedOutput'],'actual':run.stdout.strip(),'diagnostics':run.stderr}
results=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for r in pool.map(test_code,[q for q in questions if q['code']]):
  results.append(r)
  if not r['passed']:print(r,flush=True)
assert all(r['passed'] for r in results), 'C++ verification failed'
# Independent exhaustive / small-domain correctness checks for recurrences.
checks={}
# Tiling enumeration from actual board occupancy (including rotated dominoes).
from functools import lru_cache
@lru_cache(None)
def tiles(n,mask=0):
 if mask==(1<<(2*n))-1:return 1
 p=next(i for i in range(2*n) if not (mask>>i)&1);r,c=divmod(p,n);ans=0
 for shape in [[(0,0),(1,0)],[(0,0),(0,1)],[(0,0),(1,0),(0,1),(1,1)]]:
  cells=[(r+dr,c+dc) for dr,dc in shape]
  if all(x<2 and y<n and not (mask>>(x*n+y))&1 for x,y in cells):ans+=tiles(n,mask|sum(1<<(x*n+y) for x,y in cells))
 return ans
vals=[1,1]
for n in range(2,13):vals.append(vals[-1]+2*vals[-2])
for n in range(1,9):assert tiles(n)==vals[n]
for n in range(2,13):
 q=n//2
 assert vals[n]==(vals[q]**2+2*vals[q-1]**2 if n%2==0 else vals[q]*vals[q+1]+2*vals[q-1]*vals[q])
checks['tiling']='board enumeration n=1..8 and split identities n=2..12 passed'
@lru_cache(None)
def part(n,k):
 if n==0:return 1
 if k==0:return 0
 return part(n,k-1)+(part(n-k,k) if n>=k else 0)
def enum_part(n,k):
 if n==0:return [()]
 return [(v,)+tail for v in range(min(n,k),0,-1) for tail in enum_part(n-v,v)]
for n in range(10):
 for k in range(10):assert part(n,k)==len(enum_part(n,k))
checks['partition']='all n,k=0..9 compared against nonincreasing partition enumeration'
def enc(s):return s[0] if len(set(s))==1 else '-'+enc(s[:len(s)//2])+enc(s[len(s)//2:])
def dec(s,n):
 pos=0
 def walk(n):
  nonlocal pos
  ch=s[pos];pos+=1
  return walk(n//2)+walk(n//2) if ch=='-' else ch*n
 out=walk(n);assert pos==len(s);return out
for n in [1,2,4,8]:
 for bits in itertools.product('01',repeat=n):
  s=''.join(bits);assert dec(enc(s),n)==s
checks['encoding']='273 binary strings of lengths 1,2,4,8 round-trip passed'
# Actual count is 2+4+16+256=278, saved precisely below.
checks['encoding']='278 binary strings of lengths 1,2,4,8 round-trip passed'
def distance(a,b):
 d=0
 while a!=b:
  if a>b:a//=2
  else:b//=2
  d+=1
 return d
for a in range(1,40):
 for b in range(1,40):
  seen_a={};x=a;d=0
  while x:seen_a[x]=d;x//=2;d+=1
  x=b;d=0
  while x not in seen_a:x//=2;d+=1
  assert distance(a,b)==d+seen_a[x]
checks['node-distance']='1521 node pairs checked against ancestor-set method'
for n in range(1,1001):
 def s(x):return x if x<=1 else 2*s(x//2)+((x+1)//2)**2
 assert s(n)==n*(n+1)//2
checks['sum']='halving identity n=1..1000 compared with arithmetic sum'
# Counterexample checks independently reproduce deterministic wrong algorithms.
def badrev(n):
 if n<10:return n
 t=10**(len(str(n))-1)
 return t*(n%10)+10*badrev((n%t)//10)+n//t
assert badrev(1010)==11 and int(str(1010)[::-1])==101
assert 6//5*math.comb(10,4)==210 and math.comb(10,5)==252
def greedy(n,steps):
 count=0
 for step in sorted(steps,reverse=True):count+=n//step;n%=step
 return count if n==0 else math.inf
best=[0]+[math.inf]*6
for n in range(1,7):best[n]=1+min(best[n-s] for s in [1,3,4] if s<=n)
assert greedy(6,[1,3,4])==3 and best[6]==2
# Forward updates incorrectly reuse the new row when computing C(4,2).
wrong=[1,0,0];right=[1,0,0]
for n in range(1,5):
 for k in range(1,min(n,2)+1):wrong[k]+=wrong[k-1]
 for k in range(min(n,2),0,-1):right[k]+=right[k-1]
assert right[2]==math.comb(4,2) and wrong[2]!=right[2]
from collections import deque
adj={0:[1,2],1:[0,3],2:[0,3],3:[1,2]}
def enqueue_trace(mark_on_push):
 q=deque([0]);seen={0} if mark_on_push else set();added=[0]
 while q:
  u=q.popleft()
  if not mark_on_push:
   if u in seen:continue
   seen.add(u)
  for v in adj[u]:
   if v not in seen:
    q.append(v);added.append(v)
    if mark_on_push:seen.add(v)
 return added
assert enqueue_trace(False).count(3)==2 and enqueue_trace(True).count(3)==1
checks['counterexamples']='reverse-width, integer division, greedy jumps, forward DP overwrite and diamond duplicate enqueue reproduced'
# Every displayed code pattern must match a successfully executed question.
for pattern in json.loads((D/'patterns.json').read_text()):
 q=next(q for q in questions if q['id']==pattern['questionId'])
 assert pattern['code']==q['code'] and next(r for r in results if r['id']==q['id'])['passed']

# Stamp only after all verification checks pass.
byid={r['id']:r for r in results}
for q in questions:
 q['verification']['status']='passed'
 q['verification']['reviewedAt']='2026-10-13'
 q['verification']['contentSha256']=hashlib.sha256((q['prompt']+q['code']+q['answer']).encode()).hexdigest()
 if q['code']:q['verification']['actualOutput']=byid[q['id']]['actual']
(D/'questions.json').write_text(json.dumps(questions,ensure_ascii=False,indent=2)+'\n')
# Three disjoint twenty-question practice exams, balancing areas and including rubric items.
codeq=[q for q in questions if q['code']];essayq=[q for q in questions if q['grading']=='rubric'];mc=[q for q in questions if q['grading']=='choice']
from exam_presets import build_exams
exams=build_exams(questions)
(D/'exams.json').write_text(json.dumps(exams,ensure_ascii=False,indent=2)+'\n')
report={'date':'2026-10-13','sources':len(sources),'pages':sum(s['pages'] for s in sources.values()),'concepts':len(concepts),'flashcards':len(json.loads((D/'flashcards.json').read_text())),'questions':len(questions),'levels':dict(collections.Counter(q['level'] for q in questions)),'codePrograms':len(results),'codeLanguages':dict(collections.Counter(q.get('language') for q in questions if q['code'])),'codeResults':results,'independentChecks':checks,'rubricQuestions':len(essayq),'limitation':'서술형의 의미·동치성은 자동 채점하지 않음. 모범 답안과 검토된 기준으로 자기 채점.'}
(ROOT/'reports/content-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['codeResults']},ensure_ascii=False,indent=2))
