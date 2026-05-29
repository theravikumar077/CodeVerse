#include<bits/stdc++.h>
using namespace std;

int main(){  
 int n=7;
int arr[n]={1,2,3,4,5,6,7};
int max1,max2;

if (arr[0]>arr[1])
{
    max1=arr[0];
    max2=arr[1];
}
else{
    max1=arr[1];
    max2=arr[0];
}
for (int i = 2; i < n; i++)
{
    if (arr[i]>max1)
    {
        max2=max1;
        max1=arr[i];
    }
    else if(arr[i]>max2){
        max2=max1;


    }
    
}


cout<<max1<<"  "<<max2;
    return 0;
}