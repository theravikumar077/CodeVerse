#include<bits/stdc++.h>
using namespace std;

int main()
{
    int arr[10]={7,1,5,3,6,4,8,9,78,10};
    int min=arr[0];
    int max=arr[0];
    
    for(int i=0;i<10;i++)
    {
        if(arr[i]<min)
        {
            min=arr[i];
        }
        else if(arr[i]>max)
        {
            max=arr[i];
        }
    }
    cout<<max-min;
        
    return 0;
}