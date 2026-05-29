#include<bits/stdc++.h>
using namespace std;

int main()
{
    int arr[] = {1, 2, 3, 16, 5};
    int n = sizeof(arr) / sizeof(arr[0]);

    bool isSorted = true; // flag to check if the array is sorted   

    for (int i = 0; i < n-1; i++)
    {
        if (arr[i] > arr[i+1])// if the current element is greater than the next element, then the array is not sorted
        {
            isSorted = false;
            break;
        }
    }
    
    if (isSorted)
    {
        cout << "The array is sorted." << endl;
    }
    else
    {
        cout << "The array is not sorted." << endl;
    }

    return 0;
}