#include<bits/stdc++.h>
using namespace std;

int main() {
    int arr[] = {1, 1, 3, 3, 4, 4, 5};
    int n = 7;

    int i = 0; // First element always unique
               // So i = 0 (last unique index)

    for (int j = 1; j < n; j++) {
        if (arr[j] != arr[i]) {  // if the current element is not equal to the last unique element, then it is a unique element

            i++; //New unique mila → position aage badhao

            arr[i] = arr[j];// move the unique element to the next position of the last unique element in the array
        }
    }

    // print only unique elements
    for (int k = 0; k <= i; k++) {
        cout << arr[k] << " ";
    }

    cout << "\nTotal unique elements: " << i + 1;





    return 0;
}