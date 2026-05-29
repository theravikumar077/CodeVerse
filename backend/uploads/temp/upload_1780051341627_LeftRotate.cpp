// Left Rotate the Array by One

// Problem Statement: Given an integer array nums, rotate the array to the left by one.

#include<bits/stdc++.h>
using namespace std;

// int main(){
//     int arr[]={1,2,3,4,5};
//     int n=5;
//     int temp =arr[0];
//     for (int i = 1; i < n; i++) 
//     {
//         arr[i-1]=arr[i];
//     }
//     arr[n-1]=temp;
    
//     for (int k = 0; k < n; k++)
//     {
//         cout<<arr[k];

//     }
    
// }


//  mai jo extra space use kar raha hu wo O(1) hai kyuki mai sirf ek variable temp use kar raha hu aur time complexity O(n) hai kyuki mujhe 
// array ke har element ko ek baar visit karna padta hai.



// Left Rotate the Array by d times


// ------------------- bakwasss code time complexity jayda  hai 

// int main(){
//     int arr[]={1,2,3,4,5,6,7};
//     int n=7;
//     int d=3;
//     d=d%n; // to handle the case when d is greater than n

//     for (int i = 0; i < d; i++) // to rotate the array d times
//     {
//         int temp =arr[0];// to store the first element of the array in a temporary variable
//         for (int j = 1; j < n; j++) 
//         {
//             arr[j-1]=arr[j];
//         }
//         arr[n-1]=temp;
//     }
    

//     for (int k = 0; k < n; k++)
//     {
//         cout<<arr[k];

//     }
    
// }



// ------------------- optimized code time complexity O(n) and space complexity O(d)


void reverseArr(int arr[], int start, int end) {
    while(start < end) {
        swap(arr[start], arr[end]);
        start++;
        end--;
    }
}

int main() {
    int arr[] = {1,2,3,4,5,6,7};
    int n = 7;
    int d = 3;

    d = d % n;

    reverseArr(arr, 0, d-1);
    reverseArr(arr, d, n-1);
    reverseArr(arr, 0, n-1);

    for(int i = 0; i < n; i++) {
        cout << arr[i] << " ";
    }

    return 0;
}




int main(){


    
    
}