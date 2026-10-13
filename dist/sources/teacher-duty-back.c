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
