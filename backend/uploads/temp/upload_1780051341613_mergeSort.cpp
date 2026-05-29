#include <bits/stdc++.h>
using namespace std;

int main()
{
    // number of initialized elements in arr
    int m = 3; 
    // number of elements in arr1
    int n = 3; 
    // total capacity of arr (m + n)
    int total = 6;

    int arr[6]  = {1, 2, 3, 0, 0, 0}; // first m elements are actual data
    int arr1[3] = {2, 5, 6};

    int i = m - 1;        // index of last initialized element in arr (2)
    int j = n - 1;        // index of last element in arr1 (2)
    int idx = total - 1;  // index where we'll put the next largest element (5)

    // merge from the back; continue until arr1 is exhausted
    while (j >= 0)
    {
        if (i >= 0 && arr[i] > arr1[j])
        {
            arr[idx] = arr[i];
            i--;
        }
        else
        {
            arr[idx] = arr1[j];
            j--;
        }
        idx--;
    }

    cout << "Merged array ->  ";
    for (int k = 0; k < total; ++k)
    {
        cout << arr[k] << (k + 1 < total ? " " : "\n");
    }

    return 0;
}
