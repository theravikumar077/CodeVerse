#include <bits/stdc++.h>
using namespace std;

int main()
{
    int n=5;
    int arr[n]={4,1,5,2,3};
    // Insertion Sort
    for (int i = 1; i < n; i++)
    {
        int curr=arr[i];
        int prev=i-1;
        // Move elements of arr[0..i-1], that are greater than key,
        // to one position ahead of their current position
        while (prev>=0 && arr[prev]>curr)
        {
            arr[prev+1]=arr[prev];
            prev--;
        }
        arr[prev+1]=curr;
    }
    cout<<"Sorted array by Insertion Sort -->  ";
    for (int i = 0; i < n; i++)
    {
        cout<<arr[i]<<" ";
    }
    return 0;
}