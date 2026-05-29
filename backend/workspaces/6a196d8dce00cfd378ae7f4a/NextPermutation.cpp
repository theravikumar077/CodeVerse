#include <bits/stdc++.h>
using namespace std;

int main()

{
    
    int n=3;
int arr[n]={1,2,3};
// next permutation

// for finding pivot
int piv=-1;
for(int i=n-2;i>=0;i--){
    if(arr[i]<arr[i+1]){
        piv=i;
        break;
    }
}
if(piv==-1){
    // reverse the array
    reverse(arr,arr+n);
} 

// find the element just larger than pivot

else{
    for(int i=n-1;i>piv;i--){
        if(arr[i]>arr[piv]){
            swap(arr[i],arr[piv]);
            break;
        }
    }
    // reverse the suffix
    reverse(arr+piv+1,arr+n); 
}

//  reverse the dec ordered suffix to make it ascending

int i=piv+1;
int j=n-1;
while(i<j){
    swap(arr[i],arr[j]);
    i++;
    j--;
}
cout<<"Next Permutation is -> ";
for(int i=0;i<n;i++){
    cout<<arr[i]<<" ";
}

    return 0;
}