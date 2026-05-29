#include <bits/stdc++.h>
using namespace std;

int main()
{
    int sz=5;
    int arr[sz]={4,1,5,2,3}; 
    //  bubble sort
// Bubble sort ek simple sorting algorithm hai jo adjacent elements ko compare karke unhe swap karta hai agar wo wrong order mein hain.
    // Yeh poora sorting process ko sz-1 times repeat karega.
// Har baar ek element apni correct position tak reach kar leta hai.


     for (int i = 0; i < sz-1; i++)
     {
        for (int j = 0; j < sz-i-1; j++)
        {
            if (arr[j]>arr[j+1])
            {
                // swap
                swap(arr[j],arr[j+1]);
            }
            
        }
        
     }
     cout<< "Sorted array: ";
     for (int i = 0; i < sz; i++)
     {
        cout<<arr[i]<<" ";
     }
     

    return 0;
}
