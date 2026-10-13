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
