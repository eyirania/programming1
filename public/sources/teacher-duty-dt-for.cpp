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
