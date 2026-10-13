// #1 : back
#include <stdio.h>
int a, b, able[3], ans=2000;

void back(int loc, int cnt) {
	//if(ans<cnt) return;	// bounding
	if(loc>b) return;
	if(b==loc)
		if(cnt<ans)
			ans=cnt;
	for(int i=0; i<3; i++)
	//for(int i=2; i>=0; i--)
		back(loc+able[i], cnt+1);
}

int main() {
	scanf("%d %d", &a, &b);
	for(int i=0; i<3; i++) scanf("%d", &able[i]);
	back(a, 0);
	if(ans!=2000) printf("%d\n", ans);
	else printf("-1\n");
}

// #2: queue
#include <stdio.h>
#include <queue>
using namespace std;

queue<int> Q;
int a, b, able[3], dt[1200];

int main() {
	scanf("%d %d", &a, &b);
	for(int i=0; i<3; i++) scanf("%d", &able[i]);
	Q.push(a);
	while(!Q.empty()) {
		int val=Q.front();
		if(val==b) {  
			printf("%d\n", dt[val]);
			return 0;
		}
		Q.pop();
		for(int i=0; i<3; i++) {
			int tmp=val+able[i];
			if(tmp<=b && !dt[tmp]) {
				Q.push(tmp);
				dt[tmp] = dt[val]+1;
			}
		}
	}
	printf("-1\n");
}

// #3: dt-for
#include <stdio.h>
#include <algorithm>
using namespace std;

int a, b, able[3], dt[1200];

int main() {
	scanf("%d %d", &a, &b);
	for(int i=0; i<3; i++) scanf("%d", &able[i]);

	if(a==b) printf("0");
	else {
		for(int i=a; i<=b; i++) dt[i]=99999;
		dt[a]=0;
		for(int i=a+1; i<=b; i++) {
			int tmp=99999;
			for(int k=0; k<3; k++) {
				if(i-able[k]>=a)
					tmp=min(tmp, dt[i-able[k]]+1);
			}
			dt[i]=tmp;
		}
		if(dt[b]!=99999) printf("%d\n", dt[b]);
		else printf("-1\n");
	}
}

