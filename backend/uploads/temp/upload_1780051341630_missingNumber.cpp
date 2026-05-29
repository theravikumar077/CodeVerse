#include<bits/stdc++.h>
using namespace std;
int main(){
    int arr[] = {0, 1, 2, 4};
    int n=4;
    int total=n*(n+1)/2;
    int sum=0;
    for (int i = 0; i < n; i++)
    {
     sum+=arr[i];
    }
    cout<<"missing number -> "<< total-sum;
}