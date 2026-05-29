#include<bits/stdc++.h>
using namespace std;

int main()
{
 int sz=6;

int arr[6]={3,-4,5,4,-1,7};
int maxsum=INT_MIN;
 int currsum=0;
 
for (int i = 0; i < sz; i++)
{
    currsum+=arr[i];
    maxsum=max(maxsum,currsum);
    if (currsum<0)
    {
      currsum=0;
    }
    
}
cout<<maxsum;

}