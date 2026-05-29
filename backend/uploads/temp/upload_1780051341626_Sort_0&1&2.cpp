#include <bits/stdc++.h>
using namespace std;

int main()
{
    int n=7;
    int arr[n]={2,1,2,0,1,0,2};
    int count0=0,count1=0,count2=0;
    for (int i = 0; i < n; i++)
    {
        if(arr[i]==0) {
            count0++;
        }
        else if(arr[i]==1){
            count1++;
        }
        else{
            count2++;
        }
    }
    
    
    return 0;
}