#include<bits/stdc++.h>
using namespace std;


void selctionSort(int arr[],int n){
for (int i=0;i<n-1;i++){
    int smallestIndex=i;
    for(int j=i+1;j<n;j++){
        if(arr[j]<arr[smallestIndex]){
            smallestIndex=j;
        }
    }
    swap(arr[i],arr[smallestIndex]);
 }
}

void printArray(int arr[],int n){
    for (int i = 0; i < n; i++)
    {
        cout<<arr[i]<<" ";
    }
    cout<<endl;
}
int main()
{
 int n=5;
 int arr[n]={4,1,5,2,3};
 // Selection sort
 
 cout<<"Sorted array by Selection Sort -->  ";   

 selctionSort(arr,n);
  printArray(arr,n);
    return 0;
}