#include<bits/stdc++.h>
using namespace std;

int main()
{
    int arr[5]={7,1,5,3,6};
    int min=arr[0];
    int max=arr[0];
    for(int i=0;i<5;i++)
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