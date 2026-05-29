#include<bits/stdc++.h>
using namespace std;

// -----BRUTE FORCE ALGORITHM------  

// int main()
// {
//  int sz=6;

// int arr[6]={3,-4,5,4,-1,7};
// int maxsum=INT_MIN;
//  int currsum=0;
 
// for (int st = 0;st<sz; st++){
//     int currsum=0;
//     for (int end = st; end<sz; end++){
//     currsum+=arr[end];
//         maxsum=max(currsum,maxsum);
//     }
// }
//    cout<<"maximum subarry sum--> "<<maxsum;
//     return 0;
// }


// -----KADANE'S FORCE ALGORITHM------ 


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