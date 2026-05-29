#include<bits/stdc++.h>
using namespace std;

int main()
{
    int arr[] = {1, 2, 3, 4, 5};
    int n = sizeof(arr) / sizeof(arr[0]);

    int max = arr[0];// assuming the first element is the largest

    for (int i = 1; i < n; i++)
    {
        if (arr[i] > max)
        {
            max = arr[i];
        }
    }
    cout << "Largest element is: " << max << endl;


    // optimized approach
    // time complexity is O(n) and space complexity is O(1)
    


// bfrute force approach
    int max1 = arr[0];
    for (int i = 0; i < n; i++)// to compare each element with every other element
    {
        for (int j = 0; j < n; j++)// to compare the current element with all other elements
        {
            if (arr[i] > arr[j])
            {
                max1 = arr[i];
            }
        }
    }
    cout << "Largest element (brute force): " << max1 << endl;
    

    return 0;
}