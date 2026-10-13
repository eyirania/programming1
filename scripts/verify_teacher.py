#!/usr/bin/env python3
"""Run the three supplied teacher programs independently; never modify original."""
from pathlib import Path
from collections import deque
import json,subprocess,tempfile,itertools,hashlib
ROOT=Path(__file__).resolve().parents[1]
source=json.loads((ROOT/'src/content/teacher-code.json').read_text())
assert hashlib.sha256((ROOT/'public'/source['path']).read_bytes()).hexdigest()==source['sha256']
def reference(a,b,steps):
 dist={a:0};q=deque([a])
 while q:
  u=q.popleft()
  if u==b:return dist[u]
  for s in steps:
   v=u+s
   if v<=b and v not in dist:dist[v]=dist[u]+1;q.append(v)
 return -1
cases=[(1,1+d,s) for s in itertools.product(range(1,4),repeat=3) for d in [0,1,2,4,6,8]]
cases += [(5,5,(2,4,6)),(5,10,(2,4,6)),(5,19,(2,5,7)),(1,10,(3,6,9))]
reports=[]
with tempfile.TemporaryDirectory(prefix='studyos-teacher-') as td:
 for section in source['sections']:
  lang=section['language'];exe=Path(td)/lang
  src=ROOT/'public'/section['path']
  c=subprocess.run(['clang' if lang=='c' else 'clang++','-std=c11' if lang=='c' else '-std=c++11','-O1','-Wall','-Wextra','-fsanitize=undefined','-fno-sanitize-recover=all',str(src),'-o',str(exe)],capture_output=True,text=True,timeout=40)
  assert c.returncode==0,c.stderr
  selected=cases+([] if section['title'].startswith('전체') else [(1,1199,(1,3,7)),(1199,1199,(1,2,3)),(1190,1199,(2,4,6))])
  for a,b,steps in selected:
   data=f'{a} {b}\n'+ ' '.join(map(str,steps))+'\n'
   r=subprocess.run([str(exe)],input=data,capture_output=True,text=True,timeout=3)
   assert r.returncode==0 and int(r.stdout.strip())==reference(a,b,steps),(section['title'],data,r.stdout,r.stderr)
  reports.append({'section':section['title'],'originalLines':[section['lineStart'],section['lineEnd']],'cases':len(selected),'passed':True,'compilerDiagnostics':c.stderr})
report={'filename':source['filename'],'sha256':source['sha256'],'programs':reports,'passedCases':sum(r['cases'] for r in reports),'scope':'양의 이동거리, 1<=a<=b<1200. 전체 탐색은 작은 거리 차이에서만 실행. 큰 입력 시간 초과 가능성은 별도 설명.','originalPreserved':True}
(ROOT/'reports/teacher-code-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
